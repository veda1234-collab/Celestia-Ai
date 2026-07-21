'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { BirthDetails } from '@/lib/astrology/types';
import type { TransitEffect, TransitReport } from '@/lib/astrology/transit';
import { PLANETS } from '@/lib/astrology/signs';
import { cn } from '@/lib/utils/cn';
import { GlassCard, PlateHeader, CardContent } from '@/components/ui/glass-card';
import { Kicker, Meter, Rule, SemanticTag, type Tone } from '@/components/ui/plate';

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtMonth = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
const deg = (n: number) => `${n.toFixed(1)}°`;

/** English ordinal — 1st, 2nd, 3rd, 4th … */
function ordinal(n: number): string {
  const r = n % 100;
  if (r >= 11 && r <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

/** TransitEffect → semantic pigment + small-caps verdict. */
const EFFECT_TONE: Record<TransitEffect, Tone> = {
  favourable: 'good',
  neutral: 'info',
  obstructed: 'caution',
  challenging: 'care',
};
const EFFECT_LABEL: Record<TransitEffect, string> = {
  favourable: 'favourable',
  neutral: 'relieved',
  obstructed: 'vedha',
  challenging: 'testing',
};

/** The slow grahas set the season — lead with them, then the rest. */
const SLOW = ['Saturn', 'Jupiter', 'Rahu', 'Ketu'];

/** Shared plate shell — masthead is identical across loading / error / ready. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <GlassCard className="h-full">
      <PlateHeader
        folio="PLATE 04"
        kicker="GOCHAR"
        title="Today's Sky"
        description="Transits read from your natal Moon."
      />
      <CardContent className="space-y-5 pt-5">{children}</CardContent>
    </GlassCard>
  );
}

/** Pulsing hairline-outline skeleton that mirrors the final layout — never gray blocks. */
function SkeletonBody() {
  const reduce = useReducedMotion();
  const box = 'rounded-chip border border-foreground/12';
  return (
    <motion.div
      aria-hidden
      className="space-y-5"
      style={reduce ? { opacity: 0.5 } : undefined}
      animate={reduce ? undefined : { opacity: [0.4, 0.6, 0.4] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* climate barometer */}
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div className={cn('h-4 w-44', box)} />
          <div className="h-8 w-16 rounded-field border border-foreground/12" />
        </div>
        <div className="h-1.5 w-full rounded-full border border-foreground/12" />
      </div>
      <Rule gold={false} animate={false} />
      {/* graha rows */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-4 w-4 rounded-full border border-foreground/12" />
              <div className={cn('h-3 w-24', box)} />
            </div>
            <div className="h-5 w-16 rounded-full border border-foreground/12" />
          </div>
        ))}
      </div>
      <Rule gold={false} animate={false} />
      {/* ledger rows */}
      <div className="space-y-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className={cn('h-3 w-28', box)} />
            <div className={cn('h-3 w-24', box)} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

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
    return () => {
      cancelled = true;
    };
  }, [details]);

  if (error) {
    return (
      <Shell>
        <p className="text-sm text-ink-2">The sky could not be read right now. Try again in a moment.</p>
      </Shell>
    );
  }

  if (!report) {
    return (
      <Shell>
        <SkeletonBody />
      </Shell>
    );
  }

  const ordered = [
    ...report.positions.filter((p) => SLOW.includes(p.id)),
    ...report.positions.filter((p) => !SLOW.includes(p.id)),
  ];
  const { sadeSati } = report;
  const activePhase = sadeSati.phases.find((p) => p.phase === sadeSati.currentPhase);

  return (
    <Shell>
      {/* 1 · Climate barometer ------------------------------------------------ */}
      <section>
        <div className="flex items-baseline justify-between gap-3">
          <Kicker>Climate barometer</Kicker>
          <span className="dateline text-[11px]">as of {fmt(report.atISO)}</span>
        </div>
        <div className="mt-3 flex items-end justify-between gap-4">
          <p
            className="lede text-foreground/90"
            style={{ fontSize: '1.05rem', lineHeight: 1.4 }}
          >
            {report.headline}
          </p>
          <div className="shrink-0 text-right leading-none">
            <span className="font-mono text-[2.1rem] font-medium tabular-nums text-foreground">
              {report.score}
            </span>
            <span className="ml-0.5 font-mono text-sm tabular-nums text-ink-2/70">/100</span>
          </div>
        </div>
        <Meter variant="barometer" value={report.score} className="mt-3.5" />
      </section>

      <Rule gold={false} />

      {/* 2 · The grahas ------------------------------------------------------- */}
      <section>
        <Kicker className="mb-2">The grahas · from your Moon</Kicker>
        <div className="divide-y divide-foreground/[0.08]">
          {ordered.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 py-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="w-4 shrink-0 text-center text-[15px] text-foreground/85">
                  {PLANETS[p.id].glyph}
                </span>
                <span className="w-[3.75rem] shrink-0 text-sm text-foreground">{p.id}</span>
                <span className="truncate text-sm text-ink-2">{p.signName}</span>
                <span className="font-mono text-[11px] tabular-nums text-ink-2/75">{deg(p.degreeInSign)}</span>
                {p.retrograde && (
                  <span className="font-mono text-[11px] text-ink-2/70" title="retrograde">℞</span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="hidden font-mono text-[10px] tabular-nums text-ink-2/55 md:inline">
                  H{p.houseFromMoon} from Moon
                </span>
                <SemanticTag tone={EFFECT_TONE[p.effect]} label={EFFECT_LABEL[p.effect]} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <Rule gold={false} />

      {/* 3 · Sāḍe Sātī -------------------------------------------------------- */}
      <section>
        <div className="flex items-baseline justify-between gap-3">
          <Kicker>Sāḍe Sātī</Kicker>
          {sadeSati.active && sadeSati.startISO && sadeSati.endISO && (
            <span className="font-mono text-[11px] tabular-nums text-ink-2/70">
              {fmtMonth(sadeSati.startISO)} – {fmtMonth(sadeSati.endISO)}
            </span>
          )}
        </div>

        {sadeSati.active ? (
          <>
            <div className="mt-2.5">
              {sadeSati.phases.map((ph) => {
                const on = ph.phase === sadeSati.currentPhase;
                return (
                  <div
                    key={ph.phase}
                    className={cn(
                      'flex items-center justify-between gap-3 border-l-2 py-1.5 pl-3',
                      on ? 'border-gold' : 'border-foreground/10',
                    )}
                  >
                    <span className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          'text-[10.5px] font-semibold uppercase tracking-[0.1em]',
                          on ? 'text-gold' : 'text-ink-2/70',
                        )}
                      >
                        {ph.phase}
                      </span>
                      <span className={cn('text-sm', on ? 'text-foreground' : 'text-ink-2')}>
                        {ph.signName}
                      </span>
                    </span>
                    <span className="font-mono text-[10.5px] tabular-nums text-ink-2/60">
                      {fmtMonth(ph.startISO)} – {fmtMonth(ph.endISO)}
                    </span>
                  </div>
                );
              })}
            </div>
            {activePhase && (
              <p
                className="mt-2 pl-3 text-[12px] italic leading-relaxed text-ink-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {activePhase.description}
              </p>
            )}
          </>
        ) : (
          <p className="mt-1.5 text-sm text-ink-2">
            Not running
            {sadeSati.startISO && (
              <>
                {' · next begins '}
                <span className="font-mono tabular-nums text-ink-2/85">{fmt(sadeSati.startISO)}</span>
              </>
            )}
          </p>
        )}
      </section>

      <Rule gold={false} />

      {/* 4 · Ingress ledger --------------------------------------------------- */}
      <section>
        <Kicker className="mb-2">Ahead · sign changes</Kicker>
        {report.upcomingIngresses.length ? (
          <div className="divide-y divide-foreground/[0.08]">
            {report.upcomingIngresses.slice(0, 5).map((ing) => (
              <div
                key={`${ing.id}-${ing.dateISO}`}
                className="flex items-center justify-between gap-3 py-1.5"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="w-4 shrink-0 text-center text-[15px] text-foreground/85">
                    {PLANETS[ing.id].glyph}
                  </span>
                  <span className="truncate text-sm text-ink-2">→ {ing.toSignName}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3 font-mono text-[11px] tabular-nums">
                  <span className="text-ink-2/80">{fmt(ing.dateISO)}</span>
                  <span className="hidden text-ink-2/55 sm:inline">
                    {ordinal(ing.houseFromMoon)} from Moon
                  </span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-2/60">No sign changes on the near horizon.</p>
        )}
      </section>

      <Rule gold={false} />

      {/* 5 · Tārā-bala footnote ---------------------------------------------- */}
      <p className="text-[11px] leading-relaxed text-ink-2/70">
        <span className="font-sans font-semibold uppercase tracking-[0.14em] text-ink-2/60">
          Tārā-bala
        </span>
        {' — '}
        {report.taraBala.name} tārā · {report.taraBala.nakshatra} · {report.taraBala.meaning}.
      </p>
    </Shell>
  );
}
