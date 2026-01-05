/**
 * PUT /api/skills/[id] - Update skill
 * DELETE /api/skills/[id] - Delete skill
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// Type Definitions
// ============================================================================

interface UserSkill {
  id: string;
  user_id: string;
  skill_name: string;
  proficiency_level: number;
  certified: boolean;
  certification_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface SkillUpdateData {
  proficiency_level?: number;
  certified?: boolean;
  certification_date?: Date | null;
}

// ============================================================================
// Stub Functions - Replace with Java backend calls
// ============================================================================

async function findSkillById(id: string): Promise<UserSkill | null> {
  console.log('[STUB] findSkillById called with id:', id);
  // TODO: Call Java backend GET /skills/{id}
  return null;
}

async function updateSkill(id: string, data: SkillUpdateData): Promise<UserSkill> {
  console.log('[STUB] updateSkill called with id:', id, 'data:', data);
  // TODO: Call Java backend PUT /skills/{id}
  return {
    id,
    user_id: 'stub-user-id',
    skill_name: 'Stub Skill',
    proficiency_level: data.proficiency_level ?? 1,
    certified: data.certified ?? false,
    certification_date: data.certification_date ?? null,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

async function deleteSkill(id: string): Promise<void> {
  console.log('[STUB] deleteSkill called with id:', id);
  // TODO: Call Java backend DELETE /skills/{id}
}

// ============================================================================
// Route Handlers
// ============================================================================

// PUT: Update skill
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { proficiency_level, certified, certification_date } = body;

    // Find skill and verify ownership
    const existingSkill = await findSkillById(id);

    if (!existingSkill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    if (existingSkill.user_id !== payload.userId) {
      return NextResponse.json({ error: 'Not authorized to update this skill' }, { status: 403 });
    }

    // Validate proficiency level
    if (proficiency_level !== undefined && (proficiency_level < 1 || proficiency_level > 5)) {
      return NextResponse.json(
        { error: 'proficiency_level must be between 1 and 5' },
        { status: 400 }
      );
    }

    const updateData: SkillUpdateData = {};
    if (proficiency_level !== undefined) updateData.proficiency_level = proficiency_level;
    if (certified !== undefined) updateData.certified = certified;
    if (certification_date !== undefined) {
      updateData.certification_date = certification_date ? new Date(certification_date) : null;
    }

    const skill = await updateSkill(id, updateData);

    return NextResponse.json({ skill });

  } catch (error) {
    console.error('Update skill error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete skill
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Find skill and verify ownership
    const existingSkill = await findSkillById(id);

    if (!existingSkill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    if (existingSkill.user_id !== payload.userId) {
      return NextResponse.json({ error: 'Not authorized to delete this skill' }, { status: 403 });
    }

    await deleteSkill(id);

    return NextResponse.json({ message: 'Skill deleted successfully' });

  } catch (error) {
    console.error('Delete skill error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
