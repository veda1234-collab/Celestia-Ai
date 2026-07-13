'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageCircle, Star } from 'lucide-react';
import type { BirthChart } from '@/lib/astrology/types';
import { ZODIAC } from '@/lib/astrology/signs';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ReportButton } from './report-button';

const glyphOf = (name: string) => ZODIAC.find((z) => z.name === name)?.glyph ?? '✧';

export function SummaryHero({ chart }: { chart: BirthChart }) {
  const tiles = [
    { label: 'Ascendant', value: chart.ascendant.signName, glyph: ZODIAC[chart.ascendant.sign]!.glyph, sub: `${chart.ascendant.degreeInSign.toFixed(1)}° · ${chart.ascendant.nakshatra}` },
    { label: 'Moon', value: chart.moonSign, glyph: glyphOf(chart.moonSign), sub: chart.nakshatra.name },
    { label: 'Sun', value: chart.sunSign.sidereal, glyph: glyphOf(chart.sunSign.sidereal), sub: `${chart.sunSign.tropical} (Western)` },
  ];

  return (
    <GlassCard className="overflow-hidden p-6 md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <Badge variant="gold" className="mb-3">
            <Star className="h-3 w-3 fill-current" /> {chart.nakshatra.name} · Pada {chart.nakshatra.pada}
          </Badge>
          <h1 className="font-display text-2xl font-semibold leading-tight md:text-3xl">{chart.meta.name}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{chart.summary}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/chat">
                <MessageCircle className="h-4 w-4" /> Ask about your chart
              </Link>
            </Button>
            <ReportButton chart={chart} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {tiles.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="rounded-2xl border border-border bg-background/40 p-4 text-center backdrop-blur-sm"
            >
              <div className="text-3xl">{t.glyph}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{t.label}</div>
              <div className="font-display text-sm font-semibold">{t.value}</div>
              <div className="mt-0.5 text-[10px] leading-tight text-muted-foreground/70">{t.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
