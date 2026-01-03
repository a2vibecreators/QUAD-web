/**
 * PUT /api/training/[id]/progress - Update training progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// PUT: Update training progress
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params;

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
    const { status, progress_percent, quiz_score, certificate_url } = body;

    // Verify content exists and belongs to org
    const content = await prisma.qUAD_training_content.findFirst({
      where: { id: contentId, org_id: payload.companyId }
    });

    if (!content) {
      return NextResponse.json({ error: 'Training content not found' }, { status: 404 });
    }

    // Validate status
    const validStatuses = ['not_started', 'in_progress', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Upsert progress
    const completion = await prisma.qUAD_training_completions.upsert({
      where: {
        user_id_content_id: {
          user_id: payload.userId,
          content_id: contentId
        }
      },
      update: {
        ...(status && { status }),
        ...(progress_percent !== undefined && { progress_percent }),
        ...(status === 'in_progress' && { started_at: new Date() }),
        ...(status === 'completed' && { completed_at: new Date() }),
        ...(quiz_score !== undefined && { quiz_score }),
        ...(certificate_url !== undefined && { certificate_url })
      },
      create: {
        user_id: payload.userId,
        content_id: contentId,
        status: status || 'in_progress',
        progress_percent: progress_percent || 0,
        started_at: new Date()
      }
    });

    // If completed, auto-add skill if skill_category exists
    if (status === 'completed' && content.skill_category) {
      // Check if user already has this skill
      const existingSkill = await prisma.qUAD_user_skills.findFirst({
        where: {
          user_id: payload.userId,
          skill_name: content.title
        }
      });

      if (!existingSkill) {
        await prisma.qUAD_user_skills.create({
          data: {
            user_id: payload.userId,
            org_id: payload.companyId,
            skill_name: content.title,
            skill_category: content.skill_category,
            proficiency_level: content.difficulty === 'beginner' ? 1 :
              content.difficulty === 'intermediate' ? 2 : 3,
            certified: !!certificate_url,
            certification_date: certificate_url ? new Date() : null
          }
        });
      }
    }

    return NextResponse.json({
      message: 'Progress updated',
      completion
    });

  } catch (error) {
    console.error('Update training progress error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
