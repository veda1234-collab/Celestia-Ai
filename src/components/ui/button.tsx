'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] text-primary-foreground shadow-glow hover:bg-[position:right_center] hover:shadow-[0_0_50px_-6px_hsl(var(--primary)/0.8)] hover:-translate-y-0.5',
        gold:
          'bg-gradient-to-r from-gold to-[hsl(38_96%_72%)] text-gold-foreground shadow-glow-gold hover:-translate-y-0.5',
        glass: 'glass text-foreground hover:bg-[hsl(var(--card)/0.8)] hover:-translate-y-0.5',
        outline:
          'border border-border bg-transparent text-foreground hover:border-primary/60 hover:bg-primary/5',
        ghost: 'text-muted-foreground hover:text-foreground hover:bg-foreground/5',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        default: 'h-11 px-6 text-sm',
        lg: 'h-14 px-8 text-base',
        icon: 'h-11 w-11',
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
