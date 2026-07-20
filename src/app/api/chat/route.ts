import { NextResponse } from 'next/server';
import type { BirthChart } from '@/lib/astrology/types';
import { transitsForChart } from '@/lib/astrology/transit';
import type { TransitReport } from '@/lib/astrology/transit';
import { activeProviderName, buildSystemPrompt, getProvider } from '@/lib/ai';
import type { ChatMessage } from '@/lib/ai';
import { chatRequestSchema } from '@/lib/validation';
import { clientKey, rateLimit } from '@/lib/utils/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const limit = rateLimit(`chat:${clientKey(req)}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'The stars need a moment — too many questions at once.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 });
  }

  const chart = parsed.data.chart as unknown as BirthChart;
  const messages = parsed.data.messages as ChatMessage[];
  const language = parsed.data.language ?? 'en';

  // Transits are recomputed per request rather than read off the stored chart,
  // which was fixed at onboarding time and would be stale by now.
  let transits: TransitReport | undefined;
  try {
    transits = transitsForChart(chart);
  } catch (err) {
    console.error('transit computation failed; continuing without gochar', err);
  }

  const system = buildSystemPrompt(chart, language, transits);
  const provider = getProvider(chart);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of provider.streamChat({ system, messages, signal: req.signal })) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        if (!req.signal.aborted) {
          console.error('chat stream error', err);
          controller.enqueue(encoder.encode('\n\n_The stars went quiet for a moment — please ask again._'));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
      'X-AI-Provider': activeProviderName(),
    },
  });
}
