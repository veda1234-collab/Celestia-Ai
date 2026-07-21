'use client';

import Link from 'next/link';
import type { BirthChart } from '@/lib/astrology/types';
import { ZODIAC } from '@/lib/astrology/signs';
import { useMounted } from '@/lib/hooks';
import { Reveal } from '@/components/ui/reveal';
import { Button } from '@/components/ui/button';
import { CornerTicks, Kicker, Rule, SemanticTag } from '@/components/ui/plate';
import { BirthChartWheel, type WheelPlanet } from '@/components/dashboard/birth-chart-wheel';
import { DashaRibbon } from '@/components/dashboard/dasha-ribbon';

const glyphOf = (name: string) => ZODIAC.find((z) => z.name === name)?.glyph ?? '✧';

/**
 * A live specimen of the product on the landing — the real chart wheel, stat
 * band and Vimśottari ribbon rendered from a computed demo chart, so visitors
 * see the actual engraved plates rather than only reading about them.
 */
export function Showcase({ chart }: { chart: BirthChart }) {
  // The specimen mounts client-side: it renders the interactive wheel + ribbon,
  // and rendering it only after mount keeps the server HTML and the client tree
  // identical (no hydration mismatch from the stateful chart components).
  const mounted = useMounted();

  const wheelPlanets: WheelPlanet[] = chart.planets.map((p) => ({
    id: p.id,
    house: p.house,
    posInSign: p.degreeInSign,
    retro: p.retrograde,
  }));
  const houseSigns = chart.houses.map((h) => h.sign);
  const maha = chart.dasha.current.maha;
  const assessment = chart.dasha.assessments?.[maha.lord];

  const stats = [
    { k: 'Ascendant', glyph: ZODIAC[chart.ascendant.sign]!.glyph, v: chart.ascendant.signName, sub: `${chart.ascendant.degreeInSign.toFixed(1)}°` },
    { k: 'Moon', glyph: glyphOf(chart.moonSign), v: chart.moonSign, sub: chart.nakshatra.name },
    { k: 'Sun', glyph: glyphOf(chart.sunSign.sidereal), v: chart.sunSign.sidereal, sub: 'sidereal' },
  ];

  return (
    <section id="specimen" className="relative mx-auto max-w-6xl px-6 py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Kicker gold className="justify-center">Specimen · A Reading</Kicker>
        <h2 className="mt-3 plate-title text-[2rem] leading-[1.08] text-foreground sm:text-[2.5rem]">
          Not a horoscope. An instrument.
        </h2>
        <p className="lede mx-auto mt-4 text-[1.15rem] not-italic text-ink-2">
          Every placement computed from real astronomy and set like an engraved plate — the same
          figures a professional would read.
        </p>
        <Rule className="mx-auto mt-6 max-w-xs" />
      </Reveal>

      <Reveal delay={0.1}>
        <div className="relative mt-12 overflow-hidden rounded-plate border border-foreground/10 bg-plate/70 p-5 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] sm:p-8" data-active="true">
          <CornerTicks />
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
            <Kicker><span className="font-mono tracking-normal text-gold/80">PLATE 01–03</span> · Nativity of a Seeker</Kicker>
            <span className="dateline">24 Mar 1995 · 14:30 · Mumbai · 19.07°N 72.88°E</span>
          </div>

          {!mounted ? (
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="mx-auto aspect-square w-full max-w-[460px] rounded-full border border-foreground/10" />
              </div>
              <div className="lg:col-span-5">
                <div className="h-24 rounded-field plate-inset" />
              </div>
            </div>
          ) : (
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Wheel */}
            <div className="lg:col-span-7">
              <BirthChartWheel
                ascendantSign={chart.ascendant.sign}
                houseSigns={houseSigns}
                planets={wheelPlanets}
                title="Rāśi chart (D1)"
              />
            </div>

            {/* Readout column */}
            <div className="flex flex-col gap-5 lg:col-span-5">
              <div className="grid grid-cols-3 divide-x divide-foreground/10 rounded-field plate-inset">
                {stats.map((s) => (
                  <div key={s.k} className="px-3 py-3 text-center">
                    <p className="kicker">{s.k}</p>
                    <div className="mt-1.5 text-xl text-gold">{s.glyph}</div>
                    <p className="card-subhead text-base text-foreground">{s.v}</p>
                    <p className="mt-0.5 font-mono text-[10px] tabular-nums text-ink-2">{s.sub}</p>
                  </div>
                ))}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Kicker>Running daśā</Kicker>
                  {assessment && <SemanticTag tone={assessment.quality === 'good' ? 'good' : assessment.quality === 'mixed' ? 'caution' : 'care'} label={`${maha.lord} · ${assessment.quality}`} value={assessment.score} />}
                </div>
                <DashaRibbon dasha={chart.dasha} nowMs={Date.parse(chart.meta.generatedAtISO)} />
              </div>

              <p className="lede text-[1.05rem] leading-relaxed text-foreground/80">
                “You rise with {chart.ascendant.signName}, carry a {chart.moonSign} Moon, and walk your{' '}
                {maha.lord} mahādaśā — a chapter of {assessment?.quality === 'good' ? 'building and reward' : 'patient work'}.”
              </p>

              <Button asChild variant="primary" className="mt-auto self-start">
                <Link href="/onboarding">Read your own chart →</Link>
              </Button>
            </div>
          </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}
