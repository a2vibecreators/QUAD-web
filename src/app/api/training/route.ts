/**
 * GET /api/training - Get training content
 * POST /api/training - Create training content (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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
    const content = await prisma.qUAD_training_content.findMany({
      where: {
        org_id: payload.companyId,
        is_active: true,
        ...(category && { skill_category: category }),
        ...(contentType && { content_type: contentType }),
        ...(difficulty && { difficulty }),
        ...(view === 'required' && { is_required: true })
      },
      orderBy: [{ is_required: 'desc' }, { created_at: 'desc' }]
    });

    // Get user's completions
    const completions = await prisma.qUAD_training_completions.findMany({
      where: { user_id: payload.userId }
    });
    const completionMap = new Map(completions.map(c => [c.content_id, c]));

    // Enrich content with user progress
    const enrichedContent = content.map(c => {
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

    const content = await prisma.qUAD_training_content.create({
      data: {
        org_id: payload.companyId,
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
      }
    });

    return NextResponse.json({ content }, { status: 201 });

  } catch (error) {
    console.error('Create training error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
