/** Centralised, env-driven configuration. Safe defaults so the app runs keyless. */

type AIProvider = 'claude' | 'openai' | 'mock';
type GeoProvider = 'local' | 'google' | 'mapbox';

const env = process.env;

// Accept both the app's own names and generic LLM_* names.
const forced = (env.AI_PROVIDER ?? env.LLM_PROVIDER)?.toLowerCase();
const llmKey = env.LLM_API_KEY;
const llmModel = env.LLM_MODEL;

const openaiApiKey = env.OPENAI_API_KEY ?? (forced === 'openai' ? llmKey : undefined) ?? '';
const anthropicApiKey = env.ANTHROPIC_API_KEY ?? (forced === 'claude' ? llmKey : undefined) ?? '';

function resolveAIProvider(): AIProvider {
  if (forced === 'openai' || forced === 'claude' || forced === 'mock') return forced;
  if (openaiApiKey) return 'openai';
  if (anthropicApiKey) return 'claude';
  return 'mock';
}

export const config = {
  app: {
    url: env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  },
  ai: {
    provider: resolveAIProvider(),
    anthropicApiKey,
    anthropicModel: env.ANTHROPIC_MODEL ?? 'claude-opus-4-8',
    openaiApiKey,
    openaiModel: env.OPENAI_MODEL ?? llmModel ?? 'gpt-4o-mini',
  },
  geo: {
    provider: (env.GEOCODER?.toLowerCase() as GeoProvider) || 'local',
    googleApiKey: env.GOOGLE_PLACES_API_KEY ?? '',
    mapboxToken: env.MAPBOX_TOKEN ?? '',
  },
  auth: {
    jwtSecret: env.JWT_SECRET ?? 'celestia-dev-insecure-secret-change-me',
    cookieName: 'celestia_session',
    // 30 days
    maxAgeSeconds: 60 * 60 * 24 * 30,
    enabled: Boolean(env.DATABASE_URL),
  },
} as const;

export type { AIProvider, GeoProvider };
