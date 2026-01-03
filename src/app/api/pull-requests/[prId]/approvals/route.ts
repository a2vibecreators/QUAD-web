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
import { prisma } from '@/lib/prisma';

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

    // Get approvals
    const approvals = await prisma.qUAD_pr_approvals.findMany({
      where: { pr_id: prId },
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
    });

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

    const user = await prisma.qUAD_users.findUnique({
      where: { email: session.user.email },
      select: { id: true, org_id: true, full_name: true },
    });

    if (!user?.org_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Get PR with org verification and current head SHA
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

    if (pr.state !== 'open') {
      return NextResponse.json(
        { error: 'Cannot approve a closed or merged PR' },
        { status: 400 }
      );
    }

    // Create or update approval (upsert to allow re-approval after changes)
    const approval = await prisma.qUAD_pr_approvals.upsert({
      where: {
        pr_id_user_id: { pr_id: prId, user_id: user.id },
      },
      update: {
        approved_at: new Date(),
        comment: comment || null,
        commit_sha: commitSha || pr.head_sha || null,
      },
      create: {
        pr_id: prId,
        user_id: user.id,
        comment: comment || null,
        commit_sha: commitSha || pr.head_sha || null,
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

    // Also update reviewer status if this user is a reviewer
    await prisma.qUAD_pr_reviewers.updateMany({
      where: {
        pr_id: prId,
        user_id: user.id,
      },
      data: {
        status: 'approved',
        reviewed_at: new Date(),
      },
    });

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
    const user = await prisma.qUAD_users.findUnique({
      where: { email: session.user.email },
      select: { id: true, org_id: true, role: true },
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

    const targetUserId = userId || user.id;

    // Only allow revoking own approval, unless admin
    if (targetUserId !== user.id && user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Can only revoke your own approval' },
        { status: 403 }
      );
    }

    // Delete approval
    await prisma.qUAD_pr_approvals.deleteMany({
      where: {
        pr_id: prId,
        user_id: targetUserId,
      },
    });

    // Reset reviewer status if applicable
    await prisma.qUAD_pr_reviewers.updateMany({
      where: {
        pr_id: prId,
        user_id: targetUserId,
      },
      data: {
        status: 'pending',
        reviewed_at: null,
      },
    });

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
