import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { setSessionCookie, verifyPassword } from '@/lib/auth/auth';
import { loginSchema } from '@/lib/validation';
import { config } from '@/lib/config';
import { clientKey, rateLimit } from '@/lib/utils/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!config.auth.enabled) return NextResponse.json({ error: 'Accounts are not enabled.' }, { status: 501 });
  const limit = rateLimit(`auth:${clientKey(req)}`, 10, 60_000);
  if (!limit.ok) return NextResponse.json({ error: 'Too many attempts.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid credentials.' }, { status: 422 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
  }

  const sessionUser = { id: user.id, email: user.email, name: user.name };
  await setSessionCookie(sessionUser);
  return NextResponse.json({ user: sessionUser });
}
