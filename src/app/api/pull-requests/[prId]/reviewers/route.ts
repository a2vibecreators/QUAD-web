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
import { prisma } from '@/lib/prisma';

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

    // Get PR with org verification
    const pr = await prisma.qUAD_pull_requests.findUnique({
      where: { id: prId },
      include: {
        flow: {
          include: {
            domain: { select: { org_id: true } },
          },
        },
      },
    });

    if (!pr || !pr.flow) {
      return NextResponse.json({ error: 'Pull request not found' }, { status: 404 });
    }

    if (pr.flow.domain.org_id !== user.org_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get reviewers
    const reviewers = await prisma.qUAD_pr_reviewers.findMany({
      where: { pr_id: prId },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        assigner: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
      orderBy: { assigned_at: 'asc' },
    });

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

    // Get PR with org verification
    const pr = await prisma.qUAD_pull_requests.findUnique({
      where: { id: prId },
      include: {
        flow: {
          include: {
            domain: { select: { org_id: true } },
          },
        },
      },
    });

    if (!pr || !pr.flow) {
      return NextResponse.json({ error: 'Pull request not found' }, { status: 404 });
    }

    if (pr.flow.domain.org_id !== user.org_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify reviewer exists and is in org
    const reviewer = await prisma.qUAD_users.findFirst({
      where: {
        id: userId,
        org_id: user.org_id,
      },
    });

    if (!reviewer) {
      return NextResponse.json(
        { error: 'Reviewer not found in organization' },
        { status: 400 }
      );
    }

    // Add reviewer (upsert to handle re-assignments)
    const prReviewer = await prisma.qUAD_pr_reviewers.upsert({
      where: {
        pr_id_user_id: { pr_id: prId, user_id: userId },
      },
      update: {
        status: 'pending',
        assigned_at: new Date(),
        assigned_by: user.id,
        reviewed_at: null,
      },
      create: {
        pr_id: prId,
        user_id: userId,
        assigned_by: user.id,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

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

    // Get PR with org verification
    const pr = await prisma.qUAD_pull_requests.findUnique({
      where: { id: prId },
      include: {
        flow: {
          include: {
            domain: { select: { org_id: true } },
          },
        },
      },
    });

    if (!pr || !pr.flow) {
      return NextResponse.json({ error: 'Pull request not found' }, { status: 404 });
    }

    if (pr.flow.domain.org_id !== user.org_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete reviewer assignment
    await prisma.qUAD_pr_reviewers.deleteMany({
      where: {
        pr_id: prId,
        user_id: userId,
      },
    });

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

    // Get PR with org verification
    const pr = await prisma.qUAD_pull_requests.findUnique({
      where: { id: prId },
      include: {
        flow: {
          include: {
            domain: { select: { org_id: true } },
          },
        },
      },
    });

    if (!pr || !pr.flow) {
      return NextResponse.json({ error: 'Pull request not found' }, { status: 404 });
    }

    if (pr.flow.domain.org_id !== user.org_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update reviewer status
    const updated = await prisma.qUAD_pr_reviewers.update({
      where: {
        pr_id_user_id: { pr_id: prId, user_id: userId },
      },
      data: {
        status,
        reviewed_at: status !== 'pending' ? new Date() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

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
