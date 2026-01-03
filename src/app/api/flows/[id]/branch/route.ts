/**
 * POST /api/flows/[id]/branch
 *
 * Creates a Git branch for a Flow.
 * Branch name is auto-generated from Flow title and ID.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { gitHubService } from '@/lib/integrations';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: flowId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const {
      branchType = 'feature',
      fromBranch,
      repositoryId,
    } = body;

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

    // Get the Flow with domain info
    const flow = await prisma.qUAD_flows.findUnique({
      where: { id: flowId },
      include: {
        domain: true,
      },
    });

    if (!flow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
    }

    // Verify Flow belongs to user's org
    if (flow.domain.org_id !== user.org_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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
        { error: 'GitHub not connected', code: 'GIT_NOT_CONNECTED' },
        { status: 400 }
      );
    }

    // Get repository - either specified or primary for domain
    let gitRepo;
    if (repositoryId) {
      gitRepo = await prisma.qUAD_git_repositories.findFirst({
        where: {
          id: repositoryId,
          org_id: user.org_id,
        },
      });
    } else {
      gitRepo = await prisma.qUAD_git_repositories.findFirst({
        where: {
          domain_id: flow.domain_id,
          is_primary: true,
        },
      });
    }

    if (!gitRepo) {
      return NextResponse.json(
        { error: 'No repository connected to this domain', code: 'NO_REPO' },
        { status: 400 }
      );
    }

    // Check if branch already exists for this Flow
    const existingBranch = await prisma.qUAD_flow_branches.findFirst({
      where: {
        flow_id: flowId,
        repository_id: gitRepo.id,
        is_active: true,
      },
    });

    if (existingBranch) {
      return NextResponse.json({
        success: true,
        branch: {
          id: existingBranch.id,
          name: existingBranch.branch_name,
          url: existingBranch.branch_url,
          alreadyExists: true,
        },
        message: 'Branch already exists for this Flow',
      });
    }

    // Generate branch name
    const branchName = gitHubService.generateBranchName(
      flowId,
      flow.title,
      branchType as 'feature' | 'bugfix' | 'hotfix'
    );

    // Parse owner/repo from full name
    const [owner, repo] = gitRepo.repo_full_name.split('/');

    // Create branch on GitHub
    const result = await gitHubService.createBranch(integration.access_token, {
      owner,
      repo,
      branchName,
      fromBranch: fromBranch || gitRepo.default_branch || undefined,
    });

    // Save branch record
    const flowBranch = await prisma.qUAD_flow_branches.create({
      data: {
        flow_id: flowId,
        repository_id: gitRepo.id,
        branch_name: branchName,
        branch_type: branchType,
        branch_url: `${gitRepo.repo_url}/tree/${branchName}`,
        source_branch: fromBranch || gitRepo.default_branch || 'main',
        commit_sha: result.sha,
        created_by: user.id,
        is_active: true,
      },
    });

    // Update Flow with branch info
    await prisma.qUAD_flows.update({
      where: { id: flowId },
      data: {
        git_branch: branchName,
        git_repository_id: gitRepo.id,
      },
    });

    return NextResponse.json({
      success: true,
      branch: {
        id: flowBranch.id,
        name: branchName,
        url: flowBranch.branch_url,
        sha: result.sha,
        sourceRef: result.ref,
      },
      repository: {
        id: gitRepo.id,
        name: gitRepo.repo_name,
        fullName: gitRepo.repo_full_name,
      },
    });
  } catch (error) {
    console.error('Create branch error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create branch';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET - Get branch info for a Flow
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: flowId } = await context.params;

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

    // Get branches for this Flow
    const branches = await prisma.qUAD_flow_branches.findMany({
      where: { flow_id: flowId },
      include: {
        repository: {
          select: {
            id: true,
            repo_name: true,
            repo_full_name: true,
            repo_url: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({
      branches: branches.map((b) => ({
        id: b.id,
        name: b.branch_name,
        type: b.branch_type,
        url: b.branch_url,
        sourceBranch: b.source_branch,
        isActive: b.is_active,
        createdAt: b.created_at,
        repository: b.repository,
      })),
    });
  } catch (error) {
    console.error('Get branches error:', error);
    return NextResponse.json(
      { error: 'Failed to get branches' },
      { status: 500 }
    );
  }
}
