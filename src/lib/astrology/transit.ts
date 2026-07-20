/**
 * Gochar (transit) engine.
 *
 * Transits are judged the classical way — primarily from the natal Moon
 * (Chandra lagna), with the benefic/malefic house table for each graha and the
 * vedha (obstruction) rules that cancel a result when a partner house is
 * occupied. Saturn's Sāḍe Sātī and the 2½-year dhaiyas are timed from real
 * ingress instants found by bisecting sign boundaries, not from averages.
 *
 * Nothing here is cached into `BirthChart`: transits change by the hour, so a
 * report is computed fresh for a given moment from the natal context.
 */

import type { BirthChart, Dignity, PlanetId } from './types';
import {
  ayanamsaLahiri,
  bodyLongitude,
  julianDayFromDate,
  norm360,
} from './astronomy';
import { NAKSHATRAS, PLANET_ORDER, dignityOf, signName } from './signs';

const NAK_SPAN = 360 / 27;
const PADA_SPAN = NAK_SPAN / 4;
const DAY_MS = 86400000;

/** English ordinal for the aspect labels — 1st, 2nd, 3rd, 4th … */
function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

/** House (1–12) of `sign` counted from `baseSign`, whole-sign. */
const houseFrom = (baseSign: number, sign: number): number => (((sign - baseSign) % 12) + 12) % 12 + 1;

/** Sidereal (Lahiri) longitude of a body at a Julian Day. */
export function siderealLongitude(id: PlanetId, jd: number): number {
  return norm360(bodyLongitude(id, jd) - ayanamsaLahiri(jd));
}

const signAt = (id: PlanetId, jd: number): number => Math.floor(siderealLongitude(id, jd) / 30);

function isRetrograde(id: PlanetId, jd: number): boolean {
  if (id === 'Rahu' || id === 'Ketu') return true;
  if (id === 'Sun' || id === 'Moon') return false;
  const now = bodyLongitude(id, jd);
  const next = bodyLongitude(id, jd + 1);
  return ((next - now + 540) % 360) - 180 < 0;
}

// ── Classical gochar tables ─────────────────────────────────────────────────

/** Houses from the natal Moon in which each graha's transit gives good results. */
const BENEFIC_HOUSES: Record<PlanetId, number[]> = {
  Sun: [3, 6, 10, 11],
  Moon: [1, 3, 6, 7, 10, 11],
  Mars: [3, 6, 11],
  Mercury: [2, 4, 6, 8, 10, 11],
  Jupiter: [2, 5, 7, 9, 11],
  Venus: [1, 2, 3, 4, 5, 8, 9, 11, 12],
  Saturn: [3, 6, 11],
  Rahu: [3, 6, 11],
  Ketu: [3, 6, 11],
};

/**
 * Vedha (obstruction) pairs per graha. Vedha is mutual: a graha occupying one
 * house of a pair cancels the result of a graha in the other. Venus's table is
 * the one the classical sources disagree most about, so a house may carry more
 * than one partner — any occupied partner obstructs.
 */
const VEDHA_PAIRS: Record<PlanetId, [number, number][]> = {
  Sun: [[3, 9], [6, 12], [10, 4], [11, 5]],
  Moon: [[1, 5], [3, 9], [6, 12], [7, 2], [10, 4], [11, 8]],
  Mars: [[3, 12], [6, 9], [11, 5]],
  Mercury: [[2, 5], [4, 3], [6, 9], [8, 1], [10, 7], [11, 12]],
  Jupiter: [[2, 12], [5, 4], [7, 3], [9, 10], [11, 8]],
  Venus: [[1, 8], [2, 7], [3, 1], [4, 10], [5, 9], [8, 5], [9, 11], [11, 6], [12, 3]],
  Saturn: [[3, 12], [6, 9], [11, 5]],
  Rahu: [[3, 12], [6, 9], [11, 5]],
  Ketu: [[3, 12], [6, 9], [11, 5]],
};

