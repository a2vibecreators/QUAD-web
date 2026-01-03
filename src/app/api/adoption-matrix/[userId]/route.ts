/**
 * GET /api/adoption-matrix/[userId] - Get adoption matrix for a specific user
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken, calculateSafetyBuffer, getZoneName } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// GET: Get adoption matrix for a specific user
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;

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

    // Get user with adoption matrix
    const user = await prisma.qUAD_users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        org_id: true,
        email: true,
        full_name: true,
        role: true,
        adoption_matrix: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user is in same organization
    if (user.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const matrix = user.adoption_matrix;
    const skillLevel = matrix?.skill_level || 1;
    const trustLevel = matrix?.trust_level || 1;

    return NextResponse.json({
      user_id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      skill_level: skillLevel,
      trust_level: trustLevel,
      zone_name: getZoneName(skillLevel, trustLevel),
      safety_buffer: calculateSafetyBuffer(skillLevel, trustLevel),
      previous_skill_level: matrix?.previous_skill_level,
      previous_trust_level: matrix?.previous_trust_level,
      level_changed_at: matrix?.level_changed_at,
      notes: matrix?.notes,
      created_at: matrix?.created_at,
      updated_at: matrix?.updated_at
    });
  } catch (error) {
    console.error('Get user adoption matrix error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
