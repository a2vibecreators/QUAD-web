/**
 * GET /api/integrations/meeting/status
 *
 * Returns current meeting integration status for the organization.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { getProviderConfig, type MeetingProvider } from '@/lib/integrations';

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
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get all integrations for this org
    const integrations = await prisma.qUAD_meeting_integrations.findMany({
      where: { org_id: user.org_id },
      select: {
        id: true,
        provider: true,
        provider_name: true,
        is_configured: true,
        is_enabled: true,
        account_email: true,
        sync_status: true,
        last_sync_at: true,
        setup_completed_at: true,
      },
    });

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
