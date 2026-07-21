'use client';

import { cn } from '@/lib/utils/cn';
import { Starfield } from './starfield';

/** Slowly drifting aurora nebula blobs. */
export function Aurora({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div className="absolute -left-[15%] top-[-14%] h-[62vh] w-[62vh] rounded-full bg-primary/50 blur-[100px] animate-aurora" />
      <div
        className="absolute right-[-12%] top-[2%] h-[56vh] w-[56vh] rounded-full bg-accent/40 blur-[110px] animate-aurora"
        style={{ animationDelay: '-6s' }}
      />
      <div
        className="absolute bottom-[-18%] left-[30%] h-[54vh] w-[54vh] rounded-full bg-gold/26 blur-[120px] animate-aurora"
        style={{ animationDelay: '-11s' }}
      />
      <div
        className="absolute top-[34%] right-[20%] h-[44vh] w-[44vh] rounded-full bg-indigo-600/34 blur-[110px] animate-aurora"
        style={{ animationDelay: '-3s' }}
      />
      <div
        className="absolute left-[36%] top-[26%] h-[46vh] w-[46vh] rounded-full bg-accent/28 blur-[120px] animate-aurora"
        style={{ animationDelay: '-14s' }}
      />
    </div>
  );
}

/** Occasional shooting stars. */
export function Meteors({ count = 6 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="absolute h-0.5 w-0.5 rounded-full bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)] animate-[meteor_linear_infinite]"
          style={{
            top: `${(i * 53) % 60}%`,
            left: `${20 + ((i * 37) % 80)}%`,
            animationDelay: `${i * 2.6}s`,
            animationDuration: `${5 + (i % 4)}s`,
          }}
        >
          <span className="absolute right-0 top-1/2 h-px w-[120px] -translate-y-1/2 bg-gradient-to-l from-white/70 to-transparent" />
        </span>
      ))}
    </div>
  );
}

/**
 * Full-viewport cosmic backdrop: gradient base, aurora, starfield, meteors and
 * a fine grain. Fixed behind all content.
 */
export function CosmicBackground({ meteors = true }: { meteors?: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--scene-1)),hsl(var(--background))_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--scene-2)),transparent_55%)]" />
      <Aurora />
      <Starfield density={0.00022} />
      {meteors && <Meteors />}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,hsl(var(--background)/0.7)_100%)]" />
      <div className="absolute inset-0 opacity-[0.04] mix-blend-soft-light bg-grain" />
    </div>
  );
}
