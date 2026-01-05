/**
 * GET /api/integrations/meeting/providers
 *
 * Returns list of available meeting providers with their configurations.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready
import {
  getAllProviders,
  PROVIDER_DISPLAY_ORDER,
} from '@/lib/integrations';

// TODO: Implement via Java backend when endpoints are ready
async function getUserOrg(userId: string): Promise<string | null> {
  console.log(`[MeetingProviders] getUserOrg for user: ${userId}`);
  // Return mock org ID from session - actual org lookup via Java backend later
  return 'mock-org-id';
}

// TODO: Implement via Java backend when endpoints are ready
async function getConfiguredIntegrations(orgId: string): Promise<{
  provider: string;
  is_configured: boolean;
  is_enabled: boolean;
  account_email: string | null;
  sync_status: string | null;
  last_sync_at: Date | null;
}[]> {
  console.log(`[MeetingProviders] getConfiguredIntegrations for org: ${orgId}`);
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
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get all providers
    const allProviders = getAllProviders();

    // Get configured integrations for this org
    const configuredIntegrations = await getConfiguredIntegrations(orgId);

    // Create a map of configured providers
    const configuredMap = new Map(
      configuredIntegrations.map(i => [i.provider, i])
    );

    // Build response with status for each provider
    const providers = PROVIDER_DISPLAY_ORDER.map(providerId => {
      const provider = allProviders.find(p => p.id === providerId);
      const configured = configuredMap.get(providerId);

      return {
        ...provider,
        status: {
          isConfigured: configured?.is_configured ?? false,
          isEnabled: configured?.is_enabled ?? false,
          accountEmail: configured?.account_email ?? null,
          syncStatus: configured?.sync_status ?? null,
          lastSyncAt: configured?.last_sync_at ?? null,
        },
      };
    });

    // Determine recommended provider based on what's not configured
    const recommendedProvider = PROVIDER_DISPLAY_ORDER.find(
      id => !configuredMap.has(id)
    ) || PROVIDER_DISPLAY_ORDER[0];

    return NextResponse.json({
      providers,
      recommendedProvider,
      hasConfiguredProvider: configuredIntegrations.some(i => i.is_configured),
    });
  } catch (error) {
    console.error('Error fetching meeting providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}
