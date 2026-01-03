/**
 * GET /api/integrations/git/repositories
 * POST /api/integrations/git/repositories
 *
 * List available repositories and connect repos to domains.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { gitHubService } from '@/lib/integrations';

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
    const user = await prisma.qUAD_users.findUnique({
      where: { email: session.user.email },
      select: { org_id: true },
    });

    if (!user?.org_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Get GitHub integration
    const integration = await prisma.qUAD_git_integrations.findUnique({
      where: {
        org_id_provider: {
          org_id: user.org_id,
          provider: 'github',
        },
      },
    });

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
    const connectedRepos = await prisma.qUAD_git_repositories.findMany({
      where: { org_id: user.org_id },
      select: {
        external_id: true,
        domain_id: true,
        is_primary: true,
      },
    });

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
    const user = await prisma.qUAD_users.findUnique({
      where: { email: session.user.email },
      select: { id: true, org_id: true },
    });

    if (!user?.org_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Verify domain belongs to org
    const domain = await prisma.qUAD_domains.findFirst({
      where: {
        id: domainId,
        org_id: user.org_id,
        is_deleted: false,
      },
    });

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Get GitHub integration
    const integration = await prisma.qUAD_git_integrations.findUnique({
      where: {
        org_id_provider: {
          org_id: user.org_id,
          provider: 'github',
        },
      },
    });

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
      await prisma.qUAD_git_repositories.updateMany({
        where: {
          domain_id: domainId,
          is_primary: true,
        },
        data: { is_primary: false },
      });
    }

    // Create or update repository connection
    const gitRepo = await prisma.qUAD_git_repositories.upsert({
      where: {
        org_id_external_id: {
          org_id: user.org_id,
          external_id: String(repo.id),
        },
      },
      update: {
        domain_id: domainId,
        is_primary: isPrimary,
        repo_name: repo.name,
        repo_full_name: repo.full_name,
        repo_url: repo.html_url,
        clone_url: repo.clone_url,
        default_branch: repo.default_branch,
        is_private: repo.private,
      },
      create: {
        org_id: user.org_id,
        domain_id: domainId,
        provider: 'github',
        external_id: String(repo.id),
        owner: repo.owner.login,
        repo_name: repo.name,
        repo_full_name: repo.full_name,
        repo_url: repo.html_url,
        clone_url: repo.clone_url,
        default_branch: repo.default_branch,
        is_private: repo.private,
        is_primary: isPrimary,
        connected_by: user.id,
      },
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
