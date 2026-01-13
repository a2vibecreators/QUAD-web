/**
 * AI Provider Types
 *
 * Shared types for all AI providers (Claude, OpenAI, etc.)
 */

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  stopReason: string;
  latencyMs: number;
}

export interface AIStreamChunk {
  type: 'text' | 'done' | 'error';
  content?: string;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface AIProvider {
  name: string;
  call(messages: AIMessage[], config: AIConfig): Promise<AIResponse>;
  stream(messages: AIMessage[], config: AIConfig): AsyncGenerator<AIStreamChunk>;
}

// Provider-specific model mappings
export const CLAUDE_MODELS = {
  'claude-3-opus': 'claude-3-opus-20240229',
  'claude-3-sonnet': 'claude-3-sonnet-20240229',
  'claude-3-haiku': 'claude-3-haiku-20240307',
  'claude-3.5-sonnet': 'claude-3-5-sonnet-20241022',
  'claude-3.5-haiku': 'claude-3-5-haiku-20241022',
} as const;

export const OPENAI_MODELS = {
  'gpt-4': 'gpt-4-turbo-preview',
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
  'gpt-3.5': 'gpt-3.5-turbo',
} as const;

export const GEMINI_MODELS = {
  'gemini-1.5-flash': 'gemini-1.5-flash',
  'gemini-1.5-pro': 'gemini-1.5-pro',
} as const;

// Default models per provider
// Note: Gemini Flash is used as default (cheapest, fastest)
export const DEFAULT_MODELS = {
  claude: 'claude-3-5-haiku-20241022',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-1.5-flash',
} as const;

// Pricing per million tokens (for cost tracking)
export const TOKEN_PRICING = {
  'claude-3-opus-20240229': { input: 15, output: 75 },
  'claude-3-sonnet-20240229': { input: 3, output: 15 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
  'claude-3-5-haiku-20241022': { input: 0.8, output: 4 },
  'gpt-4-turbo-preview': { input: 10, output: 30 },
  'gpt-4o': { input: 5, output: 15 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },  // Cheapest!
  'gemini-1.5-pro': { input: 1.25, output: 5 },
} as const;
