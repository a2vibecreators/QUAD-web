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

// NOTE: Prisma removed - using stubs until Java backend ready
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
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function getInitialContext(
  context: RetrievalContext,
  keywords: string[],
  maxTokens: number = 4000
): Promise<RetrievalResult> {
  const { userId, sessionType } = context;

  // TODO: Call Java backend to get initial context
  console.log(`[MemoryService] getInitialContext for user: ${userId}, session: ${sessionType}, keywords: ${keywords.join(', ')}`);

  // Return empty result until backend ready
  const sessionId = crypto.randomUUID();
  return {
    sessionId,
    chunks: [],
    totalTokens: 0,
    hierarchyIncluded: [],
    keywordsMatched: [],
  };
}

/**
 * Handle iterative context request - when AI says "I need more info"
 * This is the "puzzle piece" logic
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function handleIterativeRequest(
  request: IterativeRequest
): Promise<IterativeResponse> {
  const { sessionId, aiRequestText, requestType, keywords: providedKeywords } = request;

  // TODO: Call Java backend to handle iterative request
  console.log(`[MemoryService] handleIterativeRequest for session: ${sessionId}, type: ${requestType}`);

  const extractedKeywords = providedKeywords || extractKeywordsFromRequest(aiRequestText);

  return {
    additionalChunks: [],
    totalNewTokens: 0,
    wasFound: false,
    suggestion: `Could not find information about: ${extractedKeywords.join(', ')}. Consider adding this to memory.`,
  };
}

/**
 * Mark session as complete and record success/failure
 * This feeds back into the learning system
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function completeSession(
  sessionId: string,
  wasSuccessful: boolean,
  notes?: string
): Promise<void> {
  // TODO: Call Java backend to complete session
  console.log(`[MemoryService] completeSession: ${sessionId}, success: ${wasSuccessful}, notes: ${notes}`);
}

// =============================================================================
// MEMORY DOCUMENT MANAGEMENT
// =============================================================================

/**
 * Create or update a memory document
 * TODO: Implement via Java backend when endpoints are ready
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

  // TODO: Call Java backend to upsert memory document
  console.log(`[MemoryService] upsertMemoryDocument for org: ${orgId}, level: ${level}, key: ${documentKey}`);

  return crypto.randomUUID(); // Return mock ID until backend ready
}

/**
 * Generate initial memory from template for a new org/domain/project
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function initializeMemoryFromTemplate(
  orgId: string,
  level: MemoryLevel,
  levelEntityId: string | null,
  templateType: string = 'default',
  placeholders: Record<string, string>,
  createdBy: string
): Promise<string> {
  // TODO: Call Java backend to get template and initialize memory
  console.log(`[MemoryService] initializeMemoryFromTemplate for org: ${orgId}, level: ${level}, template: ${templateType}`);

  // Create minimal memory until backend ready
  const minimalContent = `# ${placeholders.name || 'Memory'}\n\n*This memory will be populated as the system learns about this ${level}.*\n`;
  return upsertMemoryDocument(orgId, level, levelEntityId, `${placeholders.name || level} Memory`, minimalContent, createdBy);
}

/**
 * Queue a memory update from an event (ticket closed, meeting completed, etc.)
 * TODO: Implement via Java backend when endpoints are ready
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
  // TODO: Call Java backend to queue memory update
  console.log(`[MemoryService] queueMemoryUpdate for org: ${orgId}, source: ${sourceType}, target: ${targetLevel}`);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all memory documents in the hierarchy (org → domain → project → circle → user)
 * TODO: Implement via Java backend when endpoints are ready
 */
async function getHierarchicalDocuments(
  orgId: string,
  domainId?: string,
  projectId?: string,
  circleId?: string,
  userId?: string
): Promise<{ id: string; level: MemoryLevel; token_estimate: number }[]> {
  // TODO: Call Java backend to get hierarchical documents
  console.log(`[MemoryService] getHierarchicalDocuments for org: ${orgId}`);
  return []; // Return empty until backend ready
}

/**
 * Get chunks that match keywords, prioritizing by importance and match quality
 * TODO: Implement via Java backend when endpoints are ready
 */
async function getMatchingChunks(
  documentIds: string[],
  keywords: string[],
  maxTokens: number,
  excludeChunkIds: string[] = []
): Promise<ContextChunk[]> {
  // TODO: Call Java backend to get matching chunks
  console.log(`[MemoryService] getMatchingChunks for docs: ${documentIds.length}, keywords: ${keywords.join(', ')}`);
  return []; // Return empty until backend ready
}

/**
 * Apply org-specific context rules
 * TODO: Implement via Java backend when endpoints are ready
 */
async function applyContextRules(
  orgId: string,
  sessionType: SessionType,
  keywords: string[],
  chunks: ContextChunk[]
): Promise<ContextChunk[]> {
  // TODO: Call Java backend to apply context rules
  console.log(`[MemoryService] applyContextRules for org: ${orgId}, session: ${sessionType}`);
  return chunks; // Return unchanged until backend ready
}

/**
 * Update chunk statistics for learning
 * TODO: Implement via Java backend when endpoints are ready
 */
async function updateChunkStats(
  chunkIds: string[],
  statType: 'retrieved' | 'helpful' | 'insufficient'
): Promise<void> {
  // TODO: Call Java backend to update chunk stats
  if (chunkIds.length > 0) {
    console.log(`[MemoryService] updateChunkStats: ${chunkIds.length} chunks, type: ${statType}`);
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
 * TODO: Implement via Java backend when endpoints are ready
 */
async function rechunkDocument(
  documentId: string,
  content: string,
  sections: { id: string; title: string; line_start: number; line_end: number; keywords: string[] }[]
): Promise<void> {
  // TODO: Call Java backend to rechunk document
  console.log(`[MemoryService] rechunkDocument for doc: ${documentId}, sections: ${sections.length}`);
}

/**
 * Create a chunk and its keyword index
 * TODO: Implement via Java backend when endpoints are ready
 */
async function createChunkWithKeywords(
  documentId: string,
  chunkIndex: number,
  sectionId: string,
  sectionPath: string,
  content: string,
  keywords: string[]
): Promise<void> {
  // TODO: Call Java backend to create chunk with keywords
  console.log(`[MemoryService] createChunkWithKeywords for doc: ${documentId}, section: ${sectionId}`);
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
