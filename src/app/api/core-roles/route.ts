/**
 * GET /api/core-roles - List all core role templates
 *
 * Core roles are system-wide role templates that organizations can select from.
 * When creating a custom role, it must be linked to a core role.
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
  is_active: boolean;
}

// ============================================================================
// Stub Functions - Replace with Java backend calls
// ============================================================================

async function findCoreRoles(category?: string): Promise<CoreRole[]> {
  console.log('[STUB] findCoreRoles called with category:', category);
  // TODO: Call Java backend GET /core-roles?category={category}
  return [];
}

// ============================================================================
// Route Handlers
// ============================================================================

// GET: List all core roles (public endpoint for role selection)
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
    const category = searchParams.get('category') || undefined;  // Filter by category

    const coreRoles = await findCoreRoles(category);

    // Group by category for UI
    const byCategory: Record<string, CoreRole[]> = {};
    for (const role of coreRoles) {
      if (!byCategory[role.category]) {
        byCategory[role.category] = [];
      }
      byCategory[role.category].push(role);
    }

    return NextResponse.json({
      core_roles: coreRoles,
      by_category: byCategory,
      categories: Object.keys(byCategory),
      total: coreRoles.length
    });
  } catch (error) {
    console.error('Get core roles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
