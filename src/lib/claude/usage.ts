/**
 * QUAD Framework - Usage Tracker
 *
 * Tracks Claude API token usage for:
 * - Cost monitoring and reporting
 * - BYOK billing (if QUAD provides API)
 * - Optimization insights (cache hit rates, model usage)
 */

import {
  UsageRecord,
  UsageSummary,
  TaskType,
  ClaudeModel,
  ModelTier,
  MODEL_PRICING,
} from './types';

// =============================================================================
// IN-MEMORY USAGE STORE (Replace with DB in production)
// =============================================================================

const usageRecords: UsageRecord[] = [];

// =============================================================================
// USAGE TRACKING
// =============================================================================

/**
 * Record a single API call usage
 */
export function recordUsage(record: Omit<UsageRecord, 'id'>): string {
  const id = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const fullRecord: UsageRecord = {
    id,
    ...record,
  };

  usageRecords.push(fullRecord);

  // Log for debugging
  console.log(
    `[QUAD Usage] ${record.taskType} | ${record.model} | ` +
      `In: ${record.inputTokens} | Out: ${record.outputTokens} | ` +
      `Cache: ${record.cacheReadTokens} | Cost: $${record.estimatedCost.toFixed(4)}`
  );

  return id;
}

/**
 * Calculate cost from token counts
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number,
  model: ClaudeModel,
  isBatch: boolean = false
): number {
  const tier = getModelTier(model);
  const pricing = MODEL_PRICING[tier];

  // Input cost (with cache savings)
  const uncachedInputTokens = inputTokens - cacheReadTokens;
  let inputCost =
    (uncachedInputTokens / 1_000_000) * pricing.input +
    (cacheReadTokens / 1_000_000) * pricing.cachedInput;

  // Output cost
  let outputCost = (outputTokens / 1_000_000) * pricing.output;

  // Batch discount (50%)
  if (isBatch) {
    inputCost *= 0.5;
    outputCost *= 0.5;
  }

  return inputCost + outputCost;
}

function getModelTier(model: ClaudeModel): ModelTier {
  if (model.includes('haiku')) return 'haiku';
  if (model.includes('opus')) return 'opus';
  return 'sonnet';
}

// =============================================================================
// USAGE QUERIES
// =============================================================================

/**
 * Get usage records for a user
 */
export function getUserUsage(
  userId: string,
  startDate?: Date,
  endDate?: Date
): UsageRecord[] {
  return usageRecords.filter((r) => {
    if (r.userId !== userId) return false;
    if (startDate && r.timestamp < startDate) return false;
    if (endDate && r.timestamp > endDate) return false;
    return true;
  });
}

/**
 * Get usage records for an organization
 */
export function getOrgUsage(
  organizationId: string,
  startDate?: Date,
  endDate?: Date
): UsageRecord[] {
  return usageRecords.filter((r) => {
    if (r.organizationId !== organizationId) return false;
    if (startDate && r.timestamp < startDate) return false;
    if (endDate && r.timestamp > endDate) return false;
    return true;
  });
}

// =============================================================================
// USAGE SUMMARIES
// =============================================================================

/**
 * Generate usage summary for a time period
 */
export function generateSummary(
  records: UsageRecord[],
  period: 'day' | 'week' | 'month'
): UsageSummary {
  const byModel: UsageSummary['byModel'] = {
    haiku: { requests: 0, cost: 0 },
    sonnet: { requests: 0, cost: 0 },
    opus: { requests: 0, cost: 0 },
  };

  const byTaskType: Partial<Record<TaskType, { requests: number; cost: number }>> = {};

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheReadTokens = 0;
  let totalCost = 0;

  for (const record of records) {
    totalInputTokens += record.inputTokens;
    totalOutputTokens += record.outputTokens;
    totalCacheReadTokens += record.cacheReadTokens;
    totalCost += record.estimatedCost;

    // By model
    const tier = getModelTier(record.model);
    byModel[tier].requests++;
    byModel[tier].cost += record.estimatedCost;

    // By task type
    if (!byTaskType[record.taskType]) {
      byTaskType[record.taskType] = { requests: 0, cost: 0 };
    }
    byTaskType[record.taskType]!.requests++;
    byTaskType[record.taskType]!.cost += record.estimatedCost;
  }

  // Calculate cost savings from caching
  // Savings = what it would have cost without cache
  const sonnetPricing = MODEL_PRICING.sonnet;
  const wouldHaveCost = (totalCacheReadTokens / 1_000_000) * sonnetPricing.input;
  const actualCacheCost = (totalCacheReadTokens / 1_000_000) * sonnetPricing.cachedInput;
  const costSavings = wouldHaveCost - actualCacheCost;

  return {
    period,
    totalRequests: records.length,
    totalInputTokens,
    totalOutputTokens,
    totalCacheReadTokens,
    totalCost,
    costSavings,
    byModel,
    byTaskType: byTaskType as UsageSummary['byTaskType'],
  };
}

