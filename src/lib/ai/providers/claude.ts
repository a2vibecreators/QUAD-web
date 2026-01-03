/**
 * Claude (Anthropic) AI Provider
 *
 * Supports:
 * - Claude 3 Opus, Sonnet, Haiku
 * - Claude 3.5 Sonnet
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

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export class ClaudeProvider implements AIProvider {
  name = 'claude';

  /**
   * Call Claude API and get complete response
   */
  async call(messages: AIMessage[], config: AIConfig): Promise<AIResponse> {
    const startTime = Date.now();

    // Separate system message from conversation
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: config.model || DEFAULT_MODELS.claude,
        max_tokens: config.maxTokens || 4096,
        temperature: config.temperature ?? 0.7,
        system: systemMessage?.content,
        messages: conversationMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Claude API error: ${response.status} - ${error.error?.message || 'Unknown error'}`
      );
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    // Extract text content from response
    const content = data.content
      .filter((block: { type: string }) => block.type === 'text')
      .map((block: { text: string }) => block.text)
      .join('');

    return {
      content,
      model: data.model,
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      stopReason: data.stop_reason,
      latencyMs,
    };
  }

  /**
   * Stream Claude API response
   */
  async *stream(
    messages: AIMessage[],
    config: AIConfig
  ): AsyncGenerator<AIStreamChunk> {
    // Separate system message from conversation
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: config.model || DEFAULT_MODELS.claude,
        max_tokens: config.maxTokens || 4096,
        temperature: config.temperature ?? 0.7,
        system: systemMessage?.content,
        messages: conversationMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      yield {
        type: 'error',
        error: `Claude API error: ${response.status} - ${error.error?.message || 'Unknown error'}`,
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
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);

            switch (event.type) {
              case 'message_start':
                inputTokens = event.message?.usage?.input_tokens || 0;
                break;

              case 'content_block_delta':
                if (event.delta?.type === 'text_delta') {
                  yield { type: 'text', content: event.delta.text };
                }
                break;

              case 'message_delta':
                outputTokens = event.usage?.output_tokens || 0;
                break;

              case 'message_stop':
                yield {
                  type: 'done',
                  usage: { inputTokens, outputTokens },
                };
                break;

              case 'error':
                yield { type: 'error', error: event.error?.message };
                break;
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
export const claudeProvider = new ClaudeProvider();
