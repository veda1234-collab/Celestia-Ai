import { NextResponse } from 'next/server';
import { engine } from '@/lib/astrology';
import { birthDetailsSchema } from '@/lib/validation';
import { clientKey, rateLimit } from '@/lib/utils/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const limit = rateLimit(`chart:${clientKey(req)}`, 30, 60_000);
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
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const chart = engine.computeChart(parsed.data);
    return NextResponse.json({ chart });
  } catch (err) {
    console.error('chart computation failed', err);
    return NextResponse.json({ error: 'Could not compute the birth chart.' }, { status: 500 });
  }
}
