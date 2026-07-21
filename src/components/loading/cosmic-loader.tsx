'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PLANETS, PLANET_ORDER, ZODIAC } from '@/lib/astrology/signs';
import { VedastraMark } from '@/components/brand/vedastra-mark';
import { easeInk } from '@/lib/motion';

interface Props {
  steps: string[];
  done: boolean;
  onComplete: () => void;
  /** Mono birth-detail line, available before the chart is computed. */
  dateline?: string;
}

const SIZE = 300;
const C = SIZE / 2;
const R = C - 34;

const polar = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: C + r * Math.sin(a), y: C - r * Math.cos(a) };
};

/**
 * "The plate is struck" — a full-screen registration sequence that inks a
 * reticle, inscribes the zodiac ring, plots the nine grahas, and fills a
 * computation ledger of ruled lines. Gated: resolves once the real chart is
 * ready AND the core sequence has played. Reduced motion cuts to final state.
 */
export function CosmicLoader({ steps, done, onComplete, dateline }: Props) {
  const reduce = useReducedMotion();
  const [completed, setCompleted] = useState(reduce ? steps.length : 0);

  useEffect(() => {
    if (reduce || completed >= steps.length) return;
    const t = setTimeout(() => setCompleted((c) => c + 1), completed === 0 ? 420 : 620);
    return () => clearTimeout(t);
  }, [completed, steps.length, reduce]);

  useEffect(() => {
    if (done && completed >= steps.length) {
      const t = setTimeout(onComplete, reduce ? 300 : 600);
      return () => clearTimeout(t);
    }
  }, [done, completed, steps.length, onComplete, reduce]);

  const progress = (Math.min(completed, steps.length) / steps.length) * 100;
  const planetsShown = reduce ? PLANET_ORDER.length : Math.round((completed / steps.length) * PLANET_ORDER.length);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-well px-6 page-grain"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.4, ease: easeInk }}
    >
      <p className="kicker kicker-gold absolute left-6 top-6">Observation in progress</p>

      {/* The plate being struck */}
      <div className="relative h-[300px] w-[300px]">
        {/* corner registration ticks */}
        {[
          'left-0 top-0 border-l border-t',
          'right-0 top-0 border-r border-t',
          'bottom-0 left-0 border-b border-l',
          'bottom-0 right-0 border-b border-r',
        ].map((c, i) => (
          <motion.span
            key={i}
            className={`absolute h-4 w-4 border-gold/60 ${c}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduce ? 0 : 0.15, duration: 0.3 }}
          />
        ))}
        {/* reticle hairlines */}
        <motion.span
          className="absolute left-0 top-1/2 h-px w-full bg-gold/40"
          style={{ transformOrigin: 'center' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: reduce ? 0 : 0.36, ease: easeInk }}
        />
        <motion.span
          className="absolute left-1/2 top-0 h-full w-px bg-gold/40"
          style={{ transformOrigin: 'center' }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: reduce ? 0 : 0.36, ease: easeInk }}
        />

        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0">
          {/* inscribed zodiac ring */}
          <motion.circle
            cx={C} cy={C} r={R} fill="none" stroke="hsl(var(--gold))" strokeWidth="1"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : 0.36, ease: easeInk }}
          />
          {/* sign glyphs + degree ticks */}
          {ZODIAC.map((z, i) => {
            const pt = polar(i * 30 + 15, R - 16);
            const t1 = polar(i * 30, R);
            const t2 = polar(i * 30, R + 6);
            return (
              <motion.g key={z.index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 0.5 + i * 0.03 }}>
                <line x1={t1.x} y1={t1.y} x2={t2.x} y2={t2.y} stroke="hsl(var(--gold-deep) / 0.5)" strokeWidth="1" />
                <text x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" fontSize="11" fill="hsl(var(--foreground) / 0.5)">{z.glyph}</text>
              </motion.g>
            );
          })}
          {/* plotted grahas — candy colour permitted (this is the wheel) */}
          {PLANET_ORDER.slice(0, planetsShown).map((id, i) => {
            const pt = polar((i / PLANET_ORDER.length) * 360, R);
            return (
              <motion.g key={id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                <circle cx={pt.x} cy={pt.y} r="9" fill="hsl(var(--well))" stroke="hsl(var(--gold) / 0.6)" strokeWidth="1" />
                <text x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" fontSize="10" fill={PLANETS[id].color}>{PLANETS[id].glyph}</text>
              </motion.g>
            );
          })}
          {/* ascendant axis appears once the sequence nears completion */}
          {completed >= steps.length && (
            <motion.line
              x1={polar(180, R).x} y1={polar(180, R).y} x2={polar(0, R).x} y2={polar(0, R).y}
              stroke="hsl(var(--gold))" strokeWidth="1.5"
              initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }}
            />
          )}
          {/* medallion at center, shared into the header on resolve */}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <VedastraMark medallion className="h-12 w-12" />
        </div>
      </div>

      <h2 className="mt-9 lede text-center text-foreground" style={{ fontSize: '1.5rem' }}>
        Fixing your position among the stars.
      </h2>
      {dateline && <p className="dateline mt-2">{dateline}</p>}

      {/* Computation ledger — ruled lines, not checkboxes */}
      <ul className="mt-7 w-full max-w-xs space-y-2.5">
        {steps.map((step, i) => {
          const isDone = i < completed;
          const isCurrent = i === completed;
          return (
            <li key={step} className="relative">
              <span className={`block text-sm transition-colors ${isDone ? 'text-foreground/80' : isCurrent ? 'text-foreground' : 'text-ink-2/40'}`}>
                {step}
              </span>
              {isDone && (
                <motion.span
                  className="mt-1 block h-px rule-gold"
                  style={{ transformOrigin: 'left' }}
                  initial={{ scaleX: reduce ? 1 : 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, ease: easeInk }}
                />
              )}
            </li>
          );
        })}
      </ul>

      {/* Progress — a 2px gold rule pinned to the bottom margin */}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-foreground/10">
        <div className="h-full bg-gold transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>
    </motion.div>
  );
}
