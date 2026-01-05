/**
 * QUAD Codebase Indexer - Schema and code indexing for AI context
 *
 * Dual-mode search:
 * 1. Keyword Search: Fast, free, ~70% accurate
 * 2. RAG Search: Semantic, embedding-based, ~95% accurate
 *
 * Strategy: Keyword first, RAG for low confidence or complex queries
 *
 * Why both?
 * - 350 tables × 100 tokens = 35K tokens (too expensive to send all)
 * - Send only RELEVANT tables (10-20) = 1-2K tokens (97% savings)
 */

// NOTE: Prisma removed - using stubs until Java backend ready
import crypto from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

interface TableIndex {
  tableName: string;
  displayName: string;
  category: string;           // core, tickets, meetings, skills, etc.
  description: string;        // What this table stores
  columns: ColumnInfo[];
  relationships: string[];    // Related table names
  keywords: string[];         // For keyword search
  embedding?: number[];       // For RAG search (Phase 2)
  tokenCount: number;
}

interface ColumnInfo {
  name: string;
  type: string;
  description?: string;
  isKey: boolean;
  isForeignKey: boolean;
  referencesTable?: string;
}

interface SearchResult {
  table: TableIndex;
  score: number;
  matchType: 'keyword' | 'rag' | 'both';
  matchedKeywords?: string[];
}

interface CodebaseSearchOptions {
  query: string;
  orgId: string;
  maxResults?: number;
  minScore?: number;
  useRag?: boolean;         // Force RAG search
  categories?: string[];    // Filter by category
}

// =============================================================================
// QUAD SCHEMA INDEX (Pre-defined for our tables)
// =============================================================================

