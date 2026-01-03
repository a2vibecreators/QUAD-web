/**
 * OpenAI AI Provider
 *
 * Supports:
 * - GPT-4, GPT-4o, GPT-4o-mini
 * - GPT-3.5 Turbo
 * - Streaming responses
 * - BYOK (customer's own API keys)
 */

import {
  AIMessage,
  AIConfig,
  AIResponse,
  AIStreamChunk,
  AIProvider,
  DEFAULT_MODELS,
} from './types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export class OpenAIProvider implements AIProvider {
  name = 'openai';

  /**
   * Call OpenAI API and get complete response
   */
  async call(messages: AIMessage[], config: AIConfig): Promise<AIResponse> {
    const startTime = Date.now();

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || DEFAULT_MODELS.openai,
        max_tokens: config.maxTokens || 4096,
        temperature: config.temperature ?? 0.7,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error: ${response.status} - ${error.error?.message || 'Unknown error'}`
      );
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      stopReason: data.choices[0].finish_reason,
      latencyMs,
    };
  }

  /**
   * Stream OpenAI API response
   */
  async *stream(
    messages: AIMessage[],
    config: AIConfig
  ): AsyncGenerator<AIStreamChunk> {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || DEFAULT_MODELS.openai,
        max_tokens: config.maxTokens || 4096,
        temperature: config.temperature ?? 0.7,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
        stream_options: { include_usage: true },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      yield {
        type: 'error',
        error: `OpenAI API error: ${response.status} - ${error.error?.message || 'Unknown error'}`,
      };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield { type: 'error', error: 'No response body' };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') {
            yield {
              type: 'done',
              usage: { inputTokens, outputTokens },
            };
            continue;
          }

          try {
            const event = JSON.parse(data);

            // Handle content delta
            const delta = event.choices?.[0]?.delta;
            if (delta?.content) {
              yield { type: 'text', content: delta.content };
            }

            // Handle usage (comes at the end with stream_options)
            if (event.usage) {
              inputTokens = event.usage.prompt_tokens;
              outputTokens = event.usage.completion_tokens;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// Singleton instance
export const openaiProvider = new OpenAIProvider();
