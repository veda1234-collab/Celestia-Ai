'use client';

import { Compass, MessagesSquare, Orbit, Sparkles, Gem, LineChart } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Reveal } from '@/components/ui/reveal';

const features = [
  {
    icon: Orbit,
    title: 'Real Birth-Chart Engine',
    desc: 'Ascendant, planets, nakshatras, houses, navāṁśa and Vimśottari daśā computed from your exact time and place — not generic sun-sign fluff.',
  },
  {
    icon: MessagesSquare,
    title: 'AI Astrologer',
    desc: 'Chat with an astrologer that reads from your actual placements — career, love, finance, health, timing and more, in plain language.',
  },
  {
    icon: Compass,
    title: 'Daśā & Transit Timing',
    desc: 'Understand the planetary period you are living through, and the seasons of opportunity and lesson ahead.',
  },
  {
    icon: Gem,
    title: 'Lucky & Remedial Guidance',
    desc: 'Personalized colours, numbers, gemstones and auspicious days, drawn from your ascendant and Moon.',
  },
  {
    icon: LineChart,
    title: 'Yogas, Doshas & Strengths',
    desc: 'See the auspicious combinations and classical doshas in your chart, with planetary strength at a glance.',
  },
  {
    icon: Sparkles,
    title: 'A Luxury Experience',
    desc: 'A cosmic, Apple-grade interface with buttery 60fps animations, dark & light modes, and an interactive chart.',
  },
];

export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-6 py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold sm:text-5xl">
          A universe of <span className="text-gradient">insight</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Everything about your chart, made beautiful, personal and easy to understand.
        </p>
      </Reveal>

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 0.08}>
            <GlassCard interactive className="group h-full p-6">
              <div className="mb-5 inline-grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary transition-transform duration-500 group-hover:scale-110">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
