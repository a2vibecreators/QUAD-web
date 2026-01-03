/**
 * QUAD Framework - Task Router
 *
 * Automatically classifies tasks and routes them to the optimal:
 * - Model (Haiku for simple, Sonnet for coding, Opus for complex)
 * - Processing mode (Sync for instant, Batch for async)
 *
 * Decision flow:
 * 1. Classify task based on user intent
 * 2. Check input token count (>10K = batch eligible)
 * 3. Check expected output items (>5 items = batch eligible)
 * 4. Route to appropriate model based on task complexity
 */

import {
  TaskType,
  ModelTier,
  BYOKConfig,
  TASK_MODEL_MAP,
  BATCH_TASKS,
  BYOK_MODE_SETTINGS,
  MODEL_PRICING,
} from './types';

// =============================================================================
// TASK CLASSIFICATION
// =============================================================================

interface ClassificationResult {
  taskType: TaskType;
  confidence: number;       // 0-1
  reasoning: string;
  suggestedModel: ModelTier;
  useBatch: boolean;
}

/**
 * Keywords that indicate specific task types
 */
const TASK_KEYWORDS: Record<TaskType, string[]> = {
  format: ['format', 'prettier', 'indent', 'style', 'lint'],
  rename: ['rename', 'refactor name', 'change name', 'variable name'],
  boilerplate: ['boilerplate', 'scaffold', 'generate template', 'create skeleton'],
  explain: ['explain', 'what does', 'how does', 'understand', 'walk me through'],
  write_function: ['write', 'create function', 'implement', 'add function', 'new function'],
  debug: ['debug', 'fix bug', 'error', 'not working', 'issue', 'problem', 'broken'],
  code_review: ['review', 'check code', 'look at this code', 'feedback on'],
  add_feature: ['add feature', 'new feature', 'implement', 'enhance'],
  architecture: ['architecture', 'design', 'structure', 'system design', 'how should I'],
  refactor_multi: ['refactor', 'restructure', 'reorganize', 'multiple files'],
  security_audit: ['security', 'vulnerab', 'audit', 'secure', 'injection', 'xss'],
  performance: ['performance', 'optimize', 'slow', 'speed up', 'faster'],
  meeting_to_tickets: ['meeting', 'transcript', 'tickets', 'action items', 'create tasks from'],
  codebase_analysis: ['analyze codebase', 'analyze repo', 'understand codebase', 'codebase overview'],
  generate_docs: ['documentation', 'docs', 'readme', 'jsdoc', 'document this'],
  generate_tests: ['test', 'unit test', 'test cases', 'write tests', 'test coverage'],
  chat: [], // Default fallback
};

/**
 * Classify user intent into a task type
 */
export function classifyTask(userMessage: string): ClassificationResult {
  const lowerMessage = userMessage.toLowerCase();

  // Score each task type
  const scores: Array<{ type: TaskType; score: number; matches: string[] }> = [];

  for (const [taskType, keywords] of Object.entries(TASK_KEYWORDS)) {
    if (taskType === 'chat') continue; // Skip default

    const matches: string[] = [];
    let score = 0;

    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        matches.push(keyword);
        // Longer keywords are more specific, give more weight
        score += keyword.length * 0.1;
      }
    }

    if (score > 0) {
      scores.push({ type: taskType as TaskType, score, matches });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // If we have a match, use the top one
  if (scores.length > 0 && scores[0].score > 0.3) {
    const best = scores[0];
    const suggestedModel = TASK_MODEL_MAP[best.type];
    const useBatch = BATCH_TASKS.includes(best.type);

    return {
      taskType: best.type,
      confidence: Math.min(best.score / 2, 1), // Normalize to 0-1
      reasoning: `Matched keywords: ${best.matches.join(', ')}`,
      suggestedModel,
      useBatch,
    };
  }

  // Default to chat
  return {
    taskType: 'chat',
    confidence: 0.5,
    reasoning: 'No specific task keywords found, defaulting to chat',
    suggestedModel: 'sonnet',
    useBatch: false,
  };
}

// =============================================================================
// MODEL ROUTING
// =============================================================================

interface RoutingDecision {
  model: ModelTier;
  useBatch: boolean;
  estimatedCost: number;      // Per request estimate in USD
  reasoning: string;
}

/**
 * Determine optimal model and processing mode for a task
 */