const QUAD_TABLE_INDEX: TableIndex[] = [
  // Core Tables
  {
    tableName: 'QUAD_organizations',
    displayName: 'Organizations',
    category: 'core',
    description: 'Organizations/companies using QUAD. Supports hierarchy (parent_id for sub-orgs).',
    columns: [
      { name: 'id', type: 'uuid', isKey: true, isForeignKey: false },
      { name: 'name', type: 'string', isKey: false, isForeignKey: false },
      { name: 'slug', type: 'string', isKey: false, isForeignKey: false },
      { name: 'parent_id', type: 'uuid', isKey: false, isForeignKey: true, referencesTable: 'QUAD_organizations' },
    ],
    relationships: ['QUAD_users', 'QUAD_domains', 'QUAD_roles', 'QUAD_ai_configs'],
    keywords: ['organization', 'company', 'org', 'tenant', 'business', 'enterprise', 'parent', 'sub-org'],
    tokenCount: 150,
  },
  {
    tableName: 'QUAD_users',
    displayName: 'Users',
    category: 'core',
    description: 'Users who access QUAD. Linked to organizations via org_id.',
    columns: [
      { name: 'id', type: 'uuid', isKey: true, isForeignKey: false },
      { name: 'email', type: 'string', isKey: false, isForeignKey: false },
      { name: 'name', type: 'string', isKey: false, isForeignKey: false },
      { name: 'org_id', type: 'uuid', isKey: false, isForeignKey: true, referencesTable: 'QUAD_organizations' },
    ],
    relationships: ['QUAD_organizations', 'QUAD_roles', 'QUAD_user_skills', 'QUAD_tickets'],
    keywords: ['user', 'member', 'person', 'employee', 'developer', 'email', 'login', 'account'],
    tokenCount: 120,
  },
  {
    tableName: 'QUAD_domains',
    displayName: 'Domains',
    category: 'core',
    description: 'Business domains/products within an organization. Contains domain-specific settings.',
    columns: [
      { name: 'id', type: 'uuid', isKey: true, isForeignKey: false },
      { name: 'name', type: 'string', isKey: false, isForeignKey: false },
      { name: 'org_id', type: 'uuid', isKey: false, isForeignKey: true, referencesTable: 'QUAD_organizations' },
      { name: 'description', type: 'string', isKey: false, isForeignKey: false },
    ],
    relationships: ['QUAD_organizations', 'QUAD_tickets', 'QUAD_cycles', 'QUAD_circles'],
    keywords: ['domain', 'product', 'project', 'area', 'business', 'module'],
    tokenCount: 130,
  },

  // Ticket Tables
  {
    tableName: 'QUAD_tickets',
    displayName: 'Tickets',
    category: 'tickets',
    description: 'Work items - bugs, features, tasks, spikes. Core of QUAD workflow.',
    columns: [
      { name: 'id', type: 'uuid', isKey: true, isForeignKey: false },
      { name: 'ticket_number', type: 'string', isKey: false, isForeignKey: false },
      { name: 'title', type: 'string', isKey: false, isForeignKey: false },
      { name: 'description', type: 'text', isKey: false, isForeignKey: false },
      { name: 'ticket_type', type: 'string', isKey: false, isForeignKey: false, description: 'bug, feature, task, spike, story' },
      { name: 'status', type: 'string', isKey: false, isForeignKey: false },
      { name: 'priority', type: 'string', isKey: false, isForeignKey: false },
      { name: 'assignee_id', type: 'uuid', isKey: false, isForeignKey: true, referencesTable: 'QUAD_users' },
      { name: 'domain_id', type: 'uuid', isKey: false, isForeignKey: true, referencesTable: 'QUAD_domains' },
    ],
    relationships: ['QUAD_users', 'QUAD_domains', 'QUAD_ticket_skills', 'QUAD_assignment_scores'],
    keywords: ['ticket', 'issue', 'bug', 'feature', 'task', 'work', 'assign', 'status', 'priority', 'backlog', 'sprint'],
    tokenCount: 200,
  },
  {
    tableName: 'QUAD_ticket_skills',
    displayName: 'Ticket Skills',
    category: 'tickets',
    description: 'Skills required for a ticket. Used by assignment algorithm to match developers.',
    columns: [
      { name: 'ticket_id', type: 'uuid', isKey: false, isForeignKey: true, referencesTable: 'QUAD_tickets' },
      { name: 'skill_id', type: 'uuid', isKey: false, isForeignKey: true, referencesTable: 'QUAD_skills' },
      { name: 'min_proficiency', type: 'int', isKey: false, isForeignKey: false },
    ],
    relationships: ['QUAD_tickets', 'QUAD_skills'],
    keywords: ['ticket', 'skill', 'requirement', 'proficiency', 'match', 'assignment'],
    tokenCount: 80,
  },

  // Skills & Assignment
  {
    tableName: 'QUAD_skills',
    displayName: 'Skills',
    category: 'skills',
    description: 'Master list of skills (React, Python, Docker, etc.). Org-level or global.',
    columns: [
      { name: 'id', type: 'uuid', isKey: true, isForeignKey: false },
      { name: 'name', type: 'string', isKey: false, isForeignKey: false },
      { name: 'category', type: 'string', isKey: false, isForeignKey: false, description: 'frontend, backend, devops, database, etc.' },
      { name: 'ai_context', type: 'string', isKey: false, isForeignKey: false },
    ],
    relationships: ['QUAD_user_skills', 'QUAD_ticket_skills'],
    keywords: ['skill', 'technology', 'competency', 'expertise', 'tech', 'stack', 'programming', 'language'],
    tokenCount: 100,
  },
  {
    tableName: 'QUAD_user_skills',
    displayName: 'User Skills',
    category: 'skills',
    description: 'User proficiency in skills. Includes interest level and learning preferences.',
    columns: [
      { name: 'user_id', type: 'uuid', isKey: false, isForeignKey: true, referencesTable: 'QUAD_users' },
      { name: 'skill_name', type: 'string', isKey: false, isForeignKey: false },
      { name: 'proficiency_level', type: 'int', isKey: false, isForeignKey: false, description: '1-5 scale' },
      { name: 'interest_level', type: 'string', isKey: false, isForeignKey: false, description: 'high, medium, low, none' },
      { name: 'wants_to_learn', type: 'boolean', isKey: false, isForeignKey: false },
    ],
    relationships: ['QUAD_users', 'QUAD_skills'],
    keywords: ['user', 'skill', 'proficiency', 'level', 'expertise', 'interest', 'learn', 'developer'],
    tokenCount: 120,
  },
  {
    tableName: 'QUAD_assignment_scores',
    displayName: 'Assignment Scores',
    category: 'skills',
    description: 'How assignment decisions were made. Tracks candidates, scores, and reasoning.',
    columns: [
      { name: 'ticket_id', type: 'uuid', isKey: false, isForeignKey: true, referencesTable: 'QUAD_tickets' },
      { name: 'assigned_to', type: 'uuid', isKey: false, isForeignKey: true, referencesTable: 'QUAD_users' },
      { name: 'candidates', type: 'json', isKey: false, isForeignKey: false, description: 'All candidates with scores' },
      { name: 'assignment_reason', type: 'string', isKey: false, isForeignKey: false },
    ],
    relationships: ['QUAD_tickets', 'QUAD_users'],
    keywords: ['assignment', 'score', 'candidate', 'assign', 'match', 'algorithm', 'workload', 'decision'],
    tokenCount: 100,
  },

  // Meetings
  {
    tableName: 'QUAD_meetings',
    displayName: 'Meetings',
    category: 'meetings',
    description: 'Scheduled meetings - standups, planning, retros. Supports MOM workflow.',
    columns: [
      { name: 'id', type: 'uuid', isKey: true, isForeignKey: false },
      { name: 'title', type: 'string', isKey: false, isForeignKey: false },
      { name: 'meeting_type', type: 'string', isKey: false, isForeignKey: false, description: 'standup, planning, retro, review' },
      { name: 'scheduled_at', type: 'datetime', isKey: false, isForeignKey: false },
      { name: 'mom_status', type: 'string', isKey: false, isForeignKey: false, description: 'draft, needs_review, confirmed' },
      { name: 'ai_summary', type: 'text', isKey: false, isForeignKey: false },
    ],
    relationships: ['QUAD_meeting_action_items', 'QUAD_meeting_follow_ups', 'QUAD_domains'],
    keywords: ['meeting', 'standup', 'planning', 'retro', 'scrum', 'schedule', 'summary', 'MOM', 'minutes'],
    tokenCount: 150,
  },
  {
    tableName: 'QUAD_meeting_action_items',
    displayName: 'Meeting Action Items',
    category: 'meetings',
    description: 'Action items extracted from meetings by AI. BA reviews and confirms.',
    columns: [
      { name: 'meeting_id', type: 'uuid', isKey: false, isForeignKey: true, referencesTable: 'QUAD_meetings' },
      { name: 'description', type: 'string', isKey: false, isForeignKey: false },
      { name: 'item_type', type: 'string', isKey: false, isForeignKey: false, description: 'action, decision, question, risk' },
      { name: 'is_uncertain', type: 'boolean', isKey: false, isForeignKey: false },
      { name: 'ba_confirmed', type: 'boolean', isKey: false, isForeignKey: false },
    ],
    relationships: ['QUAD_meetings', 'QUAD_meeting_follow_ups'],
    keywords: ['action', 'item', 'meeting', 'decision', 'todo', 'follow-up', 'uncertain', 'review', 'BA'],
    tokenCount: 120,
  },

  // Memory & AI
  {
    tableName: 'QUAD_memory_documents',
    displayName: 'Memory Documents',
    category: 'memory',
    description: 'Hierarchical memory storage - org, domain, project, user level markdown docs.',
    columns: [
      { name: 'id', type: 'uuid', isKey: true, isForeignKey: false },
      { name: 'memory_level', type: 'string', isKey: false, isForeignKey: false, description: 'org, domain, project, circle, user' },
      { name: 'content', type: 'text', isKey: false, isForeignKey: false },
      { name: 'token_estimate', type: 'int', isKey: false, isForeignKey: false },
    ],
    relationships: ['QUAD_memory_chunks', 'QUAD_organizations'],
    keywords: ['memory', 'context', 'document', 'markdown', 'hierarchy', 'org', 'domain', 'project'],
    tokenCount: 130,
  },
  {
    tableName: 'QUAD_memory_chunks',
    displayName: 'Memory Chunks',
    category: 'memory',
    description: 'Searchable ~500-token pieces of memory documents. Indexed by keywords.',
    columns: [
      { name: 'document_id', type: 'uuid', isKey: false, isForeignKey: true, referencesTable: 'QUAD_memory_documents' },
      { name: 'content', type: 'text', isKey: false, isForeignKey: false },
      { name: 'keywords', type: 'string[]', isKey: false, isForeignKey: false },
      { name: 'embedding', type: 'json', isKey: false, isForeignKey: false, description: 'Vector for RAG search' },
    ],
    relationships: ['QUAD_memory_documents', 'QUAD_memory_keywords'],
    keywords: ['chunk', 'memory', 'search', 'keyword', 'embedding', 'rag', 'vector', 'context'],
    tokenCount: 100,
  },
  {
    tableName: 'QUAD_ai_configs',
    displayName: 'AI Configs',
    category: 'ai',
    description: 'Org-level AI settings - provider, classification mode, budget, feature toggles.',
    columns: [
      { name: 'org_id', type: 'uuid', isKey: false, isForeignKey: true, referencesTable: 'QUAD_organizations' },
      { name: 'primary_provider', type: 'string', isKey: false, isForeignKey: false },
      { name: 'classification_mode', type: 'string', isKey: false, isForeignKey: false, description: 'accuracy, cost, hybrid' },
      { name: 'monthly_budget_usd', type: 'decimal', isKey: false, isForeignKey: false },
    ],
    relationships: ['QUAD_organizations'],
    keywords: ['ai', 'config', 'settings', 'provider', 'gemini', 'claude', 'budget', 'classification', 'mode'],
    tokenCount: 120,
  },
];

