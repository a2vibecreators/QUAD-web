/**
 * GET /api/circles/[id] - Get circle by ID
 * PUT /api/circles/[id] - Update circle
 * DELETE /api/circles/[id] - Delete circle
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get circle by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    const circle = await prisma.qUAD_circles.findUnique({
      where: { id },
      include: {
        domain: {
          select: { id: true, name: true, org_id: true }
        },
        lead: {
          select: {
            id: true,
            email: true,
            full_name: true,
            adoption_matrix: {
              select: { skill_level: true, trust_level: true }
            }
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                full_name: true,
                role: true,
                adoption_matrix: {
                  select: { skill_level: true, trust_level: true }
                }
              }
            }
          }
        }
      }
    });

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    // Verify circle belongs to user's organization
    if (circle.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(circle);
  } catch (error) {
    console.error('Get circle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update circle
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    // Only admins and managers can update circles
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.qUAD_circles.findUnique({
      where: { id },
      include: { domain: { select: { org_id: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { circle_name, description, lead_user_id, is_active } = body;

    // If changing lead, verify they're in same company
    if (lead_user_id !== undefined && lead_user_id !== null) {
      const leadUser = await prisma.qUAD_users.findUnique({
        where: { id: lead_user_id }
      });
      if (!leadUser || leadUser.org_id !== payload.companyId) {
        return NextResponse.json({ error: 'Lead user not found' }, { status: 404 });
      }
    }

    const circle = await prisma.qUAD_circles.update({
      where: { id },
      data: {
        ...(circle_name !== undefined && { circle_name }),
        ...(description !== undefined && { description }),
        ...(lead_user_id !== undefined && { lead_user_id }),
        ...(is_active !== undefined && { is_active })
      },
      include: {
        domain: { select: { id: true, name: true } },
        lead: { select: { id: true, email: true, full_name: true } }
      }
    });

    return NextResponse.json(circle);
  } catch (error) {
    console.error('Update circle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete circle
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    // Only admins can delete circles
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.qUAD_circles.findUnique({
      where: { id },
      include: { domain: { select: { org_id: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.qUAD_circles.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Circle deleted successfully' });
  } catch (error) {
    console.error('Delete circle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
