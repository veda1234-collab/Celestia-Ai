'use client';

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
}: {
  className?: string;
  title?: string;
  facetColor?: string;
}) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id="vd-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F6D98A" />
          <stop offset="38%" stopColor="#D9AE52" />
          <stop offset="62%" stopColor="#B98B2E" />
          <stop offset="100%" stopColor="#EBC978" />
        </linearGradient>
      </defs>
      <path d={MARK_SOLID} fill="url(#vd-gold)" />
      <path d={MARK_FACET} fill="none" stroke={facetColor} strokeWidth="1.6" opacity="0.45" />
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
