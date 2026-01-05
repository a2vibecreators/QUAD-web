/**
 * Organization Setup Status Service
 *
 * Tracks and manages the onboarding completion status for organizations.
 * Used by middleware to block access until setup is complete.
 *
 * NOTE: Simplified to not use Prisma. Currently returns defaults.
 * TODO: Implement proper setup tracking via Java backend when endpoints are ready.
 */

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

const STEP_LABELS: Record<RequiredStep | OptionalStep, string> = {
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
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function getSetupStatus(orgId: string): Promise<SetupStatus> {
  console.log(`[getSetupStatus] Checking setup for org: ${orgId}`);

  // For now, return setup as complete to not block users
  // TODO: Implement proper setup tracking via Java backend
  return {
    isComplete: true,
    completedSteps: Object.values(STEP_LABELS),
    pendingSteps: [],
    progress: 100,
    details: {
      meetingProviderConfigured: true,
      calendarConnected: true,
      aiTierSelected: true,
      firstDomainCreated: true,
      firstCircleCreated: true,
      gitProviderConnected: false,
      slackConnected: false,
    },
    setupStartedAt: new Date(),
    setupCompletedAt: new Date(),
  };
}

/**
 * Check if setup is complete (for middleware)
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function isSetupComplete(orgId: string): Promise<boolean> {
  // For now, always return true to not block users
  console.log(`[isSetupComplete] Returning true for org: ${orgId}`);
  return true;
}

/**
 * Mark a step as complete
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function markStepComplete(
  orgId: string,
  step: RequiredStep | OptionalStep
): Promise<void> {
  console.log(`[markStepComplete] Marking step ${step} complete for org: ${orgId}`);
  // TODO: Call Java backend to persist this
}

/**
 * Initialize setup status for new organization
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function initializeSetupStatus(orgId: string): Promise<void> {
  console.log(`[initializeSetupStatus] Initializing setup for org: ${orgId}`);
  // TODO: Call Java backend to create setup record
}

/**
 * Get next required step for setup wizard
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function getNextRequiredStep(orgId: string): Promise<{
  step: string;
  label: string;
  url: string;
} | null> {
  console.log(`[getNextRequiredStep] Checking next step for org: ${orgId}`);
  // For now, return null (setup complete)
  return null;
}

/**
 * Reset setup status (for testing)
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function resetSetupStatus(orgId: string): Promise<void> {
  console.log(`[resetSetupStatus] Resetting setup for org: ${orgId}`);
  // TODO: Call Java backend to reset
}
