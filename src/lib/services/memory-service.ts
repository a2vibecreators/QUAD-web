/**
 * QUAD Memory Service - Intelligent hierarchical context management
 *
 * Core Philosophy:
 * - Send MINIMAL context initially (smart keyword matching)
 * - Learn from what AI requests (track missing puzzle pieces)
 * - Iteratively enhance context when needed
 * - Track what works to improve over time
 *
 * Goal: 1-100 HTTP calls per ticket, not 1000+ token dumps
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Token estimation (rough: 1 token ≈ 4 characters)
const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

// Memory levels in hierarchy order
const MEMORY_LEVELS = ['org', 'domain', 'project', 'circle', 'user'] as const;
type MemoryLevel = typeof MEMORY_LEVELS[number];

// Context session types
type SessionType = 'ticket_analysis' | 'code_review' | 'meeting_summary' | 'chat' | 'test_generation';

// Request types when AI needs more
type RequestType = 'code_snippet' | 'schema' | 'file_content' | 'api_endpoint' | 'business_logic' | 'clarification';

interface RetrievalContext {
  orgId: string;
  domainId?: string;
  projectId?: string;
  circleId?: string;
  userId: string;
  sessionType: SessionType;
  triggerEntityType?: 'ticket' | 'pr' | 'meeting' | 'general';
  triggerEntityId?: string;
}

interface ContextChunk {
  chunkId: string;
  content: string;
  section: string;
  level: MemoryLevel;
  importance: number;
  tokenCount: number;
  keywords: string[];
}

interface RetrievalResult {
  sessionId: string;
  chunks: ContextChunk[];
  totalTokens: number;
  hierarchyIncluded: MemoryLevel[];
  keywordsMatched: string[];
}

interface IterativeRequest {
  sessionId: string;
  aiRequestText: string;
  requestType: RequestType;
  keywords?: string[];
}

interface IterativeResponse {
  additionalChunks: ContextChunk[];
  totalNewTokens: number;
  wasFound: boolean;
  suggestion?: string;
}

// =============================================================================
// MAIN MEMORY SERVICE
// =============================================================================

/**
 * Get initial context for an AI session
 * Uses keyword matching + importance scoring to send minimal but sufficient context
 */
export async function getInitialContext(
  context: RetrievalContext,
  keywords: string[],
  maxTokens: number = 4000
): Promise<RetrievalResult> {
  const { orgId, domainId, projectId, circleId, userId, sessionType, triggerEntityType, triggerEntityId } = context;

  // Step 1: Get all applicable memory documents (hierarchical)
  const documents = await getHierarchicalDocuments(orgId, domainId, projectId, circleId, userId);

  // Step 2: Get chunks that match keywords OR have high importance
  const matchedChunks = await getMatchingChunks(
    documents.map(d => d.id),
    keywords,
    maxTokens
  );

  // Step 3: Apply context rules (org-specific overrides)
  const ruledChunks = await applyContextRules(orgId, sessionType, keywords, matchedChunks);

  // Step 4: Create context session for tracking
  const session = await prisma.qUAD_context_sessions.create({
    data: {
      org_id: orgId,
      user_id: userId,
      session_type: sessionType,
      trigger_entity_type: triggerEntityType,
      trigger_entity_id: triggerEntityId,
      context_sent: {
        initial: ruledChunks.map(c => c.chunkId),
        keywords_searched: keywords,
        iterations: [],
      },
      initial_context_tokens: ruledChunks.reduce((sum, c) => sum + c.tokenCount, 0),
      total_context_tokens: ruledChunks.reduce((sum, c) => sum + c.tokenCount, 0),
    },
  });

  // Step 5: Update chunk retrieval stats
  await updateChunkStats(ruledChunks.map(c => c.chunkId), 'retrieved');

  return {
    sessionId: session.id,
    chunks: ruledChunks,
    totalTokens: ruledChunks.reduce((sum, c) => sum + c.tokenCount, 0),
    hierarchyIncluded: [...new Set(ruledChunks.map(c => c.level))] as MemoryLevel[],
    keywordsMatched: [...new Set(ruledChunks.flatMap(c => c.keywords.filter(k => keywords.includes(k.toLowerCase()))))],
  };
}

