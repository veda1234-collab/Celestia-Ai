'use client';

import type { BirthChart } from '@/lib/astrology/types';
import { GlassCard, CardHeader, CardTitle, CardDescription } from '@/components/ui/glass-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BirthChartWheel, type WheelPlanet } from './birth-chart-wheel';

export function ChartCard({ chart }: { chart: BirthChart }) {
  const d1Planets: WheelPlanet[] = chart.planets.map((p) => ({
    id: p.id,
    house: p.house,
    posInSign: p.degreeInSign,
    retro: p.retrograde,
  }));
  const d1HouseSigns = chart.houses.map((h) => h.sign);

  const navAsc = chart.navamsa.ascendantSign;
  const d9HouseSigns = Array.from({ length: 12 }, (_, i) => (navAsc + i) % 12);
  const d9Planets: WheelPlanet[] = chart.navamsa.positions.map((p) => ({
    id: p.id,
    house: (((p.sign - navAsc) % 12) + 12) % 12 + 1,
    posInSign: 15,
  }));

  return (
    <GlassCard className="p-2 sm:p-4">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Birth Chart</CardTitle>
            <CardDescription>Whole-sign houses · hover, zoom & rotate.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <div className="px-3 pb-4">
        <Tabs defaultValue="d1">
          <TabsList>
            <TabsTrigger value="d1">Rāśi (D1)</TabsTrigger>
            <TabsTrigger value="d9">Navāṁśa (D9)</TabsTrigger>
          </TabsList>
          <TabsContent value="d1">
            <BirthChartWheel ascendantSign={chart.ascendant.sign} houseSigns={d1HouseSigns} planets={d1Planets} title="Rāśi chart (D1)" />
          </TabsContent>
          <TabsContent value="d9">
            <BirthChartWheel ascendantSign={navAsc} houseSigns={d9HouseSigns} planets={d9Planets} title="Navāṁśa chart (D9)" />
          </TabsContent>
        </Tabs>
      </div>
    </GlassCard>
  );
}
