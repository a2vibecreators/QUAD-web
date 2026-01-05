/**
 * POST /api/flows/[id]/branch
 *
 * Creates a Git branch for a Flow.
 * Branch name is auto-generated from Flow title and ID.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready
import { gitHubService } from '@/lib/integrations';

// TODO: All database operations in this file need to be implemented via Java backend

// TypeScript interfaces for data types
interface User {
  id: string;
  org_id: string | null;
}

interface Flow {
  id: string;
  title: string;
  description: string | null;
  domain_id: string;
  domain: { id: string; org_id: string };
}

interface GitIntegration {
  id: string;
  org_id: string;
  provider: string;
  access_token: string | null;
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
  flow_id: string;
  repository_id: string;
  branch_name: string;
  branch_url: string;
  branch_type: string;
  source_branch: string | null;
  commit_sha: string | null;
  is_active: boolean;
  created_at: Date;
  repository?: GitRepo;
}

interface FlowBranchCreateInput {
  flow_id: string;
  repository_id: string;
  branch_name: string;
  branch_type: string;
  branch_url: string;
  source_branch: string;
  commit_sha: string;
  created_by: string;
  is_active: boolean;
}

// Stub functions - replace with Java backend calls
async function getUserByEmail(email: string): Promise<User | null> {
  console.log(`[FlowBranch] getUserByEmail: ${email} - stub`);
  return null;
}

async function getFlowWithDomain(flowId: string): Promise<Flow | null> {
  console.log(`[FlowBranch] getFlowWithDomain: ${flowId} - stub`);
  return null;
}

async function getGitIntegration(orgId: string, provider: string): Promise<GitIntegration | null> {
  console.log(`[FlowBranch] getGitIntegration: org=${orgId}, provider=${provider} - stub`);
  return null;
}

async function getRepositoryById(repoId: string, orgId: string): Promise<GitRepo | null> {
  console.log(`[FlowBranch] getRepositoryById: ${repoId} - stub`);
  return null;
}

async function getPrimaryRepositoryForDomain(domainId: string): Promise<GitRepo | null> {
  console.log(`[FlowBranch] getPrimaryRepositoryForDomain: ${domainId} - stub`);
  return null;
}

async function getExistingBranch(flowId: string, repoId: string): Promise<FlowBranch | null> {
  console.log(`[FlowBranch] getExistingBranch: flow=${flowId}, repo=${repoId} - stub`);
  return null;
}

async function createFlowBranch(_data: FlowBranchCreateInput): Promise<FlowBranch> {
  console.log('[FlowBranch] createFlowBranch - stub');
  return {
    id: 'mock-branch-id',
    flow_id: _data.flow_id,
    repository_id: _data.repository_id,
    branch_name: _data.branch_name,
    branch_url: _data.branch_url,
    branch_type: _data.branch_type,
    source_branch: _data.source_branch,
    commit_sha: _data.commit_sha,
    is_active: true,
    created_at: new Date(),
  };
}

async function updateFlowWithBranch(flowId: string, branchName: string, repoId: string): Promise<void> {
  console.log(`[FlowBranch] updateFlowWithBranch: flow=${flowId}, branch=${branchName}, repo=${repoId} - stub`);
}

async function getFlowBranches(flowId: string): Promise<FlowBranch[]> {
  console.log(`[FlowBranch] getFlowBranches: ${flowId} - stub`);
  return [];
}

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
    const user = await getUserByEmail(session.user.email);

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
    const integration = await getGitIntegration(user.org_id, 'github');

    if (!integration?.access_token) {
      return NextResponse.json(
        { error: 'GitHub not connected', code: 'GIT_NOT_CONNECTED' },
        { status: 400 }
      );
    }

    // Get repository - either specified or primary for domain
    let gitRepo: GitRepo | null = null;
    if (repositoryId) {
      gitRepo = await getRepositoryById(repositoryId, user.org_id);
    } else {
      gitRepo = await getPrimaryRepositoryForDomain(flow.domain_id);
    }

    if (!gitRepo) {
      return NextResponse.json(
        { error: 'No repository connected to this domain', code: 'NO_REPO' },
        { status: 400 }
      );
    }

    // Check if branch already exists for this Flow
    const existingBranch = await getExistingBranch(flowId, gitRepo.id);

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
    const flowBranch = await createFlowBranch({
      flow_id: flowId,
      repository_id: gitRepo.id,
      branch_name: branchName,
      branch_type: branchType,
      branch_url: `${gitRepo.repo_url}/tree/${branchName}`,
      source_branch: fromBranch || gitRepo.default_branch || 'main',
      commit_sha: result.sha,
      created_by: user.id,
      is_active: true,
    });

    // Update Flow with branch info
    await updateFlowWithBranch(flowId, branchName, gitRepo.id);

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
    const user = await getUserByEmail(session.user.email);

    if (!user?.org_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Get branches for this Flow
    const branches = await getFlowBranches(flowId);

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
