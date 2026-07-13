import Anthropic from '@anthropic-ai/sdk';
import { config } from '@/lib/config';
import type { AIProvider, StreamChatOptions } from './types';

/**
 * Claude-backed provider. Streams text deltas from the Messages API.
 * Model defaults to claude-opus-4-8 (override via ANTHROPIC_MODEL).
 */
export class ClaudeProvider implements AIProvider {
  readonly name = 'claude';
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: config.ai.anthropicApiKey });
  }

  async *streamChat({ system, messages, signal }: StreamChatOptions): AsyncIterable<string> {
    const stream = this.client.messages.stream(
      {
        model: config.ai.anthropicModel,
        max_tokens: 2048,
        system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      },
      { signal },
    );

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }
}
