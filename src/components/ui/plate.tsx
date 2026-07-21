'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { DUR, easeInk } from '@/lib/motion';

/**
 * Reduced-motion, gated behind mount. framer's `useReducedMotion` returns the
 * media-query value immediately on the client, which differs from the server
 * (no media query) and mismatches hydration whenever a component branches its
 * DOM on it. Deferring to `false` until mounted keeps the first client render
 * identical to the SSR output.
 */
function useSafeReducedMotion(): boolean {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted ? !!reduce : false;
}

/** The five semantic pigments, plus neutral ink. */
export type Tone = 'good' | 'info' | 'caution' | 'care' | 'gold' | 'neutral';

const TONE_VAR: Record<Tone, string> = {
  good: 'var(--good)',
  info: 'var(--info)',
  caution: 'var(--caution)',
  care: 'var(--care)',
  gold: 'var(--gold)',
  neutral: 'var(--ink-2)',
};

/** Small-caps eyebrow. `gold` tints it with the accent ink. */
export function Kicker({
  children,
  gold,
  className,
  as: As = 'p',
}: {
  children: React.ReactNode;
  gold?: boolean;
  className?: string;
  as?: React.ElementType;
}) {
  return <As className={cn('kicker', gold && 'kicker-gold', className)}>{children}</As>;
}

/** Monospace marginalia line — dates, coordinates, ayanāṁśa. */
export function Dateline({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('dateline', className)}>{children}</p>;
}

/**
 * The signature engraved separator: a gold hairline that pens itself in from
 * the left on first view. Holds perfectly still after. Reduced-motion shows it
 * already drawn.
 */
export function Rule({
  gold = true,
  className,
  animate = true,
}: {
  gold?: boolean;
  className?: string;
  animate?: boolean;
}) {
  const reduce = useSafeReducedMotion();
  const base = cn('h-px w-full border-0', gold ? 'rule-gold' : 'rule-hair', className);
  if (reduce || !animate) return <hr className={base} />;
  return (
    <motion.hr
      className={base}
      style={{ transformOrigin: 'left' }}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: DUR.rule, ease: easeInk }}
    />
  );
}

/** Corner reticle ticks — appear on plate hover / active state. */
export function CornerTicks({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-200',
        '[.plate:hover>&]:opacity-100 [[data-active=true]>&]:opacity-100',
        className,
      )}
    >
      <span className="absolute left-2 top-2 h-2.5 w-2.5 border-l border-t border-gold/50" />
      <span className="absolute right-2 top-2 h-2.5 w-2.5 border-r border-t border-gold/50" />
      <span className="absolute bottom-2 left-2 h-2.5 w-2.5 border-b border-l border-gold/50" />
      <span className="absolute bottom-2 right-2 h-2.5 w-2.5 border-b border-r border-gold/50" />
    </span>
  );
}

/** Status pill: 6px tone-dot + small-caps label + optional mono number. */
export function SemanticTag({
  tone,
  label,
  value,
  className,
}: {
  tone: Tone;
  label: string;
  value?: string | number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-inset/60 px-2.5 py-1',
        className,
      )}
    >
      <span className="tone-dot" style={{ background: `hsl(${TONE_VAR[tone]})` }} />
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-foreground/85">{label}</span>
      {value != null && (
        <span className="font-mono text-[11px] tabular-nums text-ink-2">{value}</span>
      )}
    </span>
  );
}