/** Pairs that never obstruct each other, by classical exception. */
const VEDHA_EXEMPT: [PlanetId, PlanetId][] = [
  ['Sun', 'Saturn'],
  ['Moon', 'Mercury'],
];

function vedhaPartners(planet: PlanetId, house: number): number[] {
  const out: number[] = [];
  for (const [a, b] of VEDHA_PAIRS[planet]) {
    if (a === house) out.push(b);
    if (b === house) out.push(a);
  }
  return out;
}

const isExempt = (a: PlanetId, b: PlanetId): boolean =>
  VEDHA_EXEMPT.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

/** Whole-sign graha dṛṣṭi: every graha sees the 7th, plus its special aspects. */
const SPECIAL_ASPECTS: Partial<Record<PlanetId, number[]>> = {
  Mars: [4, 8],
  Jupiter: [5, 9],
  Saturn: [3, 10],
  // Rāhu/Ketu aspecting 5/9 follows the widely-taught convention; not in BPHS.
  Rahu: [5, 9],
  Ketu: [5, 9],
};

/** The nine tārās counted from the natal Moon's nakshatra. */
const TARAS = [
  { name: 'Janma', meaning: 'the birth star — guard your body and energy', good: false },
  { name: 'Sampat', meaning: 'wealth and gain', good: true },
  { name: 'Vipat', meaning: 'obstacles; avoid new beginnings', good: false },
  { name: 'Kshema', meaning: 'well-being and prosperity', good: true },
  { name: 'Pratyari', meaning: 'opposition; expect friction', good: false },
  { name: 'Sadhaka', meaning: 'accomplishment — good for effort', good: true },
  { name: 'Vadha', meaning: 'the most difficult tārā; postpone what matters', good: false },
  { name: 'Mitra', meaning: 'friendly and supportive', good: true },
  { name: 'Ati-Mitra', meaning: 'the most auspicious tārā', good: true },
] as const;

// ── Types ───────────────────────────────────────────────────────────────────

export type TransitEffect = 'favourable' | 'obstructed' | 'challenging' | 'neutral';

export interface TransitPosition {
  id: PlanetId;
  longitude: number;
  sign: number;
  signName: string;
  degreeInSign: number;
  nakshatra: string;
  pada: number;
  retrograde: boolean;
  dignity: Dignity;
  /** House counted from the natal ascendant. */
  houseFromLagna: number;
  /** House counted from the natal Moon — the seat of gochar judgement. */
  houseFromMoon: number;
  effect: TransitEffect;
  /** The graha whose placement cancels this result, if any. */
  vedhaBy: PlanetId | null;
  /**
   * True when the obstruction comes from a fast graha, so it lifts within days
   * — as opposed to a vedha from Jupiter/Saturn/the nodes that holds for months.
   */
  vedhaTransient: boolean;
  note: string;
}

export interface TransitAspect {
  from: PlanetId;
  to: PlanetId | 'Ascendant';
  /** Which aspect it is, counted in houses from the transiting graha. */
  houses: number;
  kind: 'conjunction' | 'opposition' | 'special';
  nature: 'benefic' | 'malefic';
  description: string;
}

export interface SignPeriod {
  sign: number;
  signName: string;
  startISO: string;
  endISO: string;
}

export interface SadeSatiPhase {
  phase: 'rising' | 'peak' | 'setting';
  sign: number;
  signName: string;
  startISO: string;
  endISO: string;
  description: string;
}

export interface SadeSatiStatus {
  active: boolean;
  /** The phase running now, or null when Sāḍe Sātī is not currently on. */
  currentPhase: SadeSatiPhase['phase'] | null;
  startISO: string | null;
  endISO: string | null;
  /** The canonical three dhaiyas, each a single span. */
  phases: SadeSatiPhase[];
  /**
   * Saturn's actual sign-by-sign occupancy across the period. Retrogression
   * makes it re-enter signs, so this is longer than `phases` and is the honest
   * record behind the tidy three-phase summary.
   */
  segments: SadeSatiPhase[];
  /** True when `startISO`/`endISO` describe the next occurrence, not a live one. */
  upcoming: boolean;
  description: string;
}

