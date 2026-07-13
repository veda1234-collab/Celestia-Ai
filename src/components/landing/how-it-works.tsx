'use client';

import { CalendarClock, MapPin, Stars, MessageCircleHeart } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';

const steps = [
  { icon: CalendarClock, title: 'Share your moment', desc: 'Your name, date and exact time of birth — the coordinates of your cosmic blueprint.' },
  { icon: MapPin, title: 'Pin your place', desc: 'Search your birthplace; we resolve latitude, longitude and timezone automatically.' },
  { icon: Stars, title: 'Watch it drawn', desc: 'Planets are placed, the ascendant calculated, houses read — your chart is drawn live.' },
  { icon: MessageCircleHeart, title: 'Ask the stars', desc: 'Explore your immersive dashboard and chat with your personal AI astrologer.' },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-6xl px-6 py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold sm:text-5xl">
          Four steps to your <span className="text-gradient-gold">cosmos</span>
        </h2>
        <p className="mt-4 text-muted-foreground">From a single moment in time to a lifetime of insight.</p>
      </Reveal>

      <div className="relative mt-16 grid gap-8 md:grid-cols-4">
        <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent md:block" />
        {steps.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.1} className="relative text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl glass text-primary">
              <s.icon className="h-7 w-7" />
              <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-semibold text-primary-foreground shadow-glow">
                {i + 1}
              </span>
            </div>
            <h3 className="mt-5 font-display text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
