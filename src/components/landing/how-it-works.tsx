'use client';

import { CalendarClock, MapPin, Stars, MessageCircleHeart } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { Kicker, Rule } from '@/components/ui/plate';

const steps = [
  { icon: CalendarClock, title: 'Share your moment', desc: 'Your name, date and exact time of birth — the coordinates of your cosmic blueprint.' },
  { icon: MapPin, title: 'Pin your place', desc: 'Search your birthplace; we resolve latitude, longitude and timezone automatically.' },
  { icon: Stars, title: 'Watch it drawn', desc: 'Planets are placed, the ascendant calculated, houses read — your chart is drawn live.' },
  { icon: MessageCircleHeart, title: 'Ask the stars', desc: 'Explore your bound plate of a dashboard and chat with your personal AI astrologer.' },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-6xl px-6 py-28">
      <Reveal className="max-w-2xl">
        <Kicker gold>The Method</Kicker>
        <h2 className="mt-2 font-display text-[2rem] font-normal leading-[1.08] tracking-[-0.01em] text-foreground sm:text-[2.5rem]">
          Four steps to your cosmos
        </h2>
        <p className="mt-3 text-ink-2">From a single moment in time to a lifetime of insight.</p>
        <Rule className="mt-5" />
      </Reveal>

      <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 md:grid-cols-4">
        {steps.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.08}>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm tabular-nums text-gold">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="h-px flex-1 rule-gold" />
            </div>
            <s.icon className="mt-6 h-6 w-6 text-ink-2" strokeWidth={1.5} />
            <h3 className="card-subhead mt-3 text-foreground">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">{s.desc}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
