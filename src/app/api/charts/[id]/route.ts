import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/auth';

export const runtime = 'nodejs';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const { id } = await ctx.params;
  const row = await prisma.savedChart.findFirst({ where: { id, userId: user.id } });
  if (!row) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  return NextResponse.json({
    label: row.label,
    details: JSON.parse(row.details),
    chart: JSON.parse(row.chart),
    createdAt: row.createdAt,
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const { id } = await ctx.params;
  await prisma.savedChart.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
