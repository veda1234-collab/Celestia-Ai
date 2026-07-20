'use client';

import { useEffect, useState } from 'react';
import { Loader2, Orbit } from 'lucide-react';
import type { BirthDetails } from '@/lib/astrology/types';
import type { TransitEffect, TransitReport } from '@/lib/astrology/transit';
import { PLANETS } from '@/lib/astrology/signs';
import { GlassCard, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/glass-card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const fmtMonth = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

const EFFECT_STYLE: Record<TransitEffect, string> = {
  favourable: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  neutral: 'border-sky-400/40 bg-sky-400/10 text-sky-300',
  obstructed: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  challenging: 'border-rose-400/40 bg-rose-400/10 text-rose-300',
};

const EFFECT_LABEL: Record<TransitEffect, string> = {
  favourable: 'favourable',
  neutral: 'relieved',
  obstructed: 'vedha',
  challenging: 'testing',
};

/** The slow grahas set the season — lead with them, then the rest. */
const SLOW = ['Saturn', 'Jupiter', 'Rahu', 'Ketu'];

export function TransitCard({ details }: { details: BirthDetails | null }) {
  const [report, setReport] = useState<TransitReport | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!details) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/transits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(details),
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { transits: TransitReport };
        if (!cancelled) setReport(data.transits);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [details]);

  if (error) {
    return (
      <GlassCard className="h-full">
        <CardHeader>
          <CardTitle>Current Transits</CardTitle>
          <CardDescription>Gochar — the live sky against your chart.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Transits could not be calculated right now.</p>
        </CardContent>
      </GlassCard>
    );
  }

  if (!report) {
    return (
      <GlassCard className="h-full">
        <CardHeader>
          <CardTitle>Current Transits</CardTitle>
          <CardDescription>Gochar — the live sky against your chart.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Reading the sky…
        </CardContent>
      </GlassCard>
    );
  }

  const ordered = [
    ...report.positions.filter((p) => SLOW.includes(p.id)),
    ...report.positions.filter((p) => !SLOW.includes(p.id)),
  ];
  const { sadeSati, dhaiya } = report;

  return (
    <GlassCard className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Orbit className="h-4 w-4 text-primary" /> Current Transits
        </CardTitle>
        <CardDescription>Gochar from your Moon, as of {fmt(report.atISO)}.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-lg font-semibold">{report.score}/100</p>
            <span className="text-xs text-muted-foreground">transit climate</span>
          </div>
          <div className="mt-2"><Progress value={report.score} /></div>
          <p className="mt-2 text-sm text-foreground/90">{report.headline}</p>
        </div>

        {(sadeSati.active || dhaiya.active) && (
          <div className="space-y-2">
            {sadeSati.active && (
              <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sāḍe Sātī — {sadeSati.currentPhase} phase</span>
                  <Badge variant="accent">
                    {fmtMonth(sadeSati.startISO!)} → {fmtMonth(sadeSati.endISO!)}
                  </Badge>
                </div>
                <ul className="mt-2 space-y-1">
                  {sadeSati.phases.map((p) => (
                    <li
                      key={p.phase}
                      className={`flex items-center justify-between text-xs ${p.phase === sadeSati.currentPhase ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      <span className="capitalize">{p.phase} · {p.signName}</span>
                      <span>{fmtMonth(p.startISO)} → {fmtMonth(p.endISO)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {dhaiya.active && (
              <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
                <p className="text-sm font-medium capitalize">{dhaiya.type} śani</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{dhaiya.description}</p>
              </div>
            )}
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Where the grahas are</p>
          <ul className="space-y-1.5">
            {ordered.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <span style={{ color: PLANETS[p.id].color }}>{PLANETS[p.id].glyph}</span>
                  <span className="font-medium">{p.id}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.signName}{p.retrograde ? ' ℞' : ''} · H{p.houseFromMoon}
                  </span>
                </span>
                <span
                  title={p.note}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${EFFECT_STYLE[p.effect]}`}
                >
                  {EFFECT_LABEL[p.effect]}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Next sign changes</p>
          <ul className="space-y-1.5">
            {report.upcomingIngresses.slice(0, 5).map((i) => (
              <li key={`${i.id}-${i.dateISO}`} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <span style={{ color: PLANETS[i.id].color }}>{PLANETS[i.id].glyph}</span>
                  {i.id} → {i.toSignName}
                </span>
                <span className="text-xs text-muted-foreground">{fmt(i.dateISO)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground/70">
          Tārā bala today: {report.taraBala.name} ({report.taraBala.nakshatra}) — {report.taraBala.meaning}.
        </p>
      </CardContent>
    </GlassCard>
  );
}