/** Hairline tag for vargas / labels — mono, no fill. */
export function Tag({ children, active, className }: { children: React.ReactNode; active?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-chip border px-2 py-0.5 font-mono text-[11px] tabular-nums transition-colors',
        active ? 'border-gold/60 text-gold' : 'border-foreground/12 text-ink-2',
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * The signature data primitive: a 3px ruled track with a tone fill, a 2px gold
 * caret at the value, and a trailing mono number.
 *  - linear: for tables / stacks
 *  - barometer: 0–100 with tertile ruled zones + tick labels (gochar)
 */
export function Meter({
  value,
  tone = 'gold',
  variant = 'linear',
  showValue = true,
  suffix,
  className,
}: {
  value: number;
  tone?: Tone;
  variant?: 'linear' | 'barometer';
  showValue?: boolean;
  suffix?: string;
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const fill = `hsl(${TONE_VAR[tone]})`;

  if (variant === 'barometer') {
    return (
      <div className={cn('w-full', className)}>
        <div className="relative h-1.5 w-full overflow-visible rounded-full">
          {/* tertile ruled zones */}
          <div className="absolute inset-0 flex overflow-hidden rounded-full">
            <div className="h-full" style={{ width: '33%', background: 'hsl(var(--care) / 0.22)' }} />
            <div className="h-full" style={{ width: '19%', background: 'hsl(var(--caution) / 0.22)' }} />
            <div className="h-full flex-1" style={{ background: 'hsl(var(--good) / 0.22)' }} />
          </div>
          <div className="absolute top-[-3px] h-3 w-[2px] bg-gold" style={{ left: `calc(${v}% - 1px)` }} />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[9px] tabular-nums text-ink-2/70">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="meter-track flex-1">
        <div className="meter-fill" style={{ width: `${v}%`, background: fill }} />
        <span className="meter-caret" style={{ left: `calc(${v}% - 1px)` }} />
      </div>
      {showValue && (
        <span className="w-8 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink-2">
          {Math.round(value)}
          {suffix}
        </span>
      )}
    </div>
  );
}

/**
 * A numeral that counts up to its value once when scrolled into view, then rests.
 * Reduced motion shows the final value immediately. Always tabular mono.
 */
export function CountUp({
  value,
  decimals = 0,
  suffix = '',
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}) {
  const reduce = useSafeReducedMotion();
  const ref = React.useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = React.useState(reduce ? value : 0);

  React.useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let started = false;
    const run = () => {
      const t0 = performance.now();
      const dur = 900;
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(value * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !started) {
        started = true;
        run();
      }
    });
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, reduce]);

  return (
    <span ref={ref} className={cn('font-mono tabular-nums', className)}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/** The persistent left folio rail — section index for the bound plates. */
const RAIL_SECTIONS = [
  { id: 'plate-01', folio: '01', label: 'Nativity' },
  { id: 'plate-02', folio: '02', label: 'Rāśi' },
  { id: 'plate-03', folio: '03', label: 'Daśā' },
  { id: 'plate-04', folio: '04', label: 'Gochar' },
  { id: 'plate-05', folio: '05', label: 'Grahas' },
  { id: 'plate-06', folio: '06', label: 'Notes' },
];

export function SectionRail({ name, className }: { name?: string; className?: string }) {
  const [active, setActive] = React.useState('plate-01');

  React.useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    RAIL_SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <nav className={cn('sticky top-24 w-14 shrink-0 self-start', className)} aria-label="Chart sections">
      <ul className="space-y-3">
        {RAIL_SECTIONS.map((s) => {
          const on = active === s.id;
          return (
            <li key={s.id}>
              <a href={`#${s.id}`} className="group block" title={s.label}>
                <span className={cn('block font-mono text-[11px] tabular-nums transition-colors', on ? 'text-gold' : 'text-ink-2/50 group-hover:text-ink-2')}>
                  {s.folio}
                </span>
                <span
                  className={cn(
                    'mt-1 block h-px origin-left transition-all duration-300',
                    on ? 'w-8 bg-gold' : 'w-3 bg-foreground/15 group-hover:w-5',
                  )}
                />
              </a>
            </li>
          );
        })}
      </ul>
      {name && (
        <p className="mt-6 font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-ink-2/40 [writing-mode:vertical-rl]">
          {name}
        </p>
      )}
    </nav>
  );
}

/** Three (or N) cells split by vertical hairlines — the summary stat band. */
export function StatBand({ children, className }: { children: React.ReactNode; className?: string }) {
  const items = React.Children.toArray(children);
  return (
    <div className={cn('grid grid-flow-col auto-cols-fr rounded-field plate-inset', className)}>
      {items.map((child, i) => (
        <div key={i} className={cn('px-4 py-3', i > 0 && 'border-l border-foreground/10')}>
          {child}
        </div>
      ))}
    </div>
  );
}
