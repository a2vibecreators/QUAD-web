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
import { prisma } from '@/lib/prisma';
import { recordSkillFeedback } from '@/lib/services/assignment-service';

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

    const where: Record<string, unknown> = { user_id: userId };
    if (skillName) {
      where.skill_name = { equals: skillName, mode: 'insensitive' };
    }

    const feedback = await prisma.qUAD_skill_feedback.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
    });

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

    const user = await prisma.qUAD_users.findUnique({
      where: { id: session.user.id },
      select: { org_id: true }
    });

    if (!user?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Record scrum feedback
    const delta = knows === true ? 1 : knows === false ? -1 : 0;

    await prisma.qUAD_skill_feedback.create({
      data: {
        user_id,
        skill_name,
        feedback_type: 'scrum_feedback',
        proficiency_delta: delta,
        feedback_notes: notes || (knows ? 'Demonstrated knowledge in scrum' : 'Mentioned lack of knowledge in scrum'),
        is_processed: false
      }
    });

    // Update user skill if exists
    const userSkill = await prisma.qUAD_user_skills.findFirst({
      where: { user_id, skill_name: { equals: skill_name, mode: 'insensitive' } }
    });

    if (userSkill) {
      await prisma.qUAD_user_skills.update({
        where: { id: userSkill.id },
        data: {
          positive_feedback: delta > 0 ? { increment: 1 } : undefined,
          negative_feedback: delta < 0 ? { increment: 1 } : undefined,
          // Adjust confidence based on feedback
          confidence: delta < 0 ? Math.max(0.1, Number(userSkill.confidence) - 0.1) : Number(userSkill.confidence),
          last_assessed: new Date()
        }
      });
    } else if (!knows) {
      // Create a new skill entry with low proficiency if they don't know it
      await prisma.qUAD_user_skills.create({
        data: {
          user_id,
          org_id: user.org_id,
          skill_name,
          skill_category: 'technical',
          proficiency_level: 1, // Beginner
          source: 'scrum_feedback',
          confidence: 0.6,
          negative_feedback: 1
        }
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
