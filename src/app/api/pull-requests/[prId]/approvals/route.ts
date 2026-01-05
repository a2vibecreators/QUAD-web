/**
 * GET /api/pull-requests/[prId]/approvals
 * POST /api/pull-requests/[prId]/approvals
 * DELETE /api/pull-requests/[prId]/approvals
 *
 * Manage approvals for a Pull Request.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready

// TODO: All database operations in this file need to be implemented via Java backend
// Stubbed functions return safe defaults until backend is ready

async function getUserOrgId(_email: string): Promise<string | null> {
  console.log('[PRApprovals] getUserOrgId - stub');
  return 'mock-org-id';
}

async function getPRWithOrgVerification(_prId: string): Promise<{ id: string; state: string; head_sha: string | null; flow: { domain: { org_id: string } } } | null> {
  console.log('[PRApprovals] getPRWithOrgVerification - stub');
  return null;
}

async function getPRApprovals(_prId: string): Promise<{ id: string; user_id: string; approved_at: Date; comment: string | null; commit_sha: string | null; user: { id: string; full_name: string | null; email: string } }[]> {
  console.log('[PRApprovals] getPRApprovals - stub');
  return [];
}

async function getUserById(_email: string): Promise<{ id: string; org_id: string | null; full_name: string | null; role: string | null } | null> {
  console.log('[PRApprovals] getUserById - stub');
  return null;
}

async function upsertApproval(_prId: string, _userId: string, _data: object): Promise<{ id: string; user_id: string; approved_at: Date; comment: string | null; commit_sha: string | null; user: { id: string; full_name: string | null; email: string } }> {
  console.log('[PRApprovals] upsertApproval - stub');
  return { id: 'mock-id', user_id: '', approved_at: new Date(), comment: null, commit_sha: null, user: { id: '', full_name: null, email: '' } };
}

async function updateReviewerStatus(_prId: string, _userId: string, _status: string): Promise<void> {
  console.log('[PRApprovals] updateReviewerStatus - stub');
}

async function deleteApproval(_prId: string, _userId: string): Promise<void> {
  console.log('[PRApprovals] deleteApproval - stub');
}

async function resetReviewerStatus(_prId: string, _userId: string): Promise<void> {
  console.log('[PRApprovals] resetReviewerStatus - stub');
}

interface RouteContext {
  params: Promise<{ prId: string }>;
}

/**
 * GET - Get all approvals for a PR
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prId } = await context.params;

    const orgId = await getUserOrgId(session.user.email);

    if (!orgId) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Get PR with org verification
    const pr = await getPRWithOrgVerification(prId);

    if (!pr) {
      return NextResponse.json({ error: 'Pull request not found' }, { status: 404 });
    }

    if (pr.flow.domain.org_id !== orgId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get approvals
    const approvals = await getPRApprovals(prId);

    return NextResponse.json({
      approvals: approvals.map((a) => ({
        id: a.id,
        userId: a.user_id,
        user: a.user,
        approvedAt: a.approved_at,
        comment: a.comment,
        commitSha: a.commit_sha,
      })),
      count: approvals.length,
    });
  } catch (error) {
    console.error('Get PR approvals error:', error);
    return NextResponse.json(
      { error: 'Failed to get approvals' },
      { status: 500 }
    );
  }
}

/**
 * POST - Add an approval to a PR
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { comment, commitSha } = body;

    const user = await getUserById(session.user.email);

    if (!user?.org_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Get PR with org verification and current head SHA
    const pr = await getPRWithOrgVerification(prId);

    if (!pr) {
      return NextResponse.json({ error: 'Pull request not found' }, { status: 404 });
    }

    if (pr.flow.domain.org_id !== user.org_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (pr.state !== 'open') {
      return NextResponse.json(
        { error: 'Cannot approve a closed or merged PR' },
        { status: 400 }
      );
    }

    // Create or update approval (upsert to allow re-approval after changes)
    const approval = await upsertApproval(prId, user.id, {
      comment: comment || null,
      commit_sha: commitSha || pr.head_sha || null,
    });

    // Also update reviewer status if this user is a reviewer
    await updateReviewerStatus(prId, user.id, 'approved');

    return NextResponse.json({
      success: true,
      approval: {
        id: approval.id,
        userId: approval.user_id,
        user: approval.user,
        approvedAt: approval.approved_at,
        comment: approval.comment,
        commitSha: approval.commit_sha,
      },
    });
  } catch (error) {
    console.error('Add PR approval error:', error);
    return NextResponse.json(
      { error: 'Failed to add approval' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove an approval (revoke)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prId } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // If no userId specified, user can only revoke their own approval
    const user = await getUserById(session.user.email);

    if (!user?.org_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Get PR with org verification
    const pr = await getPRWithOrgVerification(prId);

    if (!pr) {
      return NextResponse.json({ error: 'Pull request not found' }, { status: 404 });
    }

    if (pr.flow.domain.org_id !== user.org_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const targetUserId = userId || user.id;

    // Only allow revoking own approval, unless admin
    if (targetUserId !== user.id && user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Can only revoke your own approval' },
        { status: 403 }
      );
    }

    // Delete approval
    await deleteApproval(prId, targetUserId);

    // Reset reviewer status if applicable
    await resetReviewerStatus(prId, targetUserId);

    return NextResponse.json({
      success: true,
      message: 'Approval revoked',
    });
  } catch (error) {
    console.error('Revoke PR approval error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke approval' },
      { status: 500 }
    );
  }
}
