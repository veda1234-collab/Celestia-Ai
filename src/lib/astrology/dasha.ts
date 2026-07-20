import type {
  DashaAssessment,
  DashaLevel,
  DashaPeriod,
  DashaQuality,
  DashaWindow,
  PlanetId,
  PlanetPosition,
} from './types';
import { DASHA_ORDER, VIMSHOTTARI_YEARS, dignityOf, signLord } from './signs';

const YEAR_MS = 365.2425 * 86400000;
const NAK_SPAN = 360 / 27; // 13°20'
/** How far ahead the highlighted daśā windows look — a horizon the native can plan against. */
const WINDOW_HORIZON_YEARS = 30;

const addYears = (from: Date, years: number): Date => new Date(from.getTime() + years * YEAR_MS);
const parse = (iso: string): Date => new Date(Date.parse(iso));

/** Nine proportional sub-periods of a parent daśā, starting from the parent's lord. */
function buildSubPeriods(level: DashaLevel, parentLord: PlanetId, start: Date, parentYears: number): DashaPeriod[] {
  const startIdx = DASHA_ORDER.indexOf(parentLord);
  const periods: DashaPeriod[] = [];
  let cursor = new Date(start.getTime());
  for (let step = 0; step < 9; step++) {
    const lord = DASHA_ORDER[(startIdx + step) % 9]!;
    const years = (parentYears * VIMSHOTTARI_YEARS[lord]) / 120;
    const end = addYears(cursor, years);
    periods.push({ lord, level, startISO: cursor.toISOString(), endISO: end.toISOString(), years: Number(years.toFixed(4)) });
    cursor = end;
  }
  return periods;
}

function makeMaha(lord: PlanetId, start: Date, end: Date, years: number): DashaPeriod {
  return {
    lord,
    level: 1,
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    years: Number(years.toFixed(3)),
    sub: buildSubPeriods(2, lord, start, years),
  };
}

function findActive(periods: DashaPeriod[], now: Date): DashaPeriod | null {
  const t = now.getTime();
  for (const p of periods) {
    if (t >= Date.parse(p.startISO) && t < Date.parse(p.endISO)) return p;
  }
  return null;
}

/** Stamp favourability/quality onto every period (recursively) from the lord assessments. */
function annotate(periods: DashaPeriod[], assess?: Record<PlanetId, DashaAssessment>): void {
  if (!assess) return;
  for (const p of periods) {
    const a = assess[p.lord];
    if (a) {
      p.favorability = a.score;
      p.quality = a.quality;
    }
    if (p.sub) annotate(p.sub, assess);
  }
}

const KENDRA = [4, 7, 10];
const TRIKONA = [5, 9];
const DUSTHANA = [6, 8, 12];

/** Natural benefic/malefic used for daśā-lord temperament. */
const NATURE: Record<PlanetId, 'benefic' | 'malefic'> = {
  Jupiter: 'benefic', Venus: 'benefic', Mercury: 'benefic', Moon: 'benefic',
  Sun: 'malefic', Mars: 'malefic', Saturn: 'malefic', Rahu: 'malefic', Ketu: 'malefic',
};

/**
 * Score each of the nine daśā lords 0–100 with human-readable reasons, combining
 * Vimśopaka strength, natural temperament, functional lordship from the lagna
 * (yogakāraka / trikoṇa / kendra / duḥsthāna), and rāśi dignity/placement.
 */
export function assessDashaLords(
  planets: PlanetPosition[],
  ascSign: number,
  vimshopaka: Record<PlanetId, number>,
): Record<PlanetId, DashaAssessment> {
  const housesRuledBy = (lord: PlanetId): number[] => {
    const hs: number[] = [];
    for (let h = 1; h <= 12; h++) if (signLord((ascSign + h - 1) % 12) === lord) hs.push(h);
    return hs;
  };

  const out = {} as Record<PlanetId, DashaAssessment>;
  for (const lord of DASHA_ORDER) {
    const p = planets.find((x) => x.id === lord);
    const base = vimshopaka[lord] ?? 50;
    const reasons: string[] = [`Vimśopaka strength ${base}/100`];
    let score = base;

    if (NATURE[lord] === 'benefic') { score += 8; reasons.push('natural benefic'); }
    else { score -= 6; reasons.push('natural malefic'); }

    const hs = housesRuledBy(lord);
    const rulesKendra = hs.some((h) => KENDRA.includes(h));
    const rulesTrikona = hs.some((h) => TRIKONA.includes(h));
    const rulesLagna = hs.includes(1);
    const rulesDusthana = hs.some((h) => DUSTHANA.includes(h));

    if (rulesKendra && rulesTrikona) { score += 15; reasons.push(`yogakāraka (rules houses ${hs.join(', ')})`); }
    else if (rulesTrikona) { score += 10; reasons.push(`trikoṇa lord (house ${hs.filter((h) => TRIKONA.includes(h)).join(', ')})`); }
    else if (rulesLagna) { score += 6; reasons.push('lagna lord'); }
    else if (rulesKendra) { score += 5; reasons.push(`kendra lord (house ${hs.filter((h) => KENDRA.includes(h)).join(', ')})`); }
    if (rulesDusthana && !(rulesKendra && rulesTrikona)) {
      score -= 10;
      reasons.push(`also rules duḥsthāna (house ${hs.filter((h) => DUSTHANA.includes(h)).join(', ')})`);
    }

    if (p) {
      if (p.dignity === 'exalted') { score += 8; reasons.push('exalted in rāśi'); }
      else if (p.dignity === 'own') { score += 6; reasons.push('in own sign'); }
      else if (p.dignity === 'debilitated') { score -= 12; reasons.push('debilitated in rāśi'); }
      else if (p.dignity === 'enemy') { score -= 5; reasons.push("in enemy's sign"); }
      if (DUSTHANA.includes(p.house)) { score -= 6; reasons.push(`placed in duḥsthāna (house ${p.house})`); }
    }

    score = Math.max(0, Math.min(100, Math.round(score)));
    const quality: DashaQuality = score >= 58 ? 'good' : score >= 42 ? 'mixed' : 'challenging';
    out[lord] = { lord, score, quality, reasons };
  }
  return out;
}

