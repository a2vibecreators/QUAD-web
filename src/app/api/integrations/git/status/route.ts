/**
 * GET /api/integrations/git/status
 *
 * Returns the current Git integration status for the user's organization.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready
import { getAllGitProviders } from '@/lib/integrations';

// TODO: Implement via Java backend when endpoints are ready
async function getUserOrg(email: string): Promise<string | null> {
  console.log(`[GitStatus] getUserOrg for email: ${email}`);
  return 'mock-org-id';
}

// TODO: Implement via Java backend when endpoints are ready
async function getOrgGitIntegrations(orgId: string): Promise<{
  id: string;
  provider: string;
  provider_name: string;
  account_login: string | null;
  account_type: string | null;
  is_configured: boolean;
  is_enabled: boolean;
  scope: string | null;
  setup_completed_at: Date | null;
  last_sync_at: Date | null;
  sync_status: string | null;
}[]> {
  console.log(`[GitStatus] getOrgGitIntegrations for org: ${orgId}`);
  return []; // Return empty until backend ready
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's org
    const orgId = await getUserOrg(session.user.email);

    if (!orgId) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Get all Git integrations for the org
    const integrations = await getOrgGitIntegrations(orgId);

    // Get all available providers
    const providers = getAllGitProviders();

    // Build status for each provider
    const providerStatus = providers.map((provider) => {
      const integration = integrations.find((i) => i.provider === provider.id);

      return {
        provider: provider.id,
        name: provider.name,
        icon: provider.icon,
        comingSoon: provider.comingSoon || false,
        connected: integration?.is_configured || false,
        enabled: integration?.is_enabled || false,
        account: integration?.account_login || null,
        accountType: integration?.account_type || null,
        lastSyncAt: integration?.last_sync_at || null,
        syncStatus: integration?.sync_status || null,
      };
    });

    // Check if any provider is connected
    const hasConnectedProvider = providerStatus.some((p) => p.connected);

    return NextResponse.json({
      hasConnectedProvider,
      providers: providerStatus,
      connectedCount: integrations.filter((i) => i.is_configured).length,
    });
  } catch (error) {
    console.error('Git status error:', error);
    return NextResponse.json(
      { error: 'Failed to get Git status' },
      { status: 500 }
    );
  }
}
