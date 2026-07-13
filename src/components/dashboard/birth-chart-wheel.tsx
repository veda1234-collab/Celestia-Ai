'use client';

import { useMemo, useState } from 'react';
import { Minus, Plus, RotateCcw, RotateCw } from 'lucide-react';
import type { PlanetId } from '@/lib/astrology/types';
import { PLANETS, ZODIAC, signLord } from '@/lib/astrology/signs';
import { cn } from '@/lib/utils/cn';

export interface WheelPlanet {
  id: PlanetId;
  house: number; // 1–12
  posInSign: number; // 0–30
  retro?: boolean;
}

interface Props {
  ascendantSign: number;
  /** sign index per house 1..12 */
  houseSigns: number[];
  planets: WheelPlanet[];
  title?: string;
}

const SIZE = 440;
const C = SIZE / 2;
const R_OUTER = C - 8;
const R_SIGN = C - 30;
const R_RING = C - 52;
const R_PLANET = C - 92;
const R_NUM = C - 128;

/** angle measured clockwise from top (12 o'clock) → screen coords (y-down). */
function polar(angleDeg: number, r: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: C + r * Math.sin(a), y: C - r * Math.cos(a) };
}

function wedgePath(startDeg: number, endDeg: number, rInner: number, rOuter: number) {
  const o1 = polar(startDeg, rOuter);
  const o2 = polar(endDeg, rOuter);
  const i2 = polar(endDeg, rInner);
  const i1 = polar(startDeg, rInner);
  return `M ${o1.x} ${o1.y} A ${rOuter} ${rOuter} 0 0 1 ${o2.x} ${o2.y} L ${i2.x} ${i2.y} A ${rInner} ${rInner} 0 0 0 ${i1.x} ${i1.y} Z`;
}

// House 1 begins bottom-left and houses run clockwise around the wheel.
const houseStart = (h: number) => 180 + (h - 1) * 30;

/**
 * Interactive natal wheel. Whole-sign houses; planets placed at their true
 * degree within the sign. Supports zoom, rotate, hover-highlight and tooltips.
 */
