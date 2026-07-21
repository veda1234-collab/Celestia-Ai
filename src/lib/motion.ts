/**
 * Motion vocabulary for the PLATE design system.
 *
 * Motion is "ink settling" — precise, quiet, mostly hairlines. Steady state is
 * held perfectly still; there are no always-on ambient animations on working
 * surfaces. Everything here collapses under `prefers-reduced-motion`, which the
 * app honours globally (see `Reveal` and each component's `useReducedMotion`).
 */

import type { Transition, Variants } from 'framer-motion';

/** Easing tuples — mirrored as CSS vars --ease-ink / --ease-inout / --ease-soft. */
export const easeInk = [0.16, 1, 0.3, 1] as const; // expo-out: reveals, rule-draws
export const easeInOut = [0.65, 0, 0.35, 1] as const; // heavy panels, page transitions
export const easeSoft = [0.22, 1, 0.36, 1] as const; // counts, wheel zoom

/** Canonical durations (seconds). */
export const DUR = {
  micro: 0.16,
  control: 0.22,
  reveal: 0.56,
  rule: 0.64,
  page: 0.42,
  count: 0.9,
} as const;

/** Container + child reveal — a quiet 16px rise, staggered down the page. */
export const revealContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.reveal, ease: easeInk } },
};

/** THE signature: a ruled gold hairline penning itself in from the left. */
export const ruleDraw = {
  initial: { scaleX: 0 },
  whileInView: { scaleX: 1 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: DUR.rule, ease: easeInk },
  style: { transformOrigin: 'left' as const },
} as const;

/** Shared sliding underline for tabs / varga picker / step ledger. */
export const inkUnderline = {
  layoutId: 'ink-underline',
  transition: { type: 'spring', stiffness: 420, damping: 34 } as Transition,
};

/** Physical objects only — the medallion, plotted planet nodes. */
export const plotSpring: Transition = { type: 'spring', stiffness: 260, damping: 20 };

/** Page transition: outgoing slides left + fades, incoming rises + fades. */
export const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: DUR.page, ease: easeInOut },
} as const;
