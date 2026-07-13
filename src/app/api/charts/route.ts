import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/auth';
import { saveChartSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const charts = await prisma.savedChart.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, label: true, createdAt: true },
  });
  return NextResponse.json({ charts });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const parsed = saveChartSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid chart payload.' }, { status: 422 });

  const created = await prisma.savedChart.create({
    data: {
      userId: user.id,
      label: parsed.data.label,
      details: JSON.stringify(parsed.data.details),
      chart: JSON.stringify(parsed.data.chart),
    },
    select: { id: true },
  });
  return NextResponse.json({ id: created.id });
}
