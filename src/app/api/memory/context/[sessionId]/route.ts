/**
 * Context Session API - Iterate and complete context sessions
 *
 * POST /api/memory/context/[sessionId] - Request more context (iterate)
 * PATCH /api/memory/context/[sessionId] - Complete session with feedback
 * GET /api/memory/context/[sessionId] - Get session details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { MemoryService } from '@/lib/services/memory-service';

// GET - Get session details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contextSession = await prisma.qUAD_context_sessions.findUnique({
      where: { id: sessionId },
      include: {
        context_requests: {
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!contextSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      session: {
        id: contextSession.id,
        session_type: contextSession.session_type,
        trigger_entity_type: contextSession.trigger_entity_type,
        trigger_entity_id: contextSession.trigger_entity_id,
        iteration_count: contextSession.iteration_count,
        initial_context_tokens: contextSession.initial_context_tokens,
        total_context_tokens: contextSession.total_context_tokens,
        was_successful: contextSession.was_successful,
        success_notes: contextSession.success_notes,
        failure_notes: contextSession.failure_notes,
        created_at: contextSession.created_at,
        completed_at: contextSession.completed_at,
      },
      iterations: contextSession.context_requests.map(req => ({
        iteration: req.iteration_number,
        request_type: req.request_type,
        ai_request: req.ai_request_text,
        tokens_sent: req.response_tokens,
        was_sufficient: req.was_sufficient,
        missing_category: req.missing_category,
      })),
    });
  } catch (error) {
    console.error('[Context Session API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

// POST - Request more context (the "puzzle piece" endpoint)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ai_request, request_type, keywords } = body;

    if (!ai_request) {
      return NextResponse.json({
        error: 'ai_request is required (what did AI ask for?)',
      }, { status: 400 });
    }

    const validRequestTypes = ['code_snippet', 'schema', 'file_content', 'api_endpoint', 'business_logic', 'clarification'];
    if (request_type && !validRequestTypes.includes(request_type)) {
      return NextResponse.json({
        error: `Invalid request_type. Must be one of: ${validRequestTypes.join(', ')}`,
      }, { status: 400 });
    }

    const result = await MemoryService.handleIterativeRequest({
      sessionId,
      aiRequestText: ai_request,
      requestType: request_type || 'clarification',
      keywords,
    });

    // Format for AI consumption
    const formattedContext = result.additionalChunks.map(chunk => ({
      section: chunk.section,
      level: chunk.level,
      content: chunk.content,
    }));

    return NextResponse.json({
      success: true,
      found: result.wasFound,
      context: formattedContext,
      metadata: {
        new_tokens: result.totalNewTokens,
        chunks_added: result.additionalChunks.length,
      },
      suggestion: result.suggestion,
      // Raw context as markdown
      context_markdown: result.wasFound
        ? result.additionalChunks.map(c => `### ${c.section}\n${c.content}`).join('\n\n')
        : null,
    });
  } catch (error) {
    console.error('[Context Session API] Error:', error);
    return NextResponse.json({ error: 'Failed to get additional context' }, { status: 500 });
  }
}

// PATCH - Complete session with feedback
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { was_successful, notes } = body;

    if (typeof was_successful !== 'boolean') {
      return NextResponse.json({
        error: 'was_successful (boolean) is required',
      }, { status: 400 });
    }

    await MemoryService.completeSession(sessionId, was_successful, notes);

    // Get updated session stats
    const contextSession = await prisma.qUAD_context_sessions.findUnique({
      where: { id: sessionId },
    });

    return NextResponse.json({
      success: true,
      message: was_successful ? 'Session completed successfully' : 'Session marked as unsuccessful',
      session: {
        id: sessionId,
        iteration_count: contextSession?.iteration_count,
        total_context_tokens: contextSession?.total_context_tokens,
        was_successful,
        completed_at: contextSession?.completed_at,
      },
      feedback_impact: was_successful
        ? 'Initial context chunks marked as helpful - future sessions will prioritize similar chunks'
        : 'Session data recorded for analysis - will help improve context selection',
    });
  } catch (error) {
    console.error('[Context Session API] Error:', error);
    return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 });
  }
}
