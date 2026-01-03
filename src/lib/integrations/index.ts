/**
 * QUAD Framework - Integration Services
 *
 * Exports all meeting provider integrations and setup utilities.
 */

// Meeting provider definitions
export {
  MEETING_PROVIDERS,
  PROVIDER_DISPLAY_ORDER,
  DEFAULT_PROVIDER,
  getProviderConfig,
  getAllProviders,
  getProvidersByMeetingType,
  isOAuthProvider,
  type MeetingProvider,
  type ProviderConfig,
} from './meeting-providers';

// Google Calendar service
export {
  GoogleCalendarService,
  googleCalendarService,
  type GoogleCalendarConfig,
  type GoogleTokens,
  type GoogleUserInfo,
  type GoogleCalendar,
  type GoogleEvent,
  type CreateMeetingInput,
} from './google-calendar';

// Cal.com service
export {
  CalComService,
  createCalComService,
  type CalComConfig,
  type CalComEventType,
  type CalComBooking,
  type CalComUser,
  type CreateBookingInput,
  type WebhookPayload,
} from './cal-com';

// Setup status service
export {
  getSetupStatus,
  isSetupComplete,
  markStepComplete,
  initializeSetupStatus,
  getNextRequiredStep,
  resetSetupStatus,
  type SetupStatus,
} from './setup-status';

// Git provider definitions
export {
  GIT_PROVIDERS,
  GIT_PROVIDER_DISPLAY_ORDER,
  DEFAULT_GIT_PROVIDER,
  getGitProviderConfig,
  getAllGitProviders,
  isGitOAuthProvider,
  type GitProvider,
  type GitProviderConfig,
} from './git-providers';

// GitHub service
export {
  GitHubService,
  gitHubService,
  type GitHubConfig,
  type GitHubTokens,
  type GitHubUser,
  type GitHubRepository,
  type GitHubBranch,
  type GitHubPullRequest,
  type CreateBranchInput,
  type CreatePullRequestInput,
} from './github';

// BYOK (Bring Your Own Key) matrix
export {
  BYOK_MATRIX,
  BYOK_CATEGORY_NAMES,
  BYOK_CATEGORY_DESCRIPTIONS,
  getBYOKProvidersByCategory,
  getBYOKProviderConfig,
  providerSupportsByok,
  getAllBYOKCategories,
  type BYOKCategory,
  type BYOKProviderConfig,
  type BYOKField,
} from './byok-matrix';
