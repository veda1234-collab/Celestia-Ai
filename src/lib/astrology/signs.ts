import type { Dignity, PlanetId } from './types';

export interface SignInfo {
  index: number;
  name: string;
  sanskrit: string;
  glyph: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  modality: 'Cardinal' | 'Fixed' | 'Mutable';
  ruler: PlanetId;
  polarity: 'Positive' | 'Negative';
}

/** The twelve rāśis (0 = Aries). */
export const ZODIAC: SignInfo[] = [
  { index: 0, name: 'Aries', sanskrit: 'Mesha', glyph: '♈', element: 'Fire', modality: 'Cardinal', ruler: 'Mars', polarity: 'Positive' },
  { index: 1, name: 'Taurus', sanskrit: 'Vrishabha', glyph: '♉', element: 'Earth', modality: 'Fixed', ruler: 'Venus', polarity: 'Negative' },
  { index: 2, name: 'Gemini', sanskrit: 'Mithuna', glyph: '♊', element: 'Air', modality: 'Mutable', ruler: 'Mercury', polarity: 'Positive' },
  { index: 3, name: 'Cancer', sanskrit: 'Karka', glyph: '♋', element: 'Water', modality: 'Cardinal', ruler: 'Moon', polarity: 'Negative' },
  { index: 4, name: 'Leo', sanskrit: 'Simha', glyph: '♌', element: 'Fire', modality: 'Fixed', ruler: 'Sun', polarity: 'Positive' },
  { index: 5, name: 'Virgo', sanskrit: 'Kanya', glyph: '♍', element: 'Earth', modality: 'Mutable', ruler: 'Mercury', polarity: 'Negative' },
  { index: 6, name: 'Libra', sanskrit: 'Tula', glyph: '♎', element: 'Air', modality: 'Cardinal', ruler: 'Venus', polarity: 'Positive' },
  { index: 7, name: 'Scorpio', sanskrit: 'Vrishchika', glyph: '♏', element: 'Water', modality: 'Fixed', ruler: 'Mars', polarity: 'Negative' },
  { index: 8, name: 'Sagittarius', sanskrit: 'Dhanu', glyph: '♐', element: 'Fire', modality: 'Mutable', ruler: 'Jupiter', polarity: 'Positive' },
  { index: 9, name: 'Capricorn', sanskrit: 'Makara', glyph: '♑', element: 'Earth', modality: 'Cardinal', ruler: 'Saturn', polarity: 'Negative' },
  { index: 10, name: 'Aquarius', sanskrit: 'Kumbha', glyph: '♒', element: 'Air', modality: 'Fixed', ruler: 'Saturn', polarity: 'Positive' },
  { index: 11, name: 'Pisces', sanskrit: 'Meena', glyph: '♓', element: 'Water', modality: 'Mutable', ruler: 'Jupiter', polarity: 'Negative' },
];

export const signName = (i: number): string => ZODIAC[((i % 12) + 12) % 12]!.name;
export const signLord = (i: number): PlanetId => ZODIAC[((i % 12) + 12) % 12]!.ruler;

/**
 * Classify a planet's dignity in a given sign (exalted / debilitated / own /
 * friend / neutral / enemy). Shared by the rāśi engine and every varga.
 * Node lords (Rāhu/Ketu) are treated as neutral for sign-dignity purposes.
 */
export function dignityOf(id: PlanetId, sign: number): Dignity {
  const s = ((sign % 12) + 12) % 12;
  if (id === 'Rahu' || id === 'Ketu') return 'neutral';
  if (EXALTATION[id] === s) return 'exalted';
  if (DEBILITATION[id] === s) return 'debilitated';
  if (OWN_SIGNS[id]?.includes(s)) return 'own';
  const lord = signLord(s);
  if (lord === id) return 'own';
  if (FRIENDS[id]?.includes(lord)) return 'friend';
  return 'neutral';
}

export interface PlanetInfo {
  id: PlanetId;
  name: string;
  glyph: string;
  color: string; // brand-tuned hex for charts
  sanskrit: string;
  keyword: string;
}

