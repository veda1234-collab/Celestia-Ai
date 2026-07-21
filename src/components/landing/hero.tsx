'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Kicker } from '@/components/ui/plate';
import { ZodiacWheel } from '@/components/cosmic';
import { easeInk } from '@/lib/motion';

/**
 * The editorial masthead. A calm, held-still nativity almanac cover: a mono
 * kicker, a Fraunces display headline whose second line takes a single gold
 * ink-sweep on mount and then rests, a Fraunces-italic lede, and two CTAs.
 * The zodiac wheel is demoted to a faint, static watermark — no float, no
 * parallax, no infinite shimmer.
 */
export function Hero() {
  const reduce = useReducedMotion();

  // Gold on both far ends, one champagne band at centre. Sweeping the
  // background-position 0% → 100% walks that highlight across the words once,
  // exiting to leave the line resting in flat gold.
  const inkSweep: CSSProperties = {
    backgroundImage:
      'linear-gradient(100deg, hsl(var(--gold)) 0%, hsl(var(--gold)) 40%, hsl(var(--champagne)) 50%, hsl(var(--gold)) 60%, hsl(var(--gold)) 100%)',
    backgroundSize: '300% 100%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
  };

  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 pt-28 text-center">
      {/* Faint static almanac watermark — the wheel reduced to a pressed mark. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        <ZodiacWheel size={660} className="opacity-[0.05] md:opacity-[0.07]" />
      </div>

      <div className="relative z-10 flex max-w-3xl flex-col items-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeInk }}
        >
          <Kicker gold className="tracking-[0.28em]">
            An AI Almanac of Your Nativity
          </Kicker>
        </motion.div>

        <motion.h1
          className="display-hero mt-6 text-foreground"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: easeInk }}
        >
          Discover the Story
          <br />
          <motion.span
            style={inkSweep}
            initial={{ backgroundPosition: reduce ? '100% 0' : '0% 0' }}
            animate={{ backgroundPosition: '100% 0' }}
            transition={reduce ? { duration: 0 } : { duration: 1.5, delay: 0.5, ease: easeInk }}
          >
            Written in the Stars.
          </motion.span>
        </motion.h1>

        <motion.p
          className="lede mt-7 text-balance text-ink-2"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: easeInk }}
        >
          A living map of your cosmos, computed from your exact birth chart — then read aloud in
          plain language, the moment you ask.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.32, ease: easeInk }}
        >
          <Button asChild size="lg" variant="primary" className="group">
            <Link href="/onboarding">
              Begin your reading
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <a href="#how">See how it works</a>
          </Button>
        </motion.div>

        <motion.p
          className="dateline mt-8 text-ink-2/70"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.6 }}
        >
          No account · Instant · Free to explore
        </motion.p>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
