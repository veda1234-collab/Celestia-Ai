'use client';

import { useMemo } from 'react';
import type { BirthChart, DashaPeriod, DashaQuality, DashaWindow } from '@/lib/astrology/types';
import { PLANETS } from '@/lib/astrology/signs';
import { GlassCard, PlateHeader } from '@/components/ui/glass-card';
import { Meter, SemanticTag, type Tone } from '@/components/ui/plate';
import { cn } from '@/lib/utils/cn';
import { DashaRibbon } from './dasha-ribbon';

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
const fmtDay = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const LEVEL_LABEL = ['Mahādaśā', 'Antardaśā', 'Pratyantardaśā', 'Sūkṣmadaśā'] as const;
const QUALITY_TONE: Record<DashaQuality, Tone> = { good: 'good', mixed: 'caution', challenging: 'care' };

function elapsedPct(startISO: string, endISO: string): number {
  const s = Date.parse(startISO);
  const e = Date.parse(endISO);
  return Math.max(0, Math.min(100, ((Date.now() - s) / (e - s)) * 100));
}

/** A nested ruled row in the running-now stack; the mahā carries a gold edge. */
function StackRow({ period }: { period: DashaPeriod }) {
  const label = LEVEL_LABEL[period.level - 1] ?? `L${period.level}`;
  const pct = elapsedPct(period.startISO, period.endISO);
  const range = period.years < 1
    ? `${fmtDay(period.startISO)} → ${fmtDay(period.endISO)}`
    : `${fmt(period.startISO)} → ${fmt(period.endISO)}`;
  return (
    <div className={cn('py-2.5 pl-3', period.level === 1 && 'border-l-2 border-gold')} style={period.level > 1 ? { paddingLeft: `${period.level * 12}px` } : undefined}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm">
          <span className="text-foreground/85">{PLANETS[period.lord].glyph}</span>
          <span className="font-medium text-foreground">{period.lord}</span>
          <span className="kicker">{label}</span>
        </span>
        {period.quality && (
          <SemanticTag tone={QUALITY_TONE[period.quality]} label={period.quality} value={period.favorability} />
        )}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="meter-track flex-1">
          <div className="meter-fill" style={{ width: `${pct}%`, background: 'hsl(var(--gold) / 0.7)' }} />
        </div>
        <span className="w-40 shrink-0 text-right font-mono text-[10.5px] tabular-nums text-ink-2">{range}</span>
        <span className="w-12 shrink-0 text-right font-mono text-[10.5px] tabular-nums text-ink-2/70">{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function WindowColumn({ title, tone, windows }: { title: string; tone: Tone; windows: DashaWindow[] }) {
  return (
    <div>
      <p className="kicker mb-2">{title}</p>
      {windows.length ? (
        <ul className="overflow-hidden rounded-field border border-foreground/10">
          {windows.slice(0, 4).map((w) => (
            <li key={`${w.mahaLord}-${w.startISO}`} className="flex items-center justify-between gap-2 border-b border-foreground/[0.07] px-3 py-2 text-sm last:border-0 even:bg-inset/40">
              <span className="flex items-center gap-1.5">
                <span className="text-foreground/85">{PLANETS[w.mahaLord].glyph}</span>
                <span className="text-ink-2">/</span>
                <span className="text-foreground/85">{PLANETS[w.lord].glyph}</span>
                <span className="ml-1 text-foreground/90">{w.mahaLord}–{w.lord}</span>
              </span>
              <span className="flex items-center gap-2 font-mono text-[11px] tabular-nums text-ink-2">
                {fmt(w.startISO)}
                <span className="tone-dot" style={{ background: `hsl(var(--${tone}))` }} />
                {w.score}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-ink-2/70">Nothing notable in the horizon ahead.</p>
      )}
    </div>
  );
}

export function DashaCard({ chart }: { chart: BirthChart }) {
  const { maha } = chart.dasha.current;
  const stack = chart.dasha.stack ?? [];
  const assessment = chart.dasha.assessments?.[maha.lord];
  const nowMs = useMemo(() => Date.now(), []);
  const upcoming = chart.dasha.sequence.filter((d) => Date.parse(d.startISO) > nowMs).slice(0, 4);

  return (
    <GlassCard>
      <PlateHeader
        folio="PLATE 03"
        kicker="Vimśottari"
        title="The Daśā Timeline"
        description="A 120-year map of planetary periods — down to the running sūkṣma."
      />
      <div className="space-y-7 p-6 pt-4">
        <DashaRibbon dasha={chart.dasha} nowMs={nowMs} />

        {assessment && (
          <p className="text-sm leading-relaxed text-ink-2">
            <span className="text-foreground">
              {maha.lord} mahādaśā — <span className="font-mono tabular-nums text-gold">{assessment.score}/100</span> {assessment.quality}.
            </span>{' '}
            {assessment.reasons.join(' · ')}.
          </p>
        )}

        <div>
          <p className="kicker mb-1">Running now</p>
          <div className="divide-y divide-foreground/[0.07] rounded-field border border-foreground/10 px-3">
            {stack.map((p) => (
              <StackRow key={`${p.level}-${p.startISO}`} period={p} />
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <WindowColumn title="Auspicious windows" tone="good" windows={chart.dasha.favorablePeriods ?? []} />
          <WindowColumn title="Windows for care" tone="care" windows={chart.dasha.challengingPeriods ?? []} />
        </div>

        {upcoming.length > 0 && (
          <div>
            <p className="kicker mb-2">Upcoming mahādaśās</p>
            <div className="flex flex-wrap gap-2">
              {upcoming.map((d) => (
                <span key={d.startISO} className="flex items-center gap-2 rounded-field plate-inset px-3 py-1.5 text-sm">
                  <span className="text-foreground/85">{PLANETS[d.lord].glyph}</span>
                  <span className="text-foreground/90">{d.lord}</span>
                  <span className="font-mono text-[11px] tabular-nums text-ink-2">{fmt(d.startISO)} · {d.years}y</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
