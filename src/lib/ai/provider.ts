import type { BirthChart } from '@/lib/astrology/types';
import { config } from '@/lib/config';
import { ClaudeProvider } from './claude';
import { OpenAIProvider } from './openai';
import { MockProvider } from './mock';
import type { AIProvider } from './types';

let claudeSingleton: ClaudeProvider | null = null;
let openaiSingleton: OpenAIProvider | null = null;

/** True when the configured real provider has a usable API key. */
function realProviderName(): 'claude' | 'openai' | null {
  if (config.ai.provider === 'openai' && config.ai.openaiApiKey) return 'openai';
  if (config.ai.provider === 'claude' && config.ai.anthropicApiKey) return 'claude';
  return null;
}

/**
 * Select the AI provider. Uses the configured provider (OpenAI or Claude) when
 * an API key is present, otherwise the chart-aware mock so the app runs keyless.
 */
export function getProvider(chart: BirthChart): AIProvider {
  const real = realProviderName();
  if (real === 'openai') {
    openaiSingleton ??= new OpenAIProvider();
    return openaiSingleton;
  }
  if (real === 'claude') {
    claudeSingleton ??= new ClaudeProvider();
    return claudeSingleton;
  }
  return new MockProvider(chart);
}

export function activeProviderName(): string {
  return realProviderName() ?? 'mock';
}
