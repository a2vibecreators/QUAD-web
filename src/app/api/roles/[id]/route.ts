/**
 * GET /api/roles/[id] - Get role by ID
 * PUT /api/roles/[id] - Update role
 * DELETE /api/roles/[id] - Delete role
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get role by ID
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

    const role = await prisma.qUAD_roles.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            full_name: true,
            is_active: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Verify role belongs to user's organization
    if (role.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error('Get role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update role
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

    // Only admins can update roles
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Check if role exists and belongs to company
    const existing = await prisma.qUAD_roles.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existing.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      role_name,
      description,
      can_manage_company,
      can_manage_users,
      can_manage_domains,
      can_manage_flows,
      can_view_all_metrics,
      can_manage_circles,
      can_manage_resources,
      q_participation,
      u_participation,
      a_participation,
      d_participation,
      color_code,
      icon_name,
      display_order,
      hierarchy_level,
      is_active
    } = body;

    // Validate participation values if provided
    const validParticipation = ['PRIMARY', 'SUPPORT', 'REVIEW', 'INFORM'];
    if (q_participation !== undefined && q_participation !== null && !validParticipation.includes(q_participation)) {
      return NextResponse.json({ error: 'Invalid q_participation value' }, { status: 400 });
    }
    if (u_participation !== undefined && u_participation !== null && !validParticipation.includes(u_participation)) {
      return NextResponse.json({ error: 'Invalid u_participation value' }, { status: 400 });
    }
    if (a_participation !== undefined && a_participation !== null && !validParticipation.includes(a_participation)) {
      return NextResponse.json({ error: 'Invalid a_participation value' }, { status: 400 });
    }
    if (d_participation !== undefined && d_participation !== null && !validParticipation.includes(d_participation)) {
      return NextResponse.json({ error: 'Invalid d_participation value' }, { status: 400 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Allow updating most fields
    if (role_name !== undefined) updateData.role_name = role_name;
    if (description !== undefined) updateData.description = description;
    if (can_manage_company !== undefined) updateData.can_manage_company = can_manage_company;
    if (can_manage_users !== undefined) updateData.can_manage_users = can_manage_users;
    if (can_manage_domains !== undefined) updateData.can_manage_domains = can_manage_domains;
    if (can_manage_flows !== undefined) updateData.can_manage_flows = can_manage_flows;
    if (can_view_all_metrics !== undefined) updateData.can_view_all_metrics = can_view_all_metrics;
    if (can_manage_circles !== undefined) updateData.can_manage_circles = can_manage_circles;
    if (can_manage_resources !== undefined) updateData.can_manage_resources = can_manage_resources;
    if (q_participation !== undefined) updateData.q_participation = q_participation;
    if (u_participation !== undefined) updateData.u_participation = u_participation;
    if (a_participation !== undefined) updateData.a_participation = a_participation;
    if (d_participation !== undefined) updateData.d_participation = d_participation;
    if (color_code !== undefined) updateData.color_code = color_code;
    if (icon_name !== undefined) updateData.icon_name = icon_name;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (hierarchy_level !== undefined) updateData.hierarchy_level = hierarchy_level;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Note: role_code cannot be changed after creation

    const role = await prisma.qUAD_roles.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete role
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

    // Only admins can delete roles
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Check if role exists and belongs to company
    const existing = await prisma.qUAD_roles.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existing.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Cannot delete system roles
    if (existing.is_system_role) {
      return NextResponse.json(
        { error: 'Cannot delete system roles. Deactivate instead.' },
        { status: 400 }
      );
    }

    // Cannot delete roles with users assigned
    if (existing._count.users > 0) {
      return NextResponse.json(
        { error: `Cannot delete role. ${existing._count.users} user(s) have this role assigned.` },
        { status: 400 }
      );
    }

    await prisma.qUAD_roles.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
