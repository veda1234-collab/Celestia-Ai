'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Reveal } from '@/components/ui/reveal';

const faqs = [
  {
    q: 'Is the astrology real, or just generic?',
    a: 'Real. Celestia computes your ascendant, planetary longitudes, nakshatras, houses, navāṁśa (D9) and Vimśottari daśā from your exact birth time and place using astronomical algorithms — the same inputs a professional astrologer uses. The engine is provider-pluggable, so it can be upgraded to a Swiss-Ephemeris-grade backend without changing the app.',
  },
  {
    q: 'Do I need an account or to pay?',
    a: 'No. You can generate your chart and chat with the AI astrologer instantly, for free. Your profile is stored privately in your own browser.',
  },
  {
    q: 'Which system do you use — Vedic or Western?',
    a: 'Celestia is Vedic-first (sidereal, Lahiri ayanāṁśa) with nakshatras and daśās, while also surfacing your familiar Western (tropical) Sun sign so nothing feels unfamiliar.',
  },
  {
    q: 'How accurate is the birth time requirement?',
    a: 'The ascendant changes roughly every two hours and shifts about one degree every four minutes, so an accurate birth time matters most for the ascendant and house placements. Even an approximate time gives a meaningful Moon-sign and planetary reading.',
  },
  {
    q: 'Are the predictions guaranteed?',
    a: 'No — and any astrologer who guarantees the future should be treated with caution. Celestia describes tendencies, timings and possibilities to reflect on, always respecting your free will. It is for insight and entertainment, not a substitute for medical, legal or financial advice.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative mx-auto max-w-3xl px-6 py-28">
      <Reveal className="mb-12 text-center">
        <h2 className="font-display text-3xl font-semibold sm:text-5xl">
          Questions, <span className="text-gradient">answered</span>
        </h2>
      </Reveal>
      <Reveal>
        <Accordion type="single" collapsible>
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}
