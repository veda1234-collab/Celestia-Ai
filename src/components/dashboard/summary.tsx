'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import type { BirthChart, BirthDetails } from '@/lib/astrology/types';
import { ZODIAC } from '@/lib/astrology/signs';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { CountUp, Kicker } from '@/components/ui/plate';
import { ReportButton } from './report-button';

const glyphOf = (name: string) => ZODIAC.find((z) => z.name === name)?.glyph ?? '✧';

/** ayanāṁśa (decimal degrees) → DD°MM′. */
function toDMS(deg: number): string {
  const d = Math.floor(deg);
  const m = Math.round((deg - d) * 60);
  return `${d}°${String(m).padStart(2, '0')}′`;
}

function Stat({
  label,
  glyph,
  sign,
  degree,
  sub,
  keyword,
}: {
  label: string;
  glyph: string;
  sign: string;
  degree?: number;
  sub: string;
  keyword: string;
}) {
  return (
    <div className="px-5 py-4">
      <Kicker>{label}</Kicker>
      <div className="mt-2 flex items-baseline gap-2.5">
        <span className="text-2xl leading-none text-gold">{glyph}</span>
        <span className="card-subhead text-foreground">{sign}</span>
        {degree != null && (
          <CountUp value={degree} decimals={1} suffix="°" className="text-sm text-ink-2" />
        )}
      </div>
      <p className="mt-1.5 text-xs text-ink-2">{sub}</p>
      <p className="mt-0.5 text-[11px] italic text-ink-2/70">{keyword}</p>
    </div>
  );
}

export function NativityPlate({ chart, details }: { chart: BirthChart; details?: BirthDetails | null }) {
  const m = chart.meta;
  const date = new Date(m.localISO).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = m.localISO.slice(11, 16);
  const place = details?.place?.name?.split(',')[0] ?? m.timezone.split('/').pop()?.replace(/_/g, ' ');
  const lat = `${Math.abs(m.lat).toFixed(2)}°${m.lat >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(m.lon).toFixed(2)}°${m.lon >= 0 ? 'E' : 'W'}`;
  const dateline = `${date} · ${time} · ${place} · ${lat} ${lon} · Lahiri ${toDMS(m.ayanamsa)}`;

  return (
    <GlassCard className="overflow-hidden p-7 md:p-9">
      <Kicker gold className="flex items-center gap-2">
        <span className="font-mono tracking-normal text-gold/80">PLATE 01</span>
        <span className="text-ink-2/40">·</span> Nativity
      </Kicker>
      <h1 className="mt-3 display-hero text-foreground">{chart.meta.name}</h1>
      <p className="dateline mt-3">{dateline}</p>

      <div className="mt-7 grid grid-cols-1 divide-y divide-foreground/10 rounded-field plate-inset sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Stat
          label="Ascendant · Lagna"
          glyph={ZODIAC[chart.ascendant.sign]!.glyph}
          sign={chart.ascendant.signName}
          degree={chart.ascendant.degreeInSign}
          sub={`${chart.ascendant.nakshatra} · pada ${chart.nakshatra.pada}`}
          keyword="the rising self"
        />
        <Stat
          label="Moon · Rāśi"
          glyph={glyphOf(chart.moonSign)}
          sign={chart.moonSign}
          sub={`${chart.nakshatra.name} nakṣatra`}
          keyword="the inner mind"
        />
        <Stat
          label="Sun"
          glyph={glyphOf(chart.sunSign.sidereal)}
          sign={chart.sunSign.sidereal}
          sub={`${chart.sunSign.tropical} (Western)`}
          keyword="the soul's light"
        />
      </div>

      <p className="lede dropcap mt-7 text-foreground/90">{chart.summary}</p>

      <div className="mt-7 flex flex-wrap gap-3">
        <ReportButton chart={chart} />
        <Button asChild variant="outline" size="default">
          <Link href="/chat">
            <MessageCircle className="h-4 w-4" /> Ask the astrologer
          </Link>
        </Button>
      </div>
    </GlassCard>
  );
}

/** Back-compat alias for the previous export name. */
export const SummaryHero = NativityPlate;
