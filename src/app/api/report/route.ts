import { z } from 'zod';
import { NextResponse } from 'next/server';
import type { BirthChart } from '@/lib/astrology/types';
import { buildReport } from '@/lib/report/pdf';
import { clientKey, rateLimit } from '@/lib/utils/rate-limit';

export const runtime = 'nodejs';

const schema = z.object({
  chart: z.object({ meta: z.object({ name: z.string() }) }).passthrough(),
});

export async function POST(req: Request) {
  const limit = rateLimit(`report:${clientKey(req)}`, 15, 60_000);
  if (!limit.ok) return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'A chart is required.' }, { status: 422 });

  const chart = parsed.data.chart as unknown as BirthChart;
  const generatedAt = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  try {
    const pdf = await buildReport(chart, generatedAt);
    const safe = (chart.meta.name || 'report').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="celestia-${safe}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('report generation failed', err);
    return NextResponse.json({ error: 'Could not generate the report.' }, { status: 500 });
  }
}