/**
 * Handle iterative context request - when AI says "I need more info"
 * This is the "puzzle piece" logic
 */
export async function handleIterativeRequest(
  request: IterativeRequest
): Promise<IterativeResponse> {
  const { sessionId, aiRequestText, requestType, keywords: providedKeywords } = request;

  // Step 1: Get session to know what we already sent
  const session = await prisma.qUAD_context_sessions.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  const contextSent = session.context_sent as { initial: string[]; iterations: { chunks_sent: string[] }[] };
  const alreadySentChunkIds = [
    ...contextSent.initial,
    ...contextSent.iterations.flatMap(i => i.chunks_sent || []),
  ];

  // Step 2: Parse AI's request to extract keywords
  const extractedKeywords = providedKeywords || extractKeywordsFromRequest(aiRequestText);

  // Step 3: Find chunks that match but weren't already sent
  const allDocuments = await prisma.qUAD_memory_documents.findMany({
    where: { org_id: session.org_id, is_active: true },
    select: { id: true },
  });

  const newChunks = await getMatchingChunks(
    allDocuments.map(d => d.id),
    extractedKeywords,
    2000, // Smaller token limit for iterative
    alreadySentChunkIds
  );

  // Step 4: Record this context request
  await prisma.qUAD_context_requests.create({
    data: {
      session_id: sessionId,
      iteration_number: contextSent.iterations.length + 1,
      request_type: requestType,
      ai_request_text: aiRequestText,
      parsed_request: { keywords: extractedKeywords, type: requestType },
      response_chunks: newChunks.map(c => c.chunkId),
      response_tokens: newChunks.reduce((sum, c) => sum + c.tokenCount, 0),
      was_sufficient: newChunks.length > 0,
      missing_category: newChunks.length === 0 ? requestType : null,
    },
  });

  // Step 5: Update session with new iteration
  await prisma.qUAD_context_sessions.update({
    where: { id: sessionId },
    data: {
      iteration_count: { increment: 1 },
      total_context_tokens: { increment: newChunks.reduce((sum, c) => sum + c.tokenCount, 0) },
      context_sent: {
        ...contextSent,
        iterations: [
          ...contextSent.iterations,
          {
            request: aiRequestText,
            keywords: extractedKeywords,
            chunks_sent: newChunks.map(c => c.chunkId),
          },
        ],
      },
    },
  });

  // Step 6: Update chunk stats
  if (newChunks.length > 0) {
    await updateChunkStats(newChunks.map(c => c.chunkId), 'retrieved');
    // Mark previous chunks as "insufficient" since AI needed more
    await updateChunkStats(alreadySentChunkIds, 'insufficient');
  }

  return {
    additionalChunks: newChunks,
    totalNewTokens: newChunks.reduce((sum, c) => sum + c.tokenCount, 0),
    wasFound: newChunks.length > 0,
    suggestion: newChunks.length === 0
      ? `Could not find information about: ${extractedKeywords.join(', ')}. Consider adding this to memory.`
      : undefined,
  };
}

/**
 * Mark session as complete and record success/failure
 * This feeds back into the learning system
 */
export async function completeSession(
  sessionId: string,
  wasSuccessful: boolean,
  notes?: string
): Promise<void> {
  const session = await prisma.qUAD_context_sessions.findUnique({
    where: { id: sessionId },
  });

  if (!session) return;

  const contextSent = session.context_sent as { initial: string[] };

  await prisma.qUAD_context_sessions.update({
    where: { id: sessionId },
    data: {
      completed_at: new Date(),
      was_successful: wasSuccessful,
      success_notes: wasSuccessful ? notes : null,
      failure_notes: !wasSuccessful ? notes : null,
    },
  });

  // Update chunk helpfulness based on outcome
  if (wasSuccessful && session.iteration_count === 1) {
    // Initial context was sufficient - mark all initial chunks as helpful
    await updateChunkStats(contextSent.initial, 'helpful');
  }
}

