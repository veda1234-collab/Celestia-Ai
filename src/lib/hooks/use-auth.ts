'use client';

import { useEffect } from 'react';
import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: AuthUser | null;
  enabled: boolean;
  ready: boolean;
  set: (partial: Partial<AuthState>) => void;
}

const store = create<AuthState>((set) => ({
  user: null,
  enabled: false,
  ready: false,
  set: (partial) => set(partial),
}));

async function post(url: string, body: unknown): Promise<AuthUser> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? 'Something went wrong.');
  return data.user as AuthUser;
}

/** Client auth: caches the session user and exposes register/login/logout. */
export function useAuth() {
  const { user, enabled, ready, set } = store();

  useEffect(() => {
    if (ready) return;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => set({ user: d.user ?? null, enabled: Boolean(d.enabled), ready: true }))
      .catch(() => set({ ready: true }));
  }, [ready, set]);

  return {
    user,
    enabled,
    ready,
    register: async (name: string, email: string, password: string) => {
      const u = await post('/api/auth/register', { name, email, password });
      set({ user: u });
    },
    login: async (email: string, password: string) => {
      const u = await post('/api/auth/login', { email, password });
      set({ user: u });
    },
    logout: async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      set({ user: null });
    },
  };
}
