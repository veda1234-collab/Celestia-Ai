'use client';

import { useMemo, useState } from 'react';
import { Minus, Plus, RotateCcw, RotateCw } from 'lucide-react';
import type { PlanetId } from '@/lib/astrology/types';
import { PLANETS, ZODIAC, signLord } from '@/lib/astrology/signs';

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
  /** House currently highlighted from an external list (bidirectional sync). */
  activeHouse?: number | null;
  onHoverHouse?: (house: number | null) => void;
  /** Planet highlighted from the ephemeris table. */
  activePlanet?: PlanetId | null;
}

const SIZE = 460;
const C = SIZE / 2;
const R_OUTER = C - 6;
const R_SIGN = C - 30;
const R_RING = C - 54;
const R_PLANET = C - 94;
const R_NUM = C - 130;

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
 * Interactive natal wheel, engraved-plate style: hairline rings, gold-ringed
 * planet nodes (the one sanctioned place for planet candy-colours), a gold
 * ascendant axis, degree ticks. Zoom / rotate / hover with bidirectional house
 * highlight via `onHoverHouse`.
 */
export function BirthChartWheel({
  ascendantSign,
  houseSigns,
  planets,
  title,
  activeHouse,
  onHoverHouse,
  activePlanet,
}: Props) {
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [localActive, setLocalActive] = useState<number | null>(null);
  const active = localActive ?? activeHouse ?? null;

  const setActive = (h: number | null) => {
    setLocalActive(h);
    onHoverHouse?.(h);
  };

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
      <div className="absolute right-0 top-0 z-10 flex gap-1.5">
        <CtrlBtn label="Zoom out" onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}><Minus className="h-4 w-4" /></CtrlBtn>
        <CtrlBtn label="Zoom in" onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}><Plus className="h-4 w-4" /></CtrlBtn>
        <CtrlBtn label="Rotate left" onClick={() => setRot((r) => r - 30)}><RotateCcw className="h-4 w-4" /></CtrlBtn>
        <CtrlBtn label="Rotate right" onClick={() => setRot((r) => r + 30)}><RotateCw className="h-4 w-4" /></CtrlBtn>
        <CtrlBtn label="Reset" onClick={() => { setZoom(1); setRot(0); }}>⟲</CtrlBtn>
      </div>

      <div className="w-full max-w-[460px] overflow-hidden">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full select-none" role="img" aria-label={title ?? 'Birth chart'}>
          <g
            style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: `scale(${zoom}) rotate(${rot}deg)` }}
            className="transition-transform duration-500 ease-out"
          >
            {/* Engraved concentric rings — hairlines, no glow. */}
            <circle cx={C} cy={C} r={R_OUTER} fill="none" stroke="hsl(var(--gold-deep) / 0.34)" strokeWidth="1" />
            <circle cx={C} cy={C} r={R_SIGN} fill="none" stroke="hsl(var(--foreground) / 0.12)" strokeWidth="1" />
            <circle cx={C} cy={C} r={R_RING} fill="none" stroke="hsl(var(--foreground) / 0.12)" strokeWidth="1" />
            <circle cx={C} cy={C} r={R_NUM + 6} fill="none" stroke="hsl(var(--foreground) / 0.07)" strokeWidth="1" />

            {/* 5° degree ticks in the sign band. */}
            {Array.from({ length: 72 }).map((_, i) => {
              const a = i * 5;
              const major = i % 6 === 0;
              const p1 = polar(a, R_SIGN);
              const p2 = polar(a, R_SIGN + (major ? 8 : 4));
              return (
                <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke={major ? 'hsl(var(--gold-deep) / 0.4)' : 'hsl(var(--foreground) / 0.12)'} strokeWidth={major ? 1 : 0.6} />
              );
            })}

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
              const divPt1 = polar(start, R_NUM + 6);
              const divPt2 = polar(start, R_SIGN);

              return (
                <g key={h} onMouseEnter={() => setActive(h)} onMouseLeave={() => setActive(null)} className="cursor-pointer">
                  <path
                    d={wedgePath(start, end, R_RING, R_SIGN)}
                    fill={isActive ? 'hsl(var(--gold) / 0.14)' : isAsc ? 'hsl(var(--gold) / 0.05)' : 'transparent'}
                    className="transition-colors duration-200"
                  />
                  <line x1={divPt1.x} y1={divPt1.y} x2={divPt2.x} y2={divPt2.y} stroke="hsl(var(--foreground) / 0.1)" strokeWidth="0.75" />
                  <text x={signPt.x} y={signPt.y} textAnchor="middle" dominantBaseline="central" fontSize="16" fill={isActive ? 'hsl(var(--gold))' : 'hsl(var(--foreground))'} opacity={isActive ? 1 : 0.7}>
                    {ZODIAC[sign]!.glyph}
                  </text>
                  <text x={numPt.x} y={numPt.y} textAnchor="middle" dominantBaseline="central" fontSize="10" fontFamily="var(--font-mono)" fill={isActive ? 'hsl(var(--gold))' : 'hsl(var(--ink-2))'}>
                    {h}
                  </text>
                </g>
              );
            })}

            {/* Ascendant — a gold axis with an ASC tick. */}
            {(() => {
              const p1 = polar(houseStart(1), R_NUM);
              const p2 = polar(houseStart(1), R_OUTER + 6);
              const lbl = polar(houseStart(1), R_OUTER + 16);
              return (
                <g>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="hsl(var(--gold))" strokeWidth="1.5" />
                  <text x={lbl.x} y={lbl.y} textAnchor="middle" dominantBaseline="central" fontSize="9" fontFamily="var(--font-mono)" fill="hsl(var(--gold))" letterSpacing="1">
                    ASC
                  </text>
                </g>
              );
            })()}

            {/* Planets — gold-ringed nodes; candy glyph survives here only. */}
            {Array.from(byHouse.entries()).flatMap(([h, list]) =>
              list.map((p, i) => {
                const angle = houseStart(h) + Math.min(29.5, Math.max(0.5, p.posInSign));
                const r = R_PLANET - i * 22;
                const pt = polar(angle, Math.max(R_NUM + 8, r));
                const hot = activePlanet === p.id;
                return (
                  <g key={`${p.id}-${h}`} className="cursor-help">
                    <title>
                      {p.id} · {ZODIAC[houseSigns[h - 1]!]!.name} {p.posInSign.toFixed(1)}° · House {h}
                      {p.retro ? ' · ℞' : ''}
                    </title>
                    <circle cx={pt.x} cy={pt.y} r={hot ? 13 : 11.5} fill="hsl(var(--plate))" stroke={hot ? 'hsl(var(--gold))' : 'hsl(var(--gold) / 0.55)'} strokeWidth={hot ? 1.75 : 1} />
                    <text x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" fontSize="12" fill={PLANETS[p.id].color}>
                      {PLANETS[p.id].glyph}
                    </text>
                    {p.retro && (
                      <text x={pt.x + 10} y={pt.y - 9} textAnchor="middle" fontSize="7" fontFamily="var(--font-mono)" fill="hsl(var(--care))">
                        ℞
                      </text>
                    )}
                  </g>
                );
              }),
            )}
          </g>
        </svg>
      </div>

      {/* Hover readout — mono, ruled. */}
      <div className="mt-3 min-h-[48px] w-full max-w-[460px] rounded-field plate-inset px-4 py-2.5 text-sm">
        {activeInfo ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-mono text-xs tabular-nums text-gold">H{activeInfo.house}</span>
            <span className="text-foreground">{ZODIAC[activeInfo.sign]!.name}</span>
            <span className="text-ink-2">lord {activeInfo.lord}</span>
            <span className="text-ink-2">
              {activeInfo.planets.length ? activeInfo.planets.map((p) => p.id).join(' · ') : 'empty'}
            </span>
          </div>
        ) : (
          <p className="text-ink-2">Hover a house to read it · zoom & rotate with the controls.</p>
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
      className="grid h-8 w-8 place-items-center rounded-control border border-foreground/10 bg-inset text-xs text-ink-2 transition-colors hover:border-gold/50 hover:text-gold"
    >
      {children}
    </button>
  );
}
