'use client';

import { useEffect, useState } from 'react';
import { Loader2, LogOut, Save, Star, Trash2 } from 'lucide-react';
import type { BirthChart, BirthDetails } from '@/lib/astrology/types';
import { useAuth } from '@/lib/hooks/use-auth';
import { useProfile } from '@/lib/store/profile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SavedItem {
  id: string;
  label: string;
  createdAt: string;
}

export function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { user, login, register, logout } = useAuth();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {user ? (
          <AccountPanel onClose={() => onOpenChange(false)} onLogout={logout} name={user.name} email={user.email} />
        ) : (
          <AuthForms login={login} register={register} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AuthForms({
  login,
  register,
  onDone,
}: {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  onDone: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Your Vedastra account</DialogTitle>
        <DialogDescription>Save your charts and revisit them from any device.</DialogDescription>
      </DialogHeader>
      <Tabs defaultValue="signin">
        <TabsList className="w-full">
          <TabsTrigger value="signin" className="flex-1">Sign in</TabsTrigger>
          <TabsTrigger value="register" className="flex-1">Create account</TabsTrigger>
        </TabsList>

        <TabsContent value="signin" className="space-y-3">
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
          <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></Field>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <Button className="w-full" disabled={busy} onClick={() => run(() => login(email, password))}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
          </Button>
        </TabsContent>

        <TabsContent value="register" className="space-y-3">
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></Field>
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
          <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></Field>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <Button className="w-full" disabled={busy} onClick={() => run(() => register(name, email, password))}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
          </Button>
        </TabsContent>
      </Tabs>
    </>
  );
}

function AccountPanel({
  name,
  email,
  onClose,
  onLogout,
}: {
  name: string;
  email: string;
  onClose: () => void;
  onLogout: () => Promise<void>;
}) {
  const details = useProfile((s) => s.details);
  const chart = useProfile((s) => s.chart);
  const setProfile = useProfile((s) => s.setProfile);
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/charts');
      const data = await res.json();
      setItems(data.charts ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const save = async () => {
    if (!details || !chart) return;
    setSaving(true);
    try {
      await fetch('/api/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: chart.meta.name || 'My chart', details, chart }),
      });
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const load = async (id: string) => {
    const res = await fetch(`/api/charts/${id}`);
    if (!res.ok) return;
    const data = (await res.json()) as { details: BirthDetails; chart: BirthChart };
    setProfile(data.details, data.chart);
    onClose();
  };

  const remove = async (id: string) => {
    await fetch(`/api/charts/${id}`, { method: 'DELETE' });
    await refresh();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Hello, {name.split(' ')[0]}</DialogTitle>
        <DialogDescription>{email}</DialogDescription>
      </DialogHeader>

      {chart && (
        <Button className="mb-4 w-full" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save current chart
        </Button>
      )}

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Saved charts</p>
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No saved charts yet.</p>
        ) : (
          items.map((it) => (
            <div key={it.id} className="flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2">
              <Star className="h-4 w-4 shrink-0 text-gold" />
              <button onClick={() => load(it.id)} className="flex-1 truncate text-left text-sm hover:text-primary">
                {it.label}
                <span className="ml-2 text-xs text-muted-foreground">{new Date(it.createdAt).toLocaleDateString()}</span>
              </button>
              <button onClick={() => remove(it.id)} aria-label="Delete" className="text-muted-foreground hover:text-rose-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <Button variant="ghost" className="mt-4 w-full" onClick={() => void onLogout()}>
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
