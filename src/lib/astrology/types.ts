/**
 * Domain types for the Vedastra astrology engine.
 * These are provider-agnostic: any calculation backend (local math engine,
 * Swiss Ephemeris service, third-party API) must produce a `BirthChart`.
 */

export type Gender = 'male' | 'female' | 'other' | 'prefer_not';

/** Sidereal (Vedic) vs Tropical (Western). */
export type ZodiacSystem = 'vedic' | 'western';

export type PlanetId =
  | 'Sun'
  | 'Moon'
  | 'Mercury'
  | 'Venus'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Rahu'
  | 'Ketu';

export type Dignity =
  | 'exalted'
  | 'debilitated'
  | 'own'
  | 'friend'
  | 'neutral'
  | 'enemy';

export interface PlaceResult {
  id: string;
  /** Human-readable label, e.g. "Mumbai, Maharashtra, India". */
  name: string;
  city?: string;
  region?: string;
  country: string;
  countryCode?: string;
  lat: number;
  lon: number;
  /** IANA time zone, e.g. "Asia/Kolkata". */
  timezone: string;
}

export interface BirthDetails {
  fullName: string;
  gender: Gender;
  /** Local civil date at the birthplace, YYYY-MM-DD. */
  date: string;
  /** Local civil time at the birthplace, HH:mm (24h). */
  time: string;
  place: PlaceResult;
  currentLocation?: PlaceResult | null;
  email?: string | null;
  /** BCP-47 language tag, e.g. "en". */
  language: string;
  /** Which zodiac to compute in. Defaults to vedic. */
  system?: ZodiacSystem;
}

export interface PlanetPosition {
  id: PlanetId;
  /** Ecliptic longitude 0–360 (sidereal for vedic, tropical for western). */
  longitude: number;
  sign: number; // 0–11
  signName: string;
  degreeInSign: number; // 0–30
  nakshatra: string;
  nakshatraIndex: number; // 0–26
  pada: number; // 1–4
  house: number; // 1–12 (whole-sign from ascendant)
  retrograde: boolean;
  dignity: Dignity;
  /** Heuristic 0–100 strength (Shadbala-lite). */
  strength: number;
}

export interface HouseCusp {
  house: number; // 1–12
  sign: number; // 0–11
  signName: string;
  lord: PlanetId;
  planets: PlanetId[];
}

/** 1 = mahā, 2 = antar, 3 = pratyantar, 4 = sūkṣma. */
export type DashaLevel = 1 | 2 | 3 | 4;
export type DashaQuality = 'good' | 'mixed' | 'challenging';

export interface DashaPeriod {
  lord: PlanetId;
  level: DashaLevel;
  startISO: string;
  endISO: string;
  years: number;
  /** 0–100 favourability of this period's lord (see DashaAssessment). */
  favorability?: number;
  quality?: DashaQuality;
  sub?: DashaPeriod[];
}

/** Explainable scoring of a daśā lord: score, verdict and the reasons why. */
export interface DashaAssessment {
  lord: PlanetId;
  score: number; // 0–100
  quality: DashaQuality;
  reasons: string[];
}

/** A concrete upcoming (antar-level) window, tagged good/challenging. */
export interface DashaWindow {
  lord: PlanetId;
  mahaLord: PlanetId;
  startISO: string;
  endISO: string;
  score: number;
  quality: DashaQuality;
}

export interface Yoga {
  name: string;
  description: string;
  planets: PlanetId[];
  auspicious: boolean;
}

export interface Dosha {
  name: string;
  present: boolean;
  description: string;
  severity: 'none' | 'low' | 'moderate' | 'high';
}

export interface Ascendant {
  longitude: number;
  sign: number;
  signName: string;
  degreeInSign: number;
  nakshatra: string;
  pada: number;
  lord: PlanetId;
}

export interface NavamsaChart {
  ascendantSign: number;
  ascendantSignName: string;
  positions: { id: PlanetId; sign: number; signName: string }[];
}

/** The twenty divisional (varga) charts surfaced by the engine. */
export type VargaId =
  | 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | 'D8' | 'D9' | 'D10'
  | 'D11' | 'D12' | 'D16' | 'D20' | 'D24' | 'D27' | 'D30' | 'D40' | 'D45' | 'D60';

/** A single planet's placement within one divisional chart. */
export interface VargaPlanet {
  id: PlanetId;
  sign: number; // 0–11 in the varga
  signName: string;
  /** Whole-sign house counted from the varga lagna. */
  house: number; // 1–12
  /** Dignity evaluated in the varga sign. */
  dignity: Dignity;
  /** Carried from the rāśi chart (a varga does not change direction). */
  retrograde: boolean;
  /** True when the varga sign equals the planet's rāśi (D1) sign. */
  vargottama: boolean;
  /** Natural benefic (true) vs malefic (false). */
  benefic: boolean;
}

/** One complete divisional chart: varga lagna + all nine grahas within it. */
export interface VargaChart {
  id: VargaId;
  /** Number of divisions per sign (e.g. 9 for D9). */
  divisions: number;
  /** Sanskrit name, e.g. "Navāṁśa". */
  name: string;
  /** What this varga is classically read for, e.g. "marriage, dharma, fortune". */
  purpose: string;
  /** True for the classical Parāśari vargas; false for the cyclic-scheme ones. */
  classical: boolean;
  ascendant: { sign: number; signName: string };
  planets: VargaPlanet[];
  benefics: PlanetId[];
  malefics: PlanetId[];
  vargottamaPlanets: PlanetId[];
  /** Aggregate 0–100 strength of the chart (dignity + placement). */
  strength: number;
}

export interface ChartMeta {
  system: ZodiacSystem;
  ayanamsa: number;
  julianDayUT: number;
  utcISO: string;
  localISO: string;
  tzOffsetMinutes: number;
  provider: string;
  generatedAtISO: string;
  lat: number;
  lon: number;
  timezone: string;
  name: string;
}

export interface BirthChart {
  meta: ChartMeta;
  ascendant: Ascendant;
  /** Both frames surfaced so users always see a familiar Sun sign. */
  sunSign: { sidereal: string; tropical: string };
  moonSign: string;
  nakshatra: { name: string; index: number; pada: number; lord: PlanetId };
  planets: PlanetPosition[];
  houses: HouseCusp[];
  navamsa: NavamsaChart;
  /** All twenty divisional charts (D1–D60), computed from sidereal longitudes. */
  vargas: VargaChart[];
  /** Vimśopaka bala 0–100 per planet — strength across the ṣoḍaśavarga (16 charts). */
  vimshopaka: Record<PlanetId, number>;
  dasha: {
    sequence: DashaPeriod[];
    current: {
      maha: DashaPeriod;
      antar: DashaPeriod | null;
      pratyantar: DashaPeriod | null;
      sookshma: DashaPeriod | null;
    };
    /** The active mahā→antar→pratyantar→sūkṣma stack, outermost first. */
    stack: DashaPeriod[];
    /** Per-lord favourability with human-readable reasons. */
    assessments: Record<PlanetId, DashaAssessment>;
    favorablePeriods: DashaWindow[];
    challengingPeriods: DashaWindow[];
    balanceAtBirthYears: number;
  };
  yogas: Yoga[];
  doshas: Dosha[];
  /** Short, human-readable one-paragraph summary. */
  summary: string;
}

/**
 * The swappable calculation contract. Implement this to plug in a different
 * provider (e.g. a Swiss Ephemeris microservice) without touching the UI.
 */
export interface AstrologyEngine {
  readonly name: string;
  computeChart(details: BirthDetails, now?: Date): BirthChart;
}
