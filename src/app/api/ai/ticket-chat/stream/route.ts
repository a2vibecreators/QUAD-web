/**
 * POST /api/ai/ticket-chat/stream
 *
 * Streaming ticket-scoped AI chat endpoint using Server-Sent Events (SSE).
 * Returns AI response word-by-word in real-time.
 * Also saves the complete response to the database after streaming completes.
 *
 * Request body:
 *   { ticketId, message, ticketContext, conversationHistory }
 *
 * Response format (SSE):
 *   data: {"type":"text","content":"Based on"}
 *   data: {"type":"text","content":" the ticket"}
 *   data: {"type":"done","usage":{"inputTokens":100,"outputTokens":50}}
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready
import { streamAI, AIMessage } from '@/lib/ai/providers';
import { hasCredits, deductCredits } from '@/lib/ai/credit-service';

// Conversation types
interface AIConversation {
  id: string;
  org_id: string;
  user_id: string;
  scope_type: string;
  scope_id: string;
  title: string;
  status: string;
  total_messages: number;
  total_tokens_used: number;
  primary_provider: string;
}

interface AIMessage_DB {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  content_type: string;
  tokens_used: number;
}

// TODO: Implement via Java backend when endpoints are ready
async function findConversation(orgId: string, scopeType: string, scopeId: string): Promise<AIConversation | null> {
  console.log(`[TicketChatStream] findConversation for org: ${orgId}, scope: ${scopeType}/${scopeId}`);
  return null;
}

// TODO: Implement via Java backend when endpoints are ready
async function createConversation(data: Partial<AIConversation>): Promise<AIConversation> {
  console.log(`[TicketChatStream] createConversation:`, data);
  return {
    id: 'mock-conv-id',
    org_id: data.org_id || '',
    user_id: data.user_id || '',
    scope_type: data.scope_type || 'ticket',
    scope_id: data.scope_id || '',
    title: data.title || 'Chat',
    status: 'active',
    total_messages: 0,
    total_tokens_used: 0,
    primary_provider: 'claude',
  };
}

// TODO: Implement via Java backend when endpoints are ready
async function createMessage(data: Partial<AIMessage_DB>): Promise<AIMessage_DB> {
  console.log(`[TicketChatStream] createMessage:`, data);
  return {
    id: 'mock-msg-id',
    conversation_id: data.conversation_id || '',
    role: data.role || 'user',
    content: data.content || '',
    content_type: data.content_type || 'text',
    tokens_used: data.tokens_used || 0,
  };
}

// TODO: Implement via Java backend when endpoints are ready
async function updateConversation(_id: string, _data: object): Promise<void> {
  // Stub
}

// TODO: Implement via Java backend when endpoints are ready
async function getActivityRouting(_orgId: string, _activityType: string): Promise<{ provider?: string; model_id?: string } | null> {
  return null;
}

// TODO: Implement via Java backend when endpoints are ready
async function getTicketNumber(_ticketId: string): Promise<string | null> {
  return null;
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

You are helping with THIS SPECIFIC TICKET only.`;
}

export async function POST(request: NextRequest) {
  // Verify authentication via NextAuth session
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId || !session?.user?.id) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { ticketId, message, ticketContext, conversationHistory = [] } = body;

    if (!ticketId || !message) {
      return new Response(
        JSON.stringify({ error: 'ticketId and message required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const orgId = session.user.companyId;
    const userId = session.user.id;

    // Check if org has credits (shared pool across all users)
    const creditCheck = await hasCredits(orgId);
    if (!creditCheck.hasCredits && !creditCheck.isByok) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits',
          remainingCents: creditCheck.remainingCents,
          message: 'Your organization has run out of AI credits. Please purchase more or enable BYOK.',
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find or create conversation for this ticket
    let conversation = await findConversation(orgId, 'ticket', ticketId);

    if (!conversation) {
      conversation = await createConversation({
        org_id: orgId,
        user_id: userId,
        scope_type: 'ticket',
        scope_id: ticketId,
        title: ticketContext?.title
          ? `Chat: ${ticketContext.title.substring(0, 50)}`
          : 'Ticket Chat',
        status: 'active',
        primary_provider: 'claude',
      });
    }

    // Save user message first
    const userMessage = await createMessage({
      conversation_id: conversation.id,
      role: 'user',
      content: message,
      content_type: 'text',
      tokens_used: Math.ceil(message.length / 4),
    });

    // Get activity routing
    const routing = await getActivityRouting(orgId, 'ticket_question');

    // Build system prompt
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

    // Build messages array
    const aiMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // Track accumulated content for saving
    let accumulatedContent = '';
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    const startTime = Date.now();

    // Create SSE stream
    const encoder = new TextEncoder();
    const conversationId = conversation.id;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream from AI provider
          for await (const chunk of streamAI(orgId, aiMessages, {
            activityType: 'ticket_question',
            provider: routing?.provider,
            model: routing?.model_id,
          })) {
            // Format as SSE
            const data = JSON.stringify(chunk);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));

            // Accumulate content for database save
            if (chunk.type === 'text' && chunk.content) {
              accumulatedContent += chunk.content;
            }

            // Capture usage stats
            if (chunk.type === 'done' && chunk.usage) {
              totalInputTokens = chunk.usage.inputTokens;
              totalOutputTokens = chunk.usage.outputTokens;
            }

            // If done or error, save to database and close
            if (chunk.type === 'done' || chunk.type === 'error') {
              const latencyMs = Date.now() - startTime;

              // Save assistant message to database
              if (accumulatedContent) {
                const modelUsed = routing?.model_id || 'claude-3-5-haiku-20241022';
                const providerUsed = routing?.provider || 'claude';

                const assistantMessage = await createMessage({
                  conversation_id: conversationId,
                  role: 'assistant',
                  content: accumulatedContent,
                  content_type: accumulatedContent.includes('```') ? 'code' : 'text',
                  tokens_used: totalOutputTokens || Math.ceil(accumulatedContent.length / 4),
                });

                // Update conversation stats
                await updateConversation(conversationId, {
                  total_messages: 2, // Will need proper increment logic in Java backend
                  total_tokens_used: userMessage.tokens_used + (totalOutputTokens || Math.ceil(accumulatedContent.length / 4)),
                });

                // Deduct credits from org pool (shared by all users)
                // This tracks per-ticket cost for transparency
                const ticketNumber = await getTicketNumber(ticketId);

                await deductCredits(
                  orgId,
                  userId,
                  {
                    inputTokens: totalInputTokens || userMessage.tokens_used,
                    outputTokens: totalOutputTokens || Math.ceil(accumulatedContent.length / 4),
                    modelId: modelUsed,
                    provider: providerUsed,
                  },
                  {
                    conversationId: conversationId,
                    messageId: assistantMessage.id,
                    ticketId: ticketId,
                    ticketNumber: ticketNumber || undefined,
                  }
                );
              }

              break;
            }
          }
        } catch (error) {
          // Send error event
          const errorData = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Stream failed',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    // Return SSE response with conversation ID in header
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'X-Conversation-Id': conversation.id,
      },
    });

  } catch (error) {
    console.error('[Ticket Chat Stream] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to start stream' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
