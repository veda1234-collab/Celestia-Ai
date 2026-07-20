import { NextResponse } from 'next/server';
import { engine } from '@/lib/astrology';
import { transitsForChart } from '@/lib/astrology/transit';
import { birthDetailsSchema } from '@/lib/validation';
import { clientKey, rateLimit } from '@/lib/utils/rate-limit';

export const runtime = 'nodejs';

/**
 * Current gochar for a set of birth details. The chart is recomputed here rather
 * than accepted from the client so the natal frame cannot be tampered with, and
 * the transits are always for *now* — never a cached snapshot.
 */
export async function POST(req: Request) {
  const limit = rateLimit(`transits:${clientKey(req)}`, 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = birthDetailsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const chart = engine.computeChart(parsed.data);
    return NextResponse.json(
      { transits: transitsForChart(chart) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    console.error('transit computation failed', err);
    return NextResponse.json({ error: 'Could not compute transits.' }, { status: 500 });
  }
}
