'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZodiacWheel } from '@/components/cosmic';
import { useMouseParallax } from '@/lib/hooks';

const planets = [
  { size: 18, color: 'from-gold to-amber-300', top: '12%', left: '18%', delay: '0s', depth: 26 },
  { size: 12, color: 'from-primary to-accent', top: '22%', right: '14%', delay: '-2s', depth: 40 },
  { size: 26, color: 'from-amber-400 to-gold', bottom: '18%', left: '10%', delay: '-4s', depth: 32 },
  { size: 10, color: 'from-indigo-400 to-indigo-600', bottom: '26%', right: '20%', delay: '-1s', depth: 48 },
];

export function Hero() {
  const { x, y } = useMouseParallax();

  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 pt-28 text-center">
      {/* Zodiac wheel backdrop */}
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ transform: `translate3d(${x * -24}px, ${y * -24}px, 0)` }}
      >
        <ZodiacWheel size={620} className="opacity-40 md:opacity-60" />
      </motion.div>

      {/* Floating planets */}
      {planets.map((p, i) => (
        <span
          key={i}
          className="pointer-events-none absolute animate-float"
          style={{
            top: p.top,
            left: p.left,
            right: p.right,
            bottom: p.bottom,
            animationDelay: p.delay,
            transform: `translate3d(${x * p.depth}px, ${y * p.depth}px, 0)`,
          }}
          aria-hidden
        >
          <span
            className={`block rounded-full bg-gradient-to-br ${p.color} shadow-glow`}
            style={{ width: p.size, height: p.size }}
          />
        </span>
      ))}

      {/* Content */}
      <div className="relative z-10 flex max-w-3xl flex-col items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <Badge variant="outline" className="mb-6 gap-1.5 py-1 pl-1.5 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            AI astrology, grounded in your real birth chart
          </Badge>
        </motion.div>

        <motion.h1
          className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          Discover the Story <br />
          <span className="text-gradient animate-gradient bg-[length:200%_auto]">Written in the Stars.</span>
        </motion.h1>

        <motion.p
          className="mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          Personalized AI astrology powered by your birth chart. Enter your details and step into a
          living map of your cosmos — then ask it anything.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Button asChild size="lg" className="group">
            <Link href="/onboarding">
              Begin Your Cosmic Journey
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="glass">
            <a href="#how">See how it works</a>
          </Button>
        </motion.div>

        <motion.p
          className="mt-8 text-xs text-muted-foreground/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
        >
          No account needed · Works instantly · Free to explore
        </motion.p>
      </div>

      <div className="pointer-events-none absolute bottom-0 h-40 w-full bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
