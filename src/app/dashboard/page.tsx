'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useProfile } from '@/lib/store/profile';
import { useChartRefresh, useMounted } from '@/lib/hooks';
import { CosmicBackground } from '@/components/cosmic';
import { DashboardHeader } from '@/components/dashboard/header';
import { SummaryHero } from '@/components/dashboard/summary';
import { ChartCard } from '@/components/dashboard/chart-card';
import { PlanetTable } from '@/components/dashboard/planet-table';
import { DashaCard } from '@/components/dashboard/dasha-card';
import { TransitCard } from '@/components/dashboard/transit-card';
import { LuckyCard, YogaDoshaCard, HoroscopeCard } from '@/components/dashboard/insight-cards';
import { Reveal } from '@/components/ui/reveal';

export default function DashboardPage() {
  const router = useRouter();
  const mounted = useMounted();
  const chart = useProfile((s) => s.chart);
  const details = useProfile((s) => s.details);
  const clear = useProfile((s) => s.clear);
  const recomputing = useChartRefresh(mounted);

  useEffect(() => {
    if (mounted && !chart && !recomputing) router.replace('/onboarding');
  }, [mounted, chart, recomputing, router]);

  if (!mounted || !chart) {
    return (
      <main className="relative grid min-h-[100svh] place-items-center">
        <CosmicBackground meteors={false} />
        <div className="relative z-10 flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Opening your cosmos…</p>
        </div>
      </main>
    );
  }

  const onNewChart = () => {
    clear();
    router.push('/onboarding');
  };

  return (
    <main className="relative min-h-[100svh]">
      <CosmicBackground meteors={false} />
      <DashboardHeader name={chart.meta.name} onNewChart={onNewChart} />

      <div className="relative z-10 mx-auto max-w-6xl space-y-6 px-5 py-8">
        <Reveal>
          <SummaryHero chart={chart} />
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <ChartCard chart={chart} />
          </Reveal>
          <Reveal delay={0.08}>
            <DashaCard chart={chart} />
          </Reveal>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <PlanetTable chart={chart} />
          </Reveal>
          <Reveal delay={0.08}>
            <TransitCard details={details} />
          </Reveal>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Reveal>
            <HoroscopeCard chart={chart} />
          </Reveal>
          <Reveal delay={0.08}>
            <LuckyCard chart={chart} />
          </Reveal>
          <Reveal delay={0.16}>
            <YogaDoshaCard chart={chart} />
          </Reveal>
        </div>
      </div>
    </main>
  );
}
