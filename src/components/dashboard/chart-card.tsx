'use client';

import { useMemo, useState } from 'react';
import type { BirthChart, VargaChart, VargaId } from '@/lib/astrology/types';
import { GlassCard, CardHeader, CardTitle, CardDescription } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { BirthChartWheel, type WheelPlanet } from './birth-chart-wheel';

/**
 * The engine computes twenty divisional charts. D1 is drawn from the real
 * planetary degrees; every other varga only resolves to a sign, so its planets
 * are centred in their sign on the wheel.
 */
export function ChartCard({ chart }: { chart: BirthChart }) {
  // Stable identity so the memos below don't recompute on every render.
  const vargas = useMemo(() => chart.vargas ?? [], [chart.vargas]);
  const [activeId, setActiveId] = useState<VargaId>('D1');

  const active: VargaChart | undefined = useMemo(
    () => vargas.find((v) => v.id === activeId) ?? vargas[0],
    [vargas, activeId],
  );

  // D1 keeps true degrees; the rest are sign-resolved only.
  const d1Planets: WheelPlanet[] = useMemo(
    () =>
      chart.planets.map((p) => ({
        id: p.id,
        house: p.house,
        posInSign: p.degreeInSign,
        retro: p.retrograde,
      })),
    [chart.planets],
  );
  const d1HouseSigns = useMemo(() => chart.houses.map((h) => h.sign), [chart.houses]);

  const view = useMemo(() => {
    if (!active || active.id === 'D1') {
      return {
        ascendantSign: chart.ascendant.sign,
        houseSigns: d1HouseSigns,
        planets: d1Planets,
      };
    }
    const asc = active.ascendant.sign;
    return {
      ascendantSign: asc,
      houseSigns: Array.from({ length: 12 }, (_, i) => (asc + i) % 12),
      planets: active.planets.map((p) => ({
        id: p.id,
        house: p.house,
        posInSign: 15,
        retro: p.retrograde,
      })) as WheelPlanet[],
    };
  }, [active, chart.ascendant.sign, d1HouseSigns, d1Planets]);

  // No vargas on this chart (computed by an older build) — fall back to D1 only.
  if (!vargas.length) {
    return (
      <GlassCard className="p-2 sm:p-4">
        <CardHeader className="pb-2">
          <CardTitle>Birth Chart</CardTitle>
          <CardDescription>Whole-sign houses · hover, zoom &amp; rotate.</CardDescription>
        </CardHeader>
        <div className="px-3 pb-4">
          <BirthChartWheel
            ascendantSign={chart.ascendant.sign}
            houseSigns={d1HouseSigns}
            planets={d1Planets}
            title="Rāśi chart (D1)"
          />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-2 sm:p-4">
      <CardHeader className="pb-2">
        <CardTitle>Divisional Charts</CardTitle>
        <CardDescription>
          All {vargas.length} vargas · whole-sign houses · hover, zoom &amp; rotate.
        </CardDescription>
      </CardHeader>

      <div className="px-3 pb-4">
        {/* Varga selector — scrolls horizontally rather than wrapping into a wall of tabs. */}
        <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-2">
          {vargas.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setActiveId(v.id)}
              title={`${v.name} — ${v.purpose}`}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                v.id === active?.id
                  ? 'border-primary/60 bg-primary/20 text-foreground'
                  : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {v.id}
            </button>
          ))}
        </div>

        {active && (
          <div className="mb-3 rounded-xl border border-border/60 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  {active.name} <span className="text-muted-foreground">({active.id})</span>
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{active.purpose}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant={active.strength >= 60 ? 'gold' : active.strength >= 40 ? 'accent' : 'muted'}>
                  strength {active.strength}
                </Badge>
                {!active.classical && <Badge variant="muted">non-classical scheme</Badge>}
              </div>
            </div>
            {active.vargottamaPlanets.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Vargottama: <span className="text-foreground">{active.vargottamaPlanets.join(', ')}</span>
              </p>
            )}
            {!active.classical && (
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/70">
                D5, D6, D8 and D11 have no single agreed Parāśari rule; these use a documented cyclic
                scheme and should be weighed more lightly than the classical vargas.
              </p>
            )}
          </div>
        )}

        <BirthChartWheel
          key={active?.id}
          ascendantSign={view.ascendantSign}
          houseSigns={view.houseSigns}
          planets={view.planets}
          title={active ? `${active.name} chart (${active.id})` : 'Rāśi chart (D1)'}
        />

        {active && active.id !== 'D1' && (
          <p className="mt-2 text-[11px] text-muted-foreground/70">
            Divisional charts resolve a planet to a sign, not a degree — planets are shown centred in
            their varga sign.
          </p>
        )}
      </div>
    </GlassCard>
  );
}
