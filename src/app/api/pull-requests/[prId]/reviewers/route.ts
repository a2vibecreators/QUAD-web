/**
 * GET /api/pull-requests/[prId]/reviewers
 * POST /api/pull-requests/[prId]/reviewers
 * DELETE /api/pull-requests/[prId]/reviewers
 *
 * Manage reviewers for a Pull Request.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready

// TODO: All database operations in this file need to be implemented via Java backend
// Stubbed functions return safe defaults until backend is ready

interface User {
  id: string;
  full_name: string | null;
  email: string;
}

interface Assigner {
  id: string;
  full_name: string | null;
}

interface Reviewer {
  id: string;
  user_id: string;
  status: string;
  assigned_at: Date;
  assigned_by: string | null;
  reviewed_at: Date | null;
  user: User;
  assigner: Assigner | null;
}

interface PR {
  id: string;
  flow: { domain: { org_id: string } };
}

async function getUserOrgId(_email: string): Promise<string | null> {
  console.log('[PRReviewers] getUserOrgId - stub');
  return 'mock-org-id';
}

async function getUserById(_email: string): Promise<{ id: string; org_id: string | null; role: string | null } | null> {
  console.log('[PRReviewers] getUserById - stub');
  return null;
}

async function getPRWithOrgVerification(_prId: string): Promise<PR | null> {
  console.log('[PRReviewers] getPRWithOrgVerification - stub');
  return null;
}

async function getPRReviewers(_prId: string): Promise<Reviewer[]> {
  console.log('[PRReviewers] getPRReviewers - stub');
  return [];
}

async function findUserInOrg(_userId: string, _orgId: string): Promise<{ id: string } | null> {
  console.log('[PRReviewers] findUserInOrg - stub');
  return null;
}

async function upsertReviewer(_prId: string, _userId: string, _assignedBy: string): Promise<Reviewer> {
  console.log('[PRReviewers] upsertReviewer - stub');
  return {
    id: 'mock-id',
    user_id: _userId,
    status: 'pending',
    assigned_at: new Date(),
    assigned_by: _assignedBy,
    reviewed_at: null,
    user: { id: _userId, full_name: null, email: '' },
    assigner: null,
  };
}

async function deleteReviewer(_prId: string, _userId: string): Promise<void> {
  console.log('[PRReviewers] deleteReviewer - stub');
}

async function updateReviewerStatus(_prId: string, _userId: string, _status: string): Promise<Reviewer> {
  console.log('[PRReviewers] updateReviewerStatus - stub');
  return {
    id: 'mock-id',
    user_id: _userId,
    status: _status,
    assigned_at: new Date(),
    assigned_by: null,
    reviewed_at: _status !== 'pending' ? new Date() : null,
    user: { id: _userId, full_name: null, email: '' },
    assigner: null,
  };
}

interface RouteContext {
  params: Promise<{ prId: string }>;
}

/**
 * GET - Get all reviewers for a PR
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

    // Get reviewers
    const reviewers = await getPRReviewers(prId);

    return NextResponse.json({
      reviewers: reviewers.map((r) => ({
        id: r.id,
        userId: r.user_id,
        user: r.user,
        status: r.status,
        assignedAt: r.assigned_at,
        assignedBy: r.assigner,
        reviewedAt: r.reviewed_at,
      })),
    });
  } catch (error) {
    console.error('Get PR reviewers error:', error);
    return NextResponse.json(
      { error: 'Failed to get reviewers' },
      { status: 500 }
    );
  }
}

/**
 * POST - Add a reviewer to a PR
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prId } = await context.params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

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

    // Verify reviewer exists and is in org
    const reviewer = await findUserInOrg(userId, user.org_id);

    if (!reviewer) {
      return NextResponse.json(
        { error: 'Reviewer not found in organization' },
        { status: 400 }
      );
    }

    // Add reviewer (upsert to handle re-assignments)
    const prReviewer = await upsertReviewer(prId, userId, user.id);

    return NextResponse.json({
      success: true,
      reviewer: {
        id: prReviewer.id,
        userId: prReviewer.user_id,
        user: prReviewer.user,
        status: prReviewer.status,
        assignedAt: prReviewer.assigned_at,
      },
    });
  } catch (error) {
    console.error('Add PR reviewer error:', error);
    return NextResponse.json(
      { error: 'Failed to add reviewer' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a reviewer from a PR
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

    if (!userId) {
      return NextResponse.json({ error: 'userId query param required' }, { status: 400 });
    }

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

    // Delete reviewer assignment
    await deleteReviewer(prId, userId);

    return NextResponse.json({
      success: true,
      message: 'Reviewer removed',
    });
  } catch (error) {
    console.error('Remove PR reviewer error:', error);
    return NextResponse.json(
      { error: 'Failed to remove reviewer' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update reviewer status
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prId } = await context.params;
    const body = await request.json();
    const { userId, status } = body;

    if (!userId || !status) {
      return NextResponse.json(
        { error: 'userId and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'approved', 'changes_requested', 'commented'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Valid: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

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

    // Update reviewer status
    const updated = await updateReviewerStatus(prId, userId, status);

    return NextResponse.json({
      success: true,
      reviewer: {
        id: updated.id,
        userId: updated.user_id,
        user: updated.user,
        status: updated.status,
        reviewedAt: updated.reviewed_at,
      },
    });
  } catch (error) {
    console.error('Update PR reviewer status error:', error);
    return NextResponse.json(
      { error: 'Failed to update reviewer status' },
      { status: 500 }
    );
  }
}
