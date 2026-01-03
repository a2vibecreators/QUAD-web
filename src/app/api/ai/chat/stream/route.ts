/**
 * POST /api/ai/chat/stream
 *
 * Streaming AI chat endpoint using Server-Sent Events (SSE).
 * Returns AI response word-by-word in real-time.
 *
 * Response format (SSE):
 *   data: {"type":"text","content":"Hello"}
 *   data: {"type":"text","content":" world"}
 *   data: {"type":"done","usage":{"inputTokens":100,"outputTokens":50}}
 */

import { NextRequest } from 'next/server';
import { routeToContext, compactConversation, Message } from '@/lib/ai/context-categories';
import { getCodebaseIndex, formatIndexForAI } from '@/lib/ai/codebase-indexer';
import { streamAI, AIMessage } from '@/lib/ai/providers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Schema definitions (simplified for streaming context)
const SCHEMA_DEFINITIONS: Record<string, string> = {
  QUAD_tickets: 'Tickets table with id, title, description, status, priority, assignee_id',
  QUAD_users: 'Users table with id, email, role, full_name',
  QUAD_domains: 'Domains table with id, name, description, domain_type',
  QUAD_flows: 'Flows table with id, domain_id, name, flow_type',
  QUAD_circles: 'Circles table with id, name, lead_id',
  QUAD_cycles: 'Cycles table with id, name, start_date, end_date, status',
};

function buildContextString(tables: string[]): string {
  const schemaContext = tables
    .filter(t => SCHEMA_DEFINITIONS[t])
    .map(t => `- ${t}: ${SCHEMA_DEFINITIONS[t]}`)
    .join('\n');

  return schemaContext || 'General QUAD methodology context';
}

export async function POST(request: NextRequest) {
  // Verify authentication
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const user = verifyToken(token);
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Invalid token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Route to context
    const context = routeToContext(message);

    // Compact conversation history
    const messages: Message[] = conversationHistory.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));
    const compacted = compactConversation(messages, 5);

    // Get codebase index if available
    let codebaseContext = '';
    try {
      const codebaseIndex = await getCodebaseIndex(user.companyId, 'quadframework');
      if (codebaseIndex) {
        codebaseContext = formatIndexForAI(codebaseIndex);
      }
    } catch {
      // No codebase index available
    }

    // Build system prompt
    const contextString = buildContextString(context.tables);
    const systemPrompt = `You are QUAD AI, an intelligent assistant for the QUAD project management framework.

## Context
${contextString}
${codebaseContext ? `\n## Codebase Overview\n${codebaseContext}` : ''}
${compacted.summary ? `\n## Previous Conversation Summary\n${compacted.summary}` : ''}

## Instructions
- Answer questions about QUAD methodology, tickets, domains, flows, circles, and cycles
- Be concise and actionable
- Use markdown for formatting`;

    // Build messages array
    const aiMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...compacted.recentMessages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      })),
      { role: 'user', content: message },
    ];

    // Create SSE stream
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream from AI provider
          for await (const chunk of streamAI(user.companyId, aiMessages, {
            activityType: 'general_chat',
          })) {
            // Format as SSE
            const data = JSON.stringify(chunk);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));

            // If done, close stream
            if (chunk.type === 'done' || chunk.type === 'error') {
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

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });

  } catch (error) {
    console.error('[AI Chat Stream] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to start stream' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