export const PLANETS: Record<PlanetId, PlanetInfo> = {
  Sun: { id: 'Sun', name: 'Sun', glyph: '☉', color: '#f5a623', sanskrit: 'Surya', keyword: 'Self, vitality, soul' },
  Moon: { id: 'Moon', name: 'Moon', glyph: '☽', color: '#c9d3ff', sanskrit: 'Chandra', keyword: 'Mind, emotion, mother' },
  Mercury: { id: 'Mercury', name: 'Mercury', glyph: '☿', color: '#4ade80', sanskrit: 'Budha', keyword: 'Intellect, speech' },
  Venus: { id: 'Venus', name: 'Venus', glyph: '♀', color: '#f9a8d4', sanskrit: 'Shukra', keyword: 'Love, art, luxury' },
  Mars: { id: 'Mars', name: 'Mars', glyph: '♂', color: '#f87171', sanskrit: 'Mangala', keyword: 'Energy, courage' },
  Jupiter: { id: 'Jupiter', name: 'Jupiter', glyph: '♃', color: '#fbbf24', sanskrit: 'Guru', keyword: 'Wisdom, fortune' },
  Saturn: { id: 'Saturn', name: 'Saturn', glyph: '♄', color: '#93c5fd', sanskrit: 'Shani', keyword: 'Discipline, karma' },
  Rahu: { id: 'Rahu', name: 'Rahu', glyph: '☊', color: '#a78bfa', sanskrit: 'Rahu', keyword: 'Desire, obsession' },
  Ketu: { id: 'Ketu', name: 'Ketu', glyph: '☋', color: '#818cf8', sanskrit: 'Ketu', keyword: 'Detachment, moksha' },
};

export const PLANET_ORDER: PlanetId[] = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu',
];

/** Exaltation sign index per planet (classical). */
export const EXALTATION: Partial<Record<PlanetId, number>> = {
  Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6,
};
/** Debilitation = 180° opposite the exaltation sign. */
export const DEBILITATION: Partial<Record<PlanetId, number>> = {
  Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0,
};
/** Signs owned by each planet. */
export const OWN_SIGNS: Partial<Record<PlanetId, number[]>> = {
  Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5],
  Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10],
};

/** Natural friendships (simplified) for dignity classification. */
export const FRIENDS: Partial<Record<PlanetId, PlanetId[]>> = {
  Sun: ['Moon', 'Mars', 'Jupiter'],
  Moon: ['Sun', 'Mercury'],
  Mars: ['Sun', 'Moon', 'Jupiter'],
  Mercury: ['Sun', 'Venus'],
  Jupiter: ['Sun', 'Moon', 'Mars'],
  Venus: ['Mercury', 'Saturn'],
  Saturn: ['Mercury', 'Venus'],
};

export interface NakshatraInfo {
  index: number;
  name: string;
  lord: PlanetId;
  deity: string;
  symbol: string;
}

