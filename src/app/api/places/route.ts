import { NextResponse } from 'next/server';
import { geocode } from '@/lib/geo';
import { clientKey, rateLimit } from '@/lib/utils/rate-limit';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const limit = rateLimit(`places:${clientKey(req)}`, 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ results: [] }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } });
  }

  const q = new URL(req.url).searchParams.get('q') ?? '';
  const results = await geocode(q, 8);
  return NextResponse.json(
    { results },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=600' } },
  );
}