export interface SaturnDhaiya {
  active: boolean;
  type: 'kantaka' | 'ashtama' | null;
  startISO: string | null;
  endISO: string | null;
  description: string;
}

export interface Ingress {
  id: PlanetId;
  fromSign: number;
  fromSignName: string;
  toSign: number;
  toSignName: string;
  dateISO: string;
  houseFromMoon: number;
  effect: TransitEffect;
}

export interface TaraBala {
  index: number;
  name: string;
  meaning: string;
  favourable: boolean;
  nakshatra: string;
}

export interface TransitReport {
  atISO: string;
  positions: TransitPosition[];
  aspects: TransitAspect[];
  sadeSati: SadeSatiStatus;
  dhaiya: SaturnDhaiya;
  taraBala: TaraBala;
  upcomingIngresses: Ingress[];
  /** 0–100 climate score for the moment, weighted toward the slow grahas. */
  score: number;
  headline: string;
  highlights: string[];
}

/** The natal reference points a transit reading is measured against. */
export interface NatalContext {
  moonSign: number;
  moonNakshatraIndex: number;
  ascSign: number;
  /** Natal sidereal sign of each graha, for transit-to-natal aspects. */
  planetSigns: Record<PlanetId, number>;
}

/**
 * Derive the natal reference frame from a computed chart. Longitudes are stored
 * in the chart's display zodiac, so a tropical chart is shifted back to sidereal
 * — gochar is only meaningful against the sidereal frame.
 */
export function natalContextFromChart(chart: BirthChart): NatalContext {
  // A chart arriving over the wire can be missing `meta` fields; silently
  // shifting by NaN would poison every house number downstream, so fail loudly.
  const ayanamsa = chart.meta?.ayanamsa;
  if (chart.meta?.system !== 'vedic' && !Number.isFinite(ayanamsa)) {
    throw new Error('natalContextFromChart: chart.meta.ayanamsa is required to reduce a tropical chart to sidereal');
  }
  const shift = chart.meta?.system === 'vedic' ? 0 : ayanamsa;
  const sidSign = (displayLon: number) => Math.floor(norm360(displayLon - shift) / 30);

  const planetSigns = {} as Record<PlanetId, number>;
  for (const p of chart.planets) planetSigns[p.id] = sidSign(p.longitude);

  const moon = chart.planets.find((p) => p.id === 'Moon');
  return {
    moonSign: moon ? sidSign(moon.longitude) : 0,
    moonNakshatraIndex: chart.nakshatra.index,
    ascSign: sidSign(chart.ascendant.longitude),
    planetSigns,
  };
}

// ── Sign-boundary search ────────────────────────────────────────────────────

/** Coarse scan step per graha (days) — small enough never to skip a whole sign. */
const SCAN_STEP_DAYS: Record<PlanetId, number> = {
  Moon: 0.2, Mercury: 0.5, Venus: 0.5, Sun: 0.5,
  Mars: 1, Jupiter: 2, Saturn: 2, Rahu: 2, Ketu: 2,
};

/**
 * Bisect between two instants known to straddle a sign change, to ~1 minute.
 */
function refineBoundary(id: PlanetId, beforeMs: number, afterMs: number, signBefore: number): number {
  let lo = beforeMs;
  let hi = afterMs;
  while (hi - lo > 60000) {
    const mid = (lo + hi) / 2;
    if (signAt(id, julianDayFromDate(new Date(mid))) === signBefore) lo = mid;
    else hi = mid;
  }
  return hi;
}

/**
 * The sequence of signs a graha occupies across a window, with real entry/exit
 * instants. Retrograde re-entry naturally shows up as repeated sign periods.
 */
