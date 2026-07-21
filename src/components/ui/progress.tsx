import * as React from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Ruled progress bar — a flat tone fill with a gold caret at the value, matching
 * the Meter primitive. `tone` accepts any semantic pigment CSS var (default gold).
 */
export function Progress({
  value,
  className,
  tone = 'var(--gold)',
  caret = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: number; tone?: string; caret?: boolean }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn('meter-track', className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <div
        className="meter-fill transition-[width] duration-700 ease-out"
        style={{ width: `${v}%`, background: `hsl(${tone})` }}
      />
      {caret && <span className="meter-caret" style={{ left: `calc(${v}% - 1px)` }} />}
    </div>
  );
}
