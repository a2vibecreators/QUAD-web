/**
 * Skill Feedback API - Learning from scrum and ticket outcomes
 *
 * POST /api/skill-feedback - Record feedback (decline, complete, etc.)
 * GET /api/skill-feedback - Get feedback history for a user
 *
 * Use cases:
 * - Developer says "I don't know Docker" in scrum → Record negative feedback
 * - Developer completes a React ticket → Record positive feedback
 * - Developer asks for reassignment → Record as declined
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready
import { recordSkillFeedback } from '@/lib/services/assignment-service';

// Types
interface SkillFeedback {
  id: string;
  user_id: string;
  skill_name: string | null;
  feedback_type: string;
  proficiency_delta: number;
  feedback_notes: string | null;
  is_processed: boolean;
  created_at: Date;
}

interface UserSkill {
  id: string;
  user_id: string;
  skill_name: string;
  confidence: number;
  positive_feedback: number;
  negative_feedback: number;
}

// TODO: Implement via Java backend when endpoints are ready
async function getSkillFeedback(userId: string, skillName?: string | null, limit?: number): Promise<SkillFeedback[]> {
  console.log(`[SkillFeedback] getSkillFeedback for: ${userId}, skill: ${skillName}, limit: ${limit}`);
  return []; // Return empty until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function getUserOrgId(userId: string): Promise<string | null> {
  console.log(`[SkillFeedback] getUserOrgId for: ${userId}`);
  return 'mock-org-id';
}

// TODO: Implement via Java backend when endpoints are ready
async function createSkillFeedback(data: Partial<SkillFeedback>): Promise<void> {
  console.log(`[SkillFeedback] createSkillFeedback:`, data);
}

// TODO: Implement via Java backend when endpoints are ready
async function findUserSkillByName(userId: string, skillName: string): Promise<UserSkill | null> {
  console.log(`[SkillFeedback] findUserSkillByName: ${userId}, ${skillName}`);
  return null;
}

// TODO: Implement via Java backend when endpoints are ready
async function updateUserSkillFeedback(id: string, data: { positive_feedback?: number; negative_feedback?: number; confidence?: number; last_assessed?: Date }): Promise<void> {
  console.log(`[SkillFeedback] updateUserSkillFeedback: ${id}`, data);
}

// TODO: Implement via Java backend when endpoints are ready
async function createUserSkill(data: { user_id: string; org_id: string; skill_name: string; skill_category: string; proficiency_level: number; source: string; confidence: number; negative_feedback: number }): Promise<void> {
  console.log(`[SkillFeedback] createUserSkill:`, data);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || session.user.id;
    const skillName = searchParams.get('skill_name');
    const limit = parseInt(searchParams.get('limit') || '50');

    const feedback = await getSkillFeedback(userId, skillName, limit);

    // Summarize feedback by skill
    const skillSummary: Record<string, { positive: number; negative: number; neutral: number }> = {};
    for (const f of feedback) {
      const skill = f.skill_name;
      if (!skill) continue;
      if (!skillSummary[skill]) {
        skillSummary[skill] = { positive: 0, negative: 0, neutral: 0 };
      }
      if (f.proficiency_delta > 0) skillSummary[skill].positive++;
      else if (f.proficiency_delta < 0) skillSummary[skill].negative++;
      else skillSummary[skill].neutral++;
    }

    return NextResponse.json({
      success: true,
      user_id: userId,
      feedback,
      summary: skillSummary,
      total: feedback.length
    });
  } catch (error) {
    console.error('[Skill Feedback API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch skill feedback' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      user_id,
      ticket_id,
      feedback_type,
      skill_name,
      notes
    } = body;

    // Validate feedback_type
    const validTypes = ['ticket_completed', 'ticket_declined', 'ticket_reassigned', 'scrum_feedback', 'peer_feedback'];
    if (!validTypes.includes(feedback_type)) {
      return NextResponse.json({
        error: `Invalid feedback_type. Must be one of: ${validTypes.join(', ')}`
      }, { status: 400 });
    }

    // Target user (default to self for self-reported feedback)
    const targetUserId = user_id || session.user.id;

    // Record the feedback
    await recordSkillFeedback(
      targetUserId,
      ticket_id || null,
      feedback_type,
      skill_name,
      notes
    );

    return NextResponse.json({
      success: true,
      message: `Feedback recorded: ${feedback_type} for ${skill_name || 'ticket skills'}`,
      user_id: targetUserId,
      ticket_id,
      feedback_type,
      skill_name
    });
  } catch (error) {
    console.error('[Skill Feedback API] Error:', error);
    return NextResponse.json({ error: 'Failed to record skill feedback' }, { status: 500 });
  }
}

/**
 * PATCH - Quick feedback from scrum call
 * Example: { "user_id": "...", "skill_name": "docker", "knows": false, "notes": "Said in standup" }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, skill_name, knows, notes } = body;

    if (!user_id || !skill_name) {
      return NextResponse.json({ error: 'user_id and skill_name are required' }, { status: 400 });
    }

    const orgId = await getUserOrgId(session.user.id);

    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Record scrum feedback
    const delta = knows === true ? 1 : knows === false ? -1 : 0;

    await createSkillFeedback({
      user_id,
      skill_name,
      feedback_type: 'scrum_feedback',
      proficiency_delta: delta,
      feedback_notes: notes || (knows ? 'Demonstrated knowledge in scrum' : 'Mentioned lack of knowledge in scrum'),
      is_processed: false
    });

    // Update user skill if exists
    const userSkill = await findUserSkillByName(user_id, skill_name);

    if (userSkill) {
      await updateUserSkillFeedback(userSkill.id, {
        positive_feedback: delta > 0 ? userSkill.positive_feedback + 1 : undefined,
        negative_feedback: delta < 0 ? userSkill.negative_feedback + 1 : undefined,
        // Adjust confidence based on feedback
        confidence: delta < 0 ? Math.max(0.1, Number(userSkill.confidence) - 0.1) : Number(userSkill.confidence),
        last_assessed: new Date()
      });
    } else if (!knows) {
      // Create a new skill entry with low proficiency if they don't know it
      await createUserSkill({
        user_id,
        org_id: orgId,
        skill_name,
        skill_category: 'technical',
        proficiency_level: 1, // Beginner
        source: 'scrum_feedback',
        confidence: 0.6,
        negative_feedback: 1
      });
    }

    return NextResponse.json({
      success: true,
      message: knows
        ? `Recorded: ${skill_name} - User knows this skill`
        : `Recorded: ${skill_name} - User needs training`,
      user_id,
      skill_name,
      knows,
      impact: knows ? '+1 positive feedback' : '-1 negative feedback (confidence reduced)'
    });
  } catch (error) {
    console.error('[Skill Feedback API] Error:', error);
    return NextResponse.json({ error: 'Failed to record scrum feedback' }, { status: 500 });
  }
}
