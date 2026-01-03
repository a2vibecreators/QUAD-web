/**
 * Meeting Provider Definitions
 *
 * Supported calendar and meeting integrations for QUAD Framework.
 * Each provider has OAuth or API key authentication.
 */

export type MeetingProvider =
  | 'google_calendar'
  | 'cal_com'
  | 'outlook'
  | 'zoom';

export interface ProviderConfig {
  id: MeetingProvider;
  name: string;
  icon: string;
  description: string;
  features: string[];
  authType: 'oauth' | 'api_key';
  scopes?: string[];
  apiKeyRequired?: boolean;
  webhookSupported?: boolean;
  meetingSupport: {
    googleMeet: boolean;
    zoom: boolean;
    teams: boolean;
    custom: boolean;
  };
}

export const MEETING_PROVIDERS: Record<MeetingProvider, ProviderConfig> = {
  google_calendar: {
    id: 'google_calendar',
    name: 'Google Calendar',
    icon: 'google',
    description: 'Sync with Google Calendar and create Google Meet links automatically',
    features: [
      'Calendar sync',
      'Google Meet integration',
      'Gmail/Workspace login',
      'Auto-create meeting links',
      'Real-time updates via webhook',
    ],
    authType: 'oauth',
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    webhookSupported: true,
    meetingSupport: {
      googleMeet: true,
      zoom: false,
      teams: false,
      custom: true,
    },
  },

  cal_com: {
    id: 'cal_com',
    name: 'Cal.com',
    icon: 'calendar',
    description: 'Open-source scheduling platform with webhook support',
    features: [
      'Webhook events for bookings',
      'API integration',
      'Custom booking pages',
      'Multiple calendar sync',
      'Team scheduling',
    ],
    authType: 'api_key',
    apiKeyRequired: true,
    webhookSupported: true,
    meetingSupport: {
      googleMeet: true,
      zoom: true,
      teams: true,
      custom: true,
    },
  },

  outlook: {
    id: 'outlook',
    name: 'Microsoft Outlook',
    icon: 'microsoft',
    description: 'Sync with Outlook Calendar and Microsoft Teams',
    features: [
      'Calendar sync',
      'Microsoft Teams meetings',
      'Microsoft 365 integration',
      'Exchange Online support',
    ],
    authType: 'oauth',
    scopes: [
      'Calendars.ReadWrite',
      'OnlineMeetings.ReadWrite',
      'User.Read',
    ],
    webhookSupported: true,
    meetingSupport: {
      googleMeet: false,
      zoom: false,
      teams: true,
      custom: true,
    },
  },

  zoom: {
    id: 'zoom',
    name: 'Zoom',
    icon: 'video',
    description: 'Create and manage Zoom meetings directly',
    features: [
      'Create instant meetings',
      'Schedule meetings',
      'Meeting recordings',
      'Webinar support',
    ],
    authType: 'oauth',
    scopes: [
      'meeting:write',
      'meeting:read',
      'user:read',
    ],
    webhookSupported: true,
    meetingSupport: {
      googleMeet: false,
      zoom: true,
      teams: false,
      custom: false,
    },
  },
};

/**
 * Get provider configuration by ID
 */
export function getProviderConfig(providerId: MeetingProvider): ProviderConfig | null {
  return MEETING_PROVIDERS[providerId] || null;
}

/**
 * Get all available providers as array
 */
export function getAllProviders(): ProviderConfig[] {
  return Object.values(MEETING_PROVIDERS);
}

/**
 * Get providers that support a specific meeting type
 */
export function getProvidersByMeetingType(type: keyof ProviderConfig['meetingSupport']): ProviderConfig[] {
  return Object.values(MEETING_PROVIDERS).filter(p => p.meetingSupport[type]);
}

/**
 * Check if provider requires OAuth (vs API key)
 */
export function isOAuthProvider(providerId: MeetingProvider): boolean {
  const provider = MEETING_PROVIDERS[providerId];
  return provider?.authType === 'oauth';
}

/**
 * Provider display order (for UI)
 */
export const PROVIDER_DISPLAY_ORDER: MeetingProvider[] = [
  'google_calendar',  // Most common, recommended
  'cal_com',          // Open source alternative
  'outlook',          // Enterprise
  'zoom',             // Video-focused
];

/**
 * Default provider for new organizations
 */
export const DEFAULT_PROVIDER: MeetingProvider = 'google_calendar';
