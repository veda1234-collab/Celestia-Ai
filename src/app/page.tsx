import { engine } from '@/lib/astrology';
import type { BirthDetails } from '@/lib/astrology/types';
import { CinematicBackground } from '@/components/cosmic';
import { Nav } from '@/components/landing/nav';
import { Hero } from '@/components/landing/hero';
import { StatsBand } from '@/components/landing/stats-band';
import { Showcase } from '@/components/landing/showcase';
import { Features } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Testimonials } from '@/components/landing/testimonials';
import { FAQ } from '@/components/landing/faq';
import { ClosingCTA } from '@/components/landing/closing-cta';
import { Footer } from '@/components/landing/footer';

/** A fixed demo nativity, computed at build time for the landing specimen. */
const DEMO: BirthDetails = {
  fullName: 'A Seeker',
  gender: 'female',
  date: '1995-03-24',
  time: '14:30',
  language: 'en',
  place: {
    id: 'mumbai',
    name: 'Mumbai, Maharashtra, India',
    city: 'Mumbai',
    region: 'Maharashtra',
    country: 'India',
    countryCode: 'IN',
    lat: 19.076,
    lon: 72.8777,
    timezone: 'Asia/Kolkata',
  },
};

export default function Home() {
  const demoChart = engine.computeChart(DEMO, new Date('2026-07-21T12:00:00Z'));

  return (
    <main className="relative">
      <CinematicBackground />
      <Nav />
      <Hero chart={demoChart} />
      <StatsBand />
      <Showcase chart={demoChart} />
      <Features />
      <HowItWorks />
      <Testimonials />
      <FAQ />
      <ClosingCTA />
      <Footer />
    </main>
  );
}
