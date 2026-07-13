'use client';

import type { BirthChart } from '@/lib/astrology/types';
import { PLANETS } from '@/lib/astrology/signs';
import { GlassCard, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/glass-card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

function elapsedPct(startISO: string, endISO: string): number {
  const start = Date.parse(startISO);
  const end = Date.parse(endISO);
  const now = Date.now();
  return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
}

export function DashaCard({ chart }: { chart: BirthChart }) {
  const { maha, antar } = chart.dasha.current;
  const pct = elapsedPct(maha.startISO, maha.endISO);
  const upcoming = chart.dasha.sequence.filter((d) => Date.parse(d.startISO) > Date.now()).slice(0, 4);

  return (
    <GlassCard className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Vimśottari Daśā</CardTitle>
        <CardDescription>The planetary period shaping this chapter.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl" style={{ color: PLANETS[maha.lord].color }}>{PLANETS[maha.lord].glyph}</span>
              <div>
                <p className="font-display text-lg font-semibold">{maha.lord} Mahādaśā</p>
                <p className="text-xs text-muted-foreground">{fmt(maha.startISO)} → {fmt(maha.endISO)}</p>
              </div>
            </div>
            {antar && (
              <Badge variant="accent">
                {PLANETS[antar.lord].glyph} {antar.lord} antar
              </Badge>
            )}
          </div>
          <div className="mt-4">
            <Progress value={pct} />
            <p className="mt-1.5 text-xs text-muted-foreground">{pct.toFixed(0)}% through this mahādaśā</p>
          </div>
        </div>

        <p className="mt-4 mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Upcoming periods</p>
        <ul className="space-y-2">
          {upcoming.map((d) => (
            <li key={d.startISO} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
              <span className="flex items-center gap-2">
                <span style={{ color: PLANETS[d.lord].color }}>{PLANETS[d.lord].glyph}</span>
                {d.lord}
              </span>
              <span className="text-xs text-muted-foreground">{fmt(d.startISO)} · {d.years}y</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </GlassCard>
  );
}