export function signPeriods(id: PlanetId, from: Date, to: Date): SignPeriod[] {
  const stepMs = (SCAN_STEP_DAYS[id] ?? 1) * DAY_MS;
  const endMs = to.getTime();
  const periods: SignPeriod[] = [];

  let prevMs = from.getTime();
  let prevSign = signAt(id, julianDayFromDate(from));
  let periodStartMs = prevMs;

  for (let t = prevMs + stepMs; t <= endMs; t += stepMs) {
    const sign = signAt(id, julianDayFromDate(new Date(t)));
    if (sign !== prevSign) {
      const boundary = refineBoundary(id, prevMs, t, prevSign);
      periods.push({
        sign: prevSign,
        signName: signName(prevSign),
        startISO: new Date(periodStartMs).toISOString(),
        endISO: new Date(boundary).toISOString(),
      });
      periodStartMs = boundary;
      prevSign = sign;
    }
    prevMs = t;
  }

  periods.push({
    sign: prevSign,
    signName: signName(prevSign),
    startISO: new Date(periodStartMs).toISOString(),
    endISO: new Date(endMs).toISOString(),
  });
  return periods;
}

// ── Sāḍe Sātī & dhaiya ──────────────────────────────────────────────────────

const PHASE_TEXT: Record<SadeSatiPhase['phase'], string> = {
  rising: 'Saturn in the 12th from your Moon — the first dhaiya. Expenses, sleep and letting-go dominate; endings clear the ground.',
  peak: 'Saturn over your Moon — the middle and heaviest dhaiya. Mind, health and identity are under review; discipline is the way through.',
  setting: 'Saturn in the 2nd from your Moon — the closing dhaiya. Family, speech and finances consolidate as the weight lifts.',
};

const PHASE_FOR_OFFSET: Record<number, SadeSatiPhase['phase']> = { 12: 'rising', 1: 'peak', 2: 'setting' };

