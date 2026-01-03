/**
 * QUAD Framework - Claude AI Integration
 *
 * Token-optimized Claude API client with:
 * - Prompt caching (90% savings on repeated input)
 * - Model routing (Haiku/Sonnet/Opus based on task)
 * - Batch API (50% savings for async tasks)
 * - BYOK support (Bring Your Own Key)
 *
 * Usage:
 * ```typescript
 * import { getClaudeClient, createBYOKClient } from '@/lib/claude';
 *
 * // Using QUAD's API key
 * const client = getClaudeClient();
 * const response = await client.chat('Hello!');
 *
 * // Using user's own API key (BYOK)
 * const byokClient = createBYOKClient({
 *   apiKey: 'user-api-key',
 *   mode: 'conservative',
 *   userId: 'user-123',
 *   organizationId: 'org-456',
 * });
 * ```
 */

// Main client
export { ClaudeClient, getClaudeClient, createBYOKClient } from './client';

// Types
export * from './types';

// Cache management
export {
  CacheManager,
  cacheManager,
  buildQUADSystemPrompt,
  buildOrgContext,
  buildCodebaseSummary,
  compressConversation,
} from './cache';

// Task routing
export {
  classifyTask,
  routeTask,
  estimateCost,
  isWorthOptimizing,
  suggestModel,
  getModelInfo,
} from './router';

// Usage tracking
export {
  recordUsage,
  calculateCost,
  getUserUsage,
  getOrgUsage,
  generateSummary,
  getDailySummary,
  getMonthlySummary,
  checkUsageLimits,
  exportUsageCSV,
  clearUsageRecords,
} from './usage';

// Batch processing
export {
  createJob,
  getJob,
  getUserJobs,
  queueForBatch,
  startBatchProcessor,
  getJobStatusResponse,
  getBatchStats,
  cleanupOldJobs,
} from './batch';
