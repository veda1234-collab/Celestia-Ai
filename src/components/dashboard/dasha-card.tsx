'use client';

import type { BirthChart, DashaPeriod, DashaQuality, DashaWindow } from '@/lib/astrology/types';
import { PLANETS } from '@/lib/astrology/signs';
import { GlassCard, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/glass-card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
const fmtDay = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const LEVEL_LABEL = ['Mahādaśā', 'Antardaśā', 'Pratyantardaśā', 'Sūkṣmadaśā'] as const;

const QUALITY_STYLE: Record<DashaQuality, string> = {
  good: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  mixed: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  challenging: 'border-rose-400/40 bg-rose-400/10 text-rose-300',
};

function elapsedPct(startISO: string, endISO: string): number {
  const start = Date.parse(startISO);
  const end = Date.parse(endISO);
  const now = Date.now();
  return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
}

function StackRow({ period }: { period: DashaPeriod }) {
  const label = LEVEL_LABEL[period.level - 1] ?? `Level ${period.level}`;
  const pct = elapsedPct(period.startISO, period.endISO);
  // Sub-year periods deserve day precision; the mahādaśā only needs the month.
  const showDay = period.years < 1;
  const range = showDay
    ? `${fmtDay(period.startISO)} → ${fmtDay(period.endISO)}`
    : `${fmt(period.startISO)} → ${fmt(period.endISO)}`;

  return (
    <div className="rounded-xl border border-border/60 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm">
          <span className="text-base" style={{ color: PLANETS[period.lord].color }}>{PLANETS[period.lord].glyph}</span>
          <span className="font-medium">{period.lord}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </span>
        {period.quality && (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${QUALITY_STYLE[period.quality]}`}>
            {period.quality} · {period.favorability}
          </span>
        )}
      </div>
      <div className="mt-2">
        <Progress value={pct} />
        <p className="mt-1 text-[11px] text-muted-foreground">{range} · {pct.toFixed(0)}% elapsed</p>
      </div>
    </div>
  );
}

function WindowList({ title, windows, tone }: { title: string; windows: DashaWindow[]; tone: DashaQuality }) {
  if (!windows.length) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="space-y-1.5">
        {windows.slice(0, 3).map((w) => (
          <li key={`${w.mahaLord}-${w.startISO}`} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
            <span className="flex items-center gap-1.5">
              <span style={{ color: PLANETS[w.mahaLord].color }}>{PLANETS[w.mahaLord].glyph}</span>
              <span className="text-muted-foreground">/</span>
              <span style={{ color: PLANETS[w.lord].color }}>{PLANETS[w.lord].glyph}</span>
              <span className="ml-1">{w.mahaLord}–{w.lord}</span>
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] ${QUALITY_STYLE[tone]}`}>
              {fmt(w.startISO)} · {w.score}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DashaCard({ chart }: { chart: BirthChart }) {
  const { maha, antar } = chart.dasha.current;
  const stack = chart.dasha.stack ?? [];
  const mahaAssessment = chart.dasha.assessments?.[maha.lord];
  const upcoming = chart.dasha.sequence.filter((d) => Date.parse(d.startISO) > Date.now()).slice(0, 3);

  return (
    <GlassCard className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Vimśottari Daśā</CardTitle>
        <CardDescription>The planetary period shaping this chapter — down to the sūkṣma.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
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
          {mahaAssessment && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">{mahaAssessment.score}/100 · {mahaAssessment.quality}</span>
              {' — '}{mahaAssessment.reasons.join(' · ')}
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Running now</p>
          <div className="space-y-2">
            {stack.map((p) => (
              <StackRow key={`${p.level}-${p.startISO}`} period={p} />
            ))}
          </div>
        </div>

        <WindowList title="Favourable windows ahead" windows={chart.dasha.favorablePeriods ?? []} tone="good" />
        <WindowList title="Windows to navigate carefully" windows={chart.dasha.challengingPeriods ?? []} tone="challenging" />

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Upcoming mahādaśās</p>
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
        </div>
      </CardContent>
    </GlassCard>
  );
}
