/**
 * QUAD Context Categories - Phase 1 Keyword Matching
 *
 * Routes user questions to relevant schema/docs using keyword detection.
 * Falls back to embeddings (Phase 2) if no good match found.
 *
 * @example
 * const categories = matchCategories("How do I create a ticket?");
 * // Returns: ['tickets'] → loads QUAD_tickets schema + ticket docs
 */

// Category definitions with keywords, related tables, and documentation
export const QUAD_CONTEXT_CATEGORIES = {
  // Authentication & Users
  auth: {
    keywords: ['oauth', 'login', 'logout', 'signup', 'sign up', 'sign in', 'password', 'token', 'session', 'jwt', 'sso', 'google', 'github', 'authentication', 'verify', 'otp', 'magic link', 'email code'],
    tables: ['QUAD_users', 'QUAD_sessions', 'QUAD_email_verification_codes', 'QUAD_org_members'],
    docs: ['AUTHENTICATION_FLOW.md'],
    description: 'User authentication, OAuth, sessions, login/signup flows',
  },

  // Organizations
  organizations: {
    keywords: ['organization', 'org', 'company', 'team', 'workspace', 'tenant', 'billing', 'plan', 'subscription', 'member', 'invite'],
    tables: ['QUAD_organizations', 'QUAD_users', 'QUAD_org_members', 'QUAD_org_setup_status'],
    docs: ['QUAD_METHODOLOGY.md'],
    description: 'Organization management, team members, billing',
  },

  // Domains (QUAD Core)
  domains: {
    keywords: ['domain', 'project', 'product', 'initiative', 'business unit', 'department'],
    tables: ['QUAD_domains', 'QUAD_domain_members'],
    docs: ['QUAD_METHODOLOGY.md#domains'],
    description: 'QUAD domains - top-level organizational units',
  },

  // Flows (QUAD Core)
  flows: {
    keywords: ['flow', 'workflow', 'process', 'pipeline', 'stage', 'phase', 'step'],
    tables: ['QUAD_flows', 'QUAD_flow_stages'],
    docs: ['QUAD_METHODOLOGY.md#flows'],
    description: 'QUAD flows - work processes within domains',
  },

  // Circles (QUAD Core)
  circles: {
    keywords: ['circle', 'squad', 'team', 'group', 'pod', 'crew'],
    tables: ['QUAD_circles', 'QUAD_circle_members'],
    docs: ['QUAD_METHODOLOGY.md#circles'],
    description: 'QUAD circles - cross-functional teams',
  },

  // Tickets (QUAD Core)
  tickets: {
    keywords: ['ticket', 'task', 'issue', 'bug', 'feature', 'story', 'epic', 'backlog', 'sprint', 'todo', 'work item', 'card'],
    tables: ['QUAD_tickets', 'QUAD_ticket_comments', 'QUAD_ticket_attachments', 'QUAD_ticket_history'],
    docs: ['QUAD_METHODOLOGY.md#tickets'],
    description: 'QUAD tickets - work items and tasks',
  },

  // Cycles (QUAD Core)
  cycles: {
    keywords: ['cycle', 'sprint', 'iteration', 'release', 'milestone', 'roadmap', 'planning', 'retrospective', 'retro'],
    tables: ['QUAD_cycles', 'QUAD_cycle_tickets'],
    docs: ['QUAD_METHODOLOGY.md#cycles'],
    description: 'QUAD cycles - time-boxed work periods',
  },

  // AI & BYOK
  ai: {
    keywords: ['ai', 'artificial intelligence', 'llm', 'gpt', 'claude', 'gemini', 'openai', 'anthropic', 'byok', 'api key', 'model', 'token', 'context', 'prompt'],
    tables: ['QUAD_ai_configs', 'QUAD_byok_keys'],
    docs: ['AI_CONFIGURATION.md'],
    description: 'AI configuration, BYOK keys, model selection',
  },

  // Git & Pull Requests
  git: {
    keywords: ['git', 'github', 'gitlab', 'bitbucket', 'repository', 'repo', 'pull request', 'pr', 'merge', 'branch', 'commit', 'code review'],
    tables: ['QUAD_git_integrations', 'QUAD_pull_requests', 'QUAD_pr_reviews'],
    docs: ['GIT_INTEGRATION.md'],
    description: 'Git integration, pull requests, code review',
  },

  // Meetings & Calendar
  meetings: {
    keywords: ['meeting', 'calendar', 'schedule', 'call', 'standup', 'sync', 'google meet', 'zoom', 'teams', 'cal.com', 'invite', 'agenda'],
    tables: ['QUAD_meetings', 'QUAD_meeting_integrations', 'QUAD_meeting_action_items'],
    docs: ['MEETING_INTEGRATION.md'],
    description: 'Meeting scheduling, calendar integration',
  },

  // Roles & Permissions
  roles: {
    keywords: ['role', 'permission', 'access', 'admin', 'owner', 'developer', 'manager', 'qa', 'tester', 'lead', 'member'],
    tables: ['QUAD_roles', 'QUAD_core_roles', 'QUAD_users'],
    docs: ['ROLES_AND_PERMISSIONS.md'],
    description: 'User roles and permissions',
  },

  // Setup & Onboarding
  setup: {
    keywords: ['setup', 'onboarding', 'getting started', 'configure', 'install', 'first time', 'wizard', 'initial'],
    tables: ['QUAD_org_setup_status'],
    docs: ['GETTING_STARTED.md'],
    description: 'Initial setup and onboarding flow',
  },
} as const;

