/**
 * QUAD Framework - Claude Cache Manager
 *
 * Manages prompt caching strategies for optimal token savings.
 * Claude's prompt caching: 90% savings on cached input tokens.
 *
 * Cache TTL: 5 minutes (Anthropic default)
 * Minimum cacheable: 1024 tokens (Haiku), 2048 tokens (Sonnet/Opus)
 */

// =============================================================================
// CACHE KEY TYPES
// =============================================================================

export type CacheKeyType =
  | 'system_prompt'      // QUAD system instructions
  | 'org_context'        // Organization-specific context
  | 'codebase_summary'   // Project codebase overview
  | 'file_content'       // Specific file content
  | 'conversation';      // Conversation history summary

export interface CacheEntry {
  key: string;
  type: CacheKeyType;
  content: string;
  tokenCount: number;
  createdAt: Date;
  lastUsed: Date;
  hitCount: number;
}

export interface CacheStats {
  totalEntries: number;
  totalTokensCached: number;
  estimatedSavings: number;   // USD saved via caching
  hitRate: number;            // Percentage
  byType: Record<CacheKeyType, { count: number; tokens: number }>;
}

// =============================================================================
// CACHE MANAGER
// =============================================================================

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes (Anthropic cache TTL)
const MIN_CACHE_TOKENS_HAIKU = 1024;
const MIN_CACHE_TOKENS_SONNET = 2048;

class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    totalSaved: 0, // USD
  };

  // ===========================================================================
  // CACHE KEY GENERATION
  // ===========================================================================

  /**
   * Generate cache key for system prompt
   */
  systemPromptKey(organizationId: string): string {
    return `sys:${organizationId}`;
  }

  /**
   * Generate cache key for organization context
   */
  orgContextKey(organizationId: string): string {
    return `org:${organizationId}`;
  }

  /**
   * Generate cache key for codebase summary
   */
  codebaseSummaryKey(organizationId: string, repoId: string): string {
    return `code:${organizationId}:${repoId}`;
  }

  /**
   * Generate cache key for file content
   */
  fileContentKey(organizationId: string, filePath: string, hash: string): string {
    return `file:${organizationId}:${filePath}:${hash}`;
  }

  /**
   * Generate cache key for conversation summary
   */
  conversationKey(userId: string, sessionId: string): string {
    return `conv:${userId}:${sessionId}`;
  }

  // ===========================================================================
  // CACHE OPERATIONS
  // ===========================================================================

  /**
   * Check if content should be cached (meets minimum token threshold)
   */
  shouldCache(tokenCount: number, isHaiku: boolean = false): boolean {
    const minTokens = isHaiku ? MIN_CACHE_TOKENS_HAIKU : MIN_CACHE_TOKENS_SONNET;
    return tokenCount >= minTokens;
  }

  /**
   * Set cache entry
   */
  set(
    key: string,
    type: CacheKeyType,
    content: string,
    tokenCount: number
  ): void {
    const entry: CacheEntry = {
      key,
      type,
      content,
      tokenCount,
      createdAt: new Date(),
      lastUsed: new Date(),
      hitCount: 0,
    };

    this.cache.set(key, entry);
  }

  /**
   * Get cache entry if still valid
   */
  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    const now = new Date().getTime();
    const age = now - entry.createdAt.getTime();

    if (age > CACHE_TTL_MS) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update stats
    entry.lastUsed = new Date();
    entry.hitCount++;
    this.stats.hits++;

    return entry;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, totalSaved: 0 };
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    const now = new Date().getTime();
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.createdAt.getTime();
      if (age > CACHE_TTL_MS) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  // ===========================================================================
  // CACHE STATISTICS
  // ===========================================================================

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const byType: CacheStats['byType'] = {
      system_prompt: { count: 0, tokens: 0 },
      org_context: { count: 0, tokens: 0 },
      codebase_summary: { count: 0, tokens: 0 },
      file_content: { count: 0, tokens: 0 },
      conversation: { count: 0, tokens: 0 },
    };

    let totalTokens = 0;

    for (const entry of this.cache.values()) {
      byType[entry.type].count++;
      byType[entry.type].tokens += entry.tokenCount;
      totalTokens += entry.tokenCount;
    }

    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    return {
      totalEntries: this.cache.size,
      totalTokensCached: totalTokens,
      estimatedSavings: this.stats.totalSaved,
      hitRate,
      byType,
    };
  }

  /**
   * Record cost savings from cache hit
   * @param tokensSaved - Number of tokens that were cached
   * @param pricePerMToken - Price per million tokens for the model
   */
  recordSavings(tokensSaved: number, pricePerMToken: number): void {
    // Cache saves 90% of input cost
    const normalCost = (tokensSaved / 1_000_000) * pricePerMToken;
    const cachedCost = (tokensSaved / 1_000_000) * pricePerMToken * 0.1;
    const saved = normalCost - cachedCost;

    this.stats.totalSaved += saved;
  }
}

