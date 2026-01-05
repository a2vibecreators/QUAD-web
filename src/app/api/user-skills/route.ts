/**
 * User Skills API - Manage developer proficiency
 *
 * GET /api/user-skills - Get skills for current user or specified user
 * POST /api/user-skills - Add/update skill proficiency (self-assessment or during onboarding)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready

// Types
interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string | null;
  skill_name: string;
  skill_category: string | null;
  proficiency_level: number;
  source: string;
  confidence: number;
  tickets_completed: number;
  tickets_declined: number;
  last_assessed: Date | null;
  skill?: { skill_code: string; category: string } | null;
}

// TODO: Implement via Java backend when endpoints are ready
async function getUserOrgId(userId: string): Promise<string | null> {
  console.log(`[UserSkills] getUserOrgId for: ${userId}`);
  return 'mock-org-id'; // Return mock until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function getUserSkills(userId: string): Promise<UserSkill[]> {
  console.log(`[UserSkills] getUserSkills for: ${userId}`);
  return []; // Return empty until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function findUserSkill(userId: string, skillName: string): Promise<UserSkill | null> {
  console.log(`[UserSkills] findUserSkill: ${userId}, ${skillName}`);
  return null;
}

// TODO: Implement via Java backend when endpoints are ready
async function updateUserSkill(id: string, data: Partial<UserSkill>): Promise<UserSkill> {
  console.log(`[UserSkills] updateUserSkill: ${id}`, data);
  return { id, user_id: '', skill_id: null, skill_name: '', skill_category: null, proficiency_level: 1, source: '', confidence: 0, tickets_completed: 0, tickets_declined: 0, last_assessed: null };
}

// TODO: Implement via Java backend when endpoints are ready
async function createUserSkill(data: Partial<UserSkill>): Promise<UserSkill> {
  console.log(`[UserSkills] createUserSkill:`, data);
  return { id: 'mock-id', user_id: data.user_id || '', skill_id: null, skill_name: data.skill_name || '', skill_category: data.skill_category || null, proficiency_level: data.proficiency_level || 1, source: data.source || '', confidence: data.confidence || 0, tickets_completed: 0, tickets_declined: 0, last_assessed: null };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || session.user.id;

    const orgId = await getUserOrgId(session.user.id);

    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get user's skills with skill details
    const userSkills = await getUserSkills(userId);

    // Group by category
    const skillsByCategory = userSkills.reduce((acc, us) => {
      const category = us.skill_category || us.skill?.category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push({
        id: us.id,
        skill_id: us.skill_id,
        skill_name: us.skill_name,
        skill_code: us.skill?.skill_code,
        category,
        proficiency_level: us.proficiency_level,
        source: us.source,
        confidence: us.confidence,
        tickets_completed: us.tickets_completed,
        tickets_declined: us.tickets_declined,
        last_assessed: us.last_assessed,
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate skill summary for quick view
    const summary = {
      total_skills: userSkills.length,
      expert_skills: userSkills.filter(s => s.proficiency_level >= 4).length,
      intermediate_skills: userSkills.filter(s => s.proficiency_level === 3).length,
      learning_skills: userSkills.filter(s => s.proficiency_level <= 2).length,
    };

    return NextResponse.json({
      success: true,
      user_id: userId,
      skills: userSkills,
      skillsByCategory,
      summary,
    });
  } catch (error) {
    console.error('[User Skills API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch user skills' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await getUserOrgId(session.user.id);

    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const body = await request.json();
    const { user_id, skills } = body;

    // Target user (default to self)
    const targetUserId = user_id || session.user.id;

    // skills should be array: [{ skill_name, proficiency_level, skill_id? }]
    if (!Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json({ error: 'skills array is required' }, { status: 400 });
    }

    const results = [];

    for (const skillData of skills) {
      const { skill_name, skill_id, proficiency_level, skill_category } = skillData;

      if (!skill_name || proficiency_level === undefined) {
        continue;
      }

      // Check if user already has this skill
      const existing = await findUserSkill(targetUserId, skill_name);

      if (existing) {
        // Update proficiency
        const updated = await updateUserSkill(existing.id, {
          proficiency_level,
          skill_id: skill_id || existing.skill_id,
          source: 'self_declared',
          last_assessed: new Date(),
        });
        results.push({ action: 'updated', skill: updated });
      } else {
        // Create new skill entry
        const created = await createUserSkill({
          user_id: targetUserId,
          skill_name,
          skill_id,
          skill_category: skill_category || 'technical',
          proficiency_level,
          source: 'self_declared',
          confidence: 0.8, // High confidence for self-declared
        });
        results.push({ action: 'created', skill: created });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} skills`,
      results,
    });
  } catch (error) {
    console.error('[User Skills API] Error:', error);
    return NextResponse.json({ error: 'Failed to update user skills' }, { status: 500 });
  }
}
