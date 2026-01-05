/**
 * GET /api/integrations/meeting/status
 *
 * Returns current meeting integration status for the organization.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready
import { getProviderConfig, type MeetingProvider } from '@/lib/integrations';

// TODO: Implement via Java backend when endpoints are ready
async function getUserOrg(userId: string): Promise<string | null> {
  console.log(`[MeetingStatus] getUserOrg for user: ${userId}`);
  return 'mock-org-id';
}

// TODO: Implement via Java backend when endpoints are ready
async function getOrgIntegrations(orgId: string): Promise<{
  id: string;
  provider: string;
  provider_name: string;
  is_configured: boolean;
  is_enabled: boolean;
  account_email: string | null;
  sync_status: string | null;
  last_sync_at: Date | null;
  setup_completed_at: Date | null;
}[]> {
  console.log(`[MeetingStatus] getOrgIntegrations for org: ${orgId}`);
  return []; // Return empty until backend ready
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's org
    const orgId = await getUserOrg(session.user.id);

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get all integrations for this org
    const integrations = await getOrgIntegrations(orgId);

    // Enhance with provider config
    const enhancedIntegrations = integrations.map(integration => {
      const config = getProviderConfig(integration.provider as MeetingProvider);
      return {
        ...integration,
        providerConfig: config
          ? {
              name: config.name,
              icon: config.icon,
              features: config.features,
              meetingSupport: config.meetingSupport,
            }
          : null,
      };
    });

    // Get primary (enabled) integration
    const primaryIntegration = enhancedIntegrations.find(
      i => i.is_enabled && i.is_configured
    );

    // Calculate overall status
    const hasConfiguredProvider = integrations.some(i => i.is_configured);
    const hasEnabledProvider = integrations.some(i => i.is_enabled);

    return NextResponse.json({
      integrations: enhancedIntegrations,
      primaryIntegration,
      status: {
        hasConfiguredProvider,
        hasEnabledProvider,
        totalConfigured: integrations.filter(i => i.is_configured).length,
        totalEnabled: integrations.filter(i => i.is_enabled).length,
      },
    });
  } catch (error) {
    console.error('Error fetching integration status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integration status' },
      { status: 500 }
    );
  }
}