// =============================================================================
// CACHE CONTENT BUILDERS
// =============================================================================

/**
 * Build standard QUAD system prompt (cacheable)
 */
export function buildQUADSystemPrompt(orgName?: string): string {
  return `You are QUAD, an AI assistant integrated into the QUAD project management platform.

## Your Role
- Help developers with coding tasks, code reviews, and debugging
- Generate tickets from meeting transcripts and requirements
- Provide architectural guidance and best practices
- Always follow the human-in-the-loop principle - suggest, don't auto-execute

## Organization Context
${orgName ? `You are working with: ${orgName}` : 'No organization context provided.'}

## Response Guidelines
- Be concise and actionable
- Include code examples when helpful
- Flag potential security or performance issues
- When creating tickets, include: title, description, priority, estimated effort

## QUAD Terminology
- Ticket: A work item (similar to Jira story)
- Domain: A project or product area
- Core Role: Predefined role template (e.g., Backend Developer, QA Lead)
- Human-in-the-loop: AI suggests, human approves`;
}

/**
 * Build organization context (cacheable)
 */
export function buildOrgContext(org: {
  name: string;
  description?: string;
  techStack?: string[];
  conventions?: string[];
}): string {
  const lines = [
    `## Organization: ${org.name}`,
    '',
  ];

  if (org.description) {
    lines.push(`Description: ${org.description}`, '');
  }

  if (org.techStack && org.techStack.length > 0) {
    lines.push('Tech Stack:', ...org.techStack.map((t) => `- ${t}`), '');
  }

  if (org.conventions && org.conventions.length > 0) {
    lines.push('Coding Conventions:', ...org.conventions.map((c) => `- ${c}`), '');
  }

  return lines.join('\n');
}

/**
 * Build codebase summary (cacheable)
 */
export function buildCodebaseSummary(summary: {
  projectName: string;
  language: string;
  framework?: string;
  structure: Array<{ path: string; description: string }>;
}): string {
  const lines = [
    `## Codebase: ${summary.projectName}`,
    `Language: ${summary.language}`,
    summary.framework ? `Framework: ${summary.framework}` : '',
    '',
    'Project Structure:',
    ...summary.structure.map((s) => `- ${s.path}: ${s.description}`),
  ];

  return lines.filter(Boolean).join('\n');
}

/**
 * Compress conversation history for caching
 */
export function compressConversation(
  messages: Array<{ role: string; content: string }>
): string {
  // Extract key points from conversation
  const keyPoints: string[] = [];
  let currentTopic = '';

  for (const msg of messages) {
    if (msg.role === 'user') {
      // Extract topic from user message
      const firstSentence = msg.content.split(/[.!?]/)[0];
      if (firstSentence.length < 100) {
        currentTopic = firstSentence;
      }
    } else if (msg.role === 'assistant') {
      // Extract key decisions/conclusions
      if (msg.content.includes('I recommend') || msg.content.includes('I suggest')) {
        const match = msg.content.match(/I (?:recommend|suggest)[^.]+\./);
        if (match) {
          keyPoints.push(`- ${currentTopic}: ${match[0]}`);
        }
      }
    }
  }

  if (keyPoints.length === 0) {
    return 'Previous conversation: General discussion, no specific decisions recorded.';
  }

  return [
    'Previous conversation summary:',
    ...keyPoints,
  ].join('\n');
}

// =============================================================================
// SINGLETON & EXPORTS
// =============================================================================

export const cacheManager = new CacheManager();

export { CacheManager };
