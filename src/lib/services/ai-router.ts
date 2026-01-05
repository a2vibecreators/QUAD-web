/**
 * QUAD AI Router - Routes requests to optimal AI model
 *
 * Uses Task Classifier to determine model, then routes:
 * - Claude (Sonnet/Opus): Code generation, complex tasks
 * - Gemini (Flash/Pro): Understanding, classification, summaries
 *
 * Features:
 * - Automatic model selection based on task type
 * - Cost tracking and budget enforcement
 * - Fallback handling if primary model fails
 * - Response caching for repeated queries
 */

// NOTE: Prisma removed - using stubs until Java backend ready
import { TaskClassifier, ClassificationResult, ClassificationContext } from './task-classifier';
import { MemoryService } from './memory-service';

// =============================================================================
// TYPES
// =============================================================================

export interface AIRequest {
  prompt: string;
  orgId: string;
  userId: string;
  context?: ClassificationContext;
  memoryKeywords?: string[];
  maxTokens?: number;
  temperature?: number;
  forceModel?: string;
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: {
    usd: number;
    breakdown: string;
  };
  classification: ClassificationResult;
  memorySessionId?: string;
  cached: boolean;
  latencyMs: number;
}

interface ModelConfig {
  id: string;
  name: string;
  provider: 'anthropic' | 'google' | 'openai';
  costPer1kPrompt: number;    // USD per 1K prompt tokens
  costPer1kCompletion: number; // USD per 1K completion tokens
  maxTokens: number;
  supportsCode: boolean;
}

// =============================================================================
// MODEL CONFIGURATIONS
// =============================================================================

const MODELS: Record<string, ModelConfig> = {
  'claude-opus': {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    costPer1kPrompt: 0.015,
    costPer1kCompletion: 0.075,
    maxTokens: 4096,
    supportsCode: true,
  },
  'claude-sonnet': {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    costPer1kPrompt: 0.003,
    costPer1kCompletion: 0.015,
    maxTokens: 8192,
    supportsCode: true,
  },
  'gemini-pro': {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    costPer1kPrompt: 0.00125,
    costPer1kCompletion: 0.005,
    maxTokens: 8192,
    supportsCode: true,
  },
  'gemini-flash': {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    costPer1kPrompt: 0.000075,
    costPer1kCompletion: 0.0003,
    maxTokens: 8192,
    supportsCode: false,
  },
};

// =============================================================================
// MAIN ROUTER
// =============================================================================

/**
 * Route an AI request to the optimal model
 */
