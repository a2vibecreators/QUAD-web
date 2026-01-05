/**
 * Google Calendar Integration Service
 *
 * Handles OAuth flow and Calendar API operations for Google Calendar.
 * Supports both "QUAD-provided" and "BYOK" (Bring Your Own Key) modes.
 *
 * NOTE: Database operations stubbed out - will implement via Java backend when ready.
 */

// Google OAuth endpoints
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

// Scopes required for calendar access
const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  isQuadProvided: boolean; // true = QUAD pays, false = client's own credentials
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  timeZone?: string;
  backgroundColor?: string;
}

export interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: { email: string; responseStatus?: string }[];
  hangoutLink?: string; // Google Meet link
  conferenceData?: {
    conferenceId?: string;
    conferenceSolution?: { name: string };
    entryPoints?: { uri: string; entryPointType: string }[];
  };
  htmlLink?: string;
  status?: string;
}

export interface CreateMeetingInput {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendeeEmails?: string[];
  createGoogleMeet?: boolean;
  timeZone?: string;
}

/**
 * Google Calendar Service Class
 */
export class GoogleCalendarService {
  private config: GoogleCalendarConfig;

  constructor(config?: Partial<GoogleCalendarConfig>) {
    // Default to environment variables (QUAD-provided mode)
    this.config = {
      clientId: config?.clientId || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: config?.clientSecret || process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: config?.redirectUri || process.env.GOOGLE_REDIRECT_URI || '',
      isQuadProvided: config?.isQuadProvided ?? true,
    };
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: REQUIRED_SCOPES.join(' '),
      access_type: 'offline', // Get refresh token
      prompt: 'consent', // Always show consent screen to get refresh token
      state: state, // Encode org_id + user_id
    });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
    }

    return response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
    }

    return response.json();
  }

  /**
   * Get user info from Google
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  }

  /**
   * List calendars for the authenticated user
   */
  async listCalendars(accessToken: string): Promise<GoogleCalendar[]> {
    const response = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to list calendars');
    }

    const data = await response.json();
    return data.items || [];
  }

  /**
   * List events from a calendar
   */
  async listEvents(
    accessToken: string,
    calendarId: string = 'primary',
    options: {
      timeMin?: Date;
      timeMax?: Date;
      maxResults?: number;
      singleEvents?: boolean;
    } = {}
  ): Promise<GoogleEvent[]> {
    const params = new URLSearchParams({
      singleEvents: String(options.singleEvents ?? true),
      orderBy: 'startTime',
    });

    if (options.timeMin) {
      params.set('timeMin', options.timeMin.toISOString());
    }
    if (options.timeMax) {
      params.set('timeMax', options.timeMax.toISOString());
    }
    if (options.maxResults) {
      params.set('maxResults', String(options.maxResults));
    }

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      throw new Error('Failed to list events');
    }

    const data = await response.json();
    return data.items || [];
  }

  /**
   * Create a calendar event with optional Google Meet
   */
  async createEvent(
    accessToken: string,
    calendarId: string = 'primary',
    input: CreateMeetingInput
  ): Promise<GoogleEvent> {
    const event: Record<string, unknown> = {
      summary: input.title,
      description: input.description,
      start: {
        dateTime: input.startTime.toISOString(),
        timeZone: input.timeZone || 'UTC',
      },
      end: {
        dateTime: input.endTime.toISOString(),
        timeZone: input.timeZone || 'UTC',
      },
    };

    if (input.attendeeEmails?.length) {
      event.attendees = input.attendeeEmails.map(email => ({ email }));
    }

    // Add Google Meet if requested
    if (input.createGoogleMeet) {
      event.conferenceData = {
        createRequest: {
          requestId: `quad-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events${
        input.createGoogleMeet ? '?conferenceDataVersion=1' : ''
      }`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create event: ${error.error?.message || 'Unknown error'}`);
    }

    return response.json();
  }

  /**
   * Save integration to database
   * TODO: Implement via Java backend when endpoints are ready
   */
  async saveIntegration(
    orgId: string,
    userId: string,
    tokens: GoogleTokens,
    userInfo: GoogleUserInfo
  ): Promise<void> {
    console.log(`[GoogleCalendar] saveIntegration for org: ${orgId}, user: ${userId}, email: ${userInfo.email}`);
    // TODO: Call Java backend to save integration tokens
    // For now, just log
  }

  /**
   * Get valid access token (refresh if needed)
   * TODO: Implement via Java backend when endpoints are ready
   */
  async getValidAccessToken(orgId: string): Promise<string | null> {
    console.log(`[GoogleCalendar] getValidAccessToken for org: ${orgId}`);
    // TODO: Call Java backend to get stored tokens
    // For now, return null (not configured)
    return null;
  }

  /**
   * Disconnect integration
   * TODO: Implement via Java backend when endpoints are ready
   */
  async disconnect(orgId: string): Promise<void> {
    console.log(`[GoogleCalendar] disconnect for org: ${orgId}`);
    // TODO: Call Java backend to delete integration
  }
}

// Export singleton for QUAD-provided mode
export const googleCalendarService = new GoogleCalendarService();
