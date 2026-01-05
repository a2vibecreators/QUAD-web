/**
 * POST /api/flows/[id]/pull-request
 * GET /api/flows/[id]/pull-request
 *
 * Creates and manages Pull Requests for Flows.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready
import { gitHubService } from '@/lib/integrations';

// TODO: All database operations in this file need to be implemented via Java backend

interface Flow {
  id: string;
  title: string;
  description: string | null;
  acceptance_criteria: string | null;
  domain_id: string;
  domain: { id: string; org_id: string };
}

interface GitRepo {
  id: string;
  repo_name: string;
  repo_full_name: string;
  repo_url: string;
  default_branch: string | null;
}

interface FlowBranch {
  id: string;
  branch_name: string;
  repository: GitRepo;
}

interface PRData {
  id: string;
  pr_number: number;
  title: string;
  description: string | null;
  pr_url: string;
  state: string;
  is_draft: boolean;
  is_merged: boolean;
  merged_at: Date | null;
  head_branch: string;
  base_branch: string;
  created_at: Date;
  branch: { id: string; branch_name: string; branch_type: string } | null;
  repository: GitRepo;
  pr_reviewers: { id: string; user_id: string; status: string; assigned_at: Date; reviewed_at: Date | null; user: { id: string; full_name: string | null; email: string } }[];
  pr_approvals: { id: string; user_id: string; approved_at: Date; comment: string | null; commit_sha: string | null; user: { id: string; full_name: string | null; email: string } }[];
}

async function getUserById(_email: string): Promise<{ id: string; org_id: string | null } | null> {
  console.log('[FlowPR] getUserById - stub');
  return null;
}

async function getFlowWithDomain(_flowId: string): Promise<Flow | null> {
  console.log(`[FlowPR] getFlowWithDomain: ${_flowId}`);
  return null;
}

async function getGitIntegration(_orgId: string): Promise<{ access_token: string | null } | null> {
  console.log(`[FlowPR] getGitIntegration: ${_orgId}`);
  return null;
}

async function getFlowBranch(_branchId: string | null, _flowId: string): Promise<(FlowBranch & { repository: GitRepo }) | null> {
  console.log('[FlowPR] getFlowBranch - stub');
  return null;
}

async function getExistingPR(_branchId: string): Promise<PRData | null> {
  console.log('[FlowPR] getExistingPR - stub');
  return null;
}

async function createPullRequestRecord(_data: object): Promise<PRData> {
  console.log('[FlowPR] createPullRequestRecord - stub');
  return { id: 'mock-id', pr_number: 0, title: '', description: null, pr_url: '', state: 'open', is_draft: false, is_merged: false, merged_at: null, head_branch: '', base_branch: 'main', created_at: new Date(), branch: null, repository: { id: '', repo_name: '', repo_full_name: '', repo_url: '', default_branch: 'main' }, pr_reviewers: [], pr_approvals: [] };
}

async function updateFlowWithPR(_flowId: string, _prId: string, _prUrl: string): Promise<void> {
  console.log(`[FlowPR] updateFlowWithPR: ${_flowId}`);
}

async function getFlowPullRequests(_flowId: string): Promise<PRData[]> {
  console.log(`[FlowPR] getFlowPullRequests: ${_flowId}`);
  return [];
}

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
    const user = await getUserById(session.user.email);

    if (!user?.org_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Get the Flow with domain info
    const flow = await getFlowWithDomain(flowId);

    if (!flow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
    }

    // Verify Flow belongs to user's org
    if (flow.domain.org_id !== user.org_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get GitHub integration
    const integration = await getGitIntegration(user.org_id);

    if (!integration?.access_token) {
      return NextResponse.json(
        { error: 'GitHub not connected', code: 'GIT_NOT_CONNECTED' },
        { status: 400 }
      );
    }

    // Get the branch - either specified or most recent active for Flow
    const flowBranch = await getFlowBranch(branchId || null, flowId);

    if (!flowBranch) {
      return NextResponse.json(
        { error: 'No branch found. Create a branch first.', code: 'NO_BRANCH' },
        { status: 400 }
      );
    }

    // Check if PR already exists for this branch
    const existingPR = await getExistingPR(flowBranch.id);

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
    const pullRequest = await createPullRequestRecord({
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
    });

    // Update Flow with PR info
    await updateFlowWithPR(flowId, pullRequest.id, pr.html_url);

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
    const user = await getUserById(session.user.email);

    if (!user?.org_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Get PRs for this Flow with reviewers and approvals
    const pullRequests = await getFlowPullRequests(flowId);

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
