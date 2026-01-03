/**
 * User Skills API - Manage developer proficiency
 *
 * GET /api/user-skills - Get skills for current user or specified user
 * POST /api/user-skills - Add/update skill proficiency (self-assessment or during onboarding)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || session.user.id;

    const user = await prisma.qUAD_users.findUnique({
      where: { id: session.user.id },
      select: { org_id: true },
    });

    if (!user?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get user's skills with skill details
    const userSkills = await prisma.qUAD_user_skills.findMany({
      where: { user_id: userId },
      include: {
        skill: true,
      },
      orderBy: [{ proficiency_level: 'desc' }, { skill_name: 'asc' }],
    });

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

    const user = await prisma.qUAD_users.findUnique({
      where: { id: session.user.id },
      select: { org_id: true },
    });

    if (!user?.org_id) {
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
      const existing = await prisma.qUAD_user_skills.findFirst({
        where: { user_id: targetUserId, skill_name },
      });

      if (existing) {
        // Update proficiency
        const updated = await prisma.qUAD_user_skills.update({
          where: { id: existing.id },
          data: {
            proficiency_level,
            skill_id: skill_id || existing.skill_id,
            source: 'self_declared',
            last_assessed: new Date(),
          },
        });
        results.push({ action: 'updated', skill: updated });
      } else {
        // Create new skill entry
        const created = await prisma.qUAD_user_skills.create({
          data: {
            user_id: targetUserId,
            org_id: user.org_id,
            skill_name,
            skill_id,
            skill_category: skill_category || 'technical',
            proficiency_level,
            source: 'self_declared',
            confidence: 0.8, // High confidence for self-declared
          },
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
