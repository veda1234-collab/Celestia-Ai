import OpenAI from 'openai';
import { config } from '@/lib/config';
import type { AIProvider, StreamChatOptions } from './types';

/**
 * OpenAI-backed provider. Streams chat completions.
 * Model defaults to gpt-4o-mini (override via OPENAI_MODEL / LLM_MODEL).
 */
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: config.ai.openaiApiKey });
  }

  async *streamChat({ system, messages, signal }: StreamChatOptions): AsyncIterable<string> {
    const oaMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const stream = await this.client.chat.completions.create(
      {
        model: config.ai.openaiModel,
        messages: oaMessages,
        stream: true,
        max_tokens: 1024,
        temperature: 0.8,
      },
      { signal },
    );

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}
