'use client';

import { Star } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Reveal } from '@/components/ui/reveal';

const quotes = [
  {
    quote:
      'It felt like it truly knew me. The reading on my current daśā was uncannily on point, and the interface is stunning.',
    name: 'Ananya R.',
    role: 'Product Designer',
    initials: 'AR',
  },
  {
    quote:
      'Finally an astrology app that does the real math. My navāṁśa and yogas were spot on — and the chat explains everything simply.',
    name: 'Vikram S.',
    role: 'Software Engineer',
    initials: 'VS',
  },
  {
    quote:
      'The most beautiful app I have on my phone. Asking my chart about career felt like talking to a wise, calm friend.',
    name: 'Maya L.',
    role: 'Founder',
    initials: 'ML',
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="relative mx-auto max-w-6xl px-6 py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold sm:text-5xl">
          Loved under <span className="text-gradient">every sky</span>
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-5 md:grid-cols-3">
        {quotes.map((q, i) => (
          <Reveal key={q.name} delay={i * 0.08}>
            <GlassCard className="flex h-full flex-col p-6">
              <div className="mb-4 flex gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-foreground/90">“{q.quote}”</p>
              <div className="mt-6 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-primary-foreground">
                  {q.initials}
                </span>
                <div>
                  <p className="text-sm font-medium">{q.name}</p>
                  <p className="text-xs text-muted-foreground">{q.role}</p>
                </div>
              </div>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
