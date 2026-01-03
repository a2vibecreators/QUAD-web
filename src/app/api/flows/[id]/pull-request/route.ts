/**
 * POST /api/flows/[id]/pull-request
 * GET /api/flows/[id]/pull-request
 *
 * Creates and manages Pull Requests for Flows.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { gitHubService } from '@/lib/integrations';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST - Create a Pull Request for a Flow
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: flowId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const {
      title: customTitle,
      body: customBody,
      baseBranch,
      draft = false,
      branchId,
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

    // Get the branch - either specified or most recent active for Flow
    let flowBranch;
    if (branchId) {
      flowBranch = await prisma.qUAD_flow_branches.findUnique({
        where: { id: branchId },
        include: { repository: true },
      });
    } else {
      flowBranch = await prisma.qUAD_flow_branches.findFirst({
        where: {
          flow_id: flowId,
          is_active: true,
        },
        include: { repository: true },
        orderBy: { created_at: 'desc' },
      });
    }

    if (!flowBranch) {
      return NextResponse.json(
        { error: 'No branch found. Create a branch first.', code: 'NO_BRANCH' },
        { status: 400 }
      );
    }

    // Check if PR already exists for this branch
    const existingPR = await prisma.qUAD_pull_requests.findFirst({
      where: {
        branch_id: flowBranch.id,
        state: 'open',
      },
    });

    if (existingPR) {
      return NextResponse.json({
        success: true,
        pullRequest: {
          id: existingPR.id,
          number: existingPR.pr_number,
          title: existingPR.title,
          url: existingPR.pr_url,
          state: existingPR.state,
          alreadyExists: true,
        },
        message: 'Pull request already exists for this branch',
      });
    }

    // Generate PR title and body
    const prTitle = customTitle || gitHubService.generatePRTitle(flow.title, flowId);
    const prBody = customBody || gitHubService.generatePRBody({
      id: flowId,
      title: flow.title,
      description: flow.description || undefined,
      acceptance_criteria: flow.acceptance_criteria || undefined,
    });

    // Parse owner/repo from full name
    const [owner, repo] = flowBranch.repository.repo_full_name.split('/');

    // Create PR on GitHub
    const pr = await gitHubService.createPullRequest(integration.access_token, {
      owner,
      repo,
      title: prTitle,
      body: prBody,
      head: flowBranch.branch_name,
      base: baseBranch || flowBranch.repository.default_branch || 'main',
      draft,
    });

    // Save PR record
    const pullRequest = await prisma.qUAD_pull_requests.create({
      data: {
        flow_id: flowId,
        branch_id: flowBranch.id,
        repository_id: flowBranch.repository.id,
        pr_number: pr.number,
        external_id: String(pr.id),
        title: pr.title,
        description: pr.body,
        pr_url: pr.html_url,
        head_branch: pr.head.ref,
        base_branch: pr.base.ref,
        head_sha: pr.head.sha,
        state: pr.state,
        is_draft: draft,
        created_by: user.id,
      },
    });

    // Update Flow with PR info
    await prisma.qUAD_flows.update({
      where: { id: flowId },
      data: {
        git_pull_request_id: pullRequest.id,
        git_pull_request_url: pr.html_url,
      },
    });

    return NextResponse.json({
      success: true,
      pullRequest: {
        id: pullRequest.id,
        number: pr.number,
        title: pr.title,
        url: pr.html_url,
        state: pr.state,
        isDraft: draft,
        headBranch: pr.head.ref,
        baseBranch: pr.base.ref,
      },
      repository: {
        id: flowBranch.repository.id,
        name: flowBranch.repository.repo_name,
        fullName: flowBranch.repository.repo_full_name,
      },
    });
  } catch (error) {
    console.error('Create PR error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create pull request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET - Get Pull Request info for a Flow
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

    // Get PRs for this Flow with reviewers and approvals
    const pullRequests = await prisma.qUAD_pull_requests.findMany({
      where: { flow_id: flowId },
      include: {
        branch: {
          select: {
            id: true,
            branch_name: true,
            branch_type: true,
          },
        },
        repository: {
          select: {
            id: true,
            repo_name: true,
            repo_full_name: true,
            repo_url: true,
          },
        },
        pr_reviewers: {
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                email: true,
              },
            },
          },
          orderBy: { assigned_at: 'asc' },
        },
        pr_approvals: {
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                email: true,
              },
            },
          },
          orderBy: { approved_at: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({
      pullRequests: pullRequests.map((pr) => ({
        id: pr.id,
        number: pr.pr_number,
        title: pr.title,
        url: pr.pr_url,
        state: pr.state,
        isDraft: pr.is_draft,
        isMerged: pr.is_merged,
        mergedAt: pr.merged_at,
        headBranch: pr.head_branch,
        baseBranch: pr.base_branch,
        createdAt: pr.created_at,
        branch: pr.branch,
        repository: pr.repository,
        reviewers: pr.pr_reviewers.map((r) => ({
          id: r.id,
          userId: r.user_id,
          user: r.user,
          status: r.status,
          assignedAt: r.assigned_at,
          reviewedAt: r.reviewed_at,
        })),
        approvals: pr.pr_approvals.map((a) => ({
          id: a.id,
          userId: a.user_id,
          user: a.user,
          approvedAt: a.approved_at,
          comment: a.comment,
          commitSha: a.commit_sha,
        })),
        reviewerCount: pr.pr_reviewers.length,
        approvalCount: pr.pr_approvals.length,
      })),
    });
  } catch (error) {
    console.error('Get PRs error:', error);
    return NextResponse.json(
      { error: 'Failed to get pull requests' },
      { status: 500 }
    );
  }
}
