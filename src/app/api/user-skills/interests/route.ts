/**
 * User Skill Interests API - Manage what users WANT to learn
 *
 * GET /api/user-skills/interests - Get user's interests across all skills
 * PUT /api/user-skills/interests - Update interests for multiple skills
 * PATCH /api/user-skills/interests - Update interest for a single skill
 *
 * Interest levels:
 * - high: Actively seeking tickets in this area, wants to grow
 * - medium: Open to tasks, will accept
 * - low: Prefers other areas, assign only if needed
 * - none: Not interested, avoid assigning
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready

// Types
interface UserSkillInterest {
  id: string;
  skill_name: string;
  skill_category: string | null;
  proficiency_level: number;
  interest_level: string | null;
  wants_to_learn: boolean;
  updated_at?: Date;
}

// TODO: Implement via Java backend when endpoints are ready
async function getUserSkillsWithInterests(userId: string): Promise<UserSkillInterest[]> {
  console.log(`[UserInterests] getUserSkillsWithInterests for: ${userId}`);
  return []; // Return empty until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function findUserSkillByName(userId: string, skillName: string): Promise<UserSkillInterest | null> {
  console.log(`[UserInterests] findUserSkillByName: ${userId}, ${skillName}`);
  return null;
}

// TODO: Implement via Java backend when endpoints are ready
async function updateUserSkillInterest(id: string, data: Partial<UserSkillInterest>): Promise<UserSkillInterest> {
  console.log(`[UserInterests] updateUserSkillInterest: ${id}`, data);
  return { id, skill_name: '', skill_category: null, proficiency_level: 1, interest_level: null, wants_to_learn: false };
}

// TODO: Implement via Java backend when endpoints are ready
async function getUserOrgId(userId: string): Promise<string | null> {
  console.log(`[UserInterests] getUserOrgId for: ${userId}`);
  return 'mock-org-id';
}

// TODO: Implement via Java backend when endpoints are ready
async function createUserSkillWithInterest(data: {
  user_id: string;
  org_id: string;
  skill_name: string;
  skill_category: string;
  proficiency_level: number;
  interest_level: string;
  wants_to_learn: boolean;
  source: string;
}): Promise<UserSkillInterest> {
  console.log(`[UserInterests] createUserSkillWithInterest:`, data);
  return { id: 'mock-id', skill_name: data.skill_name, skill_category: data.skill_category, proficiency_level: data.proficiency_level, interest_level: data.interest_level, wants_to_learn: data.wants_to_learn };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || session.user.id;

    // Get all skills with interest info
    const userSkills = await getUserSkillsWithInterests(userId);

    // Group by interest level
    const byInterest = {
      high: userSkills.filter(s => s.interest_level === 'high'),
      medium: userSkills.filter(s => s.interest_level === 'medium'),
      low: userSkills.filter(s => s.interest_level === 'low'),
      none: userSkills.filter(s => s.interest_level === 'none'),
    };

    // Find learning opportunities (novice + eager)
    const learningOpportunities = userSkills.filter(
      s => s.proficiency_level <= 2 && s.wants_to_learn && s.interest_level === 'high'
    );

    return NextResponse.json({
      success: true,
      user_id: userId,
      skills: userSkills,
      by_interest: byInterest,
      learning_opportunities: learningOpportunities,
      summary: {
        total: userSkills.length,
        high_interest: byInterest.high.length,
        want_to_learn: learningOpportunities.length,
      },
    });
  } catch (error) {
    console.error('[User Interests API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch interests' }, { status: 500 });
  }
}

// PUT - Bulk update interests
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { interests } = body;

    // interests: [{ skill_name, interest_level, wants_to_learn }]
    if (!Array.isArray(interests)) {
      return NextResponse.json({ error: 'interests array is required' }, { status: 400 });
    }

    const results = [];

    for (const item of interests) {
      const { skill_name, interest_level, wants_to_learn } = item;

      if (!skill_name) continue;

      // Validate interest_level
      const validLevels = ['high', 'medium', 'low', 'none'];
      if (interest_level && !validLevels.includes(interest_level)) {
        continue;
      }

      // Update existing skill
      const existing = await findUserSkillByName(session.user.id, skill_name);

      if (existing) {
        const updated = await updateUserSkillInterest(existing.id, {
          interest_level: interest_level || existing.interest_level,
          wants_to_learn: wants_to_learn !== undefined ? wants_to_learn : existing.wants_to_learn,
          updated_at: new Date(),
        });
        results.push({ action: 'updated', skill: skill_name, interest_level: updated.interest_level });
      } else {
        // Create new skill entry with interest (proficiency defaults to 1)
        const orgId = await getUserOrgId(session.user.id);

        if (orgId) {
          const created = await createUserSkillWithInterest({
            user_id: session.user.id,
            org_id: orgId,
            skill_name,
            skill_category: 'technical',
            proficiency_level: 1, // Start as beginner
            interest_level: interest_level || 'high',
            wants_to_learn: wants_to_learn !== undefined ? wants_to_learn : true,
            source: 'self_declared',
          });
          results.push({ action: 'created', skill: skill_name, interest_level: created.interest_level });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated interests for ${results.length} skills`,
      results,
    });
  } catch (error) {
    console.error('[User Interests API] Error:', error);
    return NextResponse.json({ error: 'Failed to update interests' }, { status: 500 });
  }
}

// PATCH - Update single skill interest
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { skill_name, interest_level, wants_to_learn } = body;

    if (!skill_name) {
      return NextResponse.json({ error: 'skill_name is required' }, { status: 400 });
    }

    // Validate interest_level
    const validLevels = ['high', 'medium', 'low', 'none'];
    if (interest_level && !validLevels.includes(interest_level)) {
      return NextResponse.json({
        error: `Invalid interest_level. Must be one of: ${validLevels.join(', ')}`,
      }, { status: 400 });
    }

    // Find and update
    const existing = await findUserSkillByName(session.user.id, skill_name);

    if (!existing) {
      return NextResponse.json({ error: 'Skill not found. Add the skill first.' }, { status: 404 });
    }

    const updated = await updateUserSkillInterest(existing.id, {
      interest_level: interest_level || existing.interest_level,
      wants_to_learn: wants_to_learn !== undefined ? wants_to_learn : existing.wants_to_learn,
      updated_at: new Date(),
    });

    // Explain what this means for assignment
    let assignmentImpact = '';
    if (updated.interest_level === 'high' && updated.wants_to_learn) {
      assignmentImpact = 'You will be prioritized for simple/medium ' + skill_name + ' tickets as a learning opportunity.';
    } else if (updated.interest_level === 'high') {
      assignmentImpact = 'You will be considered favorably for ' + skill_name + ' tickets.';
    } else if (updated.interest_level === 'none') {
      assignmentImpact = 'You will rarely be assigned ' + skill_name + ' tickets unless no one else is available.';
    } else {
      assignmentImpact = 'Standard assignment priority for ' + skill_name + ' tickets.';
    }

    return NextResponse.json({
      success: true,
      skill_name: updated.skill_name,
      interest_level: updated.interest_level,
      wants_to_learn: updated.wants_to_learn,
      proficiency_level: updated.proficiency_level,
      assignment_impact: assignmentImpact,
    });
  } catch (error) {
    console.error('[User Interests API] Error:', error);
    return NextResponse.json({ error: 'Failed to update interest' }, { status: 500 });
  }
}