/** 27 nakshatras with their Vimśottari lords (9-lord cycle). */
export const NAKSHATRAS: NakshatraInfo[] = [
  { index: 0, name: 'Ashwini', lord: 'Ketu', deity: 'Ashwini Kumaras', symbol: "Horse's head" },
  { index: 1, name: 'Bharani', lord: 'Venus', deity: 'Yama', symbol: 'Yoni' },
  { index: 2, name: 'Krittika', lord: 'Sun', deity: 'Agni', symbol: 'Razor / flame' },
  { index: 3, name: 'Rohini', lord: 'Moon', deity: 'Brahma', symbol: 'Chariot' },
  { index: 4, name: 'Mrigashira', lord: 'Mars', deity: 'Soma', symbol: "Deer's head" },
  { index: 5, name: 'Ardra', lord: 'Rahu', deity: 'Rudra', symbol: 'Teardrop' },
  { index: 6, name: 'Punarvasu', lord: 'Jupiter', deity: 'Aditi', symbol: 'Quiver of arrows' },
  { index: 7, name: 'Pushya', lord: 'Saturn', deity: 'Brihaspati', symbol: 'Cow udder / lotus' },
  { index: 8, name: 'Ashlesha', lord: 'Mercury', deity: 'Nagas', symbol: 'Serpent' },
  { index: 9, name: 'Magha', lord: 'Ketu', deity: 'Pitris', symbol: 'Throne' },
  { index: 10, name: 'Purva Phalguni', lord: 'Venus', deity: 'Bhaga', symbol: 'Hammock' },
  { index: 11, name: 'Uttara Phalguni', lord: 'Sun', deity: 'Aryaman', symbol: 'Bed' },
  { index: 12, name: 'Hasta', lord: 'Moon', deity: 'Savitar', symbol: 'Hand' },
  { index: 13, name: 'Chitra', lord: 'Mars', deity: 'Tvashtar', symbol: 'Bright jewel' },
  { index: 14, name: 'Swati', lord: 'Rahu', deity: 'Vayu', symbol: 'Coral / sprout' },
  { index: 15, name: 'Vishakha', lord: 'Jupiter', deity: 'Indra-Agni', symbol: 'Triumphal arch' },
  { index: 16, name: 'Anuradha', lord: 'Saturn', deity: 'Mitra', symbol: 'Lotus' },
  { index: 17, name: 'Jyeshtha', lord: 'Mercury', deity: 'Indra', symbol: 'Earring / umbrella' },
  { index: 18, name: 'Mula', lord: 'Ketu', deity: 'Nirriti', symbol: 'Tied roots' },
  { index: 19, name: 'Purva Ashadha', lord: 'Venus', deity: 'Apas', symbol: 'Fan / winnowing basket' },
  { index: 20, name: 'Uttara Ashadha', lord: 'Sun', deity: 'Vishwadevas', symbol: "Elephant's tusk" },
  { index: 21, name: 'Shravana', lord: 'Moon', deity: 'Vishnu', symbol: 'Ear / three footprints' },
  { index: 22, name: 'Dhanishta', lord: 'Mars', deity: 'Vasus', symbol: 'Drum' },
  { index: 23, name: 'Shatabhisha', lord: 'Rahu', deity: 'Varuna', symbol: 'Empty circle' },
  { index: 24, name: 'Purva Bhadrapada', lord: 'Jupiter', deity: 'Aja Ekapada', symbol: 'Sword / two-faced man' },
  { index: 25, name: 'Uttara Bhadrapada', lord: 'Saturn', deity: 'Ahir Budhnya', symbol: 'Twins / serpent' },
  { index: 26, name: 'Revati', lord: 'Mercury', deity: 'Pushan', symbol: 'Fish / drum' },
];

/** Vimśottari mahādaśā lengths in years (total 120). */
export const VIMSHOTTARI_YEARS: Record<PlanetId, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};

/** Dasha lord order (Ketu leads, matching Ashwini). */
export const DASHA_ORDER: PlanetId[] = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
];

/** Per-sign lucky attributes surfaced in the dashboard (curated, traditional). */
export interface LuckyProfile {
  colors: string[];
  numbers: number[];
  gemstone: string;
  day: string;
  direction: string;
}

export const LUCKY_BY_SIGN: Record<number, LuckyProfile> = {
  0: { colors: ['Red', 'Coral'], numbers: [9, 18], gemstone: 'Red Coral', day: 'Tuesday', direction: 'East' },
  1: { colors: ['Emerald Green', 'Pink'], numbers: [6, 15], gemstone: 'Diamond', day: 'Friday', direction: 'South' },
  2: { colors: ['Green', 'Yellow'], numbers: [5, 14], gemstone: 'Emerald', day: 'Wednesday', direction: 'North' },
  3: { colors: ['White', 'Silver'], numbers: [2, 11], gemstone: 'Pearl', day: 'Monday', direction: 'North-West' },
  4: { colors: ['Gold', 'Orange'], numbers: [1, 10], gemstone: 'Ruby', day: 'Sunday', direction: 'East' },
  5: { colors: ['Green', 'Grey'], numbers: [5, 23], gemstone: 'Emerald', day: 'Wednesday', direction: 'North' },
  6: { colors: ['Blue', 'Pastel'], numbers: [6, 24], gemstone: 'Diamond', day: 'Friday', direction: 'West' },
  7: { colors: ['Maroon', 'Red'], numbers: [9, 21], gemstone: 'Red Coral', day: 'Tuesday', direction: 'North' },
  8: { colors: ['Yellow', 'Saffron'], numbers: [3, 12], gemstone: 'Yellow Sapphire', day: 'Thursday', direction: 'North-East' },
  9: { colors: ['Blue', 'Black'], numbers: [8, 17], gemstone: 'Blue Sapphire', day: 'Saturday', direction: 'West' },
  10: { colors: ['Blue', 'Turquoise'], numbers: [8, 26], gemstone: 'Blue Sapphire', day: 'Saturday', direction: 'West' },
  11: { colors: ['Yellow', 'Sea Green'], numbers: [3, 30], gemstone: 'Yellow Sapphire', day: 'Thursday', direction: 'North' },
};
