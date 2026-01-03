/**
 * GET /api/circles/[id]/members - List circle members
 * POST /api/circles/[id]/members - Add member to circle
 * DELETE /api/circles/[id]/members - Remove member from circle
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: List circle members
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: circleId } = await params;

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify circle exists and belongs to user's company
    const circle = await prisma.qUAD_circles.findUnique({
      where: { id: circleId },
      include: { domain: { select: { org_id: true } } }
    });

    if (!circle || circle.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    const members = await prisma.qUAD_circle_members.findMany({
      where: { circle_id: circleId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            full_name: true,
            role: true,
            is_active: true,
            adoption_matrix: {
              select: { skill_level: true, trust_level: true }
            }
          }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Get circle members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Add member to circle
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: circleId } = await params;

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only admins and managers can add members
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify circle exists and belongs to user's company
    const circle = await prisma.qUAD_circles.findUnique({
      where: { id: circleId },
      include: { domain: { select: { org_id: true } } }
    });

    if (!circle || circle.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    const body = await request.json();
    const { user_id, role, allocation_pct } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Verify user exists and is in same company
    const user = await prisma.qUAD_users.findUnique({
      where: { id: user_id }
    });

    if (!user || user.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already a member
    const existing = await prisma.qUAD_circle_members.findUnique({
      where: {
        circle_id_user_id: { circle_id: circleId, user_id }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a member of this circle' },
        { status: 409 }
      );
    }

    const member = await prisma.qUAD_circle_members.create({
      data: {
        circle_id: circleId,
        user_id,
        role: role || 'member',
        allocation_pct: allocation_pct || 100
      },
      include: {
        user: {
          select: { id: true, email: true, full_name: true }
        }
      }
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Add circle member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove member from circle
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: circleId } = await params;

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only admins and managers can remove members
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id query parameter is required' },
        { status: 400 }
      );
    }

    // Verify circle exists and belongs to user's company
    const circle = await prisma.qUAD_circles.findUnique({
      where: { id: circleId },
      include: { domain: { select: { org_id: true } } }
    });

    if (!circle || circle.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    // Check membership exists
    const existing = await prisma.qUAD_circle_members.findUnique({
      where: {
        circle_id_user_id: { circle_id: circleId, user_id: userId }
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'User is not a member of this circle' },
        { status: 404 }
      );
    }

    await prisma.qUAD_circle_members.delete({
      where: {
        circle_id_user_id: { circle_id: circleId, user_id: userId }
      }
    });

    return NextResponse.json({ message: 'Member removed from circle' });
  } catch (error) {
    console.error('Remove circle member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
