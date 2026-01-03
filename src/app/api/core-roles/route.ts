/**
 * GET /api/core-roles - List all core role templates
 *
 * Core roles are system-wide role templates that organizations can select from.
 * When creating a custom role, it must be linked to a core role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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
    const category = searchParams.get('category');  // Filter by category

    // Build where clause
    const where: Record<string, unknown> = {
      is_active: true
    };

    if (category) {
      where.category = category;
    }

    const coreRoles = await prisma.qUAD_core_roles.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { display_order: 'asc' },
        { hierarchy_level: 'desc' }
      ]
    });

    // Group by category for UI
    const byCategory: Record<string, typeof coreRoles> = {};
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
