/**
 * Git Provider Definitions
 *
 * Supported Git providers for QUAD Framework.
 * GitHub is primary, with GitLab and Bitbucket planned.
 */

export type GitProvider = 'github' | 'gitlab' | 'bitbucket' | 'azure_devops';

export interface GitProviderConfig {
  id: GitProvider;
  name: string;
  icon: string;
  description: string;
  features: string[];
  authType: 'oauth' | 'pat'; // Personal Access Token or OAuth
  oauth: boolean; // Whether OAuth is supported
  oauthUrl?: string;
  apiBaseUrl: string;
  scopes: string[];
  webhookSupported: boolean;
  comingSoon?: boolean; // If true, provider is not yet available
}

export const GIT_PROVIDERS: Record<GitProvider, GitProviderConfig> = {
  github: {
    id: 'github',
    name: 'GitHub',
    icon: 'github',
    description: 'The world\'s leading software development platform',
    features: [
      'Repository management',
      'Branch creation',
      'Pull request creation',
      'Webhook notifications',
      'Code review integration',
      'Actions/CI integration',
    ],
    authType: 'oauth',
    oauth: true,
    oauthUrl: 'https://github.com/login/oauth/authorize',
    apiBaseUrl: 'https://api.github.com',
    scopes: ['repo', 'read:user', 'user:email'],
    webhookSupported: true,
    comingSoon: false,
  },

  gitlab: {
    id: 'gitlab',
    name: 'GitLab',
    icon: 'gitlab',
    description: 'DevOps platform with built-in CI/CD',
    features: [
      'Repository management',
      'Merge request creation',
      'CI/CD pipelines',
      'Code review',
    ],
    authType: 'oauth',
    oauth: true,
    oauthUrl: 'https://gitlab.com/oauth/authorize',
    apiBaseUrl: 'https://gitlab.com/api/v4',
    scopes: ['api', 'read_user', 'read_repository', 'write_repository'],
    webhookSupported: true,
    comingSoon: true,
  },

  bitbucket: {
    id: 'bitbucket',
    name: 'Bitbucket',
    icon: 'bitbucket',
    description: 'Git solution for professional teams',
    features: [
      'Repository management',
      'Pull request creation',
      'Pipelines integration',
    ],
    authType: 'oauth',
    oauth: true,
    oauthUrl: 'https://bitbucket.org/site/oauth2/authorize',
    apiBaseUrl: 'https://api.bitbucket.org/2.0',
    scopes: ['repository', 'pullrequest', 'webhook'],
    webhookSupported: true,
    comingSoon: true,
  },

  azure_devops: {
    id: 'azure_devops',
    name: 'Azure DevOps',
    icon: 'azure',
    description: 'Microsoft\'s DevOps platform',
    features: [
      'Repository management',
      'Pull request creation',
      'Azure Pipelines',
      'Work item linking',
    ],
    authType: 'oauth',
    oauth: true,
    apiBaseUrl: 'https://dev.azure.com',
    scopes: ['vso.code_full', 'vso.build_execute'],
    webhookSupported: true,
    comingSoon: true,
  },
};

/**
 * Get provider configuration by ID
 */
export function getGitProviderConfig(providerId: string): GitProviderConfig | null {
  if (providerId in GIT_PROVIDERS) {
    return GIT_PROVIDERS[providerId as GitProvider];
  }
  return null;
}

/**
 * Check if provider uses OAuth
 */
export function isGitOAuthProvider(providerId: string): boolean {
  const config = getGitProviderConfig(providerId);
  return config?.oauth ?? false;
}

/**
 * Get all available providers as array
 */
export function getAllGitProviders(): GitProviderConfig[] {
  return Object.values(GIT_PROVIDERS);
}

/**
 * Provider display order (for UI)
 */
export const GIT_PROVIDER_DISPLAY_ORDER: GitProvider[] = [
  'github',    // Most common
  'gitlab',    // Second most common
  'bitbucket', // Atlassian users
  'azure_devops', // Enterprise
];

/**
 * Default provider
 */
export const DEFAULT_GIT_PROVIDER: GitProvider = 'github';
