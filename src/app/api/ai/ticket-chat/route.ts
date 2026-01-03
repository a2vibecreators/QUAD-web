/**
 * POST /api/ai/ticket-chat
 *
 * Ticket-scoped AI chat endpoint.
 * - Saves conversation history per ticket
 * - Context LIMITED to the specific ticket
 * - Uses activity-based routing to choose AI provider
 *
 * GET /api/ai/ticket-chat?ticketId=xxx
 * - Retrieves conversation history for a ticket
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { callAI, AIMessage } from '@/lib/ai/providers';
import { hasCredits, deductCredits } from '@/lib/ai/credit-service';

// Environment check for AI providers
const USE_REAL_AI = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;

/**
 * GET - Retrieve conversation history for a ticket
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');

    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId required' }, { status: 400 });
    }

    // Find existing conversation for this ticket
    const conversation = await prisma.qUAD_ai_conversations.findFirst({
      where: {
        org_id: session.user.companyId,
        scope_type: 'ticket',
        scope_id: ticketId,
        status: 'active',
      },
      include: {
        messages: {
          orderBy: { created_at: 'asc' },
          take: 50, // Last 50 messages
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({
        success: true,
        data: { messages: [], conversationId: null },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        conversationId: conversation.id,
        messages: conversation.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.created_at,
          suggestion: m.suggestion_type
            ? {
                type: m.suggestion_type,
                data: m.suggestion_data,
                status: m.suggestion_status,
              }
            : null,
        })),
        totalTokens: conversation.total_tokens_used,
      },
    });
  } catch (error) {
    console.error('[ticket-chat] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

/**
 * POST - Send a message and get AI response
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ticketId, message, ticketContext, conversationHistory = [] } = body;

    if (!ticketId || !message) {
      return NextResponse.json(
        { error: 'ticketId and message required' },
        { status: 400 }
      );
    }

    const orgId = session.user.companyId;
    const userId = session.user.id;

    // Check if org has credits (shared pool across all users)
    const creditCheck = await hasCredits(orgId);
    if (!creditCheck.hasCredits && !creditCheck.isByok) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          remainingCents: creditCheck.remainingCents,
          message: 'Your organization has run out of AI credits. Please purchase more or enable BYOK.',
        },
        { status: 402 }
      );
    }

    // 1. Find or create conversation for this ticket
    let conversation = await prisma.qUAD_ai_conversations.findFirst({
      where: {
        org_id: orgId,
        scope_type: 'ticket',
        scope_id: ticketId,
        status: 'active',
      },
    });

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.qUAD_ai_conversations.create({
        data: {
          org_id: orgId,
          user_id: userId,
          scope_type: 'ticket',
          scope_id: ticketId,
          title: ticketContext?.title
            ? `Chat: ${ticketContext.title.substring(0, 50)}`
            : 'Ticket Chat',
          status: 'active',
          primary_provider: 'claude', // Will be determined by activity routing
        },
      });
    }

    // 2. Save user message
    const userMessage = await prisma.qUAD_ai_messages.create({
      data: {
        conversation_id: conversation.id,
        role: 'user',
        content: message,
        content_type: 'text',
        tokens_used: Math.ceil(message.length / 4),
      },
    });

    // 3. Get activity routing for ticket questions
    const routing = await prisma.qUAD_ai_activity_routing.findFirst({
      where: {
        org_id: orgId,
        activity_type: 'ticket_question',
        is_active: true,
      },
    });

    // 4. Build ticket-scoped context (LIMITED to this ticket)
    const ticketPrompt = buildTicketContext(ticketContext);

    // 5. Generate AI response (real AI with mock fallback)
    const aiResponse = await generateTicketResponse(
      orgId,
      message,
      ticketContext,
      conversationHistory,
      routing
    );

    // 6. Save assistant message
    const assistantMessage = await prisma.qUAD_ai_messages.create({
      data: {
        conversation_id: conversation.id,
        role: 'assistant',
        content: aiResponse.content,
        content_type: aiResponse.hasCode ? 'code' : 'text',
        tokens_used: aiResponse.tokensUsed,
        provider: aiResponse.provider,
        model_id: aiResponse.model,
        latency_ms: aiResponse.latencyMs,
        suggestion_type: aiResponse.suggestion?.type,
        suggestion_data: aiResponse.suggestion?.data as object | undefined,
        suggestion_status: aiResponse.suggestion ? 'pending' : null,
      },
    });

    // 7. Update conversation stats
    await prisma.qUAD_ai_conversations.update({
      where: { id: conversation.id },
      data: {
        total_messages: { increment: 2 },
        total_tokens_used: {
          increment: userMessage.tokens_used + aiResponse.tokensUsed,
        },
      },
    });

    // 8. Deduct credits from org pool (shared by all users)
    // Skip for mock provider (no real cost)
    if (aiResponse.provider !== 'mock') {
      const ticketInfo = await prisma.qUAD_tickets.findUnique({
        where: { id: ticketId },
        select: { ticket_number: true },
      });

      await deductCredits(
        orgId,
        userId,
        {
          inputTokens: userMessage.tokens_used,
          outputTokens: aiResponse.tokensUsed,
          modelId: aiResponse.model,
          provider: aiResponse.provider,
        },
        {
          conversationId: conversation.id,
          messageId: assistantMessage.id,
          ticketId: ticketId,
          ticketNumber: ticketInfo?.ticket_number || undefined,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        conversationId: conversation.id,
        messageId: assistantMessage.id,
        message: aiResponse.content,
        suggestion: aiResponse.suggestion,
        tokensUsed: aiResponse.tokensUsed,
        provider: aiResponse.provider,
        model: aiResponse.model,
        latencyMs: aiResponse.latencyMs,
      },
    });
  } catch (error) {
    console.error('[ticket-chat] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

// Build context string for ticket-scoped questions
function buildTicketContext(ticket: {
  ticketNumber?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  circleName?: string;
  cycleName?: string;
}): string {
  if (!ticket) return '';

  return `
## Current Ticket Context

- **Ticket**: ${ticket.ticketNumber || 'Unknown'}
- **Title**: ${ticket.title || 'No title'}
- **Status**: ${ticket.status || 'Unknown'}
- **Priority**: ${ticket.priority || 'Unknown'}
${ticket.description ? `- **Description**: ${ticket.description.substring(0, 500)}` : ''}
${ticket.assignee ? `- **Assigned to**: ${ticket.assignee}` : ''}
${ticket.circleName ? `- **Circle**: ${ticket.circleName}` : ''}
${ticket.cycleName ? `- **Cycle**: ${ticket.cycleName}` : ''}

You are helping with THIS SPECIFIC TICKET only. Do not discuss other tickets unless explicitly asked.
`;
}

// Generate response for ticket questions
async function generateTicketResponse(
  orgId: string,
  message: string,
  ticketContext: Record<string, string> | undefined,
  history: { role: string; content: string }[],
  routing: { provider?: string; model_id?: string } | null
): Promise<{
  content: string;
  tokensUsed: number;
  latencyMs: number;
  hasCode: boolean;
  provider: string;
  model: string;
  suggestion?: { type: string; data: Record<string, unknown> };
}> {
  const startTime = Date.now();

  // Build system prompt with ticket context
  const ticketPromptContext = buildTicketContext(ticketContext || {});
  const systemPrompt = `You are QUAD AI, helping with a specific ticket in a project management system.

${ticketPromptContext}

## Your Capabilities:
- Answer questions about THIS ticket only
- Suggest next steps, identify blockers, estimate effort
- Provide implementation hints based on the ticket description
- Suggest ticket actions (status changes, comments, assignments)

## Response Format:
- Be concise and actionable
- Use markdown for formatting
- If suggesting an action, format it clearly

## Important:
- Stay focused on THIS ticket
- If asked about other tickets, politely redirect to use the general search`;

  // Check if we should use real AI
  if (USE_REAL_AI) {
    try {
      // Build messages for AI
      const aiMessages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: message },
      ];

      // Call real AI
      const aiResponse = await callAI(orgId, aiMessages, {
        activityType: 'ticket_question',
        provider: routing?.provider,
        model: routing?.model_id,
      });

      const latencyMs = Date.now() - startTime;
      console.log(`[ticket-chat] Real AI response in ${latencyMs}ms`);

      // Check for suggested actions in the response
      const suggestion = extractSuggestion(aiResponse.content);

      return {
        content: aiResponse.content,
        tokensUsed: aiResponse.usage.totalTokens,
        latencyMs,
        hasCode: aiResponse.content.includes('```'),
        provider: routing?.provider || 'claude',
        model: aiResponse.model,
        suggestion,
      };
    } catch (error) {
      console.error('[ticket-chat] AI error, using mock:', error);
      // Fall through to mock response
    }
  }

  // Mock response fallback
  console.log('[ticket-chat] Using mock response');
  const mockResponse = generateMockTicketResponse(message, ticketContext);

  return {
    content: mockResponse.content,
    tokensUsed: Math.ceil(mockResponse.content.length / 4),
    latencyMs: Date.now() - startTime,
    hasCode: mockResponse.content.includes('```'),
    provider: 'mock',
    model: 'mock',
    suggestion: mockResponse.suggestion,
  };
}

// Extract action suggestions from AI response
function extractSuggestion(
  content: string
): { type: string; data: Record<string, unknown> } | undefined {
  // Look for suggestion patterns in the response
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('suggest moving') || lowerContent.includes('change status')) {
    const statusMatch = content.match(/status.*?["'](\w+)["']/i);
    if (statusMatch) {
      return {
        type: 'update_status',
        data: { newStatus: statusMatch[1] },
      };
    }
  }

  if (lowerContent.includes('add a comment') || lowerContent.includes('leave a note')) {
    return {
      type: 'add_comment',
      data: { content: 'AI suggested adding a comment' },
    };
  }

  return undefined;
}

// Mock response generator for when no API keys are configured
function generateMockTicketResponse(
  message: string,
  ticketContext: Record<string, string> | undefined
): {
  content: string;
  suggestion?: { type: string; data: Record<string, unknown> };
} {
  const q = message.toLowerCase();
  let content: string;
  let suggestion: { type: string; data: Record<string, unknown> } | undefined;

  if (q.includes('blocking') || q.includes('blocker')) {
    content = `Based on ticket "${ticketContext?.title || 'this ticket'}":

**Potential blockers:**
1. Dependencies on other tickets may not be resolved
2. Technical requirements might need clarification
3. Resource availability could be a factor

**Suggested action:** Check the ticket's linked items and add a blocker comment if needed.`;
    suggestion = {
      type: 'add_comment',
      data: { content: 'Investigating blockers...', isBlocker: true },
    };
  } else if (q.includes('next step') || q.includes('what should')) {
    content = `For ticket "${ticketContext?.title || 'this ticket'}" (${ticketContext?.status}):

**Recommended next steps:**
1. ${ticketContext?.status === 'backlog' ? 'Move to "In Progress" and assign to a developer' : 'Continue with current implementation'}
2. Add acceptance criteria if not already defined
3. Estimate story points if missing

Would you like me to suggest a status change?`;
    suggestion = {
      type: 'update_status',
      data: { newStatus: 'in_progress' },
    };
  } else if (q.includes('estimate') || q.includes('effort')) {
    content = `Effort estimate for "${ticketContext?.title || 'this ticket'}":

Based on the description and priority (${ticketContext?.priority}):
- **Estimated story points:** 3-5
- **Estimated hours:** 4-8 hours
- **Confidence:** Medium

This is a rough estimate. For accuracy, discuss with the team.`;
  } else {
    content = `Regarding ticket "${ticketContext?.ticketNumber || ''}": ${ticketContext?.title || ''}

I can help you with:
- Identifying blockers
- Suggesting next steps
- Estimating effort
- Providing implementation hints

What would you like to know about this ticket?`;
  }

  return { content, suggestion };
}
