/**
 * GitHub Integration Service
 *
 * Handles OAuth flow and GitHub API operations.
 * Supports repository management, branch creation, and PR creation.
 *
 * BYOK (Bring Your Own Key) Support:
 * Organizations can use their own GitHub OAuth App credentials instead of QUAD's.
 * Use GitHubService.forOrg(orgId) to automatically resolve the right credentials.
 *
 * NOTE: Database operations stubbed out - will implement via Java backend when ready.
 */

// GitHub OAuth endpoints
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_API_BASE = 'https://api.github.com';

// Scopes required for full functionality
const REQUIRED_SCOPES = ['repo', 'read:user', 'user:email'];

// Default QUAD Platform redirect URI pattern
const DEFAULT_REDIRECT_URI_PATTERN = process.env.GITHUB_REDIRECT_URI ||
  'https://dev.quadframe.work/api/integrations/git/github/callback';

export interface GitHubConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  isByok?: boolean; // True if using custom org credentials
}

export interface GitHubTokens {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  type: 'User' | 'Organization';
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; type: string };
  private: boolean;
  description: string | null;
  default_branch: string;
  clone_url: string;
  html_url: string;
  permissions?: { admin: boolean; push: boolean; pull: boolean };
}

export interface GitHubBranch {
  name: string;
  commit: { sha: string; url: string };
  protected: boolean;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  head: { ref: string; sha: string };
  base: { ref: string };
  user: { login: string };
  merged: boolean;
  merged_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBranchInput {
  owner: string;
  repo: string;
  branchName: string;
  fromBranch?: string; // Default: default branch
}

export interface CreatePullRequestInput {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  head: string; // Source branch
  base: string; // Target branch
  draft?: boolean;
}

/**
 * GitHub Service Class
 *
 * Supports BYOK (Bring Your Own Key):
 * - Use GitHubService.forOrg(orgId) to get a service with org's credentials
 * - Falls back to QUAD Platform credentials if org doesn't have BYOK enabled
 */
export class GitHubService {
  private config: GitHubConfig;

  constructor(config?: Partial<GitHubConfig>) {
    this.config = {
      clientId: config?.clientId || process.env.GITHUB_CLIENT_ID || '',
      clientSecret: config?.clientSecret || process.env.GITHUB_CLIENT_SECRET || '',
      redirectUri: config?.redirectUri || DEFAULT_REDIRECT_URI_PATTERN,
      isByok: config?.isByok || false,
    };
  }

  /**
   * Factory method: Create GitHubService with org's credentials (BYOK if enabled)
   *
   * This is the PREFERRED way to get a GitHubService instance.
   * It automatically checks if the org has BYOK enabled and uses their credentials.
   *
   * TODO: Implement via Java backend when endpoints are ready
   */
  static async forOrg(orgId: string): Promise<GitHubService> {
    console.log(`[GitHub] forOrg: ${orgId} - returning default service (BYOK not implemented yet)`);
    // TODO: Call Java backend to check if org has BYOK enabled
    // For now, return default service
    return new GitHubService();
  }

  /**
   * Check if this service instance is using BYOK credentials
   */
  isByokEnabled(): boolean {
    return this.config.isByok || false;
  }

  /**
   * Get the current config (for debugging/display - secrets masked)
   */
  getConfigSummary(): { clientId: string; redirectUri: string; isByok: boolean } {
    return {
      clientId: this.config.clientId.substring(0, 8) + '...',
      redirectUri: this.config.redirectUri,
      isByok: this.config.isByok || false,
    };
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: REQUIRED_SCOPES.join(' '),
      state: state,
      allow_signup: 'false',
    });

    return `${GITHUB_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GitHubTokens> {
    const response = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code,
        redirect_uri: this.config.redirectUri,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
    }

    return data;
  }

  /**
   * Make authenticated request to GitHub API
   */
  private async request<T>(
    accessToken: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API_BASE}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`GitHub API error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get authenticated user info
   */
  async getUser(accessToken: string): Promise<GitHubUser> {
    return this.request<GitHubUser>(accessToken, '/user');
  }