export function routeTask(
  taskType: TaskType,
  inputTokens: number,
  expectedOutputItems: number,
  byokConfig?: BYOKConfig
): RoutingDecision {
  // Get base model recommendation
  let model = TASK_MODEL_MAP[taskType] || 'sonnet';

  // BYOK mode adjustments
  if (byokConfig) {
    const settings = BYOK_MODE_SETTINGS[byokConfig.mode];

    if (settings.useHaikuForSimple) {
      // Downgrade to Haiku for simple tasks
      if (['format', 'rename', 'boilerplate', 'explain'].includes(taskType)) {
        model = 'haiku';
      }
    }
  }

  // Determine if batch should be used
  let useBatch = BATCH_TASKS.includes(taskType);

  // Override batch decision based on input size
  if (inputTokens > 10000) {
    useBatch = true;
  }
  if (expectedOutputItems > 5) {
    useBatch = true;
  }

  // BYOK mode can disable batching
  if (byokConfig) {
    const settings = BYOK_MODE_SETTINGS[byokConfig.mode];
    if (!settings.useBatchWhenPossible) {
      useBatch = false;
    }
  }

  // Calculate estimated cost
  const pricing = MODEL_PRICING[model];
  const estimatedOutputTokens = expectedOutputItems * 500; // ~500 tokens per output item

  let inputCost = (inputTokens / 1_000_000) * pricing.input;
  let outputCost = (estimatedOutputTokens / 1_000_000) * pricing.output;

  // Batch gets 50% off
  if (useBatch) {
    inputCost *= 0.5;
    outputCost *= 0.5;
  }

  const estimatedCost = inputCost + outputCost;

  // Build reasoning
  const reasons: string[] = [];
  reasons.push(`Task type "${taskType}" → ${model}`);

  if (byokConfig?.mode === 'conservative' && model === 'haiku') {
    reasons.push('Downgraded to Haiku (conservative mode)');
  }

  if (useBatch) {
    reasons.push(`Using batch API (${inputTokens > 10000 ? 'large input' : 'batch-eligible task'})`);
  }

  return {
    model,
    useBatch,
    estimatedCost,
    reasoning: reasons.join('; '),
  };
}

// =============================================================================
// COST ESTIMATION
// =============================================================================

interface CostEstimate {
  withoutOptimization: number;
  withOptimization: number;
  savings: number;
  savingsPercent: number;
  breakdown: {
    inputCost: number;
    outputCost: number;
    cacheSavings: number;
    batchSavings: number;
  };
}

/**
 * Estimate cost for a request with and without optimization
 */
export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  model: ModelTier,
  cachedTokens: number = 0,
  useBatch: boolean = false
): CostEstimate {
  const pricing = MODEL_PRICING[model];

  // Without optimization
  const rawInputCost = (inputTokens / 1_000_000) * pricing.input;
  const rawOutputCost = (outputTokens / 1_000_000) * pricing.output;
  const withoutOptimization = rawInputCost + rawOutputCost;

  // With optimization
  const uncachedTokens = inputTokens - cachedTokens;
  let optimizedInputCost =
    (uncachedTokens / 1_000_000) * pricing.input +
    (cachedTokens / 1_000_000) * pricing.cachedInput;

  let optimizedOutputCost = (outputTokens / 1_000_000) * pricing.output;

  // Batch discount
  if (useBatch) {
    optimizedInputCost *= 0.5;
    optimizedOutputCost *= 0.5;
  }

  const withOptimization = optimizedInputCost + optimizedOutputCost;
  const savings = withoutOptimization - withOptimization;
  const savingsPercent = withoutOptimization > 0 ? (savings / withoutOptimization) * 100 : 0;

  // Breakdown
  const cacheSavings =
    (cachedTokens / 1_000_000) * pricing.input -
    (cachedTokens / 1_000_000) * pricing.cachedInput;

  const batchSavings = useBatch
    ? (rawInputCost + rawOutputCost) * 0.5
    : 0;

  return {
    withoutOptimization,
    withOptimization,
    savings,
    savingsPercent,
    breakdown: {
      inputCost: optimizedInputCost,
      outputCost: optimizedOutputCost,
      cacheSavings,
      batchSavings,
    },
  };
}

// =============================================================================
// INTELLIGENT ROUTING HELPERS
// =============================================================================

/**
 * Check if a request is worth optimizing (above minimum threshold)
 */
export function isWorthOptimizing(inputTokens: number, outputTokens: number): boolean {
  // If total tokens are small, optimization overhead might not be worth it
  return inputTokens + outputTokens > 1000;
}

/**
 * Suggest optimal model based on input characteristics
 */
export function suggestModel(
  inputTokens: number,
  taskComplexity: 'low' | 'medium' | 'high',
  needsReasoning: boolean
): ModelTier {
  // Large input with complex reasoning = Opus
  if (inputTokens > 50000 && needsReasoning) {
    return 'opus';
  }

  // High complexity = Opus
  if (taskComplexity === 'high') {
    return 'opus';
  }

  // Low complexity or small input = Haiku
  if (taskComplexity === 'low' || inputTokens < 2000) {
    return 'haiku';
  }

  // Default = Sonnet
  return 'sonnet';
}

/**
 * Get model tier display info
 */
export function getModelInfo(tier: ModelTier): {
  name: string;
  description: string;
  speed: string;
  cost: string;
} {
  switch (tier) {
    case 'haiku':
      return {
        name: 'Claude 3.5 Haiku',
        description: 'Fast and efficient for simple tasks',
        speed: 'Fastest',
        cost: '$0.25/$1.25 per MTok',
      };
    case 'sonnet':
      return {
        name: 'Claude Sonnet 4',
        description: 'Best balance of speed and intelligence',
        speed: 'Fast',
        cost: '$3/$15 per MTok',
      };
    case 'opus':
      return {
        name: 'Claude Opus 4',
        description: 'Most intelligent for complex tasks',
        speed: 'Moderate',
        cost: '$15/$75 per MTok',
      };
  }
}
