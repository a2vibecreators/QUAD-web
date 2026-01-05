/**
 * GET /api/roles - List roles in organization
 * POST /api/roles - Create a new role (from core role or custom)
 *
 * Roles can be:
 * 1. System roles - auto-created when org is created
 * 2. Custom roles - created by admin, MUST link to a core_role
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// Type Definitions
// ============================================================================

interface CoreRole {
  id: string;
  role_code: string;
  role_name: string;
  category: string;
  description?: string;
  can_manage_org: boolean;
  can_manage_users: boolean;
  can_manage_domains: boolean;
  can_manage_flows: boolean;
  can_view_all_metrics: boolean;
  can_manage_circles: boolean;
  can_manage_resources: boolean;
  can_delete_domain: boolean;
  q_participation: string;
  u_participation: string;
  a_participation: string;
  d_participation: string;
  color_code: string;
  icon_name: string;
  display_order: number;
  hierarchy_level: number;
}

interface Role {
  id: string;
  org_id: string;
  core_role_id?: string;
  role_code: string;
  role_name: string;
  description?: string;
  responsibilities_text?: string;
  can_manage_org: boolean;
  can_manage_users: boolean;
  can_manage_domains: boolean;
  can_manage_flows: boolean;
  can_view_all_metrics: boolean;
  can_manage_circles: boolean;
  can_manage_resources: boolean;
  can_delete_domain: boolean;
  q_participation: string;
  u_participation: string;
  a_participation: string;
  d_participation: string;
  color_code: string;
  icon_name: string;
  display_order: number;
  hierarchy_level: number;
  is_system_role: boolean;
  is_custom: boolean;
  is_active: boolean;
  core_role?: {
    id: string;
    role_code: string;
    role_name: string;
    category: string;
  };
  _count?: {
    users: number;
  };
}

interface RoleCreateData {
  org_id: string;
  core_role_id: string;
  role_code: string;
  role_name: string;
  description?: string;
  responsibilities_text?: string;
  can_manage_org?: boolean;
  can_manage_users?: boolean;
  can_manage_domains?: boolean;
  can_manage_flows?: boolean;
  can_view_all_metrics?: boolean;
  can_manage_circles?: boolean;
  can_manage_resources?: boolean;
  can_delete_domain?: boolean;
  q_participation?: string;
  u_participation?: string;
  a_participation?: string;
  d_participation?: string;
  color_code?: string;
  icon_name?: string;
  display_order?: number;
  hierarchy_level?: number;
  is_system_role: boolean;
  is_custom: boolean;
}

// ============================================================================
// Stub Functions - Replace with Java backend calls
// ============================================================================

async function findRolesByOrg(orgId: string, includeInactive: boolean): Promise<Role[]> {
  console.log('[STUB] findRolesByOrg called with orgId:', orgId, 'includeInactive:', includeInactive);
  // TODO: Call Java backend GET /roles?org_id={orgId}&include_inactive={includeInactive}
  return [];
}

async function findCoreRoleById(id: string): Promise<CoreRole | null> {
  console.log('[STUB] findCoreRoleById called with id:', id);
  // TODO: Call Java backend GET /core-roles/{id}
  return null;
}

async function findRoleByOrgAndCode(orgId: string, roleCode: string): Promise<Role | null> {
  console.log('[STUB] findRoleByOrgAndCode called with orgId:', orgId, 'roleCode:', roleCode);
  // TODO: Call Java backend GET /roles?org_id={orgId}&role_code={roleCode}
  return null;
}

async function createRole(data: RoleCreateData): Promise<Role> {
  console.log('[STUB] createRole called with data:', data);
  // TODO: Call Java backend POST /roles
  return {
    id: 'stub-role-id',
    org_id: data.org_id,
    core_role_id: data.core_role_id,
    role_code: data.role_code,
    role_name: data.role_name,
    description: data.description,
    responsibilities_text: data.responsibilities_text,
    can_manage_org: data.can_manage_org ?? false,
    can_manage_users: data.can_manage_users ?? false,
    can_manage_domains: data.can_manage_domains ?? false,
    can_manage_flows: data.can_manage_flows ?? false,
    can_view_all_metrics: data.can_view_all_metrics ?? false,
    can_manage_circles: data.can_manage_circles ?? false,
    can_manage_resources: data.can_manage_resources ?? false,
    can_delete_domain: data.can_delete_domain ?? false,
    q_participation: data.q_participation ?? 'INFORM',
    u_participation: data.u_participation ?? 'INFORM',
    a_participation: data.a_participation ?? 'INFORM',
    d_participation: data.d_participation ?? 'INFORM',
    color_code: data.color_code ?? '#000000',
    icon_name: data.icon_name ?? 'user',
    display_order: data.display_order ?? 0,
    hierarchy_level: data.hierarchy_level ?? 0,
    is_system_role: data.is_system_role,
    is_custom: data.is_custom,
    is_active: true,
  };
}

// ============================================================================
// Route Handlers
// ============================================================================

// GET: List all roles in organization
export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';

    const roles = await findRolesByOrg(payload.companyId, includeInactive);

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Get roles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new role
export async function POST(request: NextRequest) {
  try {
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

    // Only admins can create roles
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      core_role_id,  // Link to QUAD_core_roles (required for custom roles)
      role_code,
      role_name,
      description,
      responsibilities_text,  // Future: custom responsibilities from text file
      can_manage_org,
      can_manage_users,
      can_manage_domains,
      can_manage_flows,
      can_view_all_metrics,
      can_manage_circles,
      can_manage_resources,
      can_delete_domain,
      q_participation,
      u_participation,
      a_participation,
      d_participation,
      color_code,
      icon_name,
      display_order,
      hierarchy_level
    } = body;

    // Validation
    if (!role_code || !role_name) {
      return NextResponse.json(
        { error: 'role_code and role_name are required' },
        { status: 400 }
      );
    }

    // Custom roles MUST link to a core role
    if (!core_role_id) {
      return NextResponse.json(
        { error: 'core_role_id is required - custom roles must link to a core role template' },
        { status: 400 }
      );
    }

    // Verify core role exists
    const coreRole = await findCoreRoleById(core_role_id);

    if (!coreRole) {
      return NextResponse.json(
        { error: 'Core role not found' },
        { status: 404 }
      );
    }

    // Validate role_code format (uppercase, underscores allowed)
    if (!/^[A-Z][A-Z0-9_]*$/.test(role_code)) {
      return NextResponse.json(
        { error: 'role_code must be uppercase letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    // Check if role code already exists in this organization
    const existing = await findRoleByOrgAndCode(payload.companyId, role_code);

    if (existing) {
      return NextResponse.json(
        { error: `Role code '${role_code}' already exists` },
        { status: 409 }
      );
    }

    // Validate participation values if provided
    const validParticipation = ['PRIMARY', 'SUPPORT', 'REVIEW', 'INFORM'];
    if (q_participation && !validParticipation.includes(q_participation)) {
      return NextResponse.json({ error: 'Invalid q_participation value' }, { status: 400 });
    }
    if (u_participation && !validParticipation.includes(u_participation)) {
      return NextResponse.json({ error: 'Invalid u_participation value' }, { status: 400 });
    }
    if (a_participation && !validParticipation.includes(a_participation)) {
      return NextResponse.json({ error: 'Invalid a_participation value' }, { status: 400 });
    }
    if (d_participation && !validParticipation.includes(d_participation)) {
      return NextResponse.json({ error: 'Invalid d_participation value' }, { status: 400 });
    }

    // Create role - inherit defaults from core role if not specified
    const role = await createRole({
      org_id: payload.companyId,
      core_role_id,
      role_code,
      role_name,
      description: description || coreRole.description,
      responsibilities_text,
      can_manage_org: can_manage_org ?? coreRole.can_manage_org,
      can_manage_users: can_manage_users ?? coreRole.can_manage_users,
      can_manage_domains: can_manage_domains ?? coreRole.can_manage_domains,
      can_manage_flows: can_manage_flows ?? coreRole.can_manage_flows,
      can_view_all_metrics: can_view_all_metrics ?? coreRole.can_view_all_metrics,
      can_manage_circles: can_manage_circles ?? coreRole.can_manage_circles,
      can_manage_resources: can_manage_resources ?? coreRole.can_manage_resources,
      can_delete_domain: can_delete_domain ?? coreRole.can_delete_domain,
      q_participation: q_participation || coreRole.q_participation,
      u_participation: u_participation || coreRole.u_participation,
      a_participation: a_participation || coreRole.a_participation,
      d_participation: d_participation || coreRole.d_participation,
      color_code: color_code || coreRole.color_code,
      icon_name: icon_name || coreRole.icon_name,
      display_order: display_order ?? coreRole.display_order,
      hierarchy_level: hierarchy_level ?? coreRole.hierarchy_level,
      is_system_role: false,
      is_custom: true
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error('Create role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