function computeSadeSati(moonSign: number, now: Date): SadeSatiStatus {
  // One Saturn return is ~29.5 years, so a ±33-year window always contains the
  // Sāḍe Sātī surrounding or following this moment.
  const from = new Date(now.getTime() - 33 * 365.25 * DAY_MS);
  const to = new Date(now.getTime() + 33 * 365.25 * DAY_MS);
  const periods = signPeriods('Saturn', from, to);

  const involved = new Map<number, SadeSatiPhase['phase']>([
    [(moonSign + 11) % 12, 'rising'],
    [moonSign, 'peak'],
    [(moonSign + 1) % 12, 'setting'],
  ]);

  // Group consecutive periods that fall in the three signs into occurrences.
  const runs: SadeSatiPhase[][] = [];
  let run: SadeSatiPhase[] = [];
  for (const p of periods) {
    const phase = involved.get(p.sign);
    if (phase) {
      run.push({ phase, sign: p.sign, signName: p.signName, startISO: p.startISO, endISO: p.endISO, description: PHASE_TEXT[phase] });
    } else if (run.length) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length) runs.push(run);

  // Saturn retrograding back out of the 12th (or on out of the 2nd) briefly
  // leaves the three signs and would otherwise split one Sāḍe Sātī into
  // fragments — losing the true start date. Excursions last at most ~5 months,
  // while separate occurrences are ~30 years apart, so bridging short gaps is
  // unambiguous.
  const MAX_EXCURSION_MS = 250 * DAY_MS;
  const merged: SadeSatiPhase[][] = [];
  for (const r of runs) {
    const prev = merged[merged.length - 1];
    if (prev && Date.parse(r[0]!.startISO) - Date.parse(prev[prev.length - 1]!.endISO) <= MAX_EXCURSION_MS) {
      prev.push(...r);
    } else {
      merged.push([...r]);
    }
  }

  // Only a run that actually carries Saturn over the Moon is a full Sāḍe Sātī;
  // a lone 12th- or 2nd-house run at the window edge is a truncated artefact.
  const full = merged.filter((r) => r.some((p) => p.phase === 'peak'));
  const nowMs = now.getTime();
  const current = full.find((r) => nowMs >= Date.parse(r[0]!.startISO) && nowMs < Date.parse(r[r.length - 1]!.endISO));
  const next = full.find((r) => Date.parse(r[0]!.startISO) > nowMs);
  const chosen = current ?? next;

  if (!chosen) {
    return {
      active: false, currentPhase: null, startISO: null, endISO: null, phases: [], segments: [],
      upcoming: false,
      description: 'Sāḍe Sātī is not running, and no occurrence falls inside the searched window.',
    };
  }

  const startISO = chosen[0]!.startISO;
  const endISO = chosen[chosen.length - 1]!.endISO;

  // Collapse the retrograde wobble into the three classical dhaiyas: each phase
  // runs from its first appearance to the start of the next, so the summary
  // reads rising → peak → setting rather than oscillating between them.
  const ORDER: SadeSatiPhase['phase'][] = ['rising', 'peak', 'setting'];
  const firstStart = new Map<SadeSatiPhase['phase'], string>();
  for (const seg of chosen) if (!firstStart.has(seg.phase)) firstStart.set(seg.phase, seg.startISO);

  const present = ORDER.filter((p) => firstStart.has(p));
  const phases: SadeSatiPhase[] = present.map((phase, i) => {
    const next = present[i + 1];
    const spanEnd = next ? firstStart.get(next)! : endISO;
    const sign = chosen.find((s) => s.phase === phase)!.sign;
    return {
      phase,
      sign,
      signName: signName(sign),
      startISO: firstStart.get(phase)!,
      endISO: spanEnd,
      description: PHASE_TEXT[phase],
    };
  });

  const active = Boolean(current);
  const livePhase = active
    ? phases.find((p) => nowMs >= Date.parse(p.startISO) && nowMs < Date.parse(p.endISO))?.phase ?? null
    : null;

  return {
    active,
    currentPhase: livePhase,
    startISO,
    endISO,
    phases,
    segments: chosen,
    upcoming: !active,
    description: active
      ? `Sāḍe Sātī is running (${startISO.slice(0, 10)} → ${endISO.slice(0, 10)}). ${livePhase ? PHASE_TEXT[livePhase] : ''}`
      : `Sāḍe Sātī is not running now; the next one begins ${startISO.slice(0, 10)} and ends ${endISO.slice(0, 10)}.`,
  };
}

function computeDhaiya(moonSign: number, now: Date): SaturnDhaiya {
  const saturnSign = signAt('Saturn', julianDayFromDate(now));
  const house = houseFrom(moonSign, saturnSign);
  if (house !== 4 && house !== 8) {
    return { active: false, type: null, startISO: null, endISO: null, description: 'Neither kaṇṭaka nor aṣṭama śani is running.' };
  }

  // Bound the current occupancy by scanning a window wider than one Saturn sign.
  const from = new Date(now.getTime() - 4 * 365.25 * DAY_MS);
  const to = new Date(now.getTime() + 4 * 365.25 * DAY_MS);
  const nowMs = now.getTime();
  const spans = signPeriods('Saturn', from, to).filter((p) => p.sign === saturnSign);
  const first = spans[0];
  const last = spans[spans.length - 1];

  const type = house === 4 ? 'kantaka' : 'ashtama';
  return {
    active: true,
    type,
    startISO: first?.startISO ?? null,
    endISO: last?.endISO ?? null,
    description:
      type === 'kantaka'
        ? 'Kaṇṭaka (ardha) śani — Saturn in the 4th from your Moon. Home, mother, property and inner peace ask for patient maintenance.'
        : 'Aṣṭama śani — Saturn in the 8th from your Moon. A demanding 2½ years: guard health, avoid risky commitments, let old structures go.',
  };
}

