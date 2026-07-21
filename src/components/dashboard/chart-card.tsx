'use client';

import { useMemo, useState } from 'react';
import type { BirthChart, VargaChart, VargaId } from '@/lib/astrology/types';
import { ZODIAC, signLord } from '@/lib/astrology/signs';
import { GlassCard, PlateHeader } from '@/components/ui/glass-card';
import { CornerTicks, Meter, Tag } from '@/components/ui/plate';
import { cn } from '@/lib/utils/cn';
import { BirthChartWheel, type WheelPlanet } from './birth-chart-wheel';

/** The vargas always shown first; the rest live behind a disclosure. */
const PRIMARY: VargaId[] = ['D1', 'D9', 'D10', 'D12', 'D7', 'D30', 'D60'];

export function ChartCard({ chart }: { chart: BirthChart }) {
  const vargas = useMemo(() => chart.vargas ?? [], [chart.vargas]);
  const [activeId, setActiveId] = useState<VargaId>('D1');
  const [showAll, setShowAll] = useState(false);
  const [hoverHouse, setHoverHouse] = useState<number | null>(null);

  const active: VargaChart | undefined = useMemo(
    () => vargas.find((v) => v.id === activeId) ?? vargas[0],
    [vargas, activeId],
  );

  const d1Planets: WheelPlanet[] = useMemo(
    () => chart.planets.map((p) => ({ id: p.id, house: p.house, posInSign: p.degreeInSign, retro: p.retrograde })),
    [chart.planets],
  );
  const d1HouseSigns = useMemo(() => chart.houses.map((h) => h.sign), [chart.houses]);

  const view = useMemo(() => {
    if (!active || active.id === 'D1') {
      return { ascendantSign: chart.ascendant.sign, houseSigns: d1HouseSigns, planets: d1Planets };
    }
    const asc = active.ascendant.sign;
    return {
      ascendantSign: asc,
      houseSigns: Array.from({ length: 12 }, (_, i) => (asc + i) % 12),
      planets: active.planets.map((p) => ({ id: p.id, house: p.house, posInSign: 15, retro: p.retrograde })) as WheelPlanet[],
    };
  }, [active, chart.ascendant.sign, d1HouseSigns, d1Planets]);

  // Occupant glyphs per house for the "houses at a glance" list.
  const occupants = useMemo(() => {
    const m = new Map<number, string[]>();
    for (const p of view.planets) {
      const arr = m.get(p.house) ?? [];
      arr.push(p.id.slice(0, 2));
      m.set(p.house, arr);
    }
    return m;
  }, [view.planets]);

  const primaryVargas = vargas.filter((v) => PRIMARY.includes(v.id));
  const restVargas = vargas.filter((v) => !PRIMARY.includes(v.id));

  const VargaPill = ({ v }: { v: VargaChart }) => (
    <button
      key={v.id}
      type="button"
      onClick={() => setActiveId(v.id)}
      title={`${v.name} — ${v.purpose}`}
      className={cn(
        'relative shrink-0 rounded-chip border px-2.5 py-1 font-mono text-xs tabular-nums transition-colors',
        v.id === active?.id ? 'border-gold/60 text-gold' : 'border-foreground/12 text-ink-2 hover:border-gold/40 hover:text-foreground',
      )}
    >
      {v.id}
      {/* classical honesty — solid tick vs hollow */}
      <span className={cn('ml-1 inline-block h-1.5 w-1.5 rounded-full align-middle', v.classical ? 'bg-gold/70' : 'border border-gold/50')} />
    </button>
  );

  return (
    <GlassCard className="relative overflow-hidden">
      <CornerTicks />
      <PlateHeader
        folio="PLATE 02"
        kicker="Rāśi & Vargas"
        title="The Charts"
        description={vargas.length ? `All ${vargas.length} divisional charts · whole-sign houses.` : 'Whole-sign houses · hover, zoom & rotate.'}
      />

      <div className="p-6 pt-4">
        {vargas.length > 0 && (
          <div className="mb-5">
            <div className="flex flex-wrap items-center gap-1.5">
              {primaryVargas.map((v) => <VargaPill key={v.id} v={v} />)}
              {restVargas.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAll((s) => !s)}
                  className="rounded-chip border border-foreground/12 px-2.5 py-1 text-[11px] uppercase tracking-wider text-ink-2 transition-colors hover:border-gold/40 hover:text-gold"
                >
                  {showAll ? 'Fewer' : 'All 20'}
                </button>
              )}
            </div>
            {showAll && (
              <div className="mt-2 flex flex-wrap gap-1.5 border-t border-foreground/10 pt-3">
                {restVargas.map((v) => <VargaPill key={v.id} v={v} />)}
              </div>
            )}
            {active && (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="card-subhead text-foreground">
                  {active.name} <span className="font-mono text-xs text-ink-2">({active.id})</span>
                </span>
                <span className="text-ink-2">{active.purpose}</span>
                <span className="ml-auto flex items-center gap-2">
                  <span className="kicker">strength</span>
                  <span className="w-20"><Meter value={active.strength} tone={active.strength >= 60 ? 'good' : active.strength >= 40 ? 'caution' : 'care'} /></span>
                </span>
              </div>
            )}
            {active && active.vargottamaPlanets.length > 0 && (
              <p className="mt-1.5 text-xs text-ink-2">
                Vargottama: <span className="text-gold">{active.vargottamaPlanets.join(' · ')}</span>
              </p>
            )}
            {active && !active.classical && (
              <p className="mt-1.5 text-[11px] leading-relaxed text-ink-2/70">
                Marked with a hollow tick — D5/D6/D8/D11 follow a documented cyclic scheme, not a single classical rule; weigh them lightly.
              </p>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <BirthChartWheel
              key={active?.id}
              ascendantSign={view.ascendantSign}
              houseSigns={view.houseSigns}
              planets={view.planets}
              title={active ? `${active.name} chart (${active.id})` : 'Rāśi chart (D1)'}
              activeHouse={hoverHouse}
              onHoverHouse={setHoverHouse}
            />
          </div>

          {/* Houses at a glance — ruled rows synced to the wheel hover. */}
          <div className="lg:col-span-5">
            <p className="kicker mb-2">Houses at a glance</p>
            <ul className="overflow-hidden rounded-field border border-foreground/10">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
                const sign = view.houseSigns[h - 1]!;
                const on = hoverHouse === h;
                return (
                  <li
                    key={h}
                    onMouseEnter={() => setHoverHouse(h)}
                    onMouseLeave={() => setHoverHouse(null)}
                    className={cn(
                      'flex items-center gap-3 border-b border-foreground/[0.07] px-3 py-1.5 text-sm transition-colors last:border-0',
                      on ? 'bg-gold/[0.06]' : 'even:bg-inset/40',
                    )}
                  >
                    <span className={cn('w-5 font-mono text-xs tabular-nums', on ? 'text-gold' : 'text-ink-2')}>{h}</span>
                    <span className={cn('text-base', on ? 'text-gold' : 'text-foreground/80')}>{ZODIAC[sign]!.glyph}</span>
                    <span className="w-20 text-foreground/90">{ZODIAC[sign]!.name}</span>
                    <span className="text-xs text-ink-2">lord {signLord(sign)}</span>
                    <span className="ml-auto font-mono text-xs text-gold/80">{(occupants.get(h) ?? []).join(' ')}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
