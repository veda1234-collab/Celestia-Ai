'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { CornerTicks, Kicker, Rule } from './plate';

/**
 * The workhorse surface. Defaults to a matte "plate" (printed sheet) with paper
 * grain, a hairline border that gilds on hover, and corner reticle ticks.
 * `surface="glass"` keeps the frosted look for the header and floating overlays.
 */
export const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    interactive?: boolean;
    glow?: boolean;
    surface?: 'plate' | 'glass';
    ticks?: boolean;
  }
>(({ className, interactive, glow, surface = 'plate', ticks = false, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      surface === 'glass' ? 'glass rounded-2xl' : 'plate',
      interactive && 'transition-colors duration-200 hover:border-gold/55',
      glow && 'ring-glow',
      className,
    )}
    {...props}
  >
    {ticks && <CornerTicks />}
    {children}
  </div>
));
GlassCard.displayName = 'GlassCard';

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />;
}

/**
 * Editorial plate header: a mono kicker (`PLATE 0N · KICKER`), a Fraunces title,
 * and the signature pen-drawn gold rule.
 */
export function PlateHeader({
  folio,
  kicker,
  title,
  description,
  action,
  className,
}: {
  folio?: string;
  kicker?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-6 pt-6', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {(folio || kicker) && (
            <Kicker className="mb-2 flex items-center gap-2">
              {folio && <span className="font-mono tracking-normal text-gold/80">{folio}</span>}
              {folio && kicker && <span className="text-ink-2/40">·</span>}
              {kicker}
            </Kicker>
          )}
          <h3 className="plate-title text-foreground">{title}</h3>
          {description && <p className="mt-1.5 text-sm text-ink-2">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <Rule className="mt-4" />
    </div>
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('card-subhead text-foreground', className)} {...props} />;
}
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-ink-2', className)} {...props} />;
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}
export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-3 p-6 pt-0', className)} {...props} />;
}

export { Rule };
