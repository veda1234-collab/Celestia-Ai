'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { Reveal } from '@/components/ui/reveal';
import { Kicker, Rule } from '@/components/ui/plate';

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
      <Reveal className="max-w-2xl">
        <Kicker gold>Voices</Kicker>
        <h2 className="mt-2 font-display text-[2rem] font-normal leading-[1.08] tracking-[-0.01em] text-foreground sm:text-[2.5rem]">
          Loved under every sky
        </h2>
        <Rule className="mt-5" />
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {quotes.map((q, i) => (
          <Reveal key={q.name} delay={i * 0.08}>
            <GlassCard className="flex h-full flex-col p-6">
              <span aria-hidden className="font-display text-5xl leading-[0.6] text-gold/40">
                “
              </span>
              <p className="mt-3 flex-1 font-display text-[15px] italic leading-relaxed text-foreground/90">
                {q.quote}
              </p>
              <Rule className="mt-6" />
              <div className="mt-4 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-field plate-inset font-mono text-xs tabular-nums text-foreground/80">
                  {q.initials}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{q.name}</p>
                  <Kicker className="mt-0.5">{q.role}</Kicker>
                </div>
              </div>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
