/**
 * POST /api/ai/chat
 *
 * QUAD AI Chat endpoint with smart context routing.
 * Uses keyword matching to send only relevant schema/docs to AI.
 *
 * Features:
 * - Keyword-based context routing (Phase 1)
 * - Codebase index for token optimization (500 tokens vs 50K+)
 * - Conversation compaction for long chats
 * - BYOK support (user's own API keys)
 * - Falls back to embeddings if no keyword match (Phase 2 - TODO)
 */

import { NextRequest, NextResponse } from 'next/server';
import { routeToContext, compactConversation, Message, ContextCategory } from '@/lib/ai/context-categories';
import { getCodebaseIndex, formatIndexForAI } from '@/lib/ai/codebase-indexer';
import { callAI, AIMessage } from '@/lib/ai/providers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Environment check for AI providers
const USE_REAL_AI = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;

// Schema definitions for context injection
const SCHEMA_DEFINITIONS: Record<string, string> = {
  QUAD_tickets: `
CREATE TABLE "QUAD_tickets" (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  domain_id UUID,
  flow_id UUID,
  circle_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'backlog',
  priority VARCHAR(20) DEFAULT 'medium',
  assignee_id UUID,
  reporter_id UUID,
  story_points INTEGER,
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`,
  QUAD_users: `
CREATE TABLE "QUAD_users" (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'DEVELOPER',
  full_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`,
  QUAD_domains: `
CREATE TABLE "QUAD_domains" (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  domain_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`,
  QUAD_flows: `
CREATE TABLE "QUAD_flows" (
  id UUID PRIMARY KEY,
  domain_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  flow_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);`,
  QUAD_circles: `
CREATE TABLE "QUAD_circles" (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  lead_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);`,
  QUAD_cycles: `
CREATE TABLE "QUAD_cycles" (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'planning',
  goals TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);`,
  QUAD_organizations: `
CREATE TABLE "QUAD_organizations" (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  admin_email VARCHAR(255) NOT NULL,
  size VARCHAR(50),
  industry VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);`,
  QUAD_sessions: `
CREATE TABLE "QUAD_sessions" (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);`,
  QUAD_ai_configs: `
CREATE TABLE "QUAD_ai_configs" (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL UNIQUE,
  ai_tier VARCHAR(50) DEFAULT 'turbo',
  custom_model_id VARCHAR(100),
  max_tokens_per_request INTEGER DEFAULT 4000,
  features_enabled JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);`,
  QUAD_byok_keys: `
CREATE TABLE "QUAD_byok_keys" (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL,
  encrypted_key TEXT NOT NULL,
  key_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);`,
};

// Build context string from matched categories
function buildContextString(
  tables: string[],
  categories: ContextCategory[],
  codebaseContext?: string
): string {
  const schemaContext = tables
    .filter(t => SCHEMA_DEFINITIONS[t])
    .map(t => `-- ${t}\n${SCHEMA_DEFINITIONS[t]}`)
    .join('\n\n');

  // If we have a codebase index, use that for broader context
  const codebaseSection = codebaseContext
    ? `\n### Codebase Overview (from index):\n${codebaseContext}\n`
    : '';

  return `
## QUAD Framework Context

You are helping with the QUAD project management methodology.
Matched categories: ${categories.join(', ')}

### Relevant Database Schema:
${schemaContext || 'No specific schema context needed.'}
${codebaseSection}
### Key Concepts:
- **Domains**: Top-level organizational units (products, projects)
- **Flows**: Work processes within domains (feature dev, bug fix, etc.)
- **Circles**: Cross-functional teams that work on tickets
- **Tickets**: Individual work items with status, priority, assignee
- **Cycles**: Time-boxed sprints for planning and delivery
`;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Step 1: Route question to relevant context using keywords
    const context = routeToContext(message);

    console.log(`[AI Chat] User: ${user.email}`);
    console.log(`[AI Chat] Question: ${message.slice(0, 100)}...`);
    console.log(`[AI Chat] Matched categories: ${context.categories.join(', ') || 'none'}`);
    console.log(`[AI Chat] Tables: ${context.tables.join(', ') || 'none'}`);

    // Step 2: Check if we should use embeddings fallback
    if (context.shouldUseFallback) {
      console.log('[AI Chat] No keyword match - would use embeddings in Phase 2');
      // For now, proceed with general context
    }

    // Step 3: Compact conversation history if too long
    const messages: Message[] = conversationHistory.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));
    const compacted = compactConversation(messages, 5);

    if (compacted.messagesSummarized > 0) {
      console.log(`[AI Chat] Compacted ${compacted.messagesSummarized} messages, saved ~${compacted.estimatedTokensSaved} tokens`);
    }

    // Step 4: Fetch codebase index for broader context (token-optimized)
    let codebaseContext: string | undefined;
    let indexTokens = 0;
    try {
      const codebaseIndex = await getCodebaseIndex(user.companyId, 'quadframework');
      if (codebaseIndex) {
        codebaseContext = formatIndexForAI(codebaseIndex);
        indexTokens = Math.ceil(codebaseContext.length / 4);
        console.log(`[AI Chat] Using codebase index (~${indexTokens} tokens)`);
      }
    } catch {
      console.log('[AI Chat] No codebase index available');
    }

    // Step 5: Build system prompt with only relevant context
    const contextString = buildContextString(context.tables, context.categories, codebaseContext);

    const systemPrompt = `You are QUAD AI, an intelligent assistant for the QUAD project management framework.

${contextString}

${compacted.summary ? `## Previous Conversation Summary:\n${compacted.summary}\n` : ''}

