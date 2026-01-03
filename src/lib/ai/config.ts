/**
 * QUAD Framework - AI Configuration
 *
 * User-facing AI tier configuration.
 * Users select a tier, we show them the fixed combination.
 * NO custom mixing allowed - keeps it simple.
 */

// =============================================================================
// TIER TYPES
// =============================================================================

export type AITier = 'turbo' | 'balanced' | 'quality' | 'byok';

export interface AIProvider {
  name: string;
  model: string;
  costPerMTok: { input: number; output: number };
  speed: 'fastest' | 'fast' | 'medium' | 'slow';
  quality: 1 | 2 | 3 | 4 | 5; // 1 = basic, 5 = best
}

export interface TierConfig {
  id: AITier;
  name: string;
  icon: string;
  description: string;
  costPerDevMonth: string;
  color: string;
  providers: {
    extraction: AIProvider;
    classification: AIProvider;
    simpleCoding: AIProvider;
    complexCoding: AIProvider;
    codeReview: AIProvider;
    architecture: AIProvider;
  };
}

// =============================================================================
// PROVIDER DEFINITIONS
// =============================================================================

const PROVIDERS = {
  // FREE / Ultra Cheap
  groqLlama: {
    name: 'Groq',
    model: 'llama-4-scout',
    costPerMTok: { input: 0.11, output: 0.34 },
    speed: 'fastest' as const,
    quality: 3 as const,
  },
  groqMistral: {
    name: 'Groq',
    model: 'mistral-7b',
    costPerMTok: { input: 0.03, output: 0.06 },
    speed: 'fastest' as const,
    quality: 2 as const,
  },
  geminiFlashLite: {
    name: 'Google',
    model: 'gemini-2.5-flash-lite',
    costPerMTok: { input: 0.10, output: 0.40 },
    speed: 'fastest' as const,
    quality: 3 as const,
  },

  // Budget
  deepseekV3: {
    name: 'DeepSeek',
    model: 'deepseek-v3.2-exp',
    costPerMTok: { input: 0.28, output: 0.42 },
    speed: 'fast' as const,
    quality: 4 as const,
  },
  gpt4oMini: {
    name: 'OpenAI',
    model: 'gpt-4o-mini',
    costPerMTok: { input: 0.15, output: 0.60 },
    speed: 'fast' as const,
    quality: 3 as const,
  },
  mistralCodestral: {
    name: 'Mistral',
    model: 'codestral',
    costPerMTok: { input: 0.20, output: 0.60 },
    speed: 'fast' as const,
    quality: 4 as const,
  },

  // Quality
  claudeHaiku: {
    name: 'Anthropic',
    model: 'claude-3-5-haiku-20241022',
    costPerMTok: { input: 0.25, output: 1.25 },
    speed: 'fast' as const,
    quality: 4 as const,
  },
  claudeSonnet: {
    name: 'Anthropic',
    model: 'claude-sonnet-4-20250514',
    costPerMTok: { input: 3.00, output: 15.00 },
    speed: 'medium' as const,
    quality: 5 as const,
  },
  claudeOpus: {
    name: 'Anthropic',
    model: 'claude-opus-4-20250514',
    costPerMTok: { input: 15.00, output: 75.00 },
    speed: 'slow' as const,
    quality: 5 as const,
  },

  // Others
  gpt4o: {
    name: 'OpenAI',
    model: 'gpt-4o',
    costPerMTok: { input: 2.50, output: 10.00 },
    speed: 'medium' as const,
    quality: 4 as const,
  },
  geminiPro: {
    name: 'Google',
    model: 'gemini-2.5-pro',
    costPerMTok: { input: 1.25, output: 10.00 },
    speed: 'medium' as const,
    quality: 4 as const,
  },
};

// =============================================================================
// TIER CONFIGURATIONS (Fixed combinations - NO custom mixing)
// =============================================================================

