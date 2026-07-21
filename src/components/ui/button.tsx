'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium transition-[colors,transform,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985] select-none',
  {
    variants: {
      variant: {
        // Flat gold-ink rectangle with navy text — the one large gold object.
        primary:
          'bg-gold text-gold-foreground hover:bg-champagne hover:shadow-[inset_0_1px_0_hsl(var(--champagne)),0_0_26px_-14px_hsl(var(--gold)/0.5)]',
        gold:
          'bg-gold text-gold-foreground hover:bg-champagne hover:shadow-glow-gold',
        outline: 'border border-gold/60 bg-transparent text-gold hover:bg-gold/[0.08]',
        // Ghost with a gold underline that sweeps in on hover.
        ghost:
          'text-muted-foreground hover:text-foreground after:absolute after:inset-x-3 after:bottom-1.5 after:h-px after:origin-left after:scale-x-0 after:bg-gold hover:after:scale-x-100 after:transition-transform after:duration-200',
        glass: 'glass text-foreground hover:border-gold/40',
      },
      size: {
        sm: 'h-9 px-4 text-[13px]',
        default: 'h-11 px-5 text-sm',
        lg: 'h-12 px-7 text-sm',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = 'Button';

export { buttonVariants };
