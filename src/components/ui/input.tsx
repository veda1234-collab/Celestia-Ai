import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-12 w-full rounded-xl border border-input bg-background/40 px-4 py-2 text-sm backdrop-blur-sm',
        'placeholder:text-muted-foreground/70 transition-all duration-300',
        'focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25',
        'disabled:cursor-not-allowed disabled:opacity-50',
        '[color-scheme:dark] dark:[color-scheme:dark]',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
