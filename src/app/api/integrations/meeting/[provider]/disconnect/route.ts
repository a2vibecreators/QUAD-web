/**
 * POST /api/integrations/meeting/[provider]/disconnect
 *
 * Disconnects a meeting provider integration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready
import {
  getProviderConfig,
  GoogleCalendarService,
  CalComService,
  type MeetingProvider,
} from '@/lib/integrations';

interface RouteContext {
  params: Promise<{ provider: string }>;
}

// TODO: Implement via Java backend when endpoints are ready
async function getUserOrg(userId: string): Promise<string | null> {
  console.log(`[MeetingDisconnect] getUserOrg for user: ${userId}`);
  return 'mock-org-id';
}

// TODO: Implement via Java backend when endpoints are ready
async function getIntegration(orgId: string, provider: string): Promise<{ id: string } | null> {
  console.log(`[MeetingDisconnect] getIntegration for org: ${orgId}, provider: ${provider}`);
  return null; // Return null until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function deleteIntegration(integrationId: string): Promise<void> {
  console.log(`[MeetingDisconnect] deleteIntegration: ${integrationId}`);
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider } = await context.params;

    // Validate provider
    const providerConfig = getProviderConfig(provider as MeetingProvider);
    if (!providerConfig) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    // Get user's org
    const orgId = await getUserOrg(session.user.id);

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if integration exists
    const integration = await getIntegration(orgId, provider);

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Disconnect based on provider
    switch (provider) {
      case 'google_calendar': {
        const googleService = new GoogleCalendarService();
        await googleService.disconnect(orgId);
        break;
      }

      case 'cal_com': {
        const calService = new CalComService();
        await calService.disconnect(orgId);
        break;
      }

      default:
        // Generic disconnect
        await deleteIntegration(integration.id);
    }

    return NextResponse.json({
      success: true,
      message: `${providerConfig.name} disconnected successfully`,
    });
  } catch (error) {
    console.error('Error disconnecting provider:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect provider' },
      { status: 500 }
    );
  }
}