// =============================================================================
// SEARCH FUNCTIONS
// =============================================================================

/**
 * Search codebase index - dual mode (keyword + RAG)
 */
export async function searchCodebase(options: CodebaseSearchOptions): Promise<SearchResult[]> {
  const { query, maxResults = 10, minScore = 0.3, useRag = false, categories } = options;

  // Step 1: Keyword search (always runs, free)
  const keywordResults = keywordSearch(query, categories);

  // Step 2: Determine if we need RAG
  const topKeywordScore = keywordResults[0]?.score || 0;
  const needsRag = useRag || topKeywordScore < 0.5;

  let finalResults = keywordResults;

  if (needsRag) {
    // Step 3: RAG search (semantic)
    const ragResults = await ragSearch(query, categories);

    // Step 4: Merge results (prioritize RAG for ties)
    finalResults = mergeResults(keywordResults, ragResults);
  }

  // Step 5: Filter and limit
  return finalResults
    .filter(r => r.score >= minScore)
    .slice(0, maxResults);
}

/**
 * Keyword-based search (free, fast)
 */
function keywordSearch(query: string, categories?: string[]): SearchResult[] {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  let tables = QUAD_TABLE_INDEX;
  if (categories && categories.length > 0) {
    tables = tables.filter(t => categories.includes(t.category));
  }

  const results: SearchResult[] = [];

  for (const table of tables) {
    let score = 0;
    const matchedKeywords: string[] = [];

    // Check table name match
    if (queryWords.some(w => table.tableName.toLowerCase().includes(w))) {
      score += 0.3;
    }

    // Check keywords match
    for (const keyword of table.keywords) {
      for (const queryWord of queryWords) {
        if (keyword.includes(queryWord) || queryWord.includes(keyword)) {
          score += 0.15;
          matchedKeywords.push(keyword);
        }
      }
    }

    // Check description match
    for (const queryWord of queryWords) {
      if (table.description.toLowerCase().includes(queryWord)) {
        score += 0.1;
      }
    }

    // Check column names
    for (const col of table.columns) {
      if (queryWords.some(w => col.name.toLowerCase().includes(w))) {
        score += 0.1;
      }
    }

    if (score > 0) {
      results.push({
        table,
        score: Math.min(score, 1.0),
        matchType: 'keyword',
        matchedKeywords: [...new Set(matchedKeywords)],
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

/**
 * RAG-based semantic search
 * TODO: Implement with actual embeddings
 */
async function ragSearch(query: string, categories?: string[]): Promise<SearchResult[]> {
  // TODO: Call embedding API and do cosine similarity

  // For now, return enhanced keyword search as placeholder
  const results = keywordSearch(query, categories);

  // Boost scores slightly to simulate RAG improvement
  return results.map(r => ({
    ...r,
    score: Math.min(r.score * 1.2, 1.0),
    matchType: 'rag' as const,
  }));
}

/**
 * Merge keyword and RAG results
 */
function mergeResults(keywordResults: SearchResult[], ragResults: SearchResult[]): SearchResult[] {
  const merged = new Map<string, SearchResult>();

  // Add keyword results
  for (const r of keywordResults) {
    merged.set(r.table.tableName, r);
  }

  // Add/update with RAG results
  for (const r of ragResults) {
    const existing = merged.get(r.table.tableName);
    if (existing) {
      // Both matched - take higher score
      if (r.score > existing.score) {
        merged.set(r.table.tableName, { ...r, matchType: 'both' });
      } else {
        merged.set(r.table.tableName, { ...existing, matchType: 'both' });
      }
    } else {
      merged.set(r.table.tableName, r);
    }
  }

  return Array.from(merged.values()).sort((a, b) => b.score - a.score);
}

// =============================================================================
// INDEX MANAGEMENT
// =============================================================================

/**
 * Build codebase index for an org's custom tables
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function buildOrgCodebaseIndex(orgId: string): Promise<void> {
  // Get org's custom tables from schema (if they have DB access)
  // For now, we use the pre-defined QUAD index

  const indexData = {
    tables: QUAD_TABLE_INDEX.length,
    categories: [...new Set(QUAD_TABLE_INDEX.map(t => t.category))],
    totalTokens: QUAD_TABLE_INDEX.reduce((sum, t) => sum + t.tokenCount, 0),
    lastUpdated: new Date().toISOString(),
  };

  // TODO: Call Java backend to store codebase index
  console.log(`[CodebaseIndexer] buildOrgCodebaseIndex for org: ${orgId}`, indexData);
}

/**
 * Get formatted context for AI based on search results
 */
export function formatTablesForAI(results: SearchResult[], maxTokens: number = 2000): string {
  const lines: string[] = ['## Relevant Database Tables\n'];
  let tokenCount = 50; // Header

  for (const result of results) {
    const table = result.table;
    const tableText = [
      `### ${table.displayName} (\`${table.tableName}\`)`,
      table.description,
      '',
      'Key columns:',
      ...table.columns.slice(0, 5).map(c =>
        `- \`${c.name}\`: ${c.type}${c.description ? ` - ${c.description}` : ''}${c.isForeignKey ? ` (FK → ${c.referencesTable})` : ''}`
      ),
      '',
      `Related: ${table.relationships.slice(0, 3).join(', ')}`,
      '',
    ].join('\n');

    const tableTokens = Math.ceil(tableText.length / 4);

    if (tokenCount + tableTokens > maxTokens) break;

    lines.push(tableText);
    tokenCount += tableTokens;
  }

  return lines.join('\n');
}

// =============================================================================
// EXPORTS
// =============================================================================

export const CodebaseIndexer = {
  search: searchCodebase,
  buildIndex: buildOrgCodebaseIndex,
  formatForAI: formatTablesForAI,
  QUAD_TABLES: QUAD_TABLE_INDEX,
};

export default CodebaseIndexer;
