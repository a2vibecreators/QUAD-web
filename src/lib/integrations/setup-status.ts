/**
 * Organization Setup Status Service
 *
 * Tracks and manages the onboarding completion status for organizations.
 * Used by middleware to block access until setup is complete.
 */

import { prisma } from '@/lib/prisma';

export interface SetupStatus {
  isComplete: boolean;
  completedSteps: string[];
  pendingSteps: string[];
  progress: number; // 0-100
  details: {
    meetingProviderConfigured: boolean;
    calendarConnected: boolean;
    aiTierSelected: boolean;
    firstDomainCreated: boolean;
    firstCircleCreated: boolean;
    gitProviderConnected: boolean;
    slackConnected: boolean;
  };
  setupStartedAt: Date | null;
  setupCompletedAt: Date | null;
}

// Required steps for setup completion (must all be true)
const REQUIRED_STEPS = [
  'meeting_provider_configured',
  'ai_tier_selected',
] as const;

// Optional steps (nice to have but don't block)
const OPTIONAL_STEPS = [
  'calendar_connected',
  'first_domain_created',
  'first_circle_created',
  'git_provider_connected',
  'slack_connected',
] as const;

type RequiredStep = (typeof REQUIRED_STEPS)[number];
type OptionalStep = (typeof OPTIONAL_STEPS)[number];
type SetupStep = RequiredStep | OptionalStep;

const STEP_LABELS: Record<SetupStep, string> = {
  meeting_provider_configured: 'Connect Meeting Provider',
  calendar_connected: 'Sync Calendar',
  ai_tier_selected: 'Select AI Tier',
  first_domain_created: 'Create First Domain',
  first_circle_created: 'Create First Circle',
  git_provider_connected: 'Connect Git Provider',
  slack_connected: 'Connect Slack',
};

/**
 * Get setup status for an organization
 */
export async function getSetupStatus(orgId: string): Promise<SetupStatus> {
  const status = await prisma.qUAD_org_setup_status.findUnique({
    where: { org_id: orgId },
  });

  // Check AI tier selection from ai_provider_config
  const aiConfig = await prisma.qUAD_ai_provider_config.findUnique({
    where: { org_id: orgId },
  });
  const aiTierSelected = !!aiConfig;

  // Check if domain exists
  const domainCount = await prisma.qUAD_domains.count({
    where: { org_id: orgId, is_deleted: false },
  });
  const firstDomainCreated = domainCount > 0;

  // Check if circle exists
  const circleCount = await prisma.qUAD_circles.count({
    where: {
      domain: {
        org_id: orgId,
        is_deleted: false,
      },
    },
  });
  const firstCircleCreated = circleCount > 0;

  const details = {
    meetingProviderConfigured: status?.meeting_provider_configured ?? false,
    calendarConnected: status?.calendar_connected ?? false,
    aiTierSelected,
    firstDomainCreated,
    firstCircleCreated,
    gitProviderConnected: status?.git_provider_connected ?? false,
    slackConnected: status?.slack_connected ?? false,
  };

  // Calculate completed steps
  const completedSteps: string[] = [];
  const pendingSteps: string[] = [];

  for (const step of REQUIRED_STEPS) {
    const isComplete = getStepValue(step, details);
    if (isComplete) {
      completedSteps.push(STEP_LABELS[step]);
    } else {
      pendingSteps.push(STEP_LABELS[step]);
    }
  }

  // Check required steps completion
  const requiredComplete = REQUIRED_STEPS.every(step => getStepValue(step, details));

  // Calculate progress (required steps only)
  const completedCount = REQUIRED_STEPS.filter(step => getStepValue(step, details)).length;
  const progress = Math.round((completedCount / REQUIRED_STEPS.length) * 100);

  return {
    isComplete: requiredComplete,
    completedSteps,
    pendingSteps,
    progress,
    details,
    setupStartedAt: status?.setup_started_at ?? null,
    setupCompletedAt: requiredComplete ? (status?.setup_completed_at ?? new Date()) : null,
  };
}

/**
 * Helper to get step value from details object
 */
function getStepValue(
  step: SetupStep,
  details: SetupStatus['details']
): boolean {
  const mapping: Record<SetupStep, keyof SetupStatus['details']> = {
    meeting_provider_configured: 'meetingProviderConfigured',
    calendar_connected: 'calendarConnected',
    ai_tier_selected: 'aiTierSelected',
    first_domain_created: 'firstDomainCreated',
    first_circle_created: 'firstCircleCreated',
    git_provider_connected: 'gitProviderConnected',
    slack_connected: 'slackConnected',
  };

  return details[mapping[step]];
}

/**
 * Check if setup is complete (for middleware)
 */
export async function isSetupComplete(orgId: string): Promise<boolean> {
  const status = await getSetupStatus(orgId);
  return status.isComplete;
}

/**
 * Mark a step as complete
 */
export async function markStepComplete(
  orgId: string,
  step: RequiredStep | OptionalStep
): Promise<void> {
  const data: Record<string, boolean | Date> = {
    [step]: true,
  };

  await prisma.qUAD_org_setup_status.upsert({
    where: { org_id: orgId },
    update: data,
    create: {
      org_id: orgId,
      ...data,
    },
  });

  // Check if all required steps are now complete
  const status = await getSetupStatus(orgId);
  if (status.isComplete) {
    await prisma.qUAD_org_setup_status.update({
      where: { org_id: orgId },
      data: { setup_completed_at: new Date() },
    });
  }
}

/**
 * Initialize setup status for new organization
 */
export async function initializeSetupStatus(orgId: string): Promise<void> {
  await prisma.qUAD_org_setup_status.upsert({
    where: { org_id: orgId },
    update: {},
    create: {
      org_id: orgId,
      setup_started_at: new Date(),
    },
  });
}

/**
 * Get next required step for setup wizard
 */
export async function getNextRequiredStep(orgId: string): Promise<{
  step: string;
  label: string;
  url: string;
} | null> {
  const status = await getSetupStatus(orgId);

  if (status.isComplete) {
    return null;
  }

  // Return first incomplete required step
  if (!status.details.aiTierSelected) {
    return {
      step: 'ai_tier_selected',
      label: 'Select AI Tier',
      url: '/setup/ai-tier',
    };
  }

  if (!status.details.meetingProviderConfigured) {
    return {
      step: 'meeting_provider_configured',
      label: 'Connect Meeting Provider',
      url: '/setup/meetings',
    };
  }

  return null;
}

/**
 * Reset setup status (for testing)
 */
export async function resetSetupStatus(orgId: string): Promise<void> {
  await prisma.qUAD_org_setup_status.delete({
    where: { org_id: orgId },
  }).catch(() => {
    // Ignore if doesn't exist
  });

  await initializeSetupStatus(orgId);
}
