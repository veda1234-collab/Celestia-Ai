'use client';

import { useId } from 'react';

/**
 * The Vedastra star mark.
 *
 * Rebuilt as vector geometry rather than shipping the source raster, so it stays
 * crisp from favicon size to cover size, can be recoloured by theme, and can be
 * redrawn from the same numbers by the PDF generator.
 *
 * An eight-pointed compass rose with long cardinals and shorter diagonals. An
 * earlier attempt overlaid a second star rotated into the gaps, which read as a
 * sixteen-spike asterisk and turned to mush below about 40px; the facet echo
 * used here keeps a single clean silhouette that still survives at 24px.
 */

const CX = 100;
const CY = 100;
const DEG = Math.PI / 180;

/** One point of the rose: hub → shoulder → tip → shoulder → hub. */
function kite(angleDeg: number, tip: number, shoulder: number, halfDeg: number): string {
  const a = angleDeg * DEG - Math.PI / 2;
  const h = halfDeg * DEG;
  const at = (ang: number, r: number) =>
    `${(CX + Math.cos(ang) * r).toFixed(2)},${(CY + Math.sin(ang) * r).toFixed(2)}`;
  return `M${at(a, tip)}L${at(a + h, shoulder)}L${CX},${CY}L${at(a - h, shoulder)}Z`;
}

/** Eight points; cardinals run longer than the diagonals. */
function rose(cardinal: number, diagonal: number, shoulder: number, half: number): string {
  return Array.from({ length: 8 }, (_, i) =>
    kite(i * 45, i % 2 === 0 ? cardinal : diagonal, shoulder, half),
  ).join('');
}

export const MARK_SOLID = rose(94, 64, 26, 22.5);
/** Inner echo, cut in the background colour to suggest a bevelled facet. */
export const MARK_FACET = rose(52, 36, 14, 22.5);

export function VedastraMark({
  className,
  title = 'Vedastra',
  facetColor = '#0B1030',
  medallion = false,
}: {
  className?: string;
  title?: string;
  facetColor?: string;
  /** Set the star inside a ringed navy disc, matching the full brand emblem. */
  medallion?: boolean;
}) {
  // useId gives ids stable across the server/client boundary, so multiple marks
  // on a page get unique gradient references without a hydration mismatch.
  const uid = useId().replace(/:/g, '');
  const gid = `vd-gold-${uid}`;
  const rid = `vd-ring-${uid}`;
  const starScale = medallion ? 0.62 : 1;

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F6D98A" />
          <stop offset="38%" stopColor="#D9AE52" />
          <stop offset="62%" stopColor="#B98B2E" />
          <stop offset="100%" stopColor="#EBC978" />
        </linearGradient>
        <radialGradient id={rid} cx="50%" cy="38%" r="72%">
          <stop offset="0%" stopColor="#1A1740" />
          <stop offset="100%" stopColor="#0B1030" />
        </radialGradient>
      </defs>

      {medallion && (
        <>
          {/* Navy disc with a double gold rim — the coin the star sits on. */}
          <circle cx="100" cy="100" r="96" fill={`url(#${rid})`} stroke={`url(#${gid})`} strokeWidth="4" />
          <circle cx="100" cy="100" r="88" fill="none" stroke={`url(#${gid})`} strokeWidth="1" opacity="0.5" />
          {/* A few scattered stars in the field. */}
          {[
            [58, 46], [148, 60], [40, 120], [160, 132], [128, 40], [72, 150],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 2 ? 1 : 1.6} fill="#EBC978" opacity={0.7} />
          ))}
        </>
      )}

      <g transform={`translate(100 100) scale(${starScale}) translate(-100 -100)`}>
        <path d={MARK_SOLID} fill={`url(#${gid})`} />
        <path d={MARK_FACET} fill="none" stroke={medallion ? '#0B1030' : facetColor} strokeWidth="1.6" opacity="0.5" />
      </g>
    </svg>
  );
}

/** Mark plus wordmark, for the nav and the hero. */
export function VedastraLogo({ className, markClass }: { className?: string; markClass?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <VedastraMark className={markClass ?? 'h-8 w-8'} />
      <span className="font-display text-xl font-semibold tracking-tight">Vedastra</span>
    </span>
  );
}