// =============================================================================
// MEMORY DOCUMENT MANAGEMENT
// =============================================================================

/**
 * Create or update a memory document
 */
export async function upsertMemoryDocument(
  orgId: string,
  level: MemoryLevel,
  levelEntityId: string | null,
  title: string,
  content: string,
  updatedBy: string
): Promise<string> {
  const documentKey = generateDocumentKey(level, orgId, levelEntityId);
  const contentHash = crypto.createHash('sha256').update(content).digest('hex');
  const wordCount = content.split(/\s+/).length;
  const tokenEstimate = estimateTokens(content);

  // Parse sections from markdown
  const sections = parseSectionsFromMarkdown(content);

  const entityId = levelEntityId || '_global_'; // Use placeholder for null entity IDs

  const doc = await prisma.qUAD_memory_documents.upsert({
    where: {
      org_id_memory_level_level_entity_id: {
        org_id: orgId,
        memory_level: level,
        level_entity_id: entityId,
      },
    },
    create: {
      org_id: orgId,
      memory_level: level,
      level_entity_id: entityId,
      document_key: documentKey,
      title,
      content,
      content_hash: contentHash,
      word_count: wordCount,
      token_estimate: tokenEstimate,
      sections,
      last_updated_by: updatedBy,
    },
    update: {
      title,
      content,
      content_hash: contentHash,
      word_count: wordCount,
      token_estimate: tokenEstimate,
      sections,
      last_updated_by: updatedBy,
      version: { increment: 1 },
      updated_at: new Date(),
    },
  });

  // Re-chunk the document
  await rechunkDocument(doc.id, content, sections);

  return doc.id;
}

/**
 * Generate initial memory from template for a new org/domain/project
 */
