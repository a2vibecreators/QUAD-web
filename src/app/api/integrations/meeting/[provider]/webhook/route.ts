/**
 * POST /api/integrations/meeting/[provider]/webhook
 *
 * Webhook handler for meeting provider events.
 * Processes booking notifications from Cal.com, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { CalComService, type WebhookPayload } from '@/lib/integrations';

interface RouteContext {
  params: Promise<{ provider: string }>;
}

// TODO: Implement via Java backend when endpoints are ready
async function verifyOrg(orgId: string): Promise<boolean> {
  console.log(`[MeetingWebhook] verifyOrg: ${orgId}`);
  return true; // Allow webhooks until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function getFirstDomain(orgId: string): Promise<{ id: string } | null> {
  console.log(`[MeetingWebhook] getFirstDomain for org: ${orgId}`);
  return null; // Return null until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function getOrgAdmin(orgId: string): Promise<{ id: string } | null> {
  console.log(`[MeetingWebhook] getOrgAdmin for org: ${orgId}`);
  return null; // Return null until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function createMeeting(data: {
  domainId: string;
  title: string;
  scheduledAt: Date;
  durationMinutes: number;
  externalProvider: string;
  externalId: string;
  meetingUrl: string | null;
  status: string;
  organizerId: string;
}): Promise<void> {
  console.log(`[MeetingWebhook] createMeeting:`, data);
}

// TODO: Implement via Java backend when endpoints are ready
async function updateMeetingStatus(externalProvider: string, externalId: string, status: string): Promise<void> {
  console.log(`[MeetingWebhook] updateMeetingStatus: ${externalProvider}/${externalId} → ${status}`);
}

// TODO: Implement via Java backend when endpoints are ready
async function rescheduleMeeting(externalProvider: string, externalId: string, scheduledAt: Date, durationMinutes: number): Promise<void> {
  console.log(`[MeetingWebhook] rescheduleMeeting: ${externalProvider}/${externalId}`);
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
    const orgExists = await verifyOrg(orgId);

    if (!orgExists) {
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
  const domain = await getFirstDomain(orgId);

  if (!domain) {
    console.warn('No domain found for org:', orgId);
    return NextResponse.json({ success: true, warning: 'No domain to associate meeting' });
  }

  // Create or update meeting record
  switch (processed.eventType) {
    case 'BOOKING_CREATED':
    case 'BOOKING_CONFIRMED':
      // Get org admin as default organizer
      const orgAdmin = await getOrgAdmin(orgId);

      if (!orgAdmin) {
        console.warn('No organizer found for org:', orgId);
        return NextResponse.json({ success: true, warning: 'No organizer to assign' });
      }

      await createMeeting({
        domainId: domain.id,
        title: processed.meetingTitle,
        scheduledAt: processed.startTime,
        durationMinutes: Math.round(
          (processed.endTime.getTime() - processed.startTime.getTime()) / 60000
        ),
        externalProvider: 'cal_com',
        externalId: processed.uid,
        meetingUrl: processed.meetingUrl,
        status: 'scheduled',
        organizerId: orgAdmin.id,
      });
      break;

    case 'BOOKING_CANCELLED':
      await updateMeetingStatus('cal_com', processed.uid, 'cancelled');
      break;

    case 'BOOKING_RESCHEDULED':
      await rescheduleMeeting(
        'cal_com',
        processed.uid,
        processed.startTime,
        Math.round((processed.endTime.getTime() - processed.startTime.getTime()) / 60000)
      );
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