## Instructions:
- Answer questions about QUAD methodology, tickets, domains, flows, circles, and cycles
- When asked to create something, provide the specific API call or database operation needed
- Be concise and actionable
- If the question is outside QUAD scope, politely redirect to QUAD-related help
`;

    // Step 6: Get AI configuration for this org
    const aiConfig = await prisma.qUAD_ai_configs.findUnique({
      where: { org_id: user.companyId },
    });

    // Check if org has custom API keys configured (BYOK)
    // Keys are stored as vault references: openai_key_ref, anthropic_key_ref, etc.
    const hasCustomKeys = !!(aiConfig?.anthropic_key_ref || aiConfig?.openai_key_ref);

    // Step 7: Build messages array for AI
    const aiMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...compacted.recentMessages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      })),
      { role: 'user', content: message },
    ];

    // Step 8: Call AI provider (real or mock)
    let responseMessage: string;
    let usage = {
      promptTokens: Math.ceil(systemPrompt.length / 4),
      completionTokens: 100,
      totalTokens: Math.ceil(systemPrompt.length / 4) + 100,
    };
    let provider = 'mock';
    let model = 'mock';
    let latencyMs = 0;

    if (USE_REAL_AI) {
      try {
        // Use real AI provider
        const aiResponse = await callAI(user.companyId, aiMessages, {
          activityType: 'general_chat',
        });

        responseMessage = aiResponse.content;
        usage = {
          promptTokens: aiResponse.usage.inputTokens,
          completionTokens: aiResponse.usage.outputTokens,
          totalTokens: aiResponse.usage.totalTokens,
        };
        provider = 'claude'; // or detect from response
        model = aiResponse.model;
        latencyMs = aiResponse.latencyMs;

        console.log(`[AI Chat] Real AI response in ${latencyMs}ms, tokens: ${usage.totalTokens}`);
      } catch (aiError) {
        console.error('[AI Chat] AI provider error, falling back to mock:', aiError);
        responseMessage = generateMockResponse(message, context.categories);
      }
    } else {
      // Use mock response (no API keys configured)
      console.log('[AI Chat] No API keys configured, using mock response');
      responseMessage = generateMockResponse(message, context.categories);
    }

    const response = {
      success: true,
      data: {
        message: responseMessage,
        context: {
          categories: context.categories,
          tables: context.tables,
          tokensSaved: compacted.estimatedTokensSaved,
          usedFallback: context.shouldUseFallback,
          usedCodebaseIndex: !!codebaseContext,
          codebaseIndexTokens: indexTokens,
        },
        usage,
        provider,
        model,
        latencyMs,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}

// Mock response generator (replace with actual AI call)
function generateMockResponse(question: string, categories: ContextCategory[]): string {
  const q = question.toLowerCase();

  if (categories.includes('tickets')) {
    if (q.includes('create')) {
      return `To create a ticket, use the POST /api/tickets endpoint:

\`\`\`json
{
  "title": "Your ticket title",
  "description": "Detailed description",
  "priority": "medium",
  "status": "backlog",
  "domain_id": "uuid-of-domain",
  "assignee_id": "uuid-of-assignee"
}
\`\`\`

The ticket will be created with a unique ID and timestamps.`;
    }
    return `Tickets in QUAD are work items that belong to domains and can be assigned to circles. They have status (backlog, in_progress, review, done), priority (low, medium, high, critical), and can be linked to cycles for sprint planning.`;
  }

  if (categories.includes('auth')) {
    return `QUAD authentication uses JWT tokens. Users can sign up via OAuth (Google/GitHub) or email/OTP. Sessions are tracked in QUAD_sessions table. Tokens expire after 24 hours.`;
  }

  if (categories.includes('domains')) {
    return `Domains are top-level organizational units in QUAD. They represent products, projects, or business areas. Each domain can have multiple flows (workflows) and be worked on by multiple circles (teams).`;
  }

  if (categories.length === 0) {
    return `I understand you're asking about "${question.slice(0, 50)}...".

This seems to be a general question. In QUAD, I can help you with:
- **Tickets**: Creating, managing, and tracking work items
- **Domains**: Organizing projects and products
- **Flows**: Setting up workflows
- **Circles**: Managing teams
- **Cycles**: Sprint planning

What would you like to know more about?`;
  }

  return `Based on your question about ${categories.join(' and ')}, here's what you need to know...

[This is a mock response. In production, this would be replaced with actual AI-generated content using Claude, GPT, or other LLM providers configured via BYOK.]`;
}
