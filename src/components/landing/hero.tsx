'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Star } from 'lucide-react';
import type { BirthChart } from '@/lib/astrology/types';
import { ZODIAC } from '@/lib/astrology/signs';
import { useMounted } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { BirthChartWheel, type WheelPlanet } from '@/components/dashboard/birth-chart-wheel';
import { easeInk } from '@/lib/motion';

const glyphOf = (name: string) => ZODIAC.find((z) => z.name === name)?.glyph ?? '✧';

/**
 * A cinematic, product-forward masthead: an editorial headline on the left, a
 * large glowing live birth chart on the right, credibility signals beneath.
 */
export function Hero({ chart }: { chart: BirthChart }) {
  const mounted = useMounted();

  const wheelPlanets: WheelPlanet[] = chart.planets.map((p) => ({
    id: p.id,
    house: p.house,
    posInSign: p.degreeInSign,
    retro: p.retrograde,
  }));
  const houseSigns = chart.houses.map((h) => h.sign);

  const chips = [
    { label: 'Ascendant', glyph: ZODIAC[chart.ascendant.sign]!.glyph, value: chart.ascendant.signName, pos: 'left-[-6%] top-[16%]' },
    { label: 'Moon', glyph: glyphOf(chart.moonSign), value: chart.moonSign, pos: 'right-[-8%] top-[42%]' },
    { label: 'Daśā', glyph: '', value: `${chart.dasha.current.maha.lord} mahā`, pos: 'left-[2%] bottom-[10%]' },
  ];

  const inkSweep: CSSProperties = {
    backgroundImage:
      'linear-gradient(100deg, hsl(var(--gold)) 0%, hsl(var(--gold)) 38%, hsl(var(--champagne)) 50%, hsl(var(--gold)) 62%, hsl(var(--gold)) 100%)',
    backgroundSize: '300% 100%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
  };

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-32 sm:pt-36">
      {/* Ambient glow field */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[70vh] w-[70vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,hsl(var(--gold)/0.12),transparent_60%)]" />
        <div className="absolute right-[6%] top-[30%] h-[46vh] w-[46vh] rounded-full bg-[radial-gradient(circle,hsl(var(--champagne)/0.08),transparent_60%)]" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
        {/* Left — headline column */}
        <div className="relative z-10 text-center lg:text-left">
          <motion.div
            initial={mounted ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeInk }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.06] px-3.5 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">An AI almanac of your nativity</span>
            </span>
          </motion.div>

          <motion.h1
            className="mt-6 font-display text-[3.25rem] font-normal leading-[0.98] tracking-[-0.02em] text-foreground sm:text-[4.25rem] lg:text-[4.5rem]"
            initial={mounted ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.06, ease: easeInk }}
          >
            Discover the Story
            <br />
            <motion.span
              style={inkSweep}
              initial={{ backgroundPosition: '0% 0' }}
              animate={{ backgroundPosition: '100% 0' }}
              transition={{ duration: 1.6, delay: 0.5, ease: easeInk }}
            >
              Written in the Stars.
            </motion.span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-lg font-display text-[1.3rem] italic leading-[1.5] text-ink-2 lg:mx-0"
            initial={mounted ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: easeInk }}
          >
            Your exact birth chart, computed from real astronomy and read aloud in plain language —
            the moment you ask.
          </motion.p>

          <motion.div
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:items-start"
            initial={mounted ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.26, ease: easeInk }}
          >
            <Button asChild size="lg" variant="primary" className="group h-[3.25rem] px-8 text-base">
              <Link href="/onboarding">
                Begin your reading
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-[3.25rem] px-7 text-base">
              <a href="#specimen">See a live reading</a>
            </Button>
          </motion.div>

          {/* Trust row */}
          <motion.div
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:justify-start"
            initial={mounted ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.4 }}
          >
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />)}
              <span className="ml-1 text-sm text-ink-2">Loved by seekers worldwide</span>
            </div>
            <span className="hidden h-4 w-px bg-foreground/15 sm:block" />
            <span className="text-sm text-ink-2">No account · Instant · Free to explore</span>
          </motion.div>
        </div>

        {/* Right — the live chart specimen */}
        <motion.div
          className="relative mx-auto w-full max-w-[520px]"
          initial={mounted ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: easeInk }}
        >
          {/* Mount-gated so the stateful wheel can't mismatch hydration. */}
          {mounted ? (
            <BirthChartWheel
              decorative
              ascendantSign={chart.ascendant.sign}
              houseSigns={houseSigns}
              planets={wheelPlanets}
              title="A live nativity"
            />
          ) : (
            <div className="mx-auto aspect-square w-full max-w-[520px] rounded-full border border-foreground/10" />
          )}
          {/* Floating stat chips */}
          {mounted && chips.map((c) => (
            <div
              key={c.label}
              className={`absolute ${c.pos} hidden items-center gap-2 rounded-full border border-foreground/10 bg-plate/90 px-3 py-1.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)] backdrop-blur-sm sm:flex`}
            >
              {c.glyph && <span className="text-gold">{c.glyph}</span>}
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-2">{c.label}</span>
              <span className="text-sm text-foreground">{c.value}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