  /**
   * Get user's email (may require separate call)
   */
  async getUserEmail(accessToken: string): Promise<string | null> {
    const emails = await this.request<{ email: string; primary: boolean }[]>(
      accessToken,
      '/user/emails'
    );
    const primary = emails.find(e => e.primary);
    return primary?.email || emails[0]?.email || null;
  }

  /**
   * List repositories accessible to the user
   */
  async listRepositories(
    accessToken: string,
    options: { type?: 'all' | 'owner' | 'member'; sort?: 'created' | 'updated' | 'pushed' | 'full_name'; per_page?: number } = {}
  ): Promise<GitHubRepository[]> {
    const params = new URLSearchParams({
      type: options.type || 'all',
      sort: options.sort || 'updated',
      per_page: String(options.per_page || 100),
    });

    return this.request<GitHubRepository[]>(accessToken, `/user/repos?${params.toString()}`);
  }

  /**
   * Get a specific repository
   */
  async getRepository(accessToken: string, owner: string, repo: string): Promise<GitHubRepository> {
    return this.request<GitHubRepository>(accessToken, `/repos/${owner}/${repo}`);
  }

  /**
   * List branches in a repository
   */
  async listBranches(accessToken: string, owner: string, repo: string): Promise<GitHubBranch[]> {
    return this.request<GitHubBranch[]>(accessToken, `/repos/${owner}/${repo}/branches`);
  }

  /**
   * Get a specific branch
   */
  async getBranch(accessToken: string, owner: string, repo: string, branch: string): Promise<GitHubBranch> {
    return this.request<GitHubBranch>(accessToken, `/repos/${owner}/${repo}/branches/${branch}`);
  }

