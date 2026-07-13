'use client';

import type { BirthChart, Dignity } from '@/lib/astrology/types';
import { PLANETS } from '@/lib/astrology/signs';
import { GlassCard, CardHeader, CardTitle, CardDescription } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils/cn';

const DIGNITY_STYLE: Record<Dignity, string> = {
  exalted: 'text-emerald-400',
  own: 'text-primary',
  friend: 'text-accent',
  neutral: 'text-muted-foreground',
  enemy: 'text-amber-400',
  debilitated: 'text-rose-400',
};

export function PlanetTable({ chart }: { chart: BirthChart }) {
  return (
    <GlassCard className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Planetary Positions</CardTitle>
        <CardDescription>Sidereal longitudes, dignity and relative strength.</CardDescription>
      </CardHeader>
      <div className="overflow-x-auto px-2 pb-4">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">Planet</th>
              <th className="px-3 py-2 font-medium">Sign</th>
              <th className="px-3 py-2 font-medium">House</th>
              <th className="px-3 py-2 font-medium">Nakshatra</th>
              <th className="px-3 py-2 font-medium">Dignity</th>
              <th className="px-3 py-2 font-medium">Strength</th>
            </tr>
          </thead>
          <tbody>
            {chart.planets.map((p) => (
              <tr key={p.id} className="border-t border-border/60 transition-colors hover:bg-foreground/[0.03]">
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-2 font-medium">
                    <span style={{ color: PLANETS[p.id].color }}>{PLANETS[p.id].glyph}</span>
                    {p.id}
                    {p.retrograde && <span className="text-[10px] text-muted-foreground">(R)</span>}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {p.degreeInSign.toFixed(1)}° {p.signName}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{p.house}</td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {p.nakshatra} <span className="text-muted-foreground/60">{p.pada}</span>
                </td>
                <td className={cn('px-3 py-2.5 capitalize', DIGNITY_STYLE[p.dignity])}>{p.dignity}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${p.strength}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{p.strength}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