export const AI_TIERS: Record<AITier, TierConfig> = {
  turbo: {
    id: 'turbo',
    name: 'Turbo',
    icon: '🚀',
    description: 'Fastest & Cheapest - Great for startups',
    costPerDevMonth: '~$5',
    color: 'green',
    providers: {
      extraction: PROVIDERS.groqLlama,        // FREE tier
      classification: PROVIDERS.groqMistral,   // Cheapest
      simpleCoding: PROVIDERS.deepseekV3,      // Best value coder
      complexCoding: PROVIDERS.deepseekV3,     // Still DeepSeek
      codeReview: PROVIDERS.deepseekV3,        // DeepSeek handles it
      architecture: PROVIDERS.claudeHaiku,     // Only escalate for arch
    },
  },

  balanced: {
    id: 'balanced',
    name: 'Balanced',
    icon: '⚡',
    description: 'Best Value - Smart mix of providers',
    costPerDevMonth: '~$15',
    color: 'blue',
    providers: {
      extraction: PROVIDERS.deepseekV3,        // Good quality
      classification: PROVIDERS.gpt4oMini,     // Reliable
      simpleCoding: PROVIDERS.claudeHaiku,     // Fast Claude
      complexCoding: PROVIDERS.claudeSonnet,   // Best coder
      codeReview: PROVIDERS.claudeSonnet,      // Quality review
      architecture: PROVIDERS.claudeSonnet,    // Sonnet is enough
    },
  },

  quality: {
    id: 'quality',
    name: 'Quality',
    icon: '💎',
    description: 'Best Results - Claude for everything',
    costPerDevMonth: '~$35',
    color: 'purple',
    providers: {
      extraction: PROVIDERS.claudeHaiku,       // Claude all the way
      classification: PROVIDERS.claudeHaiku,
      simpleCoding: PROVIDERS.claudeHaiku,
      complexCoding: PROVIDERS.claudeSonnet,
      codeReview: PROVIDERS.claudeSonnet,
      architecture: PROVIDERS.claudeOpus,      // Premium for arch
    },
  },

  byok: {
    id: 'byok',
    name: 'BYOK',
    icon: '🔑',
    description: 'Bring Your Own Key - Full control',
    costPerDevMonth: 'You pay direct',
    color: 'gray',
    providers: {
      // Default to Claude Sonnet for everything (user can override)
      extraction: PROVIDERS.claudeSonnet,
      classification: PROVIDERS.claudeSonnet,
      simpleCoding: PROVIDERS.claudeSonnet,
      complexCoding: PROVIDERS.claudeSonnet,
      codeReview: PROVIDERS.claudeSonnet,
      architecture: PROVIDERS.claudeSonnet,
    },
  },
};

// =============================================================================
// DEFAULT CONFIGURATION (For testing with $5 credit - Claude only)
// =============================================================================

export const DEFAULT_TIER: AITier = 'quality'; // Use Claude for testing

export const DEFAULT_CONFIG: TierConfig = AI_TIERS.quality;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get tier configuration by ID
 */
export function getTierConfig(tier: AITier): TierConfig {
  return AI_TIERS[tier];
}

/**
 * Get all available tiers for display
 */
export function getAllTiers(): TierConfig[] {
  return Object.values(AI_TIERS);
}

/**
 * Get provider for a specific task type based on tier
 */
export function getProviderForTask(
  tier: AITier,
  taskType: keyof TierConfig['providers']
): AIProvider {
  return AI_TIERS[tier].providers[taskType];
}

/**
 * Calculate estimated cost for a task
 */
export function estimateTaskCost(
  tier: AITier,
  taskType: keyof TierConfig['providers'],
  inputTokens: number,
  outputTokens: number
): number {
  const provider = getProviderForTask(tier, taskType);
  const inputCost = (inputTokens / 1_000_000) * provider.costPerMTok.input;
  const outputCost = (outputTokens / 1_000_000) * provider.costPerMTok.output;
  return inputCost + outputCost;
}

/**
 * Get display info for tier selector
 */
export function getTierDisplayInfo(tier: AITier): {
  name: string;
  icon: string;
  description: string;
  cost: string;
  providers: string[];
} {
  const config = AI_TIERS[tier];
  const uniqueProviders = new Set(
    Object.values(config.providers).map((p) => p.name)
  );

  return {
    name: config.name,
    icon: config.icon,
    description: config.description,
    cost: config.costPerDevMonth,
    providers: Array.from(uniqueProviders),
  };
}
