/**
 * BYOK (Bring Your Own Key) Applicability Matrix
 *
 * Defines which integrations support custom credentials (BYOK)
 * and what fields are required for each.
 */

export type BYOKCategory = 'git' | 'calendar' | 'ai' | 'communication';

export interface BYOKProviderConfig {
  id: string;
  name: string;
  category: BYOKCategory;
  supportsByok: boolean;
  authType: 'oauth' | 'api_key' | 'both';
  requiredFields: BYOKField[];
  optionalFields: BYOKField[];
  setupUrl: string; // Where to create OAuth App or get API key
  setupInstructions: string;
}

export interface BYOKField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder: string;
  helpText?: string;
}

/**
 * BYOK Applicability Matrix
 *
 * Category breakdown:
 * - git: GitHub, GitLab, Bitbucket, Azure DevOps
 * - calendar: Google Calendar, Outlook, Cal.com, Zoom
 * - ai: OpenAI, Anthropic, Google Gemini, AWS Bedrock
 * - communication: Twilio, SendGrid, Slack, Discord
 */
export const BYOK_MATRIX: Record<string, BYOKProviderConfig> = {
  // ===========================================
  // GIT PROVIDERS
  // ===========================================
  github: {
    id: 'github',
    name: 'GitHub',
    category: 'git',
    supportsByok: true,
    authType: 'oauth',
    requiredFields: [
      {
        key: 'client_id',
        label: 'Client ID',
        type: 'text',
        placeholder: 'Ov23li...',
        helpText: 'From your GitHub OAuth App settings',
      },
      {
        key: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'Enter client secret',
        helpText: 'Keep this secure - never share publicly',
      },
    ],
    optionalFields: [
      {
        key: 'redirect_uri',
        label: 'Callback URL',
        type: 'url',
        placeholder: 'https://your-domain.com/api/integrations/git/github/callback',
        helpText: 'Only if different from default QUAD callback',
      },
    ],
    setupUrl: 'https://github.com/settings/developers',
    setupInstructions:
      'Go to GitHub Settings → Developer settings → OAuth Apps → New OAuth App. Set the callback URL to your QUAD instance callback.',
  },

  gitlab: {
    id: 'gitlab',
    name: 'GitLab',
    category: 'git',
    supportsByok: true,
    authType: 'oauth',
    requiredFields: [
      {
        key: 'client_id',
        label: 'Application ID',
        type: 'text',
        placeholder: 'Enter Application ID',
      },
      {
        key: 'client_secret',
        label: 'Secret',
        type: 'password',
        placeholder: 'Enter secret',
      },
    ],
    optionalFields: [
      {
        key: 'base_url',
        label: 'GitLab URL',
        type: 'url',
        placeholder: 'https://gitlab.com',
        helpText: 'For self-hosted GitLab instances',
      },
    ],
    setupUrl: 'https://gitlab.com/-/profile/applications',
    setupInstructions:
      'Go to GitLab → User Settings → Applications → Add new application.',
  },

  bitbucket: {
    id: 'bitbucket',
    name: 'Bitbucket',
    category: 'git',
    supportsByok: true,
    authType: 'oauth',
    requiredFields: [
      {
        key: 'client_id',
        label: 'Key',
        type: 'text',
        placeholder: 'Enter OAuth consumer key',
      },
      {
        key: 'client_secret',
        label: 'Secret',
        type: 'password',
        placeholder: 'Enter OAuth consumer secret',
      },
    ],
    optionalFields: [],
    setupUrl: 'https://bitbucket.org/account/settings/app-passwords/',
    setupInstructions:
      'Go to Bitbucket → Workspace settings → OAuth consumers → Add consumer.',
  },

  azure_devops: {
    id: 'azure_devops',
    name: 'Azure DevOps',
    category: 'git',
    supportsByok: true,
    authType: 'oauth',
    requiredFields: [
      {
        key: 'client_id',
        label: 'Application (client) ID',
        type: 'text',
        placeholder: 'Enter Azure AD app ID',
      },
      {
        key: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'Enter client secret',
      },
      {
        key: 'tenant_id',
        label: 'Tenant ID',
        type: 'text',
        placeholder: 'Enter Azure AD tenant ID',
      },
    ],
    optionalFields: [
      {
        key: 'organization',
        label: 'Organization',
        type: 'text',
        placeholder: 'your-org-name',
        helpText: 'Your Azure DevOps organization name',
      },
    ],
    setupUrl: 'https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade',
    setupInstructions:
      'Go to Azure Portal → App registrations → New registration.',
  },

  // ===========================================
  // CALENDAR/MEETING PROVIDERS
  // ===========================================
  google_calendar: {
    id: 'google_calendar',
    name: 'Google Calendar',
    category: 'calendar',
    supportsByok: true,
    authType: 'oauth',
    requiredFields: [
      {
        key: 'client_id',
        label: 'Client ID',
        type: 'text',
        placeholder: 'xxxx.apps.googleusercontent.com',
      },
      {
        key: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'Enter client secret',
      },
    ],
    optionalFields: [],
    setupUrl: 'https://console.cloud.google.com/apis/credentials',
    setupInstructions:
      'Go to Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID. Enable Calendar API.',
  },

  outlook: {
    id: 'outlook',
    name: 'Microsoft Outlook',
    category: 'calendar',
    supportsByok: true,
    authType: 'oauth',
    requiredFields: [
      {
        key: 'client_id',
        label: 'Application (client) ID',
        type: 'text',
        placeholder: 'Enter Azure AD app ID',
      },
      {
        key: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'Enter client secret',
      },
      {
        key: 'tenant_id',
        label: 'Tenant ID',
        type: 'text',
        placeholder: 'Enter Azure AD tenant ID',
      },
    ],
    optionalFields: [],
    setupUrl: 'https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade',
    setupInstructions:
      'Go to Azure Portal → App registrations → New registration. Add Microsoft Graph Calendar permissions.',
  },

  cal_com: {
    id: 'cal_com',
    name: 'Cal.com',
    category: 'calendar',
    supportsByok: true,
    authType: 'api_key',
    requiredFields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'cal_live_xxxx',
      },
    ],
    optionalFields: [
      {
        key: 'base_url',
        label: 'Cal.com URL',
        type: 'url',
        placeholder: 'https://api.cal.com/v1',
        helpText: 'For self-hosted Cal.com instances',
      },
    ],
    setupUrl: 'https://app.cal.com/settings/developer/api-keys',
    setupInstructions: 'Go to Cal.com → Settings → Developer → API Keys → Create new key.',
  },

  zoom: {
    id: 'zoom',
    name: 'Zoom',
    category: 'calendar',
    supportsByok: true,
    authType: 'oauth',
    requiredFields: [
      {
        key: 'client_id',
        label: 'Client ID',
        type: 'text',
        placeholder: 'Enter Zoom app client ID',
      },
      {
        key: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'Enter client secret',
      },
    ],
    optionalFields: [],
    setupUrl: 'https://marketplace.zoom.us/develop/create',
    setupInstructions: 'Go to Zoom Marketplace → Build App → OAuth → Create.',
  },

  // ===========================================
  // AI PROVIDERS
  // ===========================================
  openai: {
    id: 'openai',
    name: 'OpenAI',
    category: 'ai',
    supportsByok: true,
    authType: 'api_key',
    requiredFields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'sk-xxxx',
      },
    ],
    optionalFields: [
      {
        key: 'organization_id',
        label: 'Organization ID',
        type: 'text',
        placeholder: 'org-xxxx',
        helpText: 'Optional - for organization billing',
      },
    ],
    setupUrl: 'https://platform.openai.com/api-keys',
    setupInstructions: 'Go to OpenAI Platform → API Keys → Create new secret key.',
  },

  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    category: 'ai',
    supportsByok: true,
    authType: 'api_key',
    requiredFields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'sk-ant-xxxx',
      },
    ],
    optionalFields: [],
    setupUrl: 'https://console.anthropic.com/settings/keys',
    setupInstructions: 'Go to Anthropic Console → Settings → API Keys → Create Key.',
  },

  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    category: 'ai',
    supportsByok: true,
    authType: 'api_key',
    requiredFields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'AIzaSy...',
      },
    ],
    optionalFields: [],
    setupUrl: 'https://aistudio.google.com/app/apikey',
    setupInstructions: 'Go to Google AI Studio → Get API Key.',
  },

  bedrock: {
    id: 'bedrock',
    name: 'AWS Bedrock',
    category: 'ai',
    supportsByok: true,
    authType: 'api_key',
    requiredFields: [
      {
        key: 'access_key_id',
        label: 'AWS Access Key ID',
        type: 'text',
        placeholder: 'AKIA...',
      },
      {
        key: 'secret_access_key',
        label: 'AWS Secret Access Key',
        type: 'password',
        placeholder: 'Enter secret access key',
      },
      {
        key: 'region',
        label: 'AWS Region',
        type: 'text',
        placeholder: 'us-east-1',
      },
    ],
    optionalFields: [],
    setupUrl: 'https://console.aws.amazon.com/iam/home#/security_credentials',
    setupInstructions:
      'Go to AWS IAM → Create access key. Ensure the IAM user has Bedrock permissions.',
  },

  // ===========================================
  // COMMUNICATION PROVIDERS
  // ===========================================
  twilio: {
    id: 'twilio',
    name: 'Twilio (SMS/WhatsApp)',
    category: 'communication',
    supportsByok: true,
    authType: 'api_key',
    requiredFields: [
      {
        key: 'account_sid',
        label: 'Account SID',
        type: 'text',
        placeholder: 'ACxxxx',
      },
      {
        key: 'auth_token',
        label: 'Auth Token',
        type: 'password',
        placeholder: 'Enter auth token',
      },
    ],
    optionalFields: [
      {
        key: 'messaging_service_sid',
        label: 'Messaging Service SID',
        type: 'text',
        placeholder: 'MGxxxx',
        helpText: 'For sending from a messaging service',
      },
    ],
    setupUrl: 'https://console.twilio.com/',
    setupInstructions: 'Go to Twilio Console → Account → API keys and tokens.',
  },

  sendgrid: {
    id: 'sendgrid',
    name: 'SendGrid (Email)',
    category: 'communication',
    supportsByok: true,
    authType: 'api_key',
    requiredFields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'SG.xxxx',
      },
    ],
    optionalFields: [
      {
        key: 'from_email',
        label: 'From Email',
        type: 'text',
        placeholder: 'noreply@yourdomain.com',
        helpText: 'Verified sender email address',
      },
    ],
    setupUrl: 'https://app.sendgrid.com/settings/api_keys',
    setupInstructions: 'Go to SendGrid → Settings → API Keys → Create API Key.',
  },

  slack: {
    id: 'slack',
    name: 'Slack',
    category: 'communication',
    supportsByok: true,
    authType: 'oauth',
    requiredFields: [
      {
        key: 'client_id',
        label: 'Client ID',
        type: 'text',
        placeholder: 'Enter Slack app client ID',
      },
      {
        key: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'Enter client secret',
      },
      {
        key: 'signing_secret',
        label: 'Signing Secret',
        type: 'password',
        placeholder: 'Enter signing secret',
      },
    ],
    optionalFields: [
      {
        key: 'bot_token',
        label: 'Bot Token',
        type: 'password',
        placeholder: 'xoxb-xxxx',
        helpText: 'If using bot tokens instead of OAuth',
      },
    ],
    setupUrl: 'https://api.slack.com/apps',
    setupInstructions:
      'Go to Slack API → Your Apps → Create New App → OAuth & Permissions.',
  },

  discord: {
    id: 'discord',
    name: 'Discord',
    category: 'communication',
    supportsByok: true,
    authType: 'both',
    requiredFields: [
      {
        key: 'bot_token',
        label: 'Bot Token',
        type: 'password',
        placeholder: 'Enter Discord bot token',
      },
    ],
    optionalFields: [
      {
        key: 'client_id',
        label: 'Client ID',
        type: 'text',
        placeholder: 'For OAuth login',
      },
      {
        key: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'For OAuth login',
      },
    ],
    setupUrl: 'https://discord.com/developers/applications',
    setupInstructions: 'Go to Discord Developer Portal → Applications → New Application → Bot.',
  },
};

