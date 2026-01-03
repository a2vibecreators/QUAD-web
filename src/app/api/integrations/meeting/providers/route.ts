/**
 * GET /api/integrations/meeting/providers
 *
 * Returns list of available meeting providers with their configurations.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import {
  getAllProviders,
  PROVIDER_DISPLAY_ORDER,
  type MeetingProvider,
} from '@/lib/integrations';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's org
    const user = await prisma.qUAD_users.findUnique({
      where: { id: session.user.id },
      select: { org_id: true },
    });

    if (!user?.org_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get all providers
    const allProviders = getAllProviders();

    // Get configured integrations for this org
    const configuredIntegrations = await prisma.qUAD_meeting_integrations.findMany({
      where: { org_id: user.org_id },
      select: {
        provider: true,
        is_configured: true,
        is_enabled: true,
        account_email: true,
        sync_status: true,
        last_sync_at: true,
      },
    });

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
