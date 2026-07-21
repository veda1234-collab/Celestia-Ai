'use client';

import { Compass, MessagesSquare, Orbit, Sparkles, Gem, LineChart, type LucideIcon } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Reveal } from '@/components/ui/reveal';
import { Kicker, Rule, Meter } from '@/components/ui/plate';
import { cn } from '@/lib/utils/cn';

/* ── Decorative geometry for the mini zodiac ring (module-scope, computed once) ── */
const TAU = Math.PI * 2;
// Round every trig result: Math.cos/sin can differ by 1 ULP between the Node
// server's V8 and the browser's, which mismatches the SSR'd SVG coordinates.
const r2 = (n: number) => Math.round(n * 100) / 100;
const RING_TICKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * TAU - Math.PI / 2;
  return {
    x1: r2(100 + Math.cos(a) * 68),
    y1: r2(100 + Math.sin(a) * 68),
    x2: r2(100 + Math.cos(a) * 90),
    y2: r2(100 + Math.sin(a) * 90),
  };
});
// A scatter of gold "grahas" set on the ring at chosen ecliptic longitudes.
const RING_DOTS = [18, 74, 129, 168, 236, 307].map((deg, i) => {
  const a = (deg / 360) * TAU - Math.PI / 2;
  return { key: i, x: r2(100 + Math.cos(a) * 79), y: r2(100 + Math.sin(a) * 79) };
});

/** A light, engraved zodiac ring — NOT the full wheel. Rings + ticks + gold grahas. */
function ZodiacRing() {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="Zodiac ring specimen"
      className="h-36 w-36 shrink-0 sm:h-44 sm:w-44"
    >
      <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--foreground) / 0.15)" strokeWidth="1" />
      <circle cx="100" cy="100" r="68" fill="none" stroke="hsl(var(--foreground) / 0.10)" strokeWidth="1" />
      <circle cx="100" cy="100" r="40" fill="none" stroke="hsl(var(--foreground) / 0.07)" strokeWidth="1" strokeDasharray="2 5" />
      {RING_TICKS.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="hsl(var(--foreground) / 0.12)" strokeWidth="1" />
      ))}
      {RING_DOTS.map((d) => (
        <circle key={d.key} cx={d.x} cy={d.y} r="3.1" fill="hsl(var(--gold))" />
      ))}
      {/* Ascendant marker — a single gold tick at the eastern horizon. */}
      <line x1="4" y1="100" x2="19" y2="100" stroke="hsl(var(--gold))" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="2.4" fill="hsl(var(--gold) / 0.85)" />
    </svg>
  );
}

/** The shared card cornice: monochrome icon in an inset well + mono folio. */
function Head({ icon: Icon, folio }: { icon: LucideIcon; folio: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="grid h-10 w-10 place-items-center rounded-field plate-inset text-foreground/70 transition-colors duration-200 group-hover:text-gold">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
      </span>
      <span className="font-mono text-[11px] tabular-nums tracking-[0.14em] text-ink-2/50">{folio}</span>
    </div>
  );
}

const CARD = 'group flex h-full flex-col p-6';

