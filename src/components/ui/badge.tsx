import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'border-gold/30 bg-gold/[0.08] text-gold',
        accent: 'border-champagne/30 bg-champagne/[0.08] text-champagne',
        gold: 'border-gold/30 bg-gold/[0.08] text-gold',
        muted: 'border-foreground/10 bg-inset text-ink-2',
        outline: 'border-foreground/12 text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