export async function initializeMemoryFromTemplate(
  orgId: string,
  level: MemoryLevel,
  levelEntityId: string | null,
  templateType: string = 'default',
  placeholders: Record<string, string>,
  createdBy: string
): Promise<string> {
  // Get template
  const template = await prisma.qUAD_memory_templates.findFirst({
    where: {
      memory_level: level,
      template_type: templateType,
      is_active: true,
    },
    orderBy: { is_default: 'desc' },
  });

  if (!template) {
    // Create minimal memory if no template
    const minimalContent = `# ${placeholders.name || 'Memory'}\n\n*This memory will be populated as the system learns about this ${level}.*\n`;
    return upsertMemoryDocument(orgId, level, levelEntityId, `${placeholders.name || level} Memory`, minimalContent, createdBy);
  }

  // Replace placeholders in template
  let content = template.content_template;
  for (const [key, value] of Object.entries(placeholders)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  // Update template usage
  await prisma.qUAD_memory_templates.update({
    where: { id: template.id },
    data: { times_used: { increment: 1 } },
  });

  return upsertMemoryDocument(
    orgId,
    level,
    levelEntityId,
    `${placeholders.name || level} Memory`,
    content,
    createdBy
  );
}

/**
 * Queue a memory update from an event (ticket closed, meeting completed, etc.)
 */
export async function queueMemoryUpdate(
  orgId: string,
  sourceType: 'ticket_closed' | 'meeting_completed' | 'pr_merged' | 'decision_made',
  sourceEntityId: string,
  targetLevel: MemoryLevel,
  updateType: 'append' | 'update_section' | 'regenerate',
  content?: string,
  sectionId?: string,
  keywords?: string[]
): Promise<void> {
  await prisma.qUAD_memory_update_queue.create({
    data: {
      org_id: orgId,
      source_type: sourceType,
      source_entity_id: sourceEntityId,
      target_memory_level: targetLevel,
      update_type: updateType,
      section_id: sectionId,
      content_to_add: content,
      keywords_found: keywords || [],
      priority: updateType === 'regenerate' ? 80 : 50,
    },
  });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all memory documents in the hierarchy (org → domain → project → circle → user)
 */
async function getHierarchicalDocuments(
  orgId: string,
  domainId?: string,
  projectId?: string,
  circleId?: string,
  userId?: string
): Promise<{ id: string; level: MemoryLevel; token_estimate: number }[]> {
  const conditions: { memory_level: MemoryLevel; level_entity_id: string | null }[] = [
    { memory_level: 'org', level_entity_id: null },
  ];

  if (domainId) {
    conditions.push({ memory_level: 'domain', level_entity_id: domainId });
  }
  if (projectId) {
    conditions.push({ memory_level: 'project', level_entity_id: projectId });
  }
  if (circleId) {
    conditions.push({ memory_level: 'circle', level_entity_id: circleId });
  }
  if (userId) {
    conditions.push({ memory_level: 'user', level_entity_id: userId });
  }

  const documents = await prisma.qUAD_memory_documents.findMany({
    where: {
      org_id: orgId,
      is_active: true,
      OR: conditions,
    },
    select: {
      id: true,
      memory_level: true,
      token_estimate: true,
    },
    orderBy: [
      // Order by hierarchy level
      { memory_level: 'asc' },
    ],
  });

  return documents.map(d => ({
    id: d.id,
    level: d.memory_level as MemoryLevel,
    token_estimate: d.token_estimate,
  }));
}

/**
 * Get chunks that match keywords, prioritizing by importance and match quality
 */
async function getMatchingChunks(
  documentIds: string[],
  keywords: string[],
  maxTokens: number,
  excludeChunkIds: string[] = []
): Promise<ContextChunk[]> {
  if (documentIds.length === 0 || keywords.length === 0) {
    return [];
  }

  // First, get keyword matches
  const keywordMatches = await prisma.qUAD_memory_keywords.findMany({
    where: {
      keyword: { in: keywords.map(k => k.toLowerCase()), mode: 'insensitive' },
      chunk_id: { notIn: excludeChunkIds },
    },
    select: {
      chunk_id: true,
      keyword: true,
      importance: true,
    },
  });

  // Group by chunk_id and calculate match score
  const chunkScores: Record<string, { matchCount: number; totalImportance: number; keywords: string[] }> = {};
  for (const match of keywordMatches) {
    if (!chunkScores[match.chunk_id]) {
      chunkScores[match.chunk_id] = { matchCount: 0, totalImportance: 0, keywords: [] };
    }
    chunkScores[match.chunk_id].matchCount++;
    chunkScores[match.chunk_id].totalImportance += match.importance;
    chunkScores[match.chunk_id].keywords.push(match.keyword);
  }

  // Get the actual chunks
  const matchedChunkIds = Object.keys(chunkScores);

  // Also include high-importance chunks from the same documents (even without keyword match)
  const importantChunks = await prisma.qUAD_memory_chunks.findMany({
    where: {
      document_id: { in: documentIds },
      id: { notIn: excludeChunkIds },
      importance: { gte: 8 }, // Very important chunks
    },
    select: { id: true },
  });

  const allChunkIds = [...new Set([...matchedChunkIds, ...importantChunks.map(c => c.id)])];

  if (allChunkIds.length === 0) {
    return [];
  }

  // Fetch chunk details
  const chunks = await prisma.qUAD_memory_chunks.findMany({
    where: { id: { in: allChunkIds } },
    include: {
      document: {
        select: {
          memory_level: true,
        },
      },
    },
  });

  // Score and sort chunks
  const scoredChunks = chunks.map(chunk => {
    const keywordScore = chunkScores[chunk.id]?.totalImportance || 0;
    const importanceScore = chunk.importance * 10;
    const helpfulnessBonus = (Number(chunk.helpfulness_score) || 0.5) * 20;
    const totalScore = keywordScore + importanceScore + helpfulnessBonus;

    return {
      chunkId: chunk.id,
      content: chunk.content,
      section: chunk.section_path || chunk.section_id || 'General',
      level: chunk.document.memory_level as MemoryLevel,
      importance: chunk.importance,
      tokenCount: chunk.token_count,
      keywords: chunk.keywords || [],
      score: totalScore,
    };
  });

  // Sort by score (descending) and select until token limit
  scoredChunks.sort((a, b) => b.score - a.score);

  const selected: ContextChunk[] = [];
  let totalTokens = 0;

  for (const chunk of scoredChunks) {
    if (totalTokens + chunk.tokenCount <= maxTokens) {
      selected.push(chunk);
      totalTokens += chunk.tokenCount;
    }
  }

  return selected;
}

/**
 * Apply org-specific context rules
 */
async function applyContextRules(
  orgId: string,
  sessionType: SessionType,
  keywords: string[],
  chunks: ContextChunk[]
): Promise<ContextChunk[]> {
  const rules = await prisma.qUAD_context_rules.findMany({
    where: {
      org_id: orgId,
      is_active: true,
    },
    orderBy: { priority: 'desc' },
  });

  let result = [...chunks];

  for (const rule of rules) {
    const conditions = rule.trigger_conditions as { session_types?: string[]; keywords?: string[] };
    const action = rule.action_config as { chunks_to_include?: string[]; chunks_to_exclude?: string[]; max_tokens?: number };

    // Check if rule applies
    const sessionMatches = !conditions.session_types || conditions.session_types.includes(sessionType);
    const keywordMatches = !conditions.keywords || conditions.keywords.some(k => keywords.includes(k));

    if (sessionMatches && keywordMatches) {
      if (rule.rule_type === 'exclude' && action.chunks_to_exclude) {
        result = result.filter(c => !action.chunks_to_exclude?.includes(c.section));
      }
      // Add more rule types as needed
    }
  }

  return result;
}

/**
 * Update chunk statistics for learning
 */
async function updateChunkStats(
  chunkIds: string[],
  statType: 'retrieved' | 'helpful' | 'insufficient'
): Promise<void> {
  if (chunkIds.length === 0) return;

  const updateData: Record<string, { increment: number }> = {};
  if (statType === 'retrieved') updateData.times_retrieved = { increment: 1 };
  if (statType === 'helpful') updateData.times_helpful = { increment: 1 };
  if (statType === 'insufficient') updateData.times_insufficient = { increment: 1 };

  await prisma.qUAD_memory_chunks.updateMany({
    where: { id: { in: chunkIds } },
    data: updateData,
  });

  // Recalculate helpfulness scores
  const chunks = await prisma.qUAD_memory_chunks.findMany({
    where: { id: { in: chunkIds } },
    select: { id: true, times_retrieved: true, times_helpful: true },
  });

  for (const chunk of chunks) {
    if (chunk.times_retrieved > 0) {
      await prisma.qUAD_memory_chunks.update({
        where: { id: chunk.id },
        data: {
          helpfulness_score: chunk.times_helpful / chunk.times_retrieved,
        },
      });
    }
  }
}

/**
 * Generate document key like QUAD_ORG_abc123.md
 */
function generateDocumentKey(level: MemoryLevel, orgId: string, entityId: string | null): string {
  const shortOrgId = orgId.split('-')[0];
  const shortEntityId = entityId?.split('-')[0] || '';

  switch (level) {
    case 'org':
      return `QUAD_ORG_${shortOrgId}.md`;
    case 'domain':
      return `QUAD_DOMAIN_${shortOrgId}_${shortEntityId}.md`;
    case 'project':
      return `QUAD_PROJECT_${shortOrgId}_${shortEntityId}.md`;
    case 'circle':
      return `QUAD_CIRCLE_${shortOrgId}_${shortEntityId}.md`;
    case 'user':
      return `QUAD_USER_${shortOrgId}_${shortEntityId}.md`;
    default:
      return `QUAD_MEMORY_${shortOrgId}.md`;
  }
}

/**
 * Parse sections from markdown content
 */
function parseSectionsFromMarkdown(content: string): { id: string; title: string; line_start: number; line_end: number; keywords: string[] }[] {
  const lines = content.split('\n');
  const sections: { id: string; title: string; line_start: number; line_end: number; keywords: string[] }[] = [];
  let currentSection: typeof sections[0] | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);

    if (headingMatch) {
      // Close previous section
      if (currentSection) {
        currentSection.line_end = i - 1;
        // Extract keywords from section content
        const sectionContent = lines.slice(currentSection.line_start, i).join(' ');
        currentSection.keywords = extractKeywordsFromText(sectionContent);
        sections.push(currentSection);
      }

      // Start new section
      const title = headingMatch[2].trim();
      currentSection = {
        id: title.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        title,
        line_start: i,
        line_end: i,
        keywords: [],
      };
    }
  }

  // Close last section
  if (currentSection) {
    currentSection.line_end = lines.length - 1;
    const sectionContent = lines.slice(currentSection.line_start).join(' ');
    currentSection.keywords = extractKeywordsFromText(sectionContent);
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Extract keywords from text (simple implementation, can be enhanced with NLP)
 */
function extractKeywordsFromText(text: string): string[] {
  // Common tech/programming terms to prioritize
  const techTerms = [
    'react', 'typescript', 'javascript', 'python', 'java', 'golang', 'rust',
    'api', 'database', 'postgres', 'mysql', 'mongodb', 'redis',
    'docker', 'kubernetes', 'aws', 'gcp', 'azure',
    'authentication', 'authorization', 'jwt', 'oauth',
    'frontend', 'backend', 'fullstack', 'microservices',
    'testing', 'deployment', 'ci/cd', 'pipeline',
    'prisma', 'nextjs', 'express', 'fastify',
  ];

  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  // Find tech terms
  const foundTerms = techTerms.filter(term => words.includes(term));

  // Find capitalized words (likely proper nouns/names)
  const capitalizedWords = (text.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)*\b/g) || [])
    .map(w => w.toLowerCase())
    .filter(w => w.length > 2);

  return [...new Set([...foundTerms, ...capitalizedWords])].slice(0, 20);
}

