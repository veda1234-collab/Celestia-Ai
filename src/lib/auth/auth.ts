import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { config } from '@/lib/config';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: SessionUser): string {
  return jwt.sign(user, config.auth.jwtSecret, { expiresIn: config.auth.maxAgeSeconds });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as Partial<SessionUser>;
    if (!decoded.id || !decoded.email || !decoded.name) return null;
    return { id: decoded.id, email: decoded.email, name: decoded.name };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const store = await cookies();
  store.set(config.auth.cookieName, signToken(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: config.auth.maxAgeSeconds,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(config.auth.cookieName, '', { path: '/', maxAge: 0 });
  // Also clear the pre-rebrand cookie, or a stale one would keep signing the
  // user back in after they log out.
  store.set(LEGACY_COOKIE_NAME, '', { path: '/', maxAge: 0 });
}

/** Session cookie name used before the Celestia → Vedastra rename. */
const LEGACY_COOKIE_NAME = 'celestia_session';

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  // Fall back to the old cookie so sessions issued before the rename survive;
  // the token payload and secret are unchanged, only the cookie name moved.
  const token = store.get(config.auth.cookieName)?.value ?? store.get(LEGACY_COOKIE_NAME)?.value;
  return token ? verifyToken(token) : null;
}
