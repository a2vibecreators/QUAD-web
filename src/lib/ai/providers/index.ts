/**
 * AI Provider Router
 *
 * Unified interface for calling AI providers based on:
 * - Activity type routing (from QUAD_ai_activity_routing)
 * - BYOK (customer's own API keys)
 * - Fallback to platform keys
 */

import { claudeProvider } from './claude';
import { openaiProvider } from './openai';
import { AIMessage, AIConfig, AIResponse, AIStreamChunk, AIProvider } from './types';
import { prisma } from '@/lib/prisma';

export * from './types';
export { claudeProvider } from './claude';
export { openaiProvider } from './openai';

// Provider registry
const providers: Record<string, AIProvider> = {
  claude: claudeProvider,
  openai: openaiProvider,
};

/**
 * Get API key for a provider
 * Priority: BYOK (org's key) > Platform key (env var)
 */
async function getApiKey(
  orgId: string,
  provider: string
): Promise<string | null> {
  // 1. Check for BYOK key in org's AI config
  const aiConfig = await prisma.qUAD_ai_configs.findUnique({
    where: { org_id: orgId },
  });

  if (aiConfig) {
    // Check for provider-specific key reference
    const keyRef =
      provider === 'claude'
        ? aiConfig.anthropic_key_ref
        : provider === 'openai'
          ? aiConfig.openai_key_ref
          : null;

    if (keyRef) {
      // TODO: Decrypt key from vault
      // For now, the key_ref IS the key (will add vault later)
      return keyRef;
    }
  }

  // 2. Fall back to platform keys (env vars)
  if (provider === 'claude') {
    return process.env.ANTHROPIC_API_KEY || null;
  }
  if (provider === 'openai') {
    return process.env.OPENAI_API_KEY || null;
  }

  return null;
}

/**
 * Get routing config for an activity type
 */
async function getActivityRouting(
  orgId: string,
  activityType: string
): Promise<{
  provider: string;
  model: string;
  maxTokens: number;
  temperature: number;
} | null> {
  const routing = await prisma.qUAD_ai_activity_routing.findFirst({
    where: {
      org_id: orgId,
      activity_type: activityType,
      is_active: true,
    },
  });

  if (routing) {
    return {
      provider: routing.provider,
      model: routing.model_id,
      maxTokens: routing.max_tokens_input,
      temperature: Number(routing.temperature),
    };
  }

  return null;
}

/**
 * Call AI with automatic provider routing
 */
export async function callAI(
  orgId: string,
  messages: AIMessage[],
  options: {
    activityType?: string;
    provider?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<AIResponse> {
  // 1. Determine provider and model from activity routing or options
  let providerName = options.provider || 'claude';
  let model = options.model;
  let maxTokens = options.maxTokens || 4096;
  let temperature = options.temperature ?? 0.7;

  if (options.activityType) {
    const routing = await getActivityRouting(orgId, options.activityType);
    if (routing) {
      providerName = routing.provider;
      model = routing.model;
      maxTokens = routing.maxTokens;
      temperature = routing.temperature;
    }
  }

  // 2. Get API key (BYOK or platform)
  const apiKey = await getApiKey(orgId, providerName);
  if (!apiKey) {
    throw new Error(
      `No API key available for ${providerName}. Configure BYOK or set platform env var.`
    );
  }

  // 3. Get provider instance
  const provider = providers[providerName];
  if (!provider) {
    throw new Error(`Unknown provider: ${providerName}`);
  }

  // 4. Call provider
  const config: AIConfig = {
    apiKey,
    model,
    maxTokens,
    temperature,
  };

  console.log(`[AI] Calling ${providerName} (${model || 'default'}) for org ${orgId}`);

  return provider.call(messages, config);
}

/**
 * Stream AI response with automatic provider routing
 */
export async function* streamAI(
  orgId: string,
  messages: AIMessage[],
  options: {
    activityType?: string;
    provider?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): AsyncGenerator<AIStreamChunk> {
  // 1. Determine provider and model
  let providerName = options.provider || 'claude';
  let model = options.model;
  let maxTokens = options.maxTokens || 4096;
  let temperature = options.temperature ?? 0.7;

  if (options.activityType) {
    const routing = await getActivityRouting(orgId, options.activityType);
    if (routing) {
      providerName = routing.provider;
      model = routing.model;
      maxTokens = routing.maxTokens;
      temperature = routing.temperature;
    }
  }

  // 2. Get API key
  const apiKey = await getApiKey(orgId, providerName);
  if (!apiKey) {
    yield {
      type: 'error',
      error: `No API key available for ${providerName}`,
    };
    return;
  }

  // 3. Get provider instance
  const provider = providers[providerName];
  if (!provider) {
    yield { type: 'error', error: `Unknown provider: ${providerName}` };
    return;
  }

  // 4. Stream from provider
  const config: AIConfig = {
    apiKey,
    model,
    maxTokens,
    temperature,
    stream: true,
  };

  console.log(`[AI] Streaming ${providerName} (${model || 'default'}) for org ${orgId}`);

  yield* provider.stream(messages, config);
}

/**
 * Quick helper for simple questions (uses cheapest model)
 */
export async function quickAI(
  orgId: string,
  question: string,
  systemPrompt?: string
): Promise<string> {
  const messages: AIMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: question });

  const response = await callAI(orgId, messages, {
    activityType: 'simple_lookup',
    maxTokens: 1000,
    temperature: 0,
  });

  return response.content;
}
