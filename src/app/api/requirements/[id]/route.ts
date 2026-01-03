/**
 * GET /api/requirements/[id] - Get single requirement
 * PUT /api/requirements/[id] - Update requirement
 * DELETE /api/requirements/[id] - Delete requirement
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET: Get single requirement with milestones
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const requirement = await prisma.qUAD_requirements.findUnique({
      where: { id },
      include: {
        domain: {
          select: {
            id: true,
            name: true,
            org_id: true
          }
        },
        milestones: {
          include: {
            cycles: {
              select: {
                id: true,
                cycle_number: true,
                name: true,
                status: true
              }
            },
            _count: {
              select: { cycles: true }
            }
          },
          orderBy: { sequence_order: 'asc' }
        }
      }
    });

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    // Verify belongs to user's organization
    if (requirement.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    return NextResponse.json(requirement);
  } catch (error) {
    console.error('Get requirement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update requirement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Fetch existing requirement
    const existing = await prisma.qUAD_requirements.findUnique({
      where: { id },
      include: {
        domain: { select: { org_id: true } }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      status,
      source_file_url,
      source_file_name
    } = body;

    // Handle status transitions
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (source_file_url !== undefined) updateData.source_file_url = source_file_url;
    if (source_file_name !== undefined) updateData.source_file_name = source_file_name;

    // Handle approval
    if (status === 'approved' && existing.status !== 'approved') {
      updateData.status = 'approved';
      updateData.approved_by = payload.userId;
      updateData.approved_at = new Date();
    } else if (status !== undefined) {
      updateData.status = status;
    }

    const requirement = await prisma.qUAD_requirements.update({
      where: { id },
      data: updateData,
      include: {
        domain: {
          select: { id: true, name: true }
        },
        milestones: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    return NextResponse.json(requirement);
  } catch (error) {
    console.error('Update requirement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete requirement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Only admins can delete requirements
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch existing requirement
    const existing = await prisma.qUAD_requirements.findUnique({
      where: { id },
      include: {
        domain: { select: { org_id: true } }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    await prisma.qUAD_requirements.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Requirement deleted' });
  } catch (error) {
    console.error('Delete requirement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