// ── Report ──────────────────────────────────────────────────────────────────

function judge(planet: PlanetId, houseFromMoon: number, occupiedHouses: Map<number, PlanetId[]>): {
  effect: TransitEffect;
  vedhaBy: PlanetId | null;
} {
  const benefic = BENEFIC_HOUSES[planet].includes(houseFromMoon);
  const partners = vedhaPartners(planet, houseFromMoon);

  let blocker: PlanetId | null = null;
  for (const h of partners) {
    for (const other of occupiedHouses.get(h) ?? []) {
      if (other !== planet && !isExempt(planet, other)) { blocker = other; break; }
    }
    if (blocker) break;
  }

  if (benefic) return blocker ? { effect: 'obstructed', vedhaBy: blocker } : { effect: 'favourable', vedhaBy: null };
  // Vedha is mutual, so it relieves a difficult transit just as it cancels a good one.
  return blocker ? { effect: 'neutral', vedhaBy: blocker } : { effect: 'challenging', vedhaBy: null };
}

/** Grahas that clear a house within days, so any vedha they cause is fleeting. */
const FAST_GRAHAS: PlanetId[] = ['Moon', 'Mercury', 'Venus', 'Sun'];

const EFFECT_NOTE: Record<TransitEffect, string> = {
  favourable: 'supportive transit from the Moon',
  obstructed: 'would be supportive, but vedha cancels the result',
  challenging: 'demanding transit from the Moon',
  neutral: 'difficulty relieved by vedha',
};

/** Slow grahas colour years, fast ones only days — weight the climate score accordingly. */
const CLIMATE_WEIGHT: Record<PlanetId, number> = {
  Saturn: 5, Jupiter: 5, Rahu: 3, Ketu: 3, Mars: 2, Sun: 2, Venus: 1, Mercury: 1, Moon: 1,
};

const EFFECT_VALUE: Record<TransitEffect, number> = {
  favourable: 1, neutral: 0.55, obstructed: 0.45, challenging: 0,
};

/**
 * The classical benefic-house lists are lopsided — Saturn is well-placed in only
 * 3 houses of 12, Venus in 9 — so a raw weighted average does not centre on 50
 * and would label an ordinary sky "demanding" for nearly everyone. This is the
 * weighted probability of a favourable transit if every graha sat in a uniformly
 * random house: the statistical neutral the score is calibrated against. Derived
 * from the tables themselves, so it stays correct if they are edited.
 */
const NEUTRAL_BASELINE = (() => {
  let weighted = 0;
  let total = 0;
  for (const id of PLANET_ORDER) {
    const w = CLIMATE_WEIGHT[id];
    weighted += (BENEFIC_HOUSES[id].length / 12) * w;
    total += w;
  }
  return weighted / total;
})();

/** Map a raw 0–1 favourability onto a 0–100 scale where neutral reads 50. */
function calibrate(raw: number): number {
  return raw >= NEUTRAL_BASELINE
    ? 50 + ((raw - NEUTRAL_BASELINE) / (1 - NEUTRAL_BASELINE)) * 50
    : (raw / NEUTRAL_BASELINE) * 50;
}

