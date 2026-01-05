/**
 * GET /api/roles/[id] - Get role by ID
 * PUT /api/roles/[id] - Update role
 * DELETE /api/roles/[id] - Delete role
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// Type Definitions
// ============================================================================

interface RoleUser {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

interface Role {
  id: string;
  org_id: string;
  role_code: string;
  role_name: string;
  description?: string;
  can_manage_company?: boolean;
  can_manage_users: boolean;
  can_manage_domains: boolean;
  can_manage_flows: boolean;
  can_view_all_metrics: boolean;
  can_manage_circles: boolean;
  can_manage_resources: boolean;
  q_participation?: string;
  u_participation?: string;
  a_participation?: string;
  d_participation?: string;
  color_code?: string;
  icon_name?: string;
  display_order?: number;
  hierarchy_level?: number;
  is_system_role: boolean;
  is_active: boolean;
  users?: RoleUser[];
  _count?: {
    users: number;
  };
}

interface RoleUpdateData {
  role_name?: string;
  description?: string;
  can_manage_company?: boolean;
  can_manage_users?: boolean;
  can_manage_domains?: boolean;
  can_manage_flows?: boolean;
  can_view_all_metrics?: boolean;
  can_manage_circles?: boolean;
  can_manage_resources?: boolean;
  q_participation?: string;
  u_participation?: string;
  a_participation?: string;
  d_participation?: string;
  color_code?: string;
  icon_name?: string;
  display_order?: number;
  hierarchy_level?: number;
  is_active?: boolean;
}

// ============================================================================
// Stub Functions - Replace with Java backend calls
// ============================================================================

async function findRoleById(id: string): Promise<Role | null> {
  console.log('[STUB] findRoleById called with id:', id);
  // TODO: Call Java backend GET /roles/{id}
  return null;
}

async function findRoleByIdSimple(id: string): Promise<{ id: string; org_id: string; is_system_role: boolean } | null> {
  console.log('[STUB] findRoleByIdSimple called with id:', id);
  // TODO: Call Java backend GET /roles/{id}
  return null;
}

async function findRoleByIdWithCount(id: string): Promise<(Role & { _count: { users: number } }) | null> {
  console.log('[STUB] findRoleByIdWithCount called with id:', id);
  // TODO: Call Java backend GET /roles/{id}?include_count=true
  return null;
}

async function updateRole(id: string, data: RoleUpdateData): Promise<Role> {
  console.log('[STUB] updateRole called with id:', id, 'data:', data);
  // TODO: Call Java backend PUT /roles/{id}
  return {
    id,
    org_id: 'stub-org-id',
    role_code: 'STUB_ROLE',
    role_name: data.role_name ?? 'Stub Role',
    description: data.description,
    can_manage_users: data.can_manage_users ?? false,
    can_manage_domains: data.can_manage_domains ?? false,
    can_manage_flows: data.can_manage_flows ?? false,
    can_view_all_metrics: data.can_view_all_metrics ?? false,
    can_manage_circles: data.can_manage_circles ?? false,
    can_manage_resources: data.can_manage_resources ?? false,
    is_system_role: false,
    is_active: data.is_active ?? true,
  };
}

async function deleteRole(id: string): Promise<void> {
  console.log('[STUB] deleteRole called with id:', id);
  // TODO: Call Java backend DELETE /roles/{id}
}

// ============================================================================
// Route Handlers
// ============================================================================

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

    const role = await findRoleById(id);

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
    const existing = await findRoleByIdSimple(id);

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
    const updateData: RoleUpdateData = {};

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

    const role = await updateRole(id, updateData);

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
    const existing = await findRoleByIdWithCount(id);

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

    await deleteRole(id);

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
