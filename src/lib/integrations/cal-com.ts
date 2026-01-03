/**
 * Cal.com Integration Service
 *
 * Handles API key authentication and Cal.com API operations.
 * Cal.com is open-source and can be self-hosted or used via cal.com SaaS.
 */

import { prisma } from '@/lib/prisma';

// Cal.com API endpoints
const CAL_COM_API_BASE = process.env.CAL_COM_API_URL || 'https://api.cal.com/v1';

export interface CalComConfig {
  apiKey: string;
  baseUrl?: string;
  isQuadProvided: boolean; // true = QUAD-hosted Cal.com, false = client's own
}

export interface CalComEventType {
  id: number;
  title: string;
  slug: string;
  description?: string;
  length: number; // Duration in minutes
  hidden: boolean;
  position: number;
  locations?: { type: string; address?: string; link?: string }[];
}

export interface CalComBooking {
  id: number;
  uid: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees: { email: string; name: string; timeZone?: string }[];
  status: 'ACCEPTED' | 'PENDING' | 'CANCELLED' | 'REJECTED';
  meetingUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface CalComUser {
  id: number;
  username: string;
  email: string;
  name: string;
  timeZone: string;
  weekStart: string;
  avatar?: string;
}

export interface CreateBookingInput {
  eventTypeId: number;
  start: string; // ISO 8601 format
  end: string;
  name: string;
  email: string;
  timeZone?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  guests?: string[]; // Additional attendee emails
}

export interface WebhookPayload {
  triggerEvent: 'BOOKING_CREATED' | 'BOOKING_CANCELLED' | 'BOOKING_RESCHEDULED' | 'BOOKING_CONFIRMED';
  createdAt: string;
  payload: {
    title: string;
    startTime: string;
    endTime: string;
    attendees: { email: string; name: string }[];
    organizer: { email: string; name: string };
    uid: string;
    meetingUrl?: string;
  };
}

/**
 * Cal.com Service Class
 */
export class CalComService {
  private config: CalComConfig;

  constructor(config?: Partial<CalComConfig>) {
    this.config = {
      apiKey: config?.apiKey || '',
      baseUrl: config?.baseUrl || CAL_COM_API_BASE,
      isQuadProvided: config?.isQuadProvided ?? false,
    };
  }

