/**
 * PUT /api/training/[id]/progress - Update training progress
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// TypeScript interfaces for data types
interface TrainingContent {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  content_type: string;
  skill_category: string | null;
  difficulty: string;
  duration_mins: number | null;
  content_url: string | null;
  external_provider: string | null;
  is_required: boolean;
  is_active: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

interface TrainingCompletion {
  id: string;
  user_id: string;
  content_id: string;
  status: string;
  progress_percent: number;
  started_at: Date | null;
  completed_at: Date | null;
  quiz_score: number | null;
  certificate_url: string | null;
}

interface UserSkill {
  id: string;
  user_id: string;
  org_id: string;
  skill_name: string;
  skill_category: string | null;
  proficiency_level: number;
  certified: boolean;
  certification_date: Date | null;
}

// Stub functions for database operations
async function findTrainingContentByIdAndOrg(contentId: string, orgId: string): Promise<TrainingContent | null> {
  console.log('[STUB] findTrainingContentByIdAndOrg called with contentId:', contentId, 'orgId:', orgId);
  return null;
}

async function upsertTrainingCompletion(
  userId: string,
  contentId: string,
  data: Partial<TrainingCompletion>
): Promise<TrainingCompletion> {
  console.log('[STUB] upsertTrainingCompletion called with userId:', userId, 'contentId:', contentId, 'data:', data);
  return {
    id: 'stub-completion-id',
    user_id: userId,
    content_id: contentId,
    status: data.status || 'in_progress',
    progress_percent: data.progress_percent || 0,
    started_at: data.started_at || new Date(),
    completed_at: data.completed_at || null,
    quiz_score: data.quiz_score || null,
    certificate_url: data.certificate_url || null,
  };
}

async function findUserSkillByUserIdAndName(userId: string, skillName: string): Promise<UserSkill | null> {
  console.log('[STUB] findUserSkillByUserIdAndName called with userId:', userId, 'skillName:', skillName);
  return null;
}

async function createUserSkill(data: Partial<UserSkill>): Promise<UserSkill> {
  console.log('[STUB] createUserSkill called with data:', data);
  return {
    id: 'stub-skill-id',
    user_id: data.user_id || '',
    org_id: data.org_id || '',
    skill_name: data.skill_name || '',
    skill_category: data.skill_category || null,
    proficiency_level: data.proficiency_level || 1,
    certified: data.certified || false,
    certification_date: data.certification_date || null,
  };
}

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
    const content = await findTrainingContentByIdAndOrg(contentId, payload.companyId);

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
    const completionData: Partial<TrainingCompletion> = {
      status: status || 'in_progress',
      progress_percent: progress_percent || 0,
    };

    if (status === 'in_progress') {
      completionData.started_at = new Date();
    }
    if (status === 'completed') {
      completionData.completed_at = new Date();
    }
    if (quiz_score !== undefined) {
      completionData.quiz_score = quiz_score;
    }
    if (certificate_url !== undefined) {
      completionData.certificate_url = certificate_url;
    }

    const completion = await upsertTrainingCompletion(
      payload.userId,
      contentId,
      completionData
    );

    // If completed, auto-add skill if skill_category exists
    if (status === 'completed' && content.skill_category) {
      // Check if user already has this skill
      const existingSkill = await findUserSkillByUserIdAndName(payload.userId, content.title);

      if (!existingSkill) {
        await createUserSkill({
          user_id: payload.userId,
          org_id: payload.companyId,
          skill_name: content.title,
          skill_category: content.skill_category,
          proficiency_level: content.difficulty === 'beginner' ? 1 :
            content.difficulty === 'intermediate' ? 2 : 3,
          certified: !!certificate_url,
          certification_date: certificate_url ? new Date() : null
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
