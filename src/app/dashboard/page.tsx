'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useProfile } from '@/lib/store/profile';
import { useChartRefresh, useMounted } from '@/lib/hooks';
import { DashboardHeader } from '@/components/dashboard/header';
import { NativityPlate } from '@/components/dashboard/summary';
import { ChartCard } from '@/components/dashboard/chart-card';
import { PlanetTable } from '@/components/dashboard/planet-table';
import { DashaCard } from '@/components/dashboard/dasha-card';
import { TransitCard } from '@/components/dashboard/transit-card';
import { InsightPlate } from '@/components/dashboard/insight-cards';
import { Reveal } from '@/components/ui/reveal';
import { SectionRail } from '@/components/ui/plate';

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
      <main className="relative grid min-h-[100svh] place-items-center page-grain">
        <div className="relative z-10 flex flex-col items-center gap-3 text-ink-2">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
          <p className="text-sm">Opening your almanac…</p>
        </div>
      </main>
    );
  }

  const onNewChart = () => {
    clear();
    router.push('/onboarding');
  };

  return (
    <main className="relative min-h-[100svh] page-grain">
      <DashboardHeader name={chart.meta.name} chart={chart} onNewChart={onNewChart} />

      <div className="relative z-10 mx-auto flex max-w-[1180px] gap-8 px-5 py-10 xl:px-8">
        <SectionRail name={chart.meta.name} className="hidden xl:block" />

        <div className="min-w-0 flex-1 space-y-16">
          <section id="plate-01">
            <Reveal>
              <NativityPlate chart={chart} details={details} />
            </Reveal>
          </section>
          <section id="plate-02">
            <Reveal>
              <ChartCard chart={chart} />
            </Reveal>
          </section>
          <section id="plate-03">
            <Reveal>
              <DashaCard chart={chart} />
            </Reveal>
          </section>
          <section id="plate-04">
            <Reveal>
              <TransitCard details={details} />
            </Reveal>
          </section>
          <section id="plate-05">
            <Reveal>
              <PlanetTable chart={chart} />
            </Reveal>
          </section>
          <section id="plate-06">
            <Reveal>
              <InsightPlate chart={chart} />
            </Reveal>
          </section>
        </div>
      </div>
    </main>
  );
}
