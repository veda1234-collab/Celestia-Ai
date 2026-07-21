'use client';

import type { ReactNode } from 'react';
import type { BirthChart, Dignity, PlanetId } from '@/lib/astrology/types';
import { PLANETS } from '@/lib/astrology/signs';
import { GlassCard, PlateHeader, CardContent } from '@/components/ui/glass-card';
import { SemanticTag, Meter, type Tone } from '@/components/ui/plate';
import { cn } from '@/lib/utils/cn';

/** Dignity → semantic pigment (exalted/own read as strength, debilitated needs care). */
const DIGNITY_TONE: Record<Dignity, Tone> = {
  exalted: 'good',
  own: 'good',
  friend: 'info',
  neutral: 'neutral',
  enemy: 'caution',
  debilitated: 'care',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A gold small-caps header cell in the ephemeris masthead row. */
function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap border-b border-foreground/12 px-3 py-2.5 text-left align-bottom',
        'text-[10px] font-semibold uppercase leading-none tracking-[0.16em] text-gold/85',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function PlanetTable({ chart }: { chart: BirthChart }) {
  // True navāṁśa vargottama — a planet holding the same sign in D1 and D9.
  const vargottama = new Set<PlanetId>(
    chart.vargas?.find((v) => v.id === 'D9')?.vargottamaPlanets ?? [],
  );

  return (
    <GlassCard className="flex h-full flex-col overflow-hidden">
      <PlateHeader
        folio="PLATE 05"
        kicker="GRAHAS"
        title="The Grahas"
        description="Sidereal longitudes, dignity and strength."
      />
      <CardContent className="mt-4 flex-1 px-2 pb-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr>
                <Th>Graha</Th>
                <Th className="border-l">Sign</Th>
                <Th className="border-l border-foreground/10 text-right">Degree</Th>
                <Th className="border-l border-foreground/10">Nakṣatra · Pada</Th>
                <Th className="border-l border-foreground/10 text-right">House</Th>
                <Th className="border-l border-foreground/10">Dignity</Th>
                <Th className="border-l border-foreground/10 min-w-[136px]">Strength</Th>
                <Th className="border-l border-foreground/10 min-w-[136px]">Vimśopaka</Th>
              </tr>
            </thead>
            <tbody>
              {chart.planets.map((p) => {
                const info = PLANETS[p.id];
                const tone = DIGNITY_TONE[p.dignity];
                const vimsopaka = chart.vimshopaka?.[p.id];
                return (
                  <tr
                    key={p.id}
                    className="group border-b border-foreground/[0.07] transition-colors even:bg-inset/40 hover:bg-gold/[0.05]"
                  >
                    {/* Graha — monochrome glyph + name, ℞ if retrograde, vargottama flag */}
                    <td className="px-3 py-2.5 align-top">
                      <span className="flex items-baseline gap-2">
                        <span
                          aria-hidden
                          className="w-4 shrink-0 text-center text-base leading-none text-foreground/70 transition-colors group-hover:text-gold"
                        >
                          {info.glyph}
                        </span>
                        <span className="min-w-0">
                          <span className="font-medium text-foreground">
                            {info.name}
                            {p.retrograde && (
                              <sup className="ml-0.5 font-mono text-[10px] text-gold/80" title="retrograde">
                                ℞
                              </sup>
                            )}
                          </span>
                          <span className="block text-[10.5px] leading-tight text-ink-2/70">
                            {info.sanskrit}
                          </span>
                          {vargottama.has(p.id) && (
                            <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.14em] text-gold/70">
                              vargottama
                            </span>
                          )}
                        </span>
                      </span>
                    </td>

                    {/* Sign */}
                    <td className="border-l border-foreground/10 px-3 py-2.5 align-top text-foreground/90">
                      {p.signName}
                    </td>

                    {/* Degree */}
                    <td className="border-l border-foreground/10 px-3 py-2.5 text-right align-top font-mono tabular-nums text-foreground/90">
                      {p.degreeInSign.toFixed(1)}°
                    </td>

                    {/* Nakṣatra · Pada */}
                    <td className="border-l border-foreground/10 px-3 py-2.5 align-top text-ink-2">
                      <span className="text-foreground/80">{p.nakshatra}</span>
                      <span className="ml-1.5 font-mono text-[11px] tabular-nums text-ink-2/70">
                        p{p.pada}
                      </span>
                    </td>

                    {/* House */}
                    <td className="border-l border-foreground/10 px-3 py-2.5 text-right align-top font-mono tabular-nums text-foreground/90">
                      {p.house}
                    </td>

                    {/* Dignity */}
                    <td className="border-l border-foreground/10 px-3 py-2.5 align-top">
                      <SemanticTag tone={tone} label={cap(p.dignity)} />
                    </td>

                    {/* Strength — inline linear meter, tinted by dignity */}
                    <td className="border-l border-foreground/10 px-3 py-2.5 align-middle">
                      <Meter variant="linear" value={p.strength} tone={tone} />
                    </td>

                    {/* Vimśopaka — cross-varga strength meter (undefined-guarded) */}
                    <td className="border-l border-foreground/10 px-3 py-2.5 align-middle">
                      {vimsopaka != null ? (
                        <Meter variant="linear" value={vimsopaka} tone={tone} />
                      ) : (
                        <span className="font-mono text-[11px] tabular-nums text-ink-2/50">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </GlassCard>
  );
}
