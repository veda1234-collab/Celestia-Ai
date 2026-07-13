import type { BirthChart } from '@/lib/astrology/types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamChatOptions {
  system: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
}

/**
 * Swappable AI provider contract. Every provider yields plain text chunks so
 * the API route can forward them as a stream regardless of backend.
 */
export interface AIProvider {
  readonly name: string;
  streamChat(options: StreamChatOptions): AsyncIterable<string>;
}

export interface ChatRequestBody {
  messages: ChatMessage[];
  chart: BirthChart;
  language?: string;
}