/**
 * Get daily summary for a user
 */
export function getDailySummary(userId: string, date: Date = new Date()): UsageSummary {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const records = getUserUsage(userId, startOfDay, endOfDay);
  return generateSummary(records, 'day');
}

/**
 * Get monthly summary for an organization
 */
export function getMonthlySummary(organizationId: string, month?: Date): UsageSummary {
  const targetMonth = month || new Date();
  const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
  const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59);

  const records = getOrgUsage(organizationId, startOfMonth, endOfMonth);
  return generateSummary(records, 'month');
}

// =============================================================================
// USAGE ALERTS & LIMITS
// =============================================================================

interface UsageLimits {
  dailyTokens?: number;
  dailyCost?: number;
  monthlyTokens?: number;
  monthlyCost?: number;
}

interface UsageAlert {
  type: 'warning' | 'limit_reached';
  message: string;
  current: number;
  limit: number;
  percentage: number;
}

/**
 * Check usage against limits and generate alerts
 */
export function checkUsageLimits(
  userId: string,
  limits: UsageLimits
): UsageAlert[] {
  const alerts: UsageAlert[] = [];
  const today = new Date();

  // Check daily limits
  const dailySummary = getDailySummary(userId, today);

  if (limits.dailyTokens) {
    const dailyTokens = dailySummary.totalInputTokens + dailySummary.totalOutputTokens;
    const percentage = (dailyTokens / limits.dailyTokens) * 100;

    if (percentage >= 100) {
      alerts.push({
        type: 'limit_reached',
        message: 'Daily token limit reached',
        current: dailyTokens,
        limit: limits.dailyTokens,
        percentage,
      });
    } else if (percentage >= 80) {
      alerts.push({
        type: 'warning',
        message: 'Approaching daily token limit (80%)',
        current: dailyTokens,
        limit: limits.dailyTokens,
        percentage,
      });
    }
  }

  if (limits.dailyCost) {
    const percentage = (dailySummary.totalCost / limits.dailyCost) * 100;

    if (percentage >= 100) {
      alerts.push({
        type: 'limit_reached',
        message: 'Daily cost limit reached',
        current: dailySummary.totalCost,
        limit: limits.dailyCost,
        percentage,
      });
    } else if (percentage >= 80) {
      alerts.push({
        type: 'warning',
        message: 'Approaching daily cost limit (80%)',
        current: dailySummary.totalCost,
        limit: limits.dailyCost,
        percentage,
      });
    }
  }

  // TODO: Add monthly limit checks

  return alerts;
}

// =============================================================================
// USAGE EXPORT
// =============================================================================

/**
 * Export usage records as CSV
 */
export function exportUsageCSV(records: UsageRecord[]): string {
  const headers = [
    'ID',
    'Timestamp',
    'User ID',
    'Organization ID',
    'Task Type',
    'Model',
    'Input Tokens',
    'Output Tokens',
    'Cache Read Tokens',
    'Cache Creation Tokens',
    'Estimated Cost',
    'Is Batch',
    'Is BYOK',
  ];

  const rows = records.map((r) => [
    r.id,
    r.timestamp.toISOString(),
    r.userId,
    r.organizationId,
    r.taskType,
    r.model,
    r.inputTokens,
    r.outputTokens,
    r.cacheReadTokens,
    r.cacheCreationTokens,
    r.estimatedCost.toFixed(6),
    r.isBatch,
    r.isBYOK,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Clear usage records (for testing)
 */
export function clearUsageRecords(): void {
  usageRecords.length = 0;
}
