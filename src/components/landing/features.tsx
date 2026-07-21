'use client';

import { Compass, MessagesSquare, Orbit, Sparkles, Gem, LineChart } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Reveal } from '@/components/ui/reveal';
import { Kicker, Rule } from '@/components/ui/plate';

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
    title: 'A Considered Interface',
    desc: 'An editorial, observatory-grade reading room — every chart an engraved figure, every reading a ruled column of prose.',
  },
];

export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-6 py-28">
      <Reveal className="max-w-2xl">
        <Kicker gold>The Instruments</Kicker>
        <h2 className="mt-2 font-display text-[2rem] font-normal leading-[1.08] tracking-[-0.01em] text-foreground sm:text-[2.5rem]">
          A universe of insight
        </h2>
        <p className="mt-3 text-ink-2">
          Everything about your chart — computed from real astronomy, engraved as reference figures,
          and made legible.
        </p>
        <Rule className="mt-5" />
      </Reveal>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 0.08}>
            <GlassCard className="flex h-full flex-col p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-field plate-inset text-foreground/80">
                  <f.icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <span className="font-mono text-[11px] tabular-nums text-ink-2/50">
                  {String(i + 1).padStart(2, '0')} / {String(features.length).padStart(2, '0')}
                </span>
              </div>
              <h3 className="card-subhead mt-5 text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{f.desc}</p>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