export type ContextCategory = keyof typeof QUAD_CONTEXT_CATEGORIES;

/**
 * Match user question to relevant context categories
 *
 * @param question - User's question or request
 * @returns Array of matched category names, sorted by relevance (most matches first)
 *
 * @example
 * matchCategories("How do I create a new ticket?")
 * // Returns: ['tickets']
 *
 * matchCategories("Add OAuth login for the team")
 * // Returns: ['auth', 'organizations']
 */
export function matchCategories(question: string): ContextCategory[] {
  const q = question.toLowerCase();

  const scores: { category: ContextCategory; score: number }[] = [];

  for (const [category, config] of Object.entries(QUAD_CONTEXT_CATEGORIES)) {
    const matchedKeywords = config.keywords.filter(kw => q.includes(kw.toLowerCase()));
    const score = matchedKeywords.length;

    if (score > 0) {
      scores.push({ category: category as ContextCategory, score });
    }
  }

  // Sort by score descending (most relevant first)
  scores.sort((a, b) => b.score - a.score);

  // Return category names
  return scores.map(s => s.category);
}

/**
 * Get context for matched categories
 *
 * @param categories - Array of category names from matchCategories()
 * @returns Object with tables and docs to include in AI context
 */
export function getCategoryContext(categories: ContextCategory[]): {
  tables: string[];
  docs: string[];
  descriptions: string[];
} {
  const tables = new Set<string>();
  const docs = new Set<string>();
  const descriptions: string[] = [];

  for (const category of categories) {
    const config = QUAD_CONTEXT_CATEGORIES[category];
    config.tables.forEach(t => tables.add(t));
    config.docs.forEach(d => docs.add(d));
    descriptions.push(`${category}: ${config.description}`);
  }

  return {
    tables: Array.from(tables),
    docs: Array.from(docs),
    descriptions,
  };
}

/**
 * Full context routing - from question to relevant context
 *
 * @param question - User's question
 * @param fallbackToAll - If true and no match, return all categories (for embeddings fallback)
 * @returns Context object with tables, docs, and matched categories
 *
 * @example
 * const context = routeToContext("How do I assign a ticket to a circle?");
 * // Returns: {
 * //   categories: ['tickets', 'circles'],
 * //   tables: ['QUAD_tickets', 'QUAD_circles', 'QUAD_circle_members'],
 * //   docs: ['QUAD_METHODOLOGY.md#tickets', 'QUAD_METHODOLOGY.md#circles'],
 * //   shouldUseFallback: false
 * // }
 */
export function routeToContext(question: string, fallbackToAll = false): {
  categories: ContextCategory[];
  tables: string[];
  docs: string[];
  descriptions: string[];
  shouldUseFallback: boolean;
} {
  const categories = matchCategories(question);

  // No match - either return all or signal fallback needed
  if (categories.length === 0) {
    if (fallbackToAll) {
      // Return all categories for embedding search
      const allCategories = Object.keys(QUAD_CONTEXT_CATEGORIES) as ContextCategory[];
      const context = getCategoryContext(allCategories);
      return {
        categories: allCategories,
        ...context,
        shouldUseFallback: true,
      };
    }

    // Signal that embeddings fallback should be used
    return {
      categories: [],
      tables: [],
      docs: [],
      descriptions: [],
      shouldUseFallback: true,
    };
  }

  const context = getCategoryContext(categories);
  return {
    categories,
    ...context,
    shouldUseFallback: false,
  };
}

