'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

export const Tabs = TabsPrimitive.Root;

/** Triggers sit over a single hairline baseline — no pill fill. */
export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('relative inline-flex items-center gap-6 border-b border-foreground/10', className)}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

/** Active = cream small-caps + a sliding gold underline shared across triggers. */
export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const reduce = useReducedMotion();
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'group relative -mb-px inline-flex items-center whitespace-nowrap py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em]',
        'text-ink-2 transition-colors data-[state=active]:text-foreground hover:text-foreground/80',
        'focus-visible:outline-none focus-visible:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 hidden group-data-[state=active]:block">
        {reduce ? (
          <span className="block h-[2px] w-full bg-gold" />
        ) : (
          <motion.span
            layoutId="ink-underline"
            className="block h-[2px] w-full bg-gold"
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          />
        )}
      </span>
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-5 focus-visible:outline-none animate-ink-rise', className)}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';
