/**
 * QUAD Framework - Claude Client
 *
 * Main Claude API client with built-in token optimization:
 * - Prompt caching (90% savings on repeated input)
 * - Model routing (Haiku/Sonnet/Opus based on task)
 * - Batch API support (50% savings for async tasks)
 * - BYOK (Bring Your Own Key) support
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  ClaudeModel,
  ClaudeRequest,
  ClaudeResponse,
  TokenUsage,
  ModelTier,
  TaskType,
  BYOKConfig,
  MODEL_MAP,
  MODEL_PRICING,
  TASK_MODEL_MAP,
  BATCH_TASKS,
  BYOK_MODE_SETTINGS,
  BATCH_DISCOUNT,
  Message,
  MessageContent,
  SystemPrompt,
} from './types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const DEFAULT_MAX_TOKENS = 4096;
const BATCH_INPUT_THRESHOLD = 10000;  // Tokens - use batch if input > 10K
const BATCH_OUTPUT_THRESHOLD = 5;     // Items - use batch if expected outputs > 5

// =============================================================================
// CLAUDE CLIENT CLASS
// =============================================================================

export class ClaudeClient {
  private client: Anthropic;
  private defaultModel: ClaudeModel;
  private byokConfig?: BYOKConfig;

  constructor(options?: {
    apiKey?: string;
    defaultModel?: ModelTier;
    byokConfig?: BYOKConfig;
  }) {
    const apiKey = options?.apiKey || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is required. Set it in environment variables or pass via constructor.'
      );
    }

    this.client = new Anthropic({ apiKey });
    this.defaultModel = MODEL_MAP[options?.defaultModel || 'sonnet'];
    this.byokConfig = options?.byokConfig;
  }

  // ===========================================================================
  // MAIN REQUEST METHOD
  // ===========================================================================

  async request(req: ClaudeRequest): Promise<ClaudeResponse> {
    // Determine optimal model based on task type and BYOK mode
    const model = this.selectModel(req.taskType, req.byokConfig);

    // Check if this should be a batch request
    const shouldBatch = this.shouldUseBatch(req);

    if (shouldBatch && !req.forceSync) {
      // Queue for batch processing
      return this.queueBatchRequest(req, model);
    }

    // Process synchronously with caching
    return this.processSyncRequest(req, model);
  }

  // ===========================================================================
  // SYNC REQUEST PROCESSING
  // ===========================================================================

  private async processSyncRequest(
    req: ClaudeRequest,
    model: ClaudeModel
  ): Promise<ClaudeResponse> {
    // Build system prompt with cache control
    const systemPrompts: SystemPrompt[] = [];

    if (req.systemPrompt) {
      systemPrompts.push({
        type: 'text',
        text: req.systemPrompt,
        cache_control: { type: 'ephemeral' }, // Cache system prompt
      });
    }

    // Build messages with context caching
    const messages = this.buildMessagesWithCache(req);

    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: req.maxTokens || DEFAULT_MAX_TOKENS,
        system: systemPrompts.length > 0 ? systemPrompts : undefined,
        messages,
      });

      // Extract usage info
      const usage = this.extractUsage(response, model);

      // Get text content from response
      const content = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('\n');

      return {
        content,
        model,
        usage,
        cached: usage.cacheReadTokens > 0,
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  // ===========================================================================
  // MESSAGE BUILDING WITH CACHE CONTROL
  // ===========================================================================

  private buildMessagesWithCache(req: ClaudeRequest): Anthropic.MessageParam[] {
    const messages: Anthropic.MessageParam[] = [];

    // If there's context (code, docs), add it as the first user message with cache
    if (req.context) {
      // For single message with context, combine them
      if (req.messages.length === 1 && req.messages[0].role === 'user') {
        messages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: req.context,
              cache_control: { type: 'ephemeral' }, // Cache context
            },
            {
              type: 'text',
              text:
                typeof req.messages[0].content === 'string'
                  ? req.messages[0].content
                  : req.messages[0].content
                      .filter((c) => c.type === 'text')
                      .map((c) => c.text)
                      .join('\n'),
            },
          ],
        });
      } else {
        // Add context as separate message
        messages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: req.context,
              cache_control: { type: 'ephemeral' },
            },
          ],
        });
        messages.push({
          role: 'assistant',
          content: 'I understand the context. How can I help?',
        });
        // Add remaining messages
        messages.push(...this.convertMessages(req.messages));
      }
    } else {
      // No context, just convert messages
      messages.push(...this.convertMessages(req.messages));
    }

    return messages;
  }

  private convertMessages(messages: Message[]): Anthropic.MessageParam[] {
    return messages.map((msg) => ({
      role: msg.role,
      content:
        typeof msg.content === 'string'
          ? msg.content
          : msg.content.map((c) => ({
              type: 'text' as const,
              text: c.text,
              ...(c.cache_control ? { cache_control: c.cache_control } : {}),
            })),
    }));
  }

  // ===========================================================================
  // MODEL SELECTION
  // ===========================================================================

  private selectModel(
    taskType: TaskType,
    byokConfig?: BYOKConfig
  ): ClaudeModel {
    // Get recommended tier for task
    const recommendedTier = TASK_MODEL_MAP[taskType] || 'sonnet';

    // If BYOK in conservative mode, prefer Haiku for simple tasks
    if (byokConfig) {
      const modeSettings = BYOK_MODE_SETTINGS[byokConfig.mode];

      if (
        modeSettings.useHaikuForSimple &&
        ['format', 'rename', 'boilerplate', 'explain'].includes(taskType)
      ) {
        return MODEL_MAP.haiku;
      }
    }

    return MODEL_MAP[recommendedTier];
  }

  // ===========================================================================
  // BATCH DECISION
  // ===========================================================================

  private shouldUseBatch(req: ClaudeRequest): boolean {
    // Check if task type is batch-eligible
    if (!BATCH_TASKS.includes(req.taskType)) {
      return false;
    }

    // Check BYOK mode settings
    if (req.byokConfig) {
      const modeSettings = BYOK_MODE_SETTINGS[req.byokConfig.mode];
      if (!modeSettings.useBatchWhenPossible) {
        return false;
      }
    }

    // Estimate input tokens (rough: 4 chars = 1 token)
    const estimatedInputTokens = this.estimateTokens(req);

    // Use batch if input is large
    if (estimatedInputTokens > BATCH_INPUT_THRESHOLD) {
      return true;
    }

    return false;
  }

  private estimateTokens(req: ClaudeRequest): number {
    let totalChars = 0;

    // System prompt
    if (req.systemPrompt) {
      totalChars += req.systemPrompt.length;
    }

    // Context
    if (req.context) {
      totalChars += req.context.length;
    }

    // Messages
    for (const msg of req.messages) {
      if (typeof msg.content === 'string') {
        totalChars += msg.content.length;
      } else {
        for (const c of msg.content) {
          totalChars += c.text.length;
        }
      }
    }

    // Rough estimate: 4 characters per token
    return Math.ceil(totalChars / 4);
  }

  // ===========================================================================
  // BATCH PROCESSING (PLACEHOLDER)
  // ===========================================================================

  private async queueBatchRequest(
    req: ClaudeRequest,
    model: ClaudeModel
  ): Promise<ClaudeResponse> {
    // TODO: Implement actual batch API integration
    // For now, fall back to sync processing with a note

    console.log(
      `[QUAD] Task "${req.taskType}" eligible for batch processing. Processing sync for now.`
    );

    // Process synchronously as fallback
    const response = await this.processSyncRequest(req, model);

    return {
      ...response,
      // Note: In production, this would return a jobUrl and batchId
      // jobUrl: `/api/jobs/${batchId}`,
      // batchId: 'pending-batch-implementation',
    };
  }

  // ===========================================================================
  // USAGE EXTRACTION & COST CALCULATION
  // ===========================================================================

  private extractUsage(
    response: Anthropic.Message,
    model: ClaudeModel
  ): TokenUsage {
    const usage = response.usage;

    // Determine model tier for pricing
    const tier = this.getModelTier(model);
    const pricing = MODEL_PRICING[tier];

    // Calculate cost
    const inputCost =
      ((usage.input_tokens - (usage.cache_read_input_tokens || 0)) / 1_000_000) *
      pricing.input;

    const cachedInputCost =
      ((usage.cache_read_input_tokens || 0) / 1_000_000) * pricing.cachedInput;

    const outputCost = (usage.output_tokens / 1_000_000) * pricing.output;

    const estimatedCost = inputCost + cachedInputCost + outputCost;

    return {
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheReadTokens: usage.cache_read_input_tokens || 0,
      cacheCreationTokens: usage.cache_creation_input_tokens || 0,
      estimatedCost,
    };
  }

  private getModelTier(model: ClaudeModel): ModelTier {
    if (model.includes('haiku')) return 'haiku';
    if (model.includes('opus')) return 'opus';
    return 'sonnet';
  }

  // ===========================================================================
  // CONVENIENCE METHODS
  // ===========================================================================

  /**
   * Simple chat request (default Sonnet)
   */
  async chat(message: string, context?: string): Promise<string> {
    const response = await this.request({
      taskType: 'chat',
      messages: [{ role: 'user', content: message }],
      context,
    });
    return response.content;
  }

  /**
   * Code review request (Sonnet, batch-eligible)
   */
  async codeReview(code: string, instructions?: string): Promise<ClaudeResponse> {
    return this.request({
      taskType: 'code_review',
      messages: [
        {
          role: 'user',
          content: instructions || 'Please review this code for issues, improvements, and best practices.',
        },
      ],
      context: code,
    });
  }

  /**
   * Quick code formatting (Haiku for speed)
   */
  async format(code: string, language: string): Promise<string> {
    const response = await this.request({
      taskType: 'format',
      messages: [
        {
          role: 'user',
          content: `Format this ${language} code according to best practices:\n\n${code}`,
        },
      ],
    });
    return response.content;
  }

  /**
   * Explain code (Haiku for quick explanations)
   */
  async explain(code: string): Promise<string> {
    const response = await this.request({
      taskType: 'explain',
      messages: [
        {
          role: 'user',
          content: `Explain what this code does:\n\n${code}`,
        },
      ],
    });
    return response.content;
  }

  /**
   * Meeting transcript to tickets (batch-eligible)
   */
  async meetingToTickets(
    transcript: string,
    projectContext?: string
  ): Promise<ClaudeResponse> {
    return this.request({
      taskType: 'meeting_to_tickets',
      messages: [
        {
          role: 'user',
          content:
            'Extract actionable tickets from this meeting transcript. For each ticket, provide: title, description, priority (P0-P3), and estimated effort.',
        },
      ],
      context: transcript,
      systemPrompt: projectContext
        ? `You are analyzing a meeting transcript for project with this context:\n${projectContext}`
        : undefined,
    });
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let defaultClient: ClaudeClient | null = null;

/**
 * Get default Claude client (uses ANTHROPIC_API_KEY from env)
 */
export function getClaudeClient(): ClaudeClient {
  if (!defaultClient) {
    defaultClient = new ClaudeClient();
  }
  return defaultClient;
}

/**
 * Create BYOK client for specific user
 */
export function createBYOKClient(config: BYOKConfig): ClaudeClient {
  return new ClaudeClient({
    apiKey: config.apiKey,
    byokConfig: config,
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

export { ClaudeClient as default };