/** Compute the full gochar report for a moment against a natal frame. */
export function computeTransits(natal: NatalContext, now: Date = new Date()): TransitReport {
  const jd = julianDayFromDate(now);

  // Pass 1 — raw placements, so vedha can see every graha's house.
  const raw = PLANET_ORDER.map((id) => {
    const lon = siderealLongitude(id, jd);
    const sign = Math.floor(lon / 30);
    return { id, lon, sign, houseFromMoon: houseFrom(natal.moonSign, sign) };
  });

  const occupiedHouses = new Map<number, PlanetId[]>();
  for (const r of raw) {
    const list = occupiedHouses.get(r.houseFromMoon) ?? [];
    list.push(r.id);
    occupiedHouses.set(r.houseFromMoon, list);
  }

  // Pass 2 — judged positions.
  const positions: TransitPosition[] = raw.map((r) => {
    const nakIndex = Math.floor(r.lon / NAK_SPAN);
    const { effect, vedhaBy } = judge(r.id, r.houseFromMoon, occupiedHouses);
    return {
      id: r.id,
      longitude: Number(r.lon.toFixed(4)),
      sign: r.sign,
      signName: signName(r.sign),
      degreeInSign: Number((r.lon - r.sign * 30).toFixed(4)),
      nakshatra: NAKSHATRAS[nakIndex]!.name,
      pada: Math.floor((r.lon - nakIndex * NAK_SPAN) / PADA_SPAN) + 1,
      retrograde: isRetrograde(r.id, jd),
      dignity: dignityOf(r.id, r.sign),
      houseFromLagna: houseFrom(natal.ascSign, r.sign),
      houseFromMoon: r.houseFromMoon,
      effect,
      vedhaBy,
      vedhaTransient: vedhaBy ? FAST_GRAHAS.includes(vedhaBy) : false,
      note: vedhaBy
        ? `${EFFECT_NOTE[effect]} (vedha by ${vedhaBy}${FAST_GRAHAS.includes(vedhaBy) ? ', passing within days' : ''})`
        : EFFECT_NOTE[effect],
    };
  });

  // Transit-to-natal dṛṣṭi, whole-sign.
  const NATURAL_BENEFIC: PlanetId[] = ['Jupiter', 'Venus', 'Mercury', 'Moon'];
  const aspects: TransitAspect[] = [];
  const natalTargets: [PlanetId | 'Ascendant', number][] = [
    ...PLANET_ORDER.map((id) => [id, natal.planetSigns[id]] as [PlanetId, number]),
    ['Ascendant', natal.ascSign],
  ];

  for (const t of raw) {
    const casts = [7, ...(SPECIAL_ASPECTS[t.id] ?? [])];
    for (const [target, targetSign] of natalTargets) {
      if (targetSign === undefined) continue;
      const distance = houseFrom(t.sign, targetSign);
      const kind: TransitAspect['kind'] =
        distance === 1 ? 'conjunction' : distance === 7 ? 'opposition' : 'special';
      if (distance !== 1 && !casts.includes(distance)) continue;

      const nature = NATURAL_BENEFIC.includes(t.id) ? 'benefic' : 'malefic';
      const label = target === 'Ascendant' ? 'your ascendant' : `natal ${target}`;
      aspects.push({
        from: t.id,
        to: target,
        houses: distance,
        kind,
        nature,
        description:
          distance === 1
            ? `Transiting ${t.id} is conjunct ${label} in ${signName(targetSign)}.`
            : `Transiting ${t.id} casts its ${ordinal(distance)}-house aspect on ${label} in ${signName(targetSign)}.`,
      });
    }
  }

  // Tārā bala from the transiting Moon.
  const moonRaw = raw.find((r) => r.id === 'Moon')!;
  const transitNak = Math.floor(moonRaw.lon / NAK_SPAN);
  const taraIndex = ((transitNak - natal.moonNakshatraIndex + 27) % 27) % 9;
  const tara = TARAS[taraIndex]!;
  const taraBala: TaraBala = {
    index: taraIndex + 1,
    name: tara.name,
    meaning: tara.meaning,
    favourable: tara.good,
    nakshatra: NAKSHATRAS[transitNak]!.name,
  };

  // Next sign change per graha, within a horizon that can contain one.
  const HORIZON_DAYS: Record<PlanetId, number> = {
    Moon: 3, Mercury: 90, Venus: 90, Sun: 40,
    Mars: 120, Jupiter: 500, Saturn: 1200, Rahu: 700, Ketu: 700,
  };
  const upcomingIngresses: Ingress[] = [];
  for (const r of raw) {
    const horizon = new Date(now.getTime() + (HORIZON_DAYS[r.id] ?? 400) * DAY_MS);
    const periods = signPeriods(r.id, now, horizon);
    // The first period ends at the next boundary; a single period means no change.
    if (periods.length < 2) continue;
    const first = periods[0]!;
    const next = periods[1]!;
    const houseFromMoon = houseFrom(natal.moonSign, next.sign);
    upcomingIngresses.push({
      id: r.id,
      fromSign: first.sign,
      fromSignName: first.signName,
      toSign: next.sign,
      toSignName: next.signName,
      dateISO: first.endISO,
      houseFromMoon,
      effect: BENEFIC_HOUSES[r.id].includes(houseFromMoon) ? 'favourable' : 'challenging',
    });
  }
  upcomingIngresses.sort((a, b) => Date.parse(a.dateISO) - Date.parse(b.dateISO));

  const sadeSati = computeSadeSati(natal.moonSign, now);
  const dhaiya = computeDhaiya(natal.moonSign, now);

  // Weighted climate score.
  let weighted = 0;
  let totalWeight = 0;
  for (const p of positions) {
    const w = CLIMATE_WEIGHT[p.id];
    // The slow grahas carry the season; a fast graha passing through their vedha
    // house should not swing the climate score for a day or two.
    const effect: TransitEffect =
      p.vedhaTransient && w >= 3
        ? BENEFIC_HOUSES[p.id].includes(p.houseFromMoon) ? 'favourable' : 'challenging'
        : p.effect;
    weighted += EFFECT_VALUE[effect] * w;
    totalWeight += w;
  }
  let score = calibrate(weighted / totalWeight);
  if (sadeSati.active) score -= sadeSati.currentPhase === 'peak' ? 12 : 7;
  if (dhaiya.active) score -= 6;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const highlights: string[] = [];
  const slow = positions.filter((p) => p.id === 'Saturn' || p.id === 'Jupiter' || p.id === 'Rahu' || p.id === 'Ketu');
  for (const p of slow) {
    // A slow graha's standing verdict should not read as cancelled because a
    // fast graha is sitting in the vedha house today.
    const standing = p.vedhaTransient
      ? BENEFIC_HOUSES[p.id].includes(p.houseFromMoon) ? 'favourable' : 'challenging'
      : p.effect;
    const aside = p.vedhaTransient ? ` — momentarily veiled by ${p.vedhaBy}` : '';
    highlights.push(
      `${p.id} transits ${p.signName} — house ${p.houseFromMoon} from your Moon (${EFFECT_NOTE[standing]}${aside}).`,
    );
  }
  if (sadeSati.active) highlights.push(sadeSati.description);
  if (dhaiya.active) highlights.push(dhaiya.description);
  const nextBig = upcomingIngresses.find((i) => i.id === 'Jupiter' || i.id === 'Saturn' || i.id === 'Rahu');
  if (nextBig) {
    highlights.push(`${nextBig.id} enters ${nextBig.toSignName} on ${nextBig.dateISO.slice(0, 10)} — house ${nextBig.houseFromMoon} from your Moon.`);
  }

  // Thresholds are the tertiles of the score's own distribution (sampled across
  // all twelve Moon signs over several years), so the three verdicts occur about
  // equally often instead of labelling most skies "demanding".
  const headline =
    score >= 52 ? 'The sky is largely working with you right now.'
      : score >= 33 ? 'A mixed sky — some doors open, others ask for patience.'
        : 'A demanding stretch; consolidate rather than expand.';

  return {
    atISO: now.toISOString(),
    positions,
    aspects,
    sadeSati,
    dhaiya,
    taraBala,
    upcomingIngresses,
    score,
    headline,
    highlights,
  };
}

/** Convenience: compute the current gochar report straight from a birth chart. */
export function transitsForChart(chart: BirthChart, now: Date = new Date()): TransitReport {
  return computeTransits(natalContextFromChart(chart), now);
}
