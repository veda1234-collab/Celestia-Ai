/**
 * Vector renderers for the traditional Indian chart diagrams used in the PDF.
 *
 * Two styles are supported because the country is split on them: the North
 * Indian diamond, where the houses are fixed and the signs move, and the South
 * Indian square, where the signs are fixed and the ascendant is marked. Both are
 * drawn as vectors so they stay crisp at any zoom or print size.
 */

import type { PlanetId } from '@/lib/astrology/types';
import { COLOR } from './theme';

/**
 * The Vedastra star mark, drawn with the same geometry as the on-screen SVG
 * (see components/brand/vedastra-mark.tsx) so print and screen cannot drift.
 */
export function drawVedastraMark(
  doc: Pick<Doc, 'save' | 'restore' | 'moveTo' | 'lineTo' | 'fill' | 'stroke' | 'lineWidth'>,
  cx: number,
  cy: number,
  radius: number,
  color: string,
): void {
  const DEG = Math.PI / 180;
  const unit = radius / 94; // the SVG's cardinal length
  const point = (angleDeg: number, tip: number, shoulder: number, halfDeg: number) => {
    const a = angleDeg * DEG - Math.PI / 2;
    const h = halfDeg * DEG;
    const at = (ang: number, r: number) => [cx + Math.cos(ang) * r * unit, cy + Math.sin(ang) * r * unit] as const;
    const [tx, ty] = at(a, tip);
    const [rx, ry] = at(a + h, shoulder);
    const [lx, ly] = at(a - h, shoulder);
    doc.moveTo(tx, ty).lineTo(rx, ry).lineTo(cx, cy).lineTo(lx, ly).lineTo(tx, ty);
  };

  doc.save();
  for (let i = 0; i < 8; i++) point(i * 45, i % 2 === 0 ? 94 : 64, 26, 22.5);
  doc.fill(color);
  doc.restore();
}

/** Two-letter forms are what actually fit inside a house cell. */
export const PLANET_ABBR: Record<PlanetId, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju',
  Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};

export interface CellPlanet {
  id: PlanetId;
  retrograde?: boolean;
}

/** Minimal surface of the PDFKit document this module needs. */
interface Doc {
  save(): Doc;
  restore(): Doc;
  rect(x: number, y: number, w: number, h: number): Doc;
  moveTo(x: number, y: number): Doc;
  lineTo(x: number, y: number): Doc;
  fill(color?: string): Doc;
  stroke(color?: string): Doc;
  lineWidth(w: number): Doc;
  font(name: string): Doc;
  fontSize(n: number): Doc;
  fillColor(c: string): Doc;
  text(t: string, x: number, y: number, opts?: Record<string, unknown>): Doc;
}

export interface ChartDrawOptions {
  x: number;
  y: number;
  size: number;
  /** Sign occupying each house, index 0 = house 1. */
  houseSigns: number[];
  /** Planets per house, keyed 1–12. */
  byHouse: Map<number, CellPlanet[]>;
  ascendantSign: number;
  fontRegular: string;
  fontBold: string;
}

/**
 * House centroids in unit coordinates for the North Indian diamond. House 1 is
 * the top-centre lozenge and the count runs anticlockwise, which is what the
 * diagonals plus the inner diamond carve the square into.
 */
const NORTH_CENTROIDS: [number, number][] = [
  [0.50, 0.22], // 1
  [0.25, 0.13], // 2
  [0.13, 0.25], // 3
  [0.25, 0.50], // 4
  [0.13, 0.75], // 5
  [0.25, 0.87], // 6
  [0.50, 0.74], // 7
  [0.75, 0.87], // 8
  [0.87, 0.75], // 9
  [0.75, 0.50], // 10
  [0.87, 0.25], // 11
  [0.75, 0.13], // 12
];

function drawCellContents(
  doc: Doc,
  cx: number,
  cy: number,
  signNumber: number,
  planets: CellPlanet[],
  opts: { fontRegular: string; fontBold: string; size: number },
) {
  const signSize = Math.max(6, opts.size * 0.030);
  const planetSize = Math.max(5.6, opts.size * 0.028);

  // An empty house centres its sign number; an occupied one lifts the number so
  // the planets below stay visually centred in the cell.
  const signY = planets.length ? cy - planetSize * 1.5 - signSize : cy - signSize * 0.6;
  doc.font(opts.fontBold).fontSize(signSize).fillColor(COLOR.violet);
  doc.text(String(signNumber), cx - 20, signY, { width: 40, align: 'center' });

  if (!planets.length) return;
  // Wrap to at most three per line so a stacked house stays inside its cell.
  const perLine = planets.length > 4 ? 3 : planets.length > 2 ? 2 : planets.length;
  const lines: string[] = [];
  for (let i = 0; i < planets.length; i += perLine) {
    lines.push(
      planets.slice(i, i + perLine).map((p) => `${PLANET_ABBR[p.id]}${p.retrograde ? '˚' : ''}`).join(' '),
    );
  }
  doc.font(opts.fontBold).fontSize(planetSize).fillColor(COLOR.ink);
  lines.forEach((ln, i) => {
    doc.text(ln, cx - 30, cy - planetSize * 0.4 + i * (planetSize + 1.4), { width: 60, align: 'center' });
  });
}