export interface VimshottariResult {
  sequence: DashaPeriod[];
  current: {
    maha: DashaPeriod;
    antar: DashaPeriod | null;
    pratyantar: DashaPeriod | null;
    sookshma: DashaPeriod | null;
  };
  stack: DashaPeriod[];
  assessments: Record<PlanetId, DashaAssessment>;
  favorablePeriods: DashaWindow[];
  challengingPeriods: DashaWindow[];
  balanceAtBirthYears: number;
}

/**
 * Build the Vimśottari daśā from the Moon's sidereal longitude: the full ~120-year
 * mahā→antar timeline, the currently-running mahā→antar→pratyantar→sūkṣma stack
 * (the current branch is drilled four levels deep), plus favourability scoring and
 * the most favourable / most challenging upcoming windows.
 */
export function computeVimshottari(
  moonSiderealLon: number,
  birth: Date,
  now: Date,
  assess?: Record<PlanetId, DashaAssessment>,
): VimshottariResult {
  const lon = ((moonSiderealLon % 360) + 360) % 360;
  const nakIndex = Math.floor(lon / NAK_SPAN); // 0–26
  const fractionElapsed = (lon - nakIndex * NAK_SPAN) / NAK_SPAN;

  const startLordIndex = nakIndex % 9;
  const firstLord = DASHA_ORDER[startLordIndex]!;
  const balanceYears = VIMSHOTTARI_YEARS[firstLord] * (1 - fractionElapsed);

  const sequence: DashaPeriod[] = [];
  let cursor = new Date(birth.getTime());
  const endFirst = addYears(cursor, balanceYears);
  sequence.push(makeMaha(firstLord, cursor, endFirst, balanceYears));
  cursor = endFirst;
  for (let step = 1; step < 9; step++) {
    const lord = DASHA_ORDER[(startLordIndex + step) % 9]!;
    const years = VIMSHOTTARI_YEARS[lord];
    const end = addYears(cursor, years);
    sequence.push(makeMaha(lord, cursor, end, years));
    cursor = end;
  }

  annotate(sequence, assess);

  const maha = findActive(sequence, now) ?? sequence[0]!;
  const antar = findActive(maha.sub ?? [], now);

  // Drill the current branch down to pratyantar and sūkṣma.
  let pratyantar: DashaPeriod | null = null;
  let sookshma: DashaPeriod | null = null;
  if (antar) {
    antar.sub = buildSubPeriods(3, antar.lord, parse(antar.startISO), antar.years);
    annotate(antar.sub, assess);
    pratyantar = findActive(antar.sub, now);
    if (pratyantar) {
      pratyantar.sub = buildSubPeriods(4, pratyantar.lord, parse(pratyantar.startISO), pratyantar.years);
      annotate(pratyantar.sub, assess);
      sookshma = findActive(pratyantar.sub, now);
    }
  }

  const stack = [maha, antar, pratyantar, sookshma].filter((p): p is DashaPeriod => p != null);

  // Favourable / challenging upcoming windows at antar granularity. An antardaśā
  // delivers the antar lord's results filtered through the mahā lord's, so the
  // window is scored from both — otherwise every Jupiter antar ties at one value
  // and the ranking degenerates into "whichever comes last".
  const nowMs = now.getTime();
  const horizonMs = nowMs + WINDOW_HORIZON_YEARS * YEAR_MS;
  const windows: DashaWindow[] = sequence
    .flatMap((m) => (m.sub ?? []).map((a) => {
      const antarScore = a.favorability ?? 50;
      const mahaScore = m.favorability ?? 50;
      const score = Math.round(0.65 * antarScore + 0.35 * mahaScore);
      return {
        lord: a.lord,
        mahaLord: m.lord,
        startISO: a.startISO,
        endISO: a.endISO,
        score,
        quality: (score >= 58 ? 'good' : score >= 42 ? 'mixed' : 'challenging') as DashaQuality,
      };
    }))
    // Only windows that are still running or ahead, and inside a horizon a living
    // native can actually act on — the raw sequence runs 120 years from birth.
    .filter((w) => Date.parse(w.endISO) >= nowMs && Date.parse(w.startISO) <= horizonMs);

  const byDate = (x: DashaWindow, y: DashaWindow) => Date.parse(x.startISO) - Date.parse(y.startISO);
  const favorablePeriods = windows
    .filter((w) => w.quality === 'good')
    .sort((x, y) => y.score - x.score)
    .slice(0, 6)
    .sort(byDate);
  const challengingPeriods = windows
    .filter((w) => w.quality === 'challenging')
    .sort((x, y) => x.score - y.score)
    .slice(0, 6)
    .sort(byDate);

  return {
    sequence,
    current: { maha, antar, pratyantar, sookshma },
    stack,
    assessments: assess ?? ({} as Record<PlanetId, DashaAssessment>),
    favorablePeriods,
    challengingPeriods,
    balanceAtBirthYears: balanceYears,
  };
}
