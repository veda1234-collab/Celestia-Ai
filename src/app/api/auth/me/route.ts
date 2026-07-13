import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/auth';
import { config } from '@/lib/config';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user, enabled: config.auth.enabled });
}
