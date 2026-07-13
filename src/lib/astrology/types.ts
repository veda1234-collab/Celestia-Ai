/**
 * Domain types for the Celestia astrology engine.
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

export interface DashaPeriod {
  lord: PlanetId;
  startISO: string;
  endISO: string;
  years: number;
  sub?: DashaPeriod[];
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
  dasha: {
    sequence: DashaPeriod[];
    current: { maha: DashaPeriod; antar: DashaPeriod | null };
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