export async function routeAIRequest(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();

  // Step 1: Classify the task
  const classification = request.forceModel
    ? createForcedClassification(request.forceModel)
    : await TaskClassifier.classify(request.prompt, request.orgId, request.context);

  // Step 2: Check budget constraints
  const canProceed = await checkBudget(request.orgId, classification.recommendedModel);
  if (!canProceed.allowed) {
    throw new Error(`Budget exceeded: ${canProceed.reason}`);
  }

  // Step 3: Get memory context if keywords provided
  let memoryContext = '';
  let memorySessionId: string | undefined;

  if (request.memoryKeywords && request.memoryKeywords.length > 0) {
    const memoryResult = await MemoryService.getInitialContext(
      {
        orgId: request.orgId,
        userId: request.userId,
        sessionType: mapToSessionType(classification.taskType),
      },
      request.memoryKeywords,
      2000 // Max 2K tokens for context
    );
    memoryContext = memoryResult.chunks.map(c => c.content).join('\n\n');
    memorySessionId = memoryResult.sessionId;
  }

  // Step 4: Build the full prompt
  const fullPrompt = memoryContext
    ? `Context:\n${memoryContext}\n\n---\n\nRequest:\n${request.prompt}`
    : request.prompt;

  // Step 5: Call the selected model
  let response: AIResponse;

  try {
    response = await callModel(
      classification.recommendedModel,
      fullPrompt,
      request.maxTokens,
      request.temperature
    );
  } catch (error) {
    // Fallback to alternate model
    console.warn(`[AI Router] Primary model failed, trying fallback:`, error);
    response = await callModel(
      classification.fallbackModel,
      fullPrompt,
      request.maxTokens,
      request.temperature
    );
  }

  // Step 6: Record usage
  await recordUsage(request.orgId, response);

  // Step 7: Complete memory session if used
  if (memorySessionId) {
    await MemoryService.completeSession(memorySessionId, true, 'AI request completed');
  }

  return {
    ...response,
    classification,
    memorySessionId,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Quick classification without full request processing
 * Useful for UI to show which model will be used
 */
export async function previewClassification(
  prompt: string,
  orgId: string,
  context?: ClassificationContext
): Promise<{
  recommendedModel: string;
  taskType: string;
  estimatedCost: string;
  reasoning: string;
}> {
  const classification = await TaskClassifier.classify(prompt, orgId, context);
  const model = MODELS[classification.recommendedModel];

  // Estimate tokens (rough: 1 token ≈ 4 chars)
  const estimatedPromptTokens = Math.ceil(prompt.length / 4);
  const estimatedCompletionTokens = 1000; // Assume ~1K response
  const estimatedCost =
    (estimatedPromptTokens / 1000) * model.costPer1kPrompt +
    (estimatedCompletionTokens / 1000) * model.costPer1kCompletion;

  return {
    recommendedModel: model.name,
    taskType: classification.taskType,
    estimatedCost: `$${estimatedCost.toFixed(4)}`,
    reasoning: classification.reasoning,
  };
}

// =============================================================================
// MODEL CALLERS
// =============================================================================

/**
 * Call the specified AI model
 * TODO: Implement actual API calls
 */
async function callModel(
  modelKey: string,
  prompt: string,
  maxTokens?: number,
  temperature?: number
): Promise<AIResponse> {
  const model = MODELS[modelKey];
  if (!model) {
    throw new Error(`Unknown model: ${modelKey}`);
  }

  // TODO: Implement actual API calls based on provider
  // For now, return mock response

  const mockResponse = await mockModelCall(model, prompt);

  // Calculate cost
  const promptTokens = Math.ceil(prompt.length / 4);
  const completionTokens = Math.ceil(mockResponse.length / 4);
  const cost =
    (promptTokens / 1000) * model.costPer1kPrompt +
    (completionTokens / 1000) * model.costPer1kCompletion;

  return {
    content: mockResponse,
    model: model.name,
    tokensUsed: {
      prompt: promptTokens,
      completion: completionTokens,
      total: promptTokens + completionTokens,
    },
    cost: {
      usd: cost,
      breakdown: `Prompt: ${promptTokens} tokens ($${((promptTokens / 1000) * model.costPer1kPrompt).toFixed(4)}), Completion: ${completionTokens} tokens ($${((completionTokens / 1000) * model.costPer1kCompletion).toFixed(4)})`,
    },
    classification: null as unknown as ClassificationResult, // Will be set by caller
    cached: false,
    latencyMs: 0, // Will be set by caller
  };
}

/**
 * Mock model response for testing
 */
async function mockModelCall(model: ModelConfig, prompt: string): Promise<string> {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 100));

  if (model.provider === 'anthropic') {
    return `[Claude Response]\n\nBased on your request, here's my analysis:\n\n${prompt.substring(0, 100)}...\n\n// Mock code output\nfunction example() {\n  return "Hello from ${model.name}";\n}`;
  }

  return `[Gemini Response]\n\nI've analyzed your request. Here's what I found:\n\n${prompt.substring(0, 100)}...\n\nThis appears to be a task that benefits from understanding and analysis.`;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Check if org has budget for this request
 * TODO: Implement via Java backend when endpoints are ready
 */
async function checkBudget(
  orgId: string,
  modelKey: string
): Promise<{ allowed: boolean; reason?: string }> {
  // TODO: Call Java backend to check AI budget/limits
  console.log(`[AIRouter] checkBudget for org: ${orgId}, model: ${modelKey}`);
  return { allowed: true }; // Default: allow all requests until backend ready
}

/**
 * Record usage for billing and analytics
 * TODO: Implement via Java backend when endpoints are ready
 */
async function recordUsage(orgId: string, response: AIResponse): Promise<void> {
  // TODO: Call Java backend to record AI usage
  console.log(`[AIRouter] recordUsage for org: ${orgId}, cost: $${response.cost.usd}, tokens: ${response.tokensUsed.total}`);
}

/**
 * Map task type to memory session type
 */
function mapToSessionType(taskType: string): 'ticket_analysis' | 'code_review' | 'meeting_summary' | 'chat' {
  switch (taskType) {
    case 'WRITE_CODE':
    case 'REFACTOR':
    case 'DEBUG':
      return 'code_review';
    case 'SUMMARIZE':
      return 'meeting_summary';
    case 'ANALYZE':
    case 'CLASSIFY':
      return 'ticket_analysis';
    default:
      return 'chat';
  }
}

/**
 * Create classification for forced model selection
 */
function createForcedClassification(modelKey: string): ClassificationResult {
  return {
    taskType: 'OTHER',
    codePercentage: modelKey.includes('claude') ? 70 : 30,
    recommendedModel: modelKey as ClassificationResult['recommendedModel'],
    confidence: 1.0,
    reasoning: 'User forced model selection',
    classificationMethod: 'context',
    signals: {
      actionVerb: null,
      outputType: 'mixed',
      entityType: null,
      complexity: 'medium',
    },
    fallbackModel: modelKey.includes('claude') ? 'gemini-pro' : 'claude-sonnet',
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const AIRouter = {
  route: routeAIRequest,
  preview: previewClassification,
  MODELS,
};

export default AIRouter;
