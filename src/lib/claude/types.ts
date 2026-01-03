/**
 * QUAD Framework - Claude AI Types
 *
 * Type definitions for Claude API integration with token optimization.
 * Supports BYOK (Bring Your Own Key) and QUAD-provided API modes.
 */

// =============================================================================
// MODEL TYPES
// =============================================================================

export type ClaudeModel =
  | 'claude-3-5-haiku-20241022'   // Fast, cheap - simple tasks
  | 'claude-sonnet-4-20250514'    // Balanced - most coding tasks
  | 'claude-opus-4-20250514';     // Powerful - complex analysis

export type ModelTier = 'haiku' | 'sonnet' | 'opus';

export const MODEL_MAP: Record<ModelTier, ClaudeModel> = {
  haiku: 'claude-3-5-haiku-20241022',
  sonnet: 'claude-sonnet-4-20250514',
  opus: 'claude-opus-4-20250514',
};

// =============================================================================
// PRICING (per million tokens)
// =============================================================================

export const MODEL_PRICING: Record<ModelTier, { input: number; output: number; cachedInput: number }> = {
  haiku: { input: 0.25, output: 1.25, cachedInput: 0.025 },
  sonnet: { input: 3.00, output: 15.00, cachedInput: 0.30 },
  opus: { input: 15.00, output: 75.00, cachedInput: 1.50 },
};

// Batch API gets 50% off
export const BATCH_DISCOUNT = 0.5;

// =============================================================================
// TASK CLASSIFICATION
// =============================================================================

export type TaskType =
  | 'format'           // Code formatting - Haiku
  | 'rename'           // Variable renaming - Haiku
  | 'boilerplate'      // Generate boilerplate - Haiku
  | 'explain'          // Explain code - Haiku
  | 'write_function'   // Write new function - Sonnet
  | 'debug'            // Debug errors - Sonnet
  | 'code_review'      // Code review - Sonnet
  | 'add_feature'      // Add feature - Sonnet
  | 'architecture'     // Design architecture - Opus
  | 'refactor_multi'   // Multi-file refactor - Opus
  | 'security_audit'   // Security audit - Opus
  | 'performance'      // Performance optimization - Opus
  | 'meeting_to_tickets' // Meeting transcript → tickets - Batch
  | 'codebase_analysis'  // Analyze codebase - Batch
  | 'generate_docs'      // Generate documentation - Batch
  | 'generate_tests'     // Generate test cases - Batch
  | 'chat';              // Interactive chat - Sonnet (default)

// Map tasks to recommended model tier
export const TASK_MODEL_MAP: Record<TaskType, ModelTier> = {
  format: 'haiku',
  rename: 'haiku',
  boilerplate: 'haiku',
  explain: 'haiku',
  write_function: 'sonnet',
  debug: 'sonnet',
  code_review: 'sonnet',
  add_feature: 'sonnet',
  architecture: 'opus',
  refactor_multi: 'opus',
  security_audit: 'opus',
  performance: 'opus',
  meeting_to_tickets: 'sonnet', // Batch
  codebase_analysis: 'sonnet',  // Batch
  generate_docs: 'sonnet',      // Batch
  generate_tests: 'sonnet',     // Batch
  chat: 'sonnet',
};

// Tasks that should use Batch API
export const BATCH_TASKS: TaskType[] = [
  'meeting_to_tickets',
  'codebase_analysis',
  'generate_docs',
  'generate_tests',
  'code_review', // Multiple files
];

// =============================================================================
// BYOK MODES
// =============================================================================

export type BYOKMode = 'conservative' | 'flexible';

export interface BYOKConfig {
  mode: BYOKMode;
  apiKey: string;
  userId: string;
  organizationId: string;
}

export interface BYOKModeSettings {
  useHaikuForSimple: boolean;
  useBatchWhenPossible: boolean;
  maxContextCompression: boolean;
  estimatedCostPerDev: number; // Monthly estimate
}

export const BYOK_MODE_SETTINGS: Record<BYOKMode, BYOKModeSettings> = {
  conservative: {
    useHaikuForSimple: true,
    useBatchWhenPossible: true,
    maxContextCompression: true,
    estimatedCostPerDev: 15, // $15/mo
  },
  flexible: {
    useHaikuForSimple: false,
    useBatchWhenPossible: false,
    maxContextCompression: false,
    estimatedCostPerDev: 45, // $45/mo
  },
};

// =============================================================================
// MESSAGE TYPES
// =============================================================================

export interface MessageContent {
  type: 'text';
  text: string;
  cache_control?: { type: 'ephemeral' };
}

export interface Message {
  role: 'user' | 'assistant';
  content: string | MessageContent[];
}

export interface SystemPrompt {
  type: 'text';
  text: string;
  cache_control?: { type: 'ephemeral' };
}

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

export interface ClaudeRequest {
  taskType: TaskType;
  messages: Message[];
  systemPrompt?: string;
  context?: string;           // Code context, docs (cacheable)
  maxTokens?: number;
  organizationId?: string;
  userId?: string;
  byokConfig?: BYOKConfig;
  forceSync?: boolean;        // Skip batch even if eligible
}

export interface ClaudeResponse {
  content: string;
  model: ClaudeModel;
  usage: TokenUsage;
  cached: boolean;
  batchId?: string;           // If processed via batch
  jobUrl?: string;            // URL to check async job status
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  estimatedCost: number;      // In USD
}

// =============================================================================
// BATCH API TYPES
// =============================================================================

export interface BatchRequest {
  customId: string;
  request: ClaudeRequest;
}

export interface BatchJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requests: BatchRequest[];
  createdAt: Date;
  completedAt?: Date;
  results?: BatchResult[];
}

export interface BatchResult {
  customId: string;
  response?: ClaudeResponse;
  error?: string;
}

// =============================================================================
// USAGE TRACKING
// =============================================================================

export interface UsageRecord {
  id: string;
  userId: string;
  organizationId: string;
  timestamp: Date;
  taskType: TaskType;
  model: ClaudeModel;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  estimatedCost: number;
  isBatch: boolean;
  isBYOK: boolean;
}

export interface UsageSummary {
  period: 'day' | 'week' | 'month';
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCost: number;
  costSavings: number;        // Amount saved via caching/batching
  byModel: Record<ModelTier, { requests: number; cost: number }>;
  byTaskType: Record<TaskType, { requests: number; cost: number }>;
}
