import type { DashaPeriod, PlanetId } from './types';
import { DASHA_ORDER, VIMSHOTTARI_YEARS } from './signs';

const YEAR_MS = 365.2425 * 86400000;
const NAK_SPAN = 360 / 27; // 13°20'

const addYears = (from: Date, years: number): Date => new Date(from.getTime() + years * YEAR_MS);

/**
 * Build the Vimśottari mahādaśā timeline from the Moon's sidereal longitude.
 * Returns the full ~120-year sequence, the balance of the first daśā, and the
 * currently-running mahā/antar periods relative to `now`.
 */
export function computeVimshottari(
  moonSiderealLon: number,
  birth: Date,
  now: Date,
): {
  sequence: DashaPeriod[];
  balanceAtBirthYears: number;
  current: { maha: DashaPeriod; antar: DashaPeriod | null };
} {
  const lon = ((moonSiderealLon % 360) + 360) % 360;
  const nakIndex = Math.floor(lon / NAK_SPAN); // 0–26
  const posInNak = lon - nakIndex * NAK_SPAN;
  const fractionElapsed = posInNak / NAK_SPAN;

  // Nakshatra lord repeats every 9 nakshatras following DASHA_ORDER.
  const startLordIndex = nakIndex % 9;
  const firstLord = DASHA_ORDER[startLordIndex]!;
  const balanceYears = VIMSHOTTARI_YEARS[firstLord] * (1 - fractionElapsed);

  const sequence: DashaPeriod[] = [];
  let cursor = new Date(birth.getTime());

  // First (partial) mahādaśā.
  let endFirst = addYears(cursor, balanceYears);
  sequence.push(makePeriod(firstLord, cursor, endFirst, balanceYears));
  cursor = endFirst;

  // Following full mahādaśās to cover ~120 years.
  for (let step = 1; step < 9; step++) {
    const lord = DASHA_ORDER[(startLordIndex + step) % 9]!;
    const years = VIMSHOTTARI_YEARS[lord];
    const end = addYears(cursor, years);
    sequence.push(makePeriod(lord, cursor, end, years));
    cursor = end;
  }

  const maha = findActive(sequence, now) ?? sequence[0]!;
  const antar = findActive(maha.sub ?? [], now);

  return { sequence, balanceAtBirthYears: balanceYears, current: { maha, antar } };
}

function makePeriod(lord: PlanetId, start: Date, end: Date, years: number): DashaPeriod {
  return {
    lord,
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    years: Number(years.toFixed(3)),
    sub: buildAntardashas(lord, start, years),
  };
}

/** Antardaśās within a mahādaśā, each proportional to its lord's Vimśottari years. */
function buildAntardashas(mahaLord: PlanetId, start: Date, mahaYears: number): DashaPeriod[] {
  const startIdx = DASHA_ORDER.indexOf(mahaLord);
  const periods: DashaPeriod[] = [];
  let cursor = new Date(start.getTime());
  for (let step = 0; step < 9; step++) {
    const lord = DASHA_ORDER[(startIdx + step) % 9]!;
    const years = (mahaYears * VIMSHOTTARI_YEARS[lord]) / 120;
    const end = addYears(cursor, years);
    periods.push({ lord, startISO: cursor.toISOString(), endISO: end.toISOString(), years: Number(years.toFixed(3)) });
    cursor = end;
  }
  return periods;
}

function findActive(periods: DashaPeriod[], now: Date): DashaPeriod | null {
  const t = now.getTime();
  for (const p of periods) {
    if (t >= Date.parse(p.startISO) && t < Date.parse(p.endISO)) return p;
  }
  return null;
}