export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-6 py-24">
      {/* Masthead */}
      <Reveal className="max-w-2xl">
        <Kicker gold>The Instruments</Kicker>
        <h2 className="mt-2 font-display text-[2rem] font-normal leading-[1.08] tracking-[-0.01em] text-foreground sm:text-[2.5rem]">
          A universe of insight
        </h2>
        <p className="mt-3 text-ink-2">
          Everything about your chart — computed from real astronomy, engraved as reference figures,
          and made legible.
        </p>
        <Rule className="mt-5" />
      </Reveal>

      {/* Bento grid */}
      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {/* 01 · Engine — the large hero, spanning 2 cols × 2 rows */}
        <Reveal className="h-full sm:col-span-2 md:col-span-2 md:row-span-2">
          <GlassCard className={cn(CARD, 'md:p-7')}>
            <Head icon={Orbit} folio="01 / 06" />
            <div className="mt-6 flex flex-1 flex-col items-center gap-6 sm:flex-row sm:gap-8">
              <ZodiacRing />
              <div>
                <h3 className="card-subhead text-foreground">Real Birth-Chart Engine</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">
                  Ascendant, planets, nakshatras, houses, navāṁśa and Vimśottari daśā computed from
                  your exact time and place — not generic sun-sign fluff.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {['Sidereal · Lahiri', 'Swiss ephemeris', '16 vargas'].map((t) => (
                    <span
                      key={t}
                      className="rounded-chip border border-foreground/12 px-2 py-0.5 font-mono text-[10.5px] tabular-nums text-ink-2"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <Rule className="mt-6" />
            <p className="dateline mt-3">12 houses · 27 nakṣatras · 9 grahas · 5 elements</p>
          </GlassCard>
        </Reveal>

        {/* 02 · AI Astrologer — mock chat bubble */}
        <Reveal delay={0.05} className="h-full">
          <GlassCard className={CARD}>
            <Head icon={MessagesSquare} folio="02 / 06" />
            <h3 className="card-subhead mt-5 text-foreground">AI Astrologer</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              Chat with an astrologer that reads from your actual placements — career, love, finance,
              health and timing, in plain language.
            </p>
            <div className="mt-auto space-y-2.5 pt-6">
              <div className="ml-auto max-w-[88%] rounded-field rounded-br-sm plate-inset px-3.5 py-2.5">
                <p className="text-[13px] italic leading-snug text-foreground/85">
                  “When is a good time to change careers?”
                </p>
              </div>
              <div className="flex items-center gap-2 pl-1">
                <span className="tone-dot shrink-0" style={{ background: 'hsl(var(--gold))' }} />
                <span className="font-mono text-[11px] tracking-wide text-ink-2">reading your 10th house…</span>
              </div>
            </div>
          </GlassCard>
        </Reveal>

        {/* 03 · Daśā & Transit — mini 120-year ribbon */}
        <Reveal delay={0.1} className="h-full">
          <GlassCard className={CARD}>
            <Head icon={Compass} folio="03 / 06" />
            <h3 className="card-subhead mt-5 text-foreground">Daśā & Transit Timing</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              Understand the planetary period you are living through, and the seasons of opportunity
              and lesson ahead.
            </p>
            <div className="mt-auto pt-7">
              <div className="relative pt-4">
                <span
                  className="absolute top-0 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.12em] text-gold"
                  style={{ left: '58%' }}
                >
                  now
                </span>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full plate-inset">
                  {[
                    { w: 17, tone: 'good' },
                    { w: 13, tone: 'caution' },
                    { w: 21, tone: 'care' },
                    { w: 15, tone: 'good' },
                    { w: 12, tone: 'caution' },
                    { w: 22, tone: 'care' },
                  ].map((s, i) => (
                    <div key={i} style={{ width: `${s.w}%`, background: `hsl(var(--${s.tone}) / 0.3)` }} />
                  ))}
                </div>
                <span className="absolute bottom-[1px] h-3.5 w-[2px] bg-gold" style={{ left: 'calc(58% - 1px)' }} />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[10px] tabular-nums text-ink-2/60">
                <span>1998</span>
                <span>120 yr</span>
                <span>2118</span>
              </div>
            </div>
          </GlassCard>
        </Reveal>

        {/* 05 · Yogas, Doshas & Strengths — inline meters (spans 2 cols) */}
        <Reveal delay={0.05} className="h-full sm:col-span-2 md:col-span-2">
          <GlassCard className={CARD}>
            <Head icon={LineChart} folio="05 / 06" />
            <h3 className="card-subhead mt-5 text-foreground">Yogas, Doshas & Strengths</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              See the auspicious combinations and classical doshas in your chart, with planetary
              strength at a glance.
            </p>
            <div className="mt-auto space-y-3.5 pt-6">
              <div>
                <p className="mb-1.5 text-[11px] text-ink-2">Rāja yoga · dignity</p>
                <Meter value={82} tone="good" />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] text-ink-2">Maṅgala dośa · intensity</p>
                <Meter value={46} tone="caution" />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] text-ink-2">Budha bala · strength</p>
                <Meter value={91} tone="good" />
              </div>
            </div>
          </GlassCard>
        </Reveal>

        {/* 04 · Lucky & Remedial — color swatches */}
        <Reveal delay={0.1} className="h-full">
          <GlassCard className={CARD}>
            <Head icon={Gem} folio="04 / 06" />
            <h3 className="card-subhead mt-5 text-foreground">Lucky & Remedial</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              Personalized colours, numbers, gemstones and auspicious days, drawn from your ascendant
              and Moon.
            </p>
            <div className="mt-auto pt-6">
              <div className="flex gap-2.5">
                {[
                  { label: 'Gold', v: 'hsl(var(--gold))' },
                  { label: 'Emerald', v: 'hsl(var(--good))' },
                  { label: 'Rose', v: 'hsl(var(--care))' },
                  { label: 'Sapphire', v: 'hsl(var(--info))' },
                ].map((s) => (
                  <div key={s.label} className="flex flex-1 flex-col items-center gap-1.5">
                    <span
                      className="h-8 w-full rounded-field border border-foreground/10"
                      style={{ background: s.v }}
                    />
                    <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-2/70">{s.label}</span>
                  </div>
                ))}
              </div>
              <p className="dateline mt-3 text-ink-2/70">nos. 3 · 6 · 9 — Thursday</p>
            </div>
          </GlassCard>
        </Reveal>

        {/* 06 · A Considered Interface — full-width typographic banner */}
        <Reveal delay={0.15} className="h-full sm:col-span-2 md:col-span-3">
          <GlassCard className={cn(CARD, 'md:p-8')}>
            <Head icon={Sparkles} folio="06 / 06" />
            <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-10">
              <div className="flex items-start gap-4">
                <span aria-hidden className="font-display text-6xl leading-[0.6] text-gold/70">“</span>
                <p className="font-display text-xl italic leading-snug text-foreground sm:text-[1.6rem] md:max-w-md">
                  Every chart an engraved figure. Every reading a ruled column of prose.
                </p>
              </div>
              <div className="md:max-w-xs md:text-right">
                <h3 className="card-subhead text-foreground">A Considered Interface</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">
                  An editorial, observatory-grade reading room — restrained, legible, and made to be
                  lived in.
                </p>
              </div>
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </section>
  );
}
