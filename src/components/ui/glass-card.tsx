import * as React from 'react';
import { cn } from '@/lib/utils/cn';

/** Frosted glass surface — the workhorse container for cards and panels. */
export const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean; glow?: boolean }
>(({ className, interactive, glow, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'glass rounded-2xl',
      interactive &&
        'transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow',
      glow && 'ring-glow',
      className,
    )}
    {...props}
  />
));
GlassCard.displayName = 'GlassCard';

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-display text-lg font-semibold tracking-tight', className)} {...props} />;
}
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}
export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-3 p-6 pt-0', className)} {...props} />;
}