export function BirthChartWheel({ ascendantSign, houseSigns, planets, title }: Props) {
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  const byHouse = useMemo(() => {
    const map = new Map<number, WheelPlanet[]>();
    for (const p of planets) {
      const arr = map.get(p.house) ?? [];
      arr.push(p);
      map.set(p.house, arr);
    }
    return map;
  }, [planets]);

  const activeInfo = active
    ? {
        house: active,
        sign: houseSigns[active - 1]!,
        lord: signLord(houseSigns[active - 1]!),
        planets: byHouse.get(active) ?? [],
      }
    : null;

  return (
    <div className="relative flex flex-col items-center">
      {/* Controls */}
      <div className="absolute right-0 top-0 z-10 flex gap-1.5">
        <CtrlBtn label="Zoom out" onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}><Minus className="h-4 w-4" /></CtrlBtn>
        <CtrlBtn label="Zoom in" onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}><Plus className="h-4 w-4" /></CtrlBtn>
        <CtrlBtn label="Rotate left" onClick={() => setRot((r) => r - 30)}><RotateCcw className="h-4 w-4" /></CtrlBtn>
        <CtrlBtn label="Rotate right" onClick={() => setRot((r) => r + 30)}><RotateCw className="h-4 w-4" /></CtrlBtn>
        <CtrlBtn label="Reset" onClick={() => { setZoom(1); setRot(0); }}>⟲</CtrlBtn>
      </div>

      <div className="w-full max-w-[440px] overflow-hidden">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full select-none" role="img" aria-label={title ?? 'Birth chart'}>
          <defs>
            <radialGradient id="wheel-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.28" />
              <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="0.06" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          <g
            style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: `scale(${zoom}) rotate(${rot}deg)` }}
            className="transition-transform duration-500 ease-out"
          >
            <circle cx={C} cy={C} r={R_RING} fill="url(#wheel-core)" />
            <circle cx={C} cy={C} r={R_OUTER} fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
            <circle cx={C} cy={C} r={R_SIGN} fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
            <circle cx={C} cy={C} r={R_RING} fill="none" stroke="hsl(var(--border))" strokeWidth="1" />

            {Array.from({ length: 12 }).map((_, idx) => {
              const h = idx + 1;
              const start = houseStart(h);
              const end = start + 30;
              const mid = start + 15;
              const sign = houseSigns[idx]!;
              const isActive = active === h;
              const isAsc = sign === ascendantSign;
              const signPt = polar(mid, R_SIGN + 15);
              const numPt = polar(mid, R_NUM);
              const divPt1 = polar(start, R_RING);
              const divPt2 = polar(start, R_OUTER);

              return (
                <g key={h} onMouseEnter={() => setActive(h)} onMouseLeave={() => setActive(null)} className="cursor-pointer">
                  <path
                    d={wedgePath(start, end, R_RING, R_SIGN)}
                    fill={isActive ? 'hsl(var(--primary) / 0.28)' : isAsc ? 'hsl(var(--primary) / 0.10)' : 'transparent'}
                    className="transition-colors duration-200"
                  />
                  <line x1={divPt1.x} y1={divPt1.y} x2={divPt2.x} y2={divPt2.y} stroke="hsl(var(--border))" strokeWidth="0.75" />
                  <text x={signPt.x} y={signPt.y} textAnchor="middle" dominantBaseline="central" fontSize="17" fill="hsl(var(--foreground))" opacity={isActive ? 1 : 0.75}>
                    {ZODIAC[sign]!.glyph}
                  </text>
                  <text x={numPt.x} y={numPt.y} textAnchor="middle" dominantBaseline="central" fontSize="10" fill="hsl(var(--muted-foreground))">
                    {h}
                  </text>
                </g>
              );
            })}

            {/* Ascendant marker */}
            {(() => {
              const p1 = polar(houseStart(1), R_RING);
              const p2 = polar(houseStart(1), R_OUTER + 6);
              const lbl = polar(houseStart(1), R_OUTER + 16);
              return (
                <g>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="hsl(var(--gold))" strokeWidth="2" />
                  <text x={lbl.x} y={lbl.y} textAnchor="middle" dominantBaseline="central" fontSize="9" fill="hsl(var(--gold))" fontWeight="600">
                    ASC
                  </text>
                </g>
              );
            })()}

            {/* Planets */}
            {Array.from(byHouse.entries()).flatMap(([h, list]) =>
              list.map((p, i) => {
                const angle = houseStart(h) + Math.min(29.5, Math.max(0.5, p.posInSign));
                const r = R_PLANET - i * 22;
                const pt = polar(angle, Math.max(R_NUM + 6, r));
                return (
                  <g key={`${p.id}-${h}`} className="cursor-help">
                    <title>
                      {p.id} · {ZODIAC[houseSigns[h - 1]!]!.name} {p.posInSign.toFixed(1)}° · House {h}
                      {p.retro ? ' (R)' : ''}
                    </title>
                    <circle cx={pt.x} cy={pt.y} r="12" fill="hsl(var(--card))" stroke={PLANETS[p.id].color} strokeWidth="1.5" />
                    <text x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" fontSize="12" fill={PLANETS[p.id].color}>
                      {PLANETS[p.id].glyph}
                    </text>
                    {p.retro && (
                      <text x={pt.x + 11} y={pt.y - 9} textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">
                        R
                      </text>
                    )}
                  </g>
                );
              }),
            )}
          </g>
        </svg>
      </div>

      {/* Hover readout */}
      <div className="mt-2 min-h-[52px] w-full max-w-[440px] rounded-xl border border-border bg-background/40 px-4 py-2.5 text-sm backdrop-blur-sm">
        {activeInfo ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-medium">House {activeInfo.house}</span>
            <span className="text-muted-foreground">
              {ZODIAC[activeInfo.sign]!.name} · lord {activeInfo.lord}
            </span>
            <span className="text-muted-foreground">
              {activeInfo.planets.length ? activeInfo.planets.map((p) => p.id).join(', ') : 'empty'}
            </span>
          </div>
        ) : (
          <p className="text-muted-foreground">Hover a house to explore it · use the controls to zoom & rotate.</p>
        )}
      </div>
    </div>
  );
}

function CtrlBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg glass text-xs text-foreground transition-all hover:border-primary/40 hover:text-primary"
    >
      {children}
    </button>
  );
}