/** The North Indian diamond: fixed houses, moving signs. */
export function drawNorthIndianChart(doc: Doc, o: ChartDrawOptions): void {
  const { x, y, size } = o;

  doc.save();
  doc.rect(x, y, size, size).fill(COLOR.white);
  doc.rect(x, y, size, size).lineWidth(1.1).stroke(COLOR.violet);

  // Both diagonals. A mid tone rather than the hairline colour, or the internal
  // geometry washes out when the chart is printed.
  const GRID = '#B9B0D8';
  doc.lineWidth(0.7);
  doc.moveTo(x, y).lineTo(x + size, y + size).stroke(GRID);
  doc.moveTo(x + size, y).lineTo(x, y + size).stroke(GRID);

  // Inner diamond through the side midpoints.
  const mid = size / 2;
  doc.moveTo(x + mid, y)
    .lineTo(x + size, y + mid)
    .lineTo(x + mid, y + size)
    .lineTo(x, y + mid)
    .lineTo(x + mid, y)
    .stroke(GRID);

  for (let h = 1; h <= 12; h++) {
    const [ux, uy] = NORTH_CENTROIDS[h - 1]!;
    const sign = o.houseSigns[h - 1] ?? 0;
    drawCellContents(
      doc,
      x + ux * size,
      y + uy * size,
      sign + 1,
      o.byHouse.get(h) ?? [],
      { fontRegular: o.fontRegular, fontBold: o.fontBold, size },
    );
  }
  doc.restore();
}

/**
 * South Indian square: signs are fixed in place (Pisces top-left, running
 * clockwise) and the ascendant cell is flagged.
 */
const SOUTH_CELLS: { sign: number; col: number; row: number }[] = [
  { sign: 11, col: 0, row: 0 }, { sign: 0, col: 1, row: 0 }, { sign: 1, col: 2, row: 0 }, { sign: 2, col: 3, row: 0 },
  { sign: 10, col: 0, row: 1 }, { sign: 3, col: 3, row: 1 },
  { sign: 9, col: 0, row: 2 }, { sign: 4, col: 3, row: 2 },
  { sign: 8, col: 0, row: 3 }, { sign: 7, col: 1, row: 3 }, { sign: 6, col: 2, row: 3 }, { sign: 5, col: 3, row: 3 },
];

export function drawSouthIndianChart(doc: Doc, o: ChartDrawOptions): void {
  const { x, y, size } = o;
  const cell = size / 4;

  doc.save();
  doc.rect(x, y, size, size).fill(COLOR.white);

  // Sign → house, so planets can be looked up by the house they occupy.
  const houseOfSign = new Map<number, number>();
  o.houseSigns.forEach((s, i) => houseOfSign.set(s, i + 1));

  for (const c of SOUTH_CELLS) {
    const cx = x + c.col * cell;
    const cy = y + c.row * cell;
    const isAsc = c.sign === o.ascendantSign;

    doc.rect(cx, cy, cell, cell).fill(isAsc ? COLOR.violetSoft : COLOR.white);
    doc.rect(cx, cy, cell, cell).lineWidth(0.7).stroke(COLOR.line);
    if (isAsc) {
      // The traditional ascendant mark: a stroke across the cell's top-left.
      doc.lineWidth(1).moveTo(cx, cy).lineTo(cx + cell * 0.30, cy).stroke(COLOR.violet);
      doc.lineWidth(1).moveTo(cx, cy).lineTo(cx, cy + cell * 0.30).stroke(COLOR.violet);
    }

    const house = houseOfSign.get(c.sign);
    drawCellContents(
      doc,
      cx + cell / 2,
      cy + cell / 2,
      c.sign + 1,
      house ? o.byHouse.get(house) ?? [] : [],
      { fontRegular: o.fontRegular, fontBold: o.fontBold, size },
    );
  }

  // Outer frame drawn last so it sits above the cell strokes.
  doc.rect(x, y, size, size).lineWidth(1.1).stroke(COLOR.violet);
  doc.restore();
}
