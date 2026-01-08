/**
 * GET /api/training - Get training content
 * POST /api/training - Create training content (admin)
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

interface TrainingContentWithProgress extends TrainingContent {
  user_progress: {
    status: string;
    progress_percent: number;
    started_at: Date | null;
    completed_at: Date | null;
    quiz_score: number | null;
  } | null;
}

// Stub functions for database operations
async function findTrainingContent(
  orgId: string,
  filters: {
    category?: string | null;
    contentType?: string | null;
    difficulty?: string | null;
    isRequired?: boolean;
  }
): Promise<TrainingContent[]> {
  console.log('[STUB] findTrainingContent called with orgId:', orgId, 'filters:', filters);
  return [];
}

async function findTrainingCompletionsByUserId(userId: string): Promise<TrainingCompletion[]> {
  console.log('[STUB] findTrainingCompletionsByUserId called with userId:', userId);
  return [];
}

async function createTrainingContent(data: Partial<TrainingContent>): Promise<TrainingContent> {
  console.log('[STUB] createTrainingContent called with data:', data);
  return {
    id: 'stub-training-id',
    org_id: data.org_id || '',
    title: data.title || '',
    description: data.description || null,
    content_type: data.content_type || 'document',
    skill_category: data.skill_category || null,
    difficulty: data.difficulty || 'beginner',
    duration_mins: data.duration_mins || null,
    content_url: data.content_url || null,
    external_provider: data.external_provider || null,
    is_required: data.is_required || false,
    is_active: true,
    created_by: data.created_by || '',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

// GET: Get training content
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const contentType = searchParams.get('type');
    const difficulty = searchParams.get('difficulty');
    const view = searchParams.get('view') || 'all'; // all, my_progress, required

    // Get all training content
    const content = await findTrainingContent(payload.orgId, {
      category,
      contentType,
      difficulty,
      isRequired: view === 'required' ? true : undefined,
    });

    // Get user's completions
    const completions = await findTrainingCompletionsByUserId(payload.userId);
    const completionMap = new Map(completions.map(c => [c.content_id, c]));

    // Enrich content with user progress
    const enrichedContent: TrainingContentWithProgress[] = content.map(c => {
      const completion = completionMap.get(c.id);
      return {
        ...c,
        user_progress: completion ? {
          status: completion.status,
          progress_percent: completion.progress_percent,
          started_at: completion.started_at,
          completed_at: completion.completed_at,
          quiz_score: completion.quiz_score
        } : null
      };
    });

    // Filter by user progress if requested
    let filteredContent = enrichedContent;
    if (view === 'my_progress') {
      filteredContent = enrichedContent.filter(c => c.user_progress !== null);
    }

    // Group by category
    const byCategory = filteredContent.reduce((acc, c) => {
      const cat = c.skill_category || 'uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(c);
      return acc;
    }, {} as Record<string, typeof filteredContent>);

    // Calculate stats
    const stats = {
      total_content: content.length,
      completed: completions.filter(c => c.status === 'completed').length,
      in_progress: completions.filter(c => c.status === 'in_progress').length,
      required_total: content.filter(c => c.is_required).length,
      required_completed: content.filter(c => c.is_required && completionMap.get(c.id)?.status === 'completed').length
    };

    return NextResponse.json({
      content: filteredContent,
      by_category: byCategory,
      stats
    });

  } catch (error) {
    console.error('Get training error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create training content
export async function POST(request: NextRequest) {
  try {
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
    const {
      title,
      description,
      content_type,
      skill_category,
      difficulty,
      duration_mins,
      content_url,
      external_provider,
      is_required
    } = body;

    if (!title || !content_type) {
      return NextResponse.json(
        { error: 'title and content_type are required' },
        { status: 400 }
      );
    }

    // Validate content type
    const validTypes = ['video', 'document', 'quiz', 'workshop', 'external_link'];
    if (!validTypes.includes(content_type)) {
      return NextResponse.json(
        { error: `Invalid content_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate difficulty
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: `Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}` },
        { status: 400 }
      );
    }

    const content = await createTrainingContent({
      org_id: payload.orgId,
      title,
      description,
      content_type,
      skill_category,
      difficulty: difficulty || 'beginner',
      duration_mins,
      content_url,
      external_provider,
      is_required: is_required || false,
      created_by: payload.userId
    });

    return NextResponse.json({ content }, { status: 201 });

  } catch (error) {
    console.error('Create training error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