  /**
   * Set API key (for BYOK mode)
   */
  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  /**
   * Make authenticated request to Cal.com API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Cal.com API error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Verify API key by fetching user info
   */
  async verifyApiKey(apiKey: string): Promise<CalComUser> {
    const response = await fetch(`${this.config.baseUrl}/me?apiKey=${apiKey}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Invalid API key');
    }

    const data = await response.json();
    return data.user;
  }

  /**
   * Get event types (booking types)
   */
  async getEventTypes(): Promise<CalComEventType[]> {
    const data = await this.request<{ event_types: CalComEventType[] }>(
      `/event-types?apiKey=${this.config.apiKey}`
    );
    return data.event_types || [];
  }

  /**
   * Get bookings (meetings)
   */
  async getBookings(options: {
    status?: 'upcoming' | 'past' | 'cancelled';
    limit?: number;
  } = {}): Promise<CalComBooking[]> {
    const params = new URLSearchParams({
      apiKey: this.config.apiKey,
    });

    if (options.status) params.set('status', options.status);
    if (options.limit) params.set('take', String(options.limit));

    const data = await this.request<{ bookings: CalComBooking[] }>(
      `/bookings?${params.toString()}`
    );
    return data.bookings || [];
  }

  /**
   * Get single booking by UID
   */
  async getBooking(uid: string): Promise<CalComBooking> {
    const data = await this.request<{ booking: CalComBooking }>(
      `/bookings/${uid}?apiKey=${this.config.apiKey}`
    );
    return data.booking;
  }

  /**
   * Create a new booking
   */
  async createBooking(input: CreateBookingInput): Promise<CalComBooking> {
    const data = await this.request<CalComBooking>(
      `/bookings?apiKey=${this.config.apiKey}`,
      {
        method: 'POST',
        body: JSON.stringify({
          eventTypeId: input.eventTypeId,
          start: input.start,
          end: input.end,
          responses: {
            name: input.name,
            email: input.email,
            notes: input.notes,
          },
          timeZone: input.timeZone || 'UTC',
          metadata: input.metadata || {},
          guests: input.guests || [],
        }),
      }
    );
    return data;
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(uid: string, reason?: string): Promise<void> {
    await this.request(
      `/bookings/${uid}/cancel?apiKey=${this.config.apiKey}`,
      {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      }
    );
  }

  /**
   * Process webhook payload from Cal.com
   */
  processWebhook(payload: WebhookPayload): {
    eventType: string;
    meetingTitle: string;
    startTime: Date;
    endTime: Date;
    attendees: { email: string; name: string }[];
    meetingUrl?: string;
    uid: string;
  } {
    return {
      eventType: payload.triggerEvent,
      meetingTitle: payload.payload.title,
      startTime: new Date(payload.payload.startTime),
      endTime: new Date(payload.payload.endTime),
      attendees: payload.payload.attendees,
      meetingUrl: payload.payload.meetingUrl,
      uid: payload.payload.uid,
    };
  }

  /**
   * Save integration to database
   */
  async saveIntegration(
    orgId: string,
    userId: string,
    apiKey: string,
    userInfo: CalComUser
  ): Promise<void> {
    await prisma.qUAD_meeting_integrations.upsert({
      where: {
        org_id_provider: {
          org_id: orgId,
          provider: 'cal_com',
        },
      },
      update: {
        api_key: apiKey, // In production, encrypt this
        account_email: userInfo.email,
        is_configured: true,
        is_enabled: true,
        setup_completed_at: new Date(),
        setup_completed_by: userId,
        sync_status: 'success',
        last_sync_at: new Date(),
      },
      create: {
        org_id: orgId,
        provider: 'cal_com',
        provider_name: 'Cal.com',
        api_key: apiKey,
        account_email: userInfo.email,
        is_configured: true,
        is_enabled: true,
        setup_completed_at: new Date(),
        setup_completed_by: userId,
        sync_status: 'success',
        last_sync_at: new Date(),
      },
    });

    // Update org setup status
    await prisma.qUAD_org_setup_status.upsert({
      where: { org_id: orgId },
      update: {
        meeting_provider_configured: true,
        calendar_connected: true,
      },
      create: {
        org_id: orgId,
        meeting_provider_configured: true,
        calendar_connected: true,
      },
    });
  }

  /**
   * Get integration from database
   */
  async getIntegration(orgId: string): Promise<{ apiKey: string; email: string } | null> {
    const integration = await prisma.qUAD_meeting_integrations.findUnique({
      where: {
        org_id_provider: {
          org_id: orgId,
          provider: 'cal_com',
        },
      },
    });

    if (!integration?.api_key) {
      return null;
    }

    return {
      apiKey: integration.api_key,
      email: integration.account_email || '',
    };
  }

  /**
   * Disconnect integration
   */
  async disconnect(orgId: string): Promise<void> {
    await prisma.qUAD_meeting_integrations.delete({
      where: {
        org_id_provider: {
          org_id: orgId,
          provider: 'cal_com',
        },
      },
    });

    // Check if other meeting providers are still connected
    const remainingIntegrations = await prisma.qUAD_meeting_integrations.count({
      where: {
        org_id: orgId,
        is_configured: true,
      },
    });

    // Update setup status if no integrations remain
    if (remainingIntegrations === 0) {
      await prisma.qUAD_org_setup_status.update({
        where: { org_id: orgId },
        data: {
          meeting_provider_configured: false,
          calendar_connected: false,
        },
      });
    }
  }

  /**
   * Generate webhook URL for this organization
   */
  getWebhookUrl(orgId: string): string {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://dev.quadframe.work';
    return `${baseUrl}/api/integrations/meeting/cal_com/webhook?org_id=${orgId}`;
  }
}

// Export factory function
export function createCalComService(apiKey?: string): CalComService {
  return new CalComService({ apiKey });
}