// =============================================================================
// PHASE 2: Embeddings Fallback (to be implemented)
// =============================================================================

/**
 * PLACEHOLDER: Embedding-based context search
 *
 * When keyword matching fails or returns low confidence,
 * fall back to semantic search using embeddings.
 *
 * Implementation requires:
 * 1. pgvector extension in PostgreSQL
 * 2. QUAD_document_chunks table with embedding column
 * 3. OpenAI or similar embedding API
 *
 * @param question - User's question
 * @param topK - Number of most similar chunks to return
 * @returns Promise with relevant document chunks
 */
export async function searchByEmbedding(
  question: string,
  topK: number = 5
): Promise<{ content: string; similarity: number }[]> {
  // TODO: Phase 2 implementation
  // 1. Generate embedding for question using OpenAI/Anthropic API
  // 2. Query QUAD_document_chunks with vector similarity search
  // 3. Return top-K most similar chunks

  console.warn('Embeddings fallback not yet implemented - using keyword matching only');
  return [];
}

// =============================================================================
// COMPACTION: Conversation Summarization
// =============================================================================

/**
 * Compact conversation history to reduce token usage
 *
 * Strategy:
 * - Keep last N messages verbatim (recent context is important)
 * - Summarize older messages into a condensed summary
 * - Track token savings for analytics
 *
 * @param messages - Full conversation history
 * @param keepLastN - Number of recent messages to keep verbatim (default: 5)
 * @returns Compacted conversation with summary
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface CompactedConversation {
  summary: string | null;
  recentMessages: Message[];
  messagesSummarized: number;
  estimatedTokensSaved: number;
}

export function compactConversation(
  messages: Message[],
  keepLastN: number = 5
): CompactedConversation {
  if (messages.length <= keepLastN) {
    // No need to compact - conversation is small enough
    return {
      summary: null,
      recentMessages: messages,
      messagesSummarized: 0,
      estimatedTokensSaved: 0,
    };
  }

  const olderMessages = messages.slice(0, -keepLastN);
  const recentMessages = messages.slice(-keepLastN);

  // Simple summary: extract key points from older messages
  // In production, use AI to generate better summaries
  const keyPoints = olderMessages
    .filter(m => m.role === 'user')
    .map(m => m.content.slice(0, 100)) // First 100 chars of each user message
    .join('; ');

  const summary = `Previous conversation summary: ${keyPoints}...`;

  // Estimate tokens saved (rough: 4 chars = 1 token)
  const originalTokens = olderMessages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);
  const summaryTokens = Math.ceil(summary.length / 4);
  const tokensSaved = Math.max(0, originalTokens - summaryTokens);

  return {
    summary,
    recentMessages,
    messagesSummarized: olderMessages.length,
    estimatedTokensSaved: tokensSaved,
  };
}

// =============================================================================
// USAGE EXAMPLE
// =============================================================================

/*
// In your API route or service:

import { routeToContext, compactConversation, Message } from '@/lib/ai/context-categories';

async function handleAIRequest(question: string, conversationHistory: Message[]) {
  // Step 1: Route question to relevant context
  const context = routeToContext(question);

  if (context.shouldUseFallback) {
    // No good keyword match - could use embeddings here
    console.log('No keyword match, consider embeddings fallback');
  }

  // Step 2: Compact conversation if too long
  const compacted = compactConversation(conversationHistory, 5);

  // Step 3: Build prompt with only relevant context
  const systemPrompt = `
You are QUAD AI assistant.

RELEVANT CONTEXT (${context.categories.join(', ')}):
Tables: ${context.tables.join(', ')}
Docs: ${context.docs.join(', ')}

${context.descriptions.join('\n')}

${compacted.summary ? `PREVIOUS CONVERSATION: ${compacted.summary}` : ''}
`;

  // Step 4: Send to AI with reduced token usage
  // ... your AI API call here
}
*/