/**
 * Get providers by category
 */
export function getBYOKProvidersByCategory(category: BYOKCategory): BYOKProviderConfig[] {
  return Object.values(BYOK_MATRIX).filter((p) => p.category === category);
}

/**
 * Get provider config by ID
 */
export function getBYOKProviderConfig(providerId: string): BYOKProviderConfig | null {
  return BYOK_MATRIX[providerId] || null;
}

/**
 * Check if provider supports BYOK
 */
export function providerSupportsByok(providerId: string): boolean {
  return BYOK_MATRIX[providerId]?.supportsByok ?? false;
}

/**
 * Get all BYOK categories with their providers
 */
export function getAllBYOKCategories(): { category: BYOKCategory; providers: BYOKProviderConfig[] }[] {
  const categories: BYOKCategory[] = ['git', 'calendar', 'ai', 'communication'];
  return categories.map((category) => ({
    category,
    providers: getBYOKProvidersByCategory(category),
  }));
}

/**
 * Category display names
 */
export const BYOK_CATEGORY_NAMES: Record<BYOKCategory, string> = {
  git: 'Git & Source Control',
  calendar: 'Calendar & Meetings',
  ai: 'AI & Language Models',
  communication: 'Communication & Notifications',
};

/**
 * Category descriptions
 */
export const BYOK_CATEGORY_DESCRIPTIONS: Record<BYOKCategory, string> = {
  git: 'Connect your own GitHub, GitLab, Bitbucket, or Azure DevOps OAuth apps',
  calendar: 'Use your own Google Calendar, Outlook, Cal.com, or Zoom credentials',
  ai: 'Bring your own OpenAI, Anthropic, Gemini, or AWS Bedrock API keys',
  communication: 'Configure your own Twilio, SendGrid, Slack, or Discord apps',
};
