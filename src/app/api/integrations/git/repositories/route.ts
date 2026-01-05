/**
 * GET /api/integrations/git/repositories
 * POST /api/integrations/git/repositories
 *
 * List available repositories and connect repos to domains.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready
import { gitHubService } from '@/lib/integrations';

// TODO: Implement via Java backend when endpoints are ready
async function getUserOrg(email: string): Promise<string | null> {
  console.log(`[GitRepositories] getUserOrg for email: ${email}`);
  return 'mock-org-id';
}

// TODO: Implement via Java backend when endpoints are ready
async function getUserWithOrg(email: string): Promise<{ id: string; org_id: string } | null> {
  console.log(`[GitRepositories] getUserWithOrg for email: ${email}`);
  return { id: 'mock-user-id', org_id: 'mock-org-id' };
}

// TODO: Implement via Java backend when endpoints are ready
async function getGitHubIntegration(orgId: string): Promise<{ access_token: string } | null> {
  console.log(`[GitRepositories] getGitHubIntegration for org: ${orgId}`);
  return null; // Return null until backend ready - GitHub not connected
}

// TODO: Implement via Java backend when endpoints are ready
async function getConnectedRepos(orgId: string): Promise<{
  external_id: string;
  domain_id: string | null;
  is_primary: boolean;
}[]> {
  console.log(`[GitRepositories] getConnectedRepos for org: ${orgId}`);
  return []; // Return empty until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function verifyDomainBelongsToOrg(domainId: string, orgId: string): Promise<boolean> {
  console.log(`[GitRepositories] verifyDomainBelongsToOrg: domain=${domainId}, org=${orgId}`);
  return true; // Allow until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function unsetPrimaryRepos(domainId: string): Promise<void> {
  console.log(`[GitRepositories] unsetPrimaryRepos for domain: ${domainId}`);
}

// TODO: Implement via Java backend when endpoints are ready
async function upsertGitRepository(data: {
  orgId: string;
  domainId: string;
  externalId: string;
  owner: string;
  repoName: string;
  repoFullName: string;
  repoUrl: string;
  cloneUrl: string;
  defaultBranch: string;
  isPrivate: boolean;
  isPrimary: boolean;
  connectedBy: string;
}): Promise<{
  id: string;
  repo_name: string;
  repo_full_name: string;
  repo_url: string;
  is_primary: boolean;
}> {
  console.log(`[GitRepositories] upsertGitRepository:`, data);
  return {
    id: 'mock-repo-id',
    repo_name: data.repoName,
    repo_full_name: data.repoFullName,
    repo_url: data.repoUrl,
    is_primary: data.isPrimary,
  };
}

/**
 * GET - List repositories from connected Git providers
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domain_id');

    // Get user's org
    const orgId = await getUserOrg(session.user.email);

    if (!orgId) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Get GitHub integration
    const integration = await getGitHubIntegration(orgId);

    if (!integration?.access_token) {
      return NextResponse.json(
        { error: 'GitHub not connected' },
        { status: 400 }
      );
    }

    // Fetch repositories from GitHub
    const repos = await gitHubService.listRepositories(integration.access_token, {
      type: 'all',
      sort: 'updated',
      per_page: 100,
    });

    // Get already connected repositories for this org
    const connectedRepos = await getConnectedRepos(orgId);

    // Build response with connection status
    const reposWithStatus = repos.map((repo) => {
      const connected = connectedRepos.find(
        (cr) => cr.external_id === String(repo.id)
      );

      return {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        ownerType: repo.owner.type,
        private: repo.private,
        description: repo.description,
        defaultBranch: repo.default_branch,
        htmlUrl: repo.html_url,
        cloneUrl: repo.clone_url,
        permissions: repo.permissions,
        connected: !!connected,
        connectedToDomainId: connected?.domain_id || null,
        isPrimary: connected?.is_primary || false,
      };
    });

    // If domain_id provided, filter to show unconnected or connected to this domain
    let filteredRepos = reposWithStatus;
    if (domainId) {
      filteredRepos = reposWithStatus.filter(
        (repo) => !repo.connected || repo.connectedToDomainId === domainId
      );
    }

    return NextResponse.json({
      repositories: filteredRepos,
      total: filteredRepos.length,
      hasMore: repos.length >= 100,
    });
  } catch (error) {
    console.error('List repositories error:', error);
    return NextResponse.json(
      { error: 'Failed to list repositories' },
      { status: 500 }
    );
  }
}

/**
 * POST - Connect a repository to a domain
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { repositoryId, domainId, isPrimary = true } = body;

    if (!repositoryId || !domainId) {
      return NextResponse.json(
        { error: 'repositoryId and domainId are required' },
        { status: 400 }
      );
    }

    // Get user's org
    const user = await getUserWithOrg(session.user.email);

    if (!user?.org_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Verify domain belongs to org
    const domainValid = await verifyDomainBelongsToOrg(domainId, user.org_id);

    if (!domainValid) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Get GitHub integration
    const integration = await getGitHubIntegration(user.org_id);

    if (!integration?.access_token) {
      return NextResponse.json(
        { error: 'GitHub not connected' },
        { status: 400 }
      );
    }

    // Fetch repository details from GitHub
    const repos = await gitHubService.listRepositories(integration.access_token);
    const repo = repos.find((r) => r.id === Number(repositoryId));

    if (!repo) {
      return NextResponse.json(
        { error: 'Repository not found or not accessible' },
        { status: 404 }
      );
    }

    // If setting as primary, unset other primary repos for this domain
    if (isPrimary) {
      await unsetPrimaryRepos(domainId);
    }

    // Create or update repository connection
    const gitRepo = await upsertGitRepository({
      orgId: user.org_id,
      domainId,
      externalId: String(repo.id),
      owner: repo.owner.login,
      repoName: repo.name,
      repoFullName: repo.full_name,
      repoUrl: repo.html_url,
      cloneUrl: repo.clone_url,
      defaultBranch: repo.default_branch,
      isPrivate: repo.private,
      isPrimary,
      connectedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      repository: {
        id: gitRepo.id,
        name: gitRepo.repo_name,
        fullName: gitRepo.repo_full_name,
        url: gitRepo.repo_url,
        isPrimary: gitRepo.is_primary,
      },
    });
  } catch (error) {
    console.error('Connect repository error:', error);
    return NextResponse.json(
      { error: 'Failed to connect repository' },
      { status: 500 }
    );
  }
}
