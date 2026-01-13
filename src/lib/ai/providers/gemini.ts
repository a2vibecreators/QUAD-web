/**
 * Google Gemini AI Provider
 *
 * Supports:
 * - Gemini 1.5 Flash (fast, cheap)
 * - Gemini 1.5 Pro (better quality)
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

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiProvider implements AIProvider {
  name = 'gemini';

  /**
   * Call Gemini API and get complete response
   */
  async call(messages: AIMessage[], config: AIConfig): Promise<AIResponse> {
    const startTime = Date.now();

    // Convert messages to Gemini format
    const contents = this.convertMessages(messages);
    const model = config.model || DEFAULT_MODELS.gemini;

    const response = await fetch(
      `${GEMINI_API_BASE}/${model}:generateContent?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: config.temperature ?? 0.7,
            maxOutputTokens: config.maxTokens || 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini API error: ${response.status} - ${error.error?.message || 'Unknown error'}`
      );
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    // Extract text from response
    const candidate = data.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text || '';

    // Calculate token usage (Gemini provides this in usageMetadata)
    const usage = data.usageMetadata || {};
    const inputTokens = usage.promptTokenCount || 0;
    const outputTokens = usage.candidatesTokenCount || 0;

    return {
      content,
      model,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      stopReason: candidate?.finishReason || 'stop',
      latencyMs,
    };
  }

  /**
   * Stream Gemini API response
   */
  async *stream(
    messages: AIMessage[],
    config: AIConfig
  ): AsyncGenerator<AIStreamChunk> {
    const contents = this.convertMessages(messages);
    const model = config.model || DEFAULT_MODELS.gemini;

    const response = await fetch(
      `${GEMINI_API_BASE}/${model}:streamGenerateContent?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: config.temperature ?? 0.7,
            maxOutputTokens: config.maxTokens || 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      yield {
        type: 'error',
        error: `Gemini API error: ${response.status} - ${error.error?.message || 'Unknown error'}`,
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
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Gemini streaming format: JSON objects separated by newlines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const chunk = JSON.parse(line);
            const candidate = chunk.candidates?.[0];

            if (candidate?.content?.parts?.[0]?.text) {
              yield {
                type: 'text',
                content: candidate.content.parts[0].text,
              };
            }

            // Update token counts
            const usage = chunk.usageMetadata;
            if (usage) {
              totalInputTokens = usage.promptTokenCount || totalInputTokens;
              totalOutputTokens = usage.candidatesTokenCount || totalOutputTokens;
            }

            // Check if done
            if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
              yield {
                type: 'done',
                usage: {
                  inputTokens: totalInputTokens,
                  outputTokens: totalOutputTokens,
                },
              };
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      // Final done event
      yield {
        type: 'done',
        usage: {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
        },
      };
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Convert AIMessage format to Gemini format
   * Gemini uses "contents" array with "role" and "parts"
   */
  private convertMessages(messages: AIMessage[]): any[] {
    const contents: any[] = [];

    for (const message of messages) {
      // Gemini doesn't have separate system messages
      // Merge system message into first user message
      if (message.role === 'system') {
        const nextUserMessage = messages.find(m => m.role === 'user');
        if (nextUserMessage) {
          // System message will be prepended to user message
          continue;
        }
      }

      // Map roles (Gemini uses "user" and "model" instead of "assistant")
      const role = message.role === 'assistant' ? 'model' : 'user';

      // If this is the first user message and there was a system message, prepend it
      const systemMessage = messages.find(m => m.role === 'system');
      let content = message.content;
      if (
        message.role === 'user' &&
        systemMessage &&
        messages.indexOf(message) === messages.findIndex(m => m.role === 'user')
      ) {
        content = `${systemMessage.content}\n\n${content}`;
      }

      contents.push({
        role,
        parts: [{ text: content }],
      });
    }

    return contents;
  }
}

// Singleton instance
export const geminiProvider = new GeminiProvider();
