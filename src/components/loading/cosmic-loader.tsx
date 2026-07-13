'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { ZodiacWheel } from '@/components/cosmic';
import { Progress } from '@/components/ui/progress';
import { PLANETS, PLANET_ORDER } from '@/lib/astrology/signs';

interface Props {
  steps: string[];
  done: boolean;
  onComplete: () => void;
}

/**
 * Full-screen cosmic loader. Progresses through named calculation steps while a
 * chart is drawn, then resolves once the real chart is ready AND the sequence
 * has played out (so it never flashes past too fast).
 */
export function CosmicLoader({ steps, done, onComplete }: Props) {
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (completed >= steps.length) return;
    const t = setTimeout(() => setCompleted((c) => c + 1), completed === 0 ? 500 : 780);
    return () => clearTimeout(t);
  }, [completed, steps.length]);

  useEffect(() => {
    if (done && completed >= steps.length) {
      const t = setTimeout(onComplete, 750);
      return () => clearTimeout(t);
    }
  }, [done, completed, steps.length, onComplete]);

  const progress = (Math.min(completed, steps.length) / steps.length) * 100;
  const planetsShown = Math.round((completed / steps.length) * PLANET_ORDER.length);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Drawing chart */}
      <div className="relative mb-10 h-64 w-64">
        <ZodiacWheel size={256} className="absolute inset-0 opacity-30" />
        <svg viewBox="0 0 256 256" className="absolute inset-0 text-primary">
          <motion.circle
            cx="128"
            cy="128"
            r="92"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            strokeDasharray="580"
            initial={{ strokeDashoffset: 580 }}
            animate={{ strokeDashoffset: 580 - (progress / 100) * 580 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
          {PLANET_ORDER.slice(0, planetsShown).map((id, i) => {
            const a = (i / PLANET_ORDER.length) * Math.PI * 2 - Math.PI / 2;
            return (
              <motion.g key={id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
                <circle cx={128 + 92 * Math.cos(a)} cy={128 + 92 * Math.sin(a)} r="7" fill={PLANETS[id].color} opacity="0.9" />
                <text x={128 + 92 * Math.cos(a)} y={128 + 92 * Math.sin(a)} textAnchor="middle" dominantBaseline="central" fontSize="9" fill="hsl(var(--background))">
                  {PLANETS[id].glyph}
                </text>
              </motion.g>
            );
          })}
          <circle cx="128" cy="128" r="4" fill="hsl(var(--gold))" />
        </svg>
      </div>

      <h2 className="font-display text-2xl font-semibold">Aligning the heavens…</h2>
      <p className="mt-1 text-sm text-muted-foreground">Reading the moment you arrived.</p>

      <div className="mt-8 w-full max-w-sm">
        <Progress value={progress} />
        <ul className="mt-6 space-y-3">
          {steps.map((step, i) => {
            const isDone = i < completed;
            const isCurrent = i === completed;
            return (
              <li key={step} className="flex items-center gap-3 text-sm">
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full transition-colors ${
                    isDone ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isDone ? (
                      <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check className="h-3 w-3" />
                      </motion.span>
                    ) : isCurrent ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : null}
                  </AnimatePresence>
                </span>
                <span className={isDone ? 'text-foreground' : isCurrent ? 'text-foreground/80' : 'text-muted-foreground/60'}>
                  {step}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.div>
  );
}