  /**
   * Create a new branch
   */
  async createBranch(accessToken: string, input: CreateBranchInput): Promise<{ ref: string; sha: string }> {
    const { owner, repo, branchName, fromBranch } = input;

    // Get the SHA of the source branch
    const sourceBranch = fromBranch || (await this.getRepository(accessToken, owner, repo)).default_branch;
    const source = await this.getBranch(accessToken, owner, repo, sourceBranch);

    // Create the new branch as a git ref
    const result = await this.request<{ ref: string; object: { sha: string } }>(
      accessToken,
      `/repos/${owner}/${repo}/git/refs`,
      {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: source.commit.sha,
        }),
      }
    );

    return { ref: result.ref, sha: result.object.sha };
  }

  /**
   * Create a pull request
   */
  async createPullRequest(accessToken: string, input: CreatePullRequestInput): Promise<GitHubPullRequest> {
    const { owner, repo, title, body, head, base, draft } = input;

    return this.request<GitHubPullRequest>(
      accessToken,
      `/repos/${owner}/${repo}/pulls`,
      {
        method: 'POST',
        body: JSON.stringify({
          title,
          body: body || '',
          head,
          base,
          draft: draft || false,
        }),
      }
    );
  }

  /**
   * List pull requests
   */
  async listPullRequests(
    accessToken: string,
    owner: string,
    repo: string,
    options: { state?: 'open' | 'closed' | 'all'; head?: string; base?: string } = {}
  ): Promise<GitHubPullRequest[]> {
    const params = new URLSearchParams();
    if (options.state) params.set('state', options.state);
    if (options.head) params.set('head', options.head);
    if (options.base) params.set('base', options.base);

    return this.request<GitHubPullRequest[]>(
      accessToken,
      `/repos/${owner}/${repo}/pulls?${params.toString()}`
    );
  }

  /**
   * Get a specific pull request
   */
  async getPullRequest(accessToken: string, owner: string, repo: string, pullNumber: number): Promise<GitHubPullRequest> {
    return this.request<GitHubPullRequest>(accessToken, `/repos/${owner}/${repo}/pulls/${pullNumber}`);
  }

  /**
   * Save integration to database
   * TODO: Implement via Java backend when endpoints are ready
   */
  async saveIntegration(
    orgId: string,
    userId: string,
    tokens: GitHubTokens,
    user: GitHubUser
  ): Promise<void> {
    console.log(`[GitHub] saveIntegration for org: ${orgId}, user: ${userId}, login: ${user.login}`);
    // TODO: Call Java backend to save integration
  }

  /**
   * Get valid access token for org
   * TODO: Implement via Java backend when endpoints are ready
   */
  async getAccessToken(orgId: string): Promise<string | null> {
    console.log(`[GitHub] getAccessToken for org: ${orgId}`);
    // TODO: Call Java backend to get stored token
    return null;
  }

  /**
   * Disconnect integration
   * TODO: Implement via Java backend when endpoints are ready
   */
  async disconnect(orgId: string): Promise<void> {
    console.log(`[GitHub] disconnect for org: ${orgId}`);
    // TODO: Call Java backend to delete integration
  }

  /**
   * Save BYOK credentials for an organization
   * TODO: Implement via Java backend when endpoints are ready
   */
  async saveBYOKCredentials(
    orgId: string,
    credentials: {
      clientId: string;
      clientSecret: string;
      redirectUri?: string;
    }
  ): Promise<void> {
    console.log(`[GitHub] saveBYOKCredentials for org: ${orgId}, clientId: ${credentials.clientId.substring(0, 8)}...`);
    // TODO: Call Java backend to save BYOK credentials
  }

  /**
   * Disable BYOK and revert to QUAD Platform credentials
   * TODO: Implement via Java backend when endpoints are ready
   */
  async disableBYOK(orgId: string): Promise<void> {
    console.log(`[GitHub] disableBYOK for org: ${orgId}`);
    // TODO: Call Java backend to disable BYOK
  }

  /**
   * Get BYOK status for an organization
   * TODO: Implement via Java backend when endpoints are ready
   */
  async getBYOKStatus(orgId: string): Promise<{
    enabled: boolean;
    hasCredentials: boolean;
    clientIdPreview: string | null;
  }> {
    console.log(`[GitHub] getBYOKStatus for org: ${orgId}`);
    // TODO: Call Java backend to get BYOK status
    return {
      enabled: false,
      hasCredentials: false,
      clientIdPreview: null,
    };
  }

  /**
   * Generate branch name from Flow
   */
  generateBranchName(
    flowId: string,
    flowTitle: string,
    type: 'feature' | 'bugfix' | 'hotfix' = 'feature'
  ): string {
    const prefix = {
      feature: 'feature/',
      bugfix: 'bugfix/',
      hotfix: 'hotfix/',
    }[type];

    // Clean the title for branch name
    const cleanTitle = flowTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .substring(0, 50); // Limit length

    return `${prefix}FLOW-${flowId.substring(0, 8)}-${cleanTitle}`;
  }

  /**
   * Generate PR title from Flow
   */
  generatePRTitle(flowTitle: string, flowId: string): string {
    return `[FLOW-${flowId.substring(0, 8)}] ${flowTitle}`;
  }

  /**
   * Generate PR body from Flow details
   */
  generatePRBody(flow: {
    id: string;
    title: string;
    description?: string;
    acceptance_criteria?: string;
  }): string {
    return `## Flow Details

**Flow ID:** \`${flow.id.substring(0, 8)}\`
**Title:** ${flow.title}

${flow.description ? `### Description\n${flow.description}\n` : ''}
${flow.acceptance_criteria ? `### Acceptance Criteria\n${flow.acceptance_criteria}\n` : ''}

---
*Created via QUAD Framework*
`;
  }
}

// Export singleton instance
export const gitHubService = new GitHubService();
