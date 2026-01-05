/**
 * GET /api/adoption-matrix - Get adoption matrix for all users in company
 * PUT /api/adoption-matrix - Update adoption matrix for a user
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
  email: string;
  full_name: string | null;
  role: string;
  org_id: string;
  adoption_matrix: AdoptionMatrix | null;
}

// ============================================================================
// Stub Functions
// ============================================================================

async function findUsersByOrgIdWithMatrix(orgId: string): Promise<UserWithAdoptionMatrix[]> {
  console.log('[STUB] findUsersByOrgIdWithMatrix called with:', orgId);
  // TODO: Implement via Java backend GET /users?org_id={orgId}&include=adoption_matrix
  return [];
}

async function findUserByIdWithMatrix(userId: string): Promise<UserWithAdoptionMatrix | null> {
  console.log('[STUB] findUserByIdWithMatrix called with:', userId);
  // TODO: Implement via Java backend GET /users/{id}?include=adoption_matrix
  return null;
}

async function updateAdoptionMatrix(userId: string, data: {
  skill_level?: number;
  trust_level?: number;
  previous_skill_level?: number;
  previous_trust_level?: number;
  level_changed_at?: Date;
  notes?: string | null;
}): Promise<AdoptionMatrix> {
  console.log('[STUB] updateAdoptionMatrix called with:', userId, JSON.stringify(data));
  // TODO: Implement via Java backend PUT /adoption-matrix/{userId}
  return {
    id: 'stub-matrix-id',
    user_id: userId,
    skill_level: data.skill_level || 1,
    trust_level: data.trust_level || 1,
    previous_skill_level: data.previous_skill_level || null,
    previous_trust_level: data.previous_trust_level || null,
    level_changed_at: data.level_changed_at || null,
    notes: data.notes || null,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

async function createAdoptionMatrix(data: {
  user_id: string;
  skill_level: number;
  trust_level: number;
  notes?: string | null;
}): Promise<AdoptionMatrix> {
  console.log('[STUB] createAdoptionMatrix called with:', JSON.stringify(data));
  // TODO: Implement via Java backend POST /adoption-matrix
  return {
    id: 'stub-matrix-id',
    user_id: data.user_id,
    skill_level: data.skill_level,
    trust_level: data.trust_level,
    previous_skill_level: null,
    previous_trust_level: null,
    level_changed_at: null,
    notes: data.notes || null,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

// ============================================================================
// Route Handlers
// ============================================================================

// GET: Get adoption matrix for all users in company
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

    // Get all users with their adoption matrix
    const users = await findUsersByOrgIdWithMatrix(payload.companyId);

    // Enrich with zone names and safety buffers
    const matrixData = users.map(user => {
      const matrix = user.adoption_matrix;
      const skillLevel = matrix?.skill_level || 1;
      const trustLevel = matrix?.trust_level || 1;

      return {
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
        notes: matrix?.notes
      };
    });

    // Group by zone for visualization
    const byZone: Record<string, typeof matrixData> = {};
    matrixData.forEach(item => {
      const key = `${item.skill_level}-${item.trust_level}`;
      if (!byZone[key]) {
        byZone[key] = [];
      }
      byZone[key].push(item);
    });

    return NextResponse.json({
      matrix: matrixData,
      by_zone: byZone,
      zone_legend: {
        '1-1': { name: 'AI Skeptic', buffer: 80, description: 'Low skill, low trust' },
        '1-2': { name: 'Curious Novice', buffer: 60, description: 'Low skill, medium trust' },
        '1-3': { name: 'Trusting Novice', buffer: 50, description: 'Low skill, high trust' },
        '2-1': { name: 'Skeptical User', buffer: 60, description: 'Medium skill, low trust' },
        '2-2': { name: 'Growing User', buffer: 40, description: 'Medium skill, medium trust' },
        '2-3': { name: 'Eager Adopter', buffer: 30, description: 'Medium skill, high trust' },
        '3-1': { name: 'Cautious Expert', buffer: 40, description: 'High skill, low trust' },
        '3-2': { name: 'Balanced Expert', buffer: 20, description: 'High skill, medium trust' },
        '3-3': { name: 'AI Champion', buffer: 10, description: 'High skill, high trust' }
      }
    });
  } catch (error) {
    console.error('Get adoption matrix error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update adoption matrix for a user
export async function PUT(request: NextRequest) {
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

    // Only admins and managers can update adoption matrix
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, skill_level, trust_level, notes } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Validate levels
    if (skill_level !== undefined && (skill_level < 1 || skill_level > 3)) {
      return NextResponse.json(
        { error: 'skill_level must be between 1 and 3' },
        { status: 400 }
      );
    }

    if (trust_level !== undefined && (trust_level < 1 || trust_level > 3)) {
      return NextResponse.json(
        { error: 'trust_level must be between 1 and 3' },
        { status: 400 }
      );
    }

    // Verify user exists and is in same company
    const user = await findUserByIdWithMatrix(user_id);

    if (!user || user.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upsert adoption matrix
    const existing = user.adoption_matrix;

    let matrix;
    if (existing) {
      // Update existing
      matrix = await updateAdoptionMatrix(user_id, {
        previous_skill_level: existing.skill_level,
        previous_trust_level: existing.trust_level,
        skill_level: skill_level ?? existing.skill_level,
        trust_level: trust_level ?? existing.trust_level,
        level_changed_at: new Date(),
        notes: notes !== undefined ? notes : existing.notes
      });
    } else {
      // Create new
      matrix = await createAdoptionMatrix({
        user_id,
        skill_level: skill_level || 1,
        trust_level: trust_level || 1,
        notes
      });
    }

    return NextResponse.json({
      ...matrix,
      zone_name: getZoneName(matrix.skill_level, matrix.trust_level),
      safety_buffer: calculateSafetyBuffer(matrix.skill_level, matrix.trust_level)
    });
  } catch (error) {
    console.error('Update adoption matrix error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
