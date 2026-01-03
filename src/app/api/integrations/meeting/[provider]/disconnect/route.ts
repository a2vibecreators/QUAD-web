/**
 * POST /api/integrations/meeting/[provider]/disconnect
 *
 * Disconnects a meeting provider integration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import {
  getProviderConfig,
  GoogleCalendarService,
  CalComService,
  type MeetingProvider,
} from '@/lib/integrations';

interface RouteContext {
  params: Promise<{ provider: string }>;
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

    // Check if integration exists
    const integration = await prisma.qUAD_meeting_integrations.findUnique({
      where: {
        org_id_provider: {
          org_id: user.org_id,
          provider: provider,
        },
      },
    });

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
        await googleService.disconnect(user.org_id);
        break;
      }

      case 'cal_com': {
        const calService = new CalComService();
        await calService.disconnect(user.org_id);
        break;
      }

      default:
        // Generic disconnect
        await prisma.qUAD_meeting_integrations.delete({
          where: { id: integration.id },
        });
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
