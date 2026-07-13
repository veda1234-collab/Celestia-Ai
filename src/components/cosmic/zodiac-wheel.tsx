'use client';

import { ZODIAC } from '@/lib/astrology/signs';
import { cn } from '@/lib/utils/cn';

/**
 * Decorative, slowly-rotating zodiac wheel used on the hero and loader.
 * Pure SVG so it stays crisp at any size and GPU-composites cheaply.
 */
export function ZodiacWheel({ size = 420, className }: { size?: number; className?: string }) {
  const c = size / 2;
  const rOuter = c - 6;
  const rGlyph = c - 30;
  const rInner = c - 58;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={cn('text-primary', className)}
      aria-hidden
    >
      <defs>
        <radialGradient id="zw-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.5" />
          <stop offset="45%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="zw-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="50%" stopColor="hsl(var(--accent))" />
          <stop offset="100%" stopColor="hsl(var(--gold))" />
        </linearGradient>
      </defs>

      <circle cx={c} cy={c} r={rInner - 6} fill="url(#zw-core)" />

      {/* Rotating outer wheel */}
      <g className="origin-center animate-spin-slow" style={{ transformBox: 'fill-box' }}>
        <circle cx={c} cy={c} r={rOuter} fill="none" stroke="url(#zw-ring)" strokeWidth="1.5" opacity="0.8" />
        <circle cx={c} cy={c} r={rGlyph + 14} fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.25" />
        <circle cx={c} cy={c} r={rInner} fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.25" />

        {ZODIAC.map((sign, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const tickAngle = (i * 30 - 90) * (Math.PI / 180);
          // Round so server and client render identical strings (no hydration mismatch).
          const q = (n: number) => Math.round(n * 100) / 100;
          const gx = q(c + rGlyph * Math.cos(angle));
          const gy = q(c + rGlyph * Math.sin(angle));
          const x1 = q(c + rInner * Math.cos(tickAngle));
          const y1 = q(c + rInner * Math.sin(tickAngle));
          const x2 = q(c + rOuter * Math.cos(tickAngle));
          const y2 = q(c + rOuter * Math.sin(tickAngle));
          return (
            <g key={sign.index}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.5" opacity="0.25" />
              <text
                x={gx}
                y={gy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={size * 0.055}
                fill="currentColor"
                opacity="0.9"
              >
                {sign.glyph}
              </text>
            </g>
          );
        })}
      </g>

      {/* Counter-rotating inner constellation ring */}
      <g className="origin-center animate-spin-reverse" style={{ transformBox: 'fill-box' }}>
        <circle cx={c} cy={c} r={rInner - 18} fill="none" stroke="hsl(var(--accent))" strokeWidth="0.75" strokeDasharray="2 8" opacity="0.6" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30) * (Math.PI / 180);
          return (
            <circle
              key={i}
              cx={Math.round((c + (rInner - 18) * Math.cos(a)) * 100) / 100}
              cy={Math.round((c + (rInner - 18) * Math.sin(a)) * 100) / 100}
              r={1.6}
              fill="hsl(var(--gold))"
            />
          );
        })}
      </g>
    </svg>
  );
}
