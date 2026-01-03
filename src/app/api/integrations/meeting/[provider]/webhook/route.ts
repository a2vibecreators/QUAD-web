/**
 * POST /api/integrations/meeting/[provider]/webhook
 *
 * Webhook handler for meeting provider events.
 * Processes booking notifications from Cal.com, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CalComService, type WebhookPayload } from '@/lib/integrations';

interface RouteContext {
  params: Promise<{ provider: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { provider } = await context.params;
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');

    if (!orgId) {
      return NextResponse.json(
        { error: 'Missing org_id parameter' },
        { status: 400 }
      );
    }

    // Verify org exists
    const org = await prisma.qUAD_organizations.findUnique({
      where: { id: orgId },
      select: { id: true },
    });

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Handle by provider
    switch (provider) {
      case 'cal_com':
        return handleCalComWebhook(request, orgId);

      case 'google_calendar':
        return handleGoogleWebhook(request, orgId);

      default:
        return NextResponse.json(
          { error: 'Webhook not supported for this provider' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle Cal.com webhook
 */
async function handleCalComWebhook(
  request: NextRequest,
  orgId: string
): Promise<NextResponse> {
  const payload = (await request.json()) as WebhookPayload;
  const calService = new CalComService();
  const processed = calService.processWebhook(payload);

  // Log the webhook event
  console.log('Cal.com webhook received:', {
    orgId,
    eventType: processed.eventType,
    meetingTitle: processed.meetingTitle,
    uid: processed.uid,
  });

  // Find domain to associate meeting with (use first active domain for now)
  const domain = await prisma.qUAD_domains.findFirst({
    where: {
      org_id: orgId,
      is_deleted: false,
    },
    select: { id: true },
  });

  if (!domain) {
    console.warn('No domain found for org:', orgId);
    return NextResponse.json({ success: true, warning: 'No domain to associate meeting' });
  }

  // Create or update meeting record
  switch (processed.eventType) {
    case 'BOOKING_CREATED':
    case 'BOOKING_CONFIRMED':
      // Get org admin as default organizer
      const orgAdmin = await prisma.qUAD_users.findFirst({
        where: { org_id: orgId },
        select: { id: true },
      });

      if (!orgAdmin) {
        console.warn('No organizer found for org:', orgId);
        return NextResponse.json({ success: true, warning: 'No organizer to assign' });
      }

      await prisma.qUAD_meetings.create({
        data: {
          domain: { connect: { id: domain.id } },
          title: processed.meetingTitle,
          scheduled_at: processed.startTime,
          duration_minutes: Math.round(
            (processed.endTime.getTime() - processed.startTime.getTime()) / 60000
          ),
          external_provider: 'cal_com',
          external_id: processed.uid,
          meeting_url: processed.meetingUrl,
          status: 'scheduled',
          organizer_id: orgAdmin.id,
        },
      });
      break;

    case 'BOOKING_CANCELLED':
      await prisma.qUAD_meetings.updateMany({
        where: {
          external_provider: 'cal_com',
          external_id: processed.uid,
        },
        data: {
          status: 'cancelled',
        },
      });
      break;

    case 'BOOKING_RESCHEDULED':
      await prisma.qUAD_meetings.updateMany({
        where: {
          external_provider: 'cal_com',
          external_id: processed.uid,
        },
        data: {
          scheduled_at: processed.startTime,
          duration_minutes: Math.round(
            (processed.endTime.getTime() - processed.startTime.getTime()) / 60000
          ),
        },
      });
      break;
  }

  return NextResponse.json({ success: true });
}

/**
 * Handle Google Calendar webhook (push notifications)
 */
async function handleGoogleWebhook(
  request: NextRequest,
  orgId: string
): Promise<NextResponse> {
  // Google sends headers for verification
  const channelId = request.headers.get('X-Goog-Channel-ID');
  const resourceState = request.headers.get('X-Goog-Resource-State');

  console.log('Google Calendar webhook received:', {
    orgId,
    channelId,
    resourceState,
  });

  // For now, just acknowledge the webhook
  // Full implementation would sync calendar changes
  if (resourceState === 'sync') {
    // Initial sync confirmation
    return NextResponse.json({ success: true });
  }

  // TODO: Implement calendar sync on change notifications
  // This would:
  // 1. Fetch changed events from Google Calendar API
  // 2. Update/create/delete QUAD_meetings records
  // 3. Trigger any Flow creation from meeting action items

  return NextResponse.json({ success: true });
}