/**
 * Extract keywords from AI's request for more info
 */
function extractKeywordsFromRequest(request: string): string[] {
  // Common patterns in AI requests
  const patterns = [
    /(?:need|see|show|find|get)\s+(?:the\s+)?([a-zA-Z_]+)/gi,
    /([A-Z][a-z]+(?:[A-Z][a-z]+)+)/g, // CamelCase
    /([a-z]+_[a-z_]+)/g, // snake_case
    /`([^`]+)`/g, // backtick-quoted
  ];

  const keywords: string[] = [];

  for (const pattern of patterns) {
    const matches = request.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 2) {
        keywords.push(match[1].toLowerCase());
      }
    }
  }

  return [...new Set(keywords)];
}

/**
 * Re-chunk a document into searchable pieces
 */
async function rechunkDocument(
  documentId: string,
  content: string,
  sections: { id: string; title: string; line_start: number; line_end: number; keywords: string[] }[]
): Promise<void> {
  // Delete existing chunks
  await prisma.qUAD_memory_chunks.deleteMany({
    where: { document_id: documentId },
  });

  // Delete existing keywords
  const oldChunks = await prisma.qUAD_memory_chunks.findMany({
    where: { document_id: documentId },
    select: { id: true },
  });
  if (oldChunks.length > 0) {
    await prisma.qUAD_memory_keywords.deleteMany({
      where: { chunk_id: { in: oldChunks.map(c => c.id) } },
    });
  }

  const lines = content.split('\n');
  const TARGET_CHUNK_TOKENS = 500;

  let chunkIndex = 0;

  for (const section of sections) {
    const sectionLines = lines.slice(section.line_start, section.line_end + 1);
    const sectionContent = sectionLines.join('\n');
    const sectionTokens = estimateTokens(sectionContent);

    // If section is small enough, keep as one chunk
    if (sectionTokens <= TARGET_CHUNK_TOKENS * 1.5) {
      await createChunkWithKeywords(
        documentId,
        chunkIndex++,
        section.id,
        section.title,
        sectionContent,
        section.keywords
      );
    } else {
      // Split section into multiple chunks
      let currentChunk = '';
      let currentTokens = 0;

      for (const line of sectionLines) {
        const lineTokens = estimateTokens(line);

        if (currentTokens + lineTokens > TARGET_CHUNK_TOKENS && currentChunk) {
          await createChunkWithKeywords(
            documentId,
            chunkIndex++,
            section.id,
            section.title,
            currentChunk,
            extractKeywordsFromText(currentChunk)
          );
          currentChunk = line;
          currentTokens = lineTokens;
        } else {
          currentChunk += (currentChunk ? '\n' : '') + line;
          currentTokens += lineTokens;
        }
      }

      // Save remaining content
      if (currentChunk) {
        await createChunkWithKeywords(
          documentId,
          chunkIndex++,
          section.id,
          section.title,
          currentChunk,
          extractKeywordsFromText(currentChunk)
        );
      }
    }
  }
}

/**
 * Create a chunk and its keyword index
 */
async function createChunkWithKeywords(
  documentId: string,
  chunkIndex: number,
  sectionId: string,
  sectionPath: string,
  content: string,
  keywords: string[]
): Promise<void> {
  const chunk = await prisma.qUAD_memory_chunks.create({
    data: {
      document_id: documentId,
      chunk_index: chunkIndex,
      section_id: sectionId,
      section_path: sectionPath,
      content,
      content_hash: crypto.createHash('sha256').update(content).digest('hex'),
      token_count: estimateTokens(content),
      keywords,
      importance: calculateImportance(content, sectionId),
    },
  });

  // Create keyword entries
  const keywordEntries = keywords.map(keyword => ({
    chunk_id: chunk.id,
    keyword,
    keyword_type: categorizekeyword(keyword),
    importance: 5,
    bigrams: [] as string[],
    trigrams: [] as string[],
  }));

  if (keywordEntries.length > 0) {
    await prisma.qUAD_memory_keywords.createMany({
      data: keywordEntries,
    });
  }
}

/**
 * Calculate importance score for a chunk
 */
function calculateImportance(content: string, sectionId: string): number {
  let score = 5; // Default

  // Sections that are always important
  const highImportanceSections = ['tech_stack', 'architecture', 'database', 'api', 'authentication'];
  if (highImportanceSections.some(s => sectionId.includes(s))) {
    score += 3;
  }

  // Content indicators
  if (content.includes('IMPORTANT') || content.includes('CRITICAL')) score += 2;
  if (content.includes('```')) score += 1; // Code blocks are useful
  if (content.match(/https?:\/\//)) score += 1; // Links might be useful

  return Math.min(10, score);
}

/**
 * Categorize a keyword
 */
function categorizekeyword(keyword: string): string {
  const techTerms = ['react', 'typescript', 'javascript', 'python', 'docker', 'kubernetes', 'prisma', 'nextjs'];
  const conceptTerms = ['authentication', 'authorization', 'deployment', 'testing', 'architecture'];
  const actionTerms = ['create', 'update', 'delete', 'fetch', 'generate', 'validate'];

  if (techTerms.includes(keyword)) return 'tech';
  if (conceptTerms.includes(keyword)) return 'concept';
  if (actionTerms.includes(keyword)) return 'action';

  return 'custom';
}

// =============================================================================
// EXPORTS FOR API
// =============================================================================

export const MemoryService = {
  getInitialContext,
  handleIterativeRequest,
  completeSession,
  upsertMemoryDocument,
  initializeMemoryFromTemplate,
  queueMemoryUpdate,
};

export default MemoryService;
