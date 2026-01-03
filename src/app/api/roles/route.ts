/**
 * GET /api/roles - List roles in organization
 * POST /api/roles - Create a new role (from core role or custom)
 *
 * Roles can be:
 * 1. System roles - auto-created when org is created
 * 2. Custom roles - created by admin, MUST link to a core_role
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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

    // Build where clause
    const where: Record<string, unknown> = {
      org_id: payload.companyId
    };

    if (!includeInactive) {
      where.is_active = true;
    }

    const roles = await prisma.qUAD_roles.findMany({
      where,
      include: {
        core_role: {
          select: {
            id: true,
            role_code: true,
            role_name: true,
            category: true
          }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: [
        { display_order: 'asc' },
        { hierarchy_level: 'desc' }
      ]
    });

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
    const coreRole = await prisma.qUAD_core_roles.findUnique({
      where: { id: core_role_id }
    });

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
    const existing = await prisma.qUAD_roles.findUnique({
      where: {
        org_id_role_code: {
          org_id: payload.companyId,
          role_code
        }
      }
    });

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
    const role = await prisma.qUAD_roles.create({
      data: {
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
      },
      include: {
        core_role: {
          select: { id: true, role_code: true, role_name: true, category: true }
        }
      }
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
