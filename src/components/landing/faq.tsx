'use client';

import { ChevronDown } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Reveal } from '@/components/ui/reveal';
import { Kicker, Rule } from '@/components/ui/plate';

const faqs = [
  {
    q: 'Is the astrology real, or just generic?',
    a: 'Real. Vedastra computes your ascendant, planetary longitudes, nakshatras, houses, navāṁśa (D9) and Vimśottari daśā from your exact birth time and place using astronomical algorithms — the same inputs a professional astrologer uses. The engine is provider-pluggable, so it can be upgraded to a Swiss-Ephemeris-grade backend without changing the app.',
  },
  {
    q: 'Do I need an account or to pay?',
    a: 'No. You can generate your chart and chat with the AI astrologer instantly, for free. Your profile is stored privately in your own browser.',
  },
  {
    q: 'Which system do you use — Vedic or Western?',
    a: 'Vedastra is Vedic-first (sidereal, Lahiri ayanāṁśa) with nakshatras and daśās, while also surfacing your familiar Western (tropical) Sun sign so nothing feels unfamiliar.',
  },
  {
    q: 'How accurate is the birth time requirement?',
    a: 'The ascendant changes roughly every two hours and shifts about one degree every four minutes, so an accurate birth time matters most for the ascendant and house placements. Even an approximate time gives a meaningful Moon-sign and planetary reading.',
  },
  {
    q: 'Are the predictions guaranteed?',
    a: 'No — and any astrologer who guarantees the future should be treated with caution. Vedastra describes tendencies, timings and possibilities to reflect on, always respecting your free will. It is for insight and entertainment, not a substitute for medical, legal or financial advice.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative mx-auto max-w-3xl px-6 py-24">
      <Reveal className="mb-10">
        <Kicker gold>Marginalia</Kicker>
        <h2 className="mt-2 font-display text-[2rem] font-normal leading-[1.08] tracking-[-0.01em] text-foreground sm:text-[2.5rem]">
          Questions, answered
        </h2>
        <Rule className="mt-5" />
      </Reveal>

      <Reveal>
        <GlassCard className="overflow-hidden">
          <div className="divide-y divide-foreground/10">
            {faqs.map((f, i) => (
              <details key={i} className="group px-6">
                <summary className="flex cursor-pointer list-none items-baseline gap-4 py-5 [&::-webkit-details-marker]:hidden">
                  <span className="mt-0.5 font-mono text-xs tabular-nums text-gold/70">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="card-subhead flex-1 text-foreground">{f.q}</span>
                  <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-ink-2 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="pb-5 pl-9 pr-8 text-sm leading-relaxed text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </GlassCard>
      </Reveal>
    </section>
  );
}
