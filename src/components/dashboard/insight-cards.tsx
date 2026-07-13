'use client';

import { Gem, Hash, Palette, CalendarDays, Compass, ShieldAlert, Sparkles } from 'lucide-react';
import type { BirthChart } from '@/lib/astrology/types';
import { LUCKY_BY_SIGN } from '@/lib/astrology/signs';
import { horoscope, type Timeframe } from '@/lib/astrology/horoscope';
import { GlassCard, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function LuckyCard({ chart }: { chart: BirthChart }) {
  const lucky = LUCKY_BY_SIGN[chart.ascendant.sign]!;
  const rows = [
    { icon: Palette, label: 'Colours', value: lucky.colors.join(', ') },
    { icon: Hash, label: 'Numbers', value: lucky.numbers.join(', ') },
    { icon: Gem, label: 'Gemstone', value: lucky.gemstone },
    { icon: CalendarDays, label: 'Day', value: lucky.day },
    { icon: Compass, label: 'Direction', value: lucky.direction },
  ];
  return (
    <GlassCard className="h-full">
      <CardHeader>
        <CardTitle>Lucky Factors</CardTitle>
        <CardDescription>Tuned to your ascendant & Moon.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <r.icon className="h-4 w-4 text-primary" /> {r.label}
            </span>
            <span className="text-right font-medium">{r.value}</span>
          </div>
        ))}
        <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground/70">
          Consult a qualified astrologer before wearing any gemstone.
        </p>
      </CardContent>
    </GlassCard>
  );
}

export function YogaDoshaCard({ chart }: { chart: BirthChart }) {
  return (
    <GlassCard className="h-full">
      <CardHeader>
        <CardTitle>Yogas & Doshas</CardTitle>
        <CardDescription>Notable combinations in your chart.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-gold" /> Yogas
          </p>
          {chart.yogas.length ? (
            <ul className="space-y-2">
              {chart.yogas.map((y) => (
                <li key={y.name} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{y.name}</span>
                    <Badge variant="gold">auspicious</Badge>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{y.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No tracked yogas are formed — steady, self-made growth is favoured.</p>
          )}
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5 text-accent" /> Doshas
          </p>
          <ul className="space-y-2">
            {chart.doshas.map((d) => (
              <li key={d.name} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                <span>{d.name}</span>
                <Badge variant={d.present ? 'accent' : 'muted'}>{d.present ? d.severity : 'clear'}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </GlassCard>
  );
}

const FRAMES: { value: Timeframe; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

export function HoroscopeCard({ chart }: { chart: BirthChart }) {
  return (
    <GlassCard className="h-full">
      <CardHeader>
        <CardTitle>Horoscope</CardTitle>
        <CardDescription>Guidance across time. Ask the AI to go deeper.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="today">
          <TabsList className="flex-wrap">
            {FRAMES.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>{f.label}</TabsTrigger>
            ))}
          </TabsList>
          {FRAMES.map((f) => (
            <TabsContent key={f.value} value={f.value} className="mt-4">
              <p className="text-sm leading-relaxed text-foreground/90">{horoscope(chart, f.value)}</p>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </GlassCard>
  );
}
