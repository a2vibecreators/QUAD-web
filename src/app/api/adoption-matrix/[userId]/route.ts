/**
 * GET /api/adoption-matrix/[userId] - Get adoption matrix for a specific user
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken, calculateSafetyBuffer, getZoneName } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface AdoptionMatrix {
  id: string;
  user_id: string;
  skill_level: number;
  trust_level: number;
  previous_skill_level: number | null;
  previous_trust_level: number | null;
  level_changed_at: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

interface UserWithAdoptionMatrix {
  id: string;
  org_id: string;
  email: string;
  full_name: string | null;
  role: string;
  adoption_matrix: AdoptionMatrix | null;
}

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// ============================================================================
// Stub Functions
// ============================================================================

async function findUserByIdWithMatrix(userId: string): Promise<UserWithAdoptionMatrix | null> {
  console.log('[STUB] findUserByIdWithMatrix called with:', userId);
  // TODO: Implement via Java backend GET /users/{id}?include=adoption_matrix
  return null;
}

// ============================================================================
// Route Handlers
// ============================================================================

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
    const user = await findUserByIdWithMatrix(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user is in same organization
    if (user.org_id !== payload.orgId) {
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
