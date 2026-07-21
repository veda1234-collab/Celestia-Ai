import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-11 w-full rounded-field border border-foreground/10 bg-inset px-3.5 py-2 text-sm',
        'placeholder:text-muted-foreground/60 transition-colors duration-200',
        'focus-visible:outline-none focus-visible:border-gold/60 focus-visible:ring-2 focus-visible:ring-ring/40',
        'focus-visible:shadow-[inset_0_1px_0_hsl(var(--gold)/0.25)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        '[color-scheme:dark] dark:[color-scheme:dark]',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
