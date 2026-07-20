import type { Dignity, PlanetId, VargaChart, VargaId, VargaPlanet } from './types';
import { dignityOf, signName } from './signs';

/**
 * Divisional (varga) chart engine.
 *
 * Given the sidereal longitudes of the ascendant and the nine grahas, this
 * computes all twenty divisional charts (D1–D60). The sixteen ṣoḍaśavarga
 * divisions use their classical Parāśari construction rules; the four remaining
 * charts the app surfaces (D5, D6, D8, D11) are not part of the classical
 * scheme and use a documented cyclic (parivṛtti) division, flagged
 * `classical: false` so nothing is presented as more authoritative than it is.
 *
 * References: Bṛhat Parāśara Horā Śāstra (varga adhyāya); the ṣoḍaśavarga and
 * Vimśopaka-bala weightings follow the standard BPHS tables.
 */

export interface VargaDef {
  id: VargaId;
  n: number;
  name: string;
  purpose: string;
  classical: boolean;
}

/** The twenty vargas the platform computes, with their classical significations. */
export const VARGA_DEFS: VargaDef[] = [
  { id: 'D1', n: 1, name: 'Rāśi', purpose: 'Body, overall life, the self and the physical world', classical: true },
  { id: 'D2', n: 2, name: 'Horā', purpose: 'Wealth, resources and material prosperity', classical: true },
  { id: 'D3', n: 3, name: 'Drekkāṇa', purpose: 'Siblings, courage, initiative and vitality', classical: true },
  { id: 'D4', n: 4, name: 'Chaturthāṁśa', purpose: 'Fortune, property, fixed assets, home and inner happiness', classical: true },
  { id: 'D5', n: 5, name: 'Pañchāṁśa', purpose: 'Power, fame, authority and accrued merit', classical: false },
  { id: 'D6', n: 6, name: 'Ṣaṣṭhāṁśa', purpose: 'Health, disease, debts and obstacles', classical: false },
  { id: 'D7', n: 7, name: 'Saptāṁśa', purpose: 'Children, progeny and creative continuity', classical: true },
  { id: 'D8', n: 8, name: 'Aṣṭāṁśa', purpose: 'Longevity, sudden events and hidden difficulties', classical: false },
  { id: 'D9', n: 9, name: 'Navāṁśa', purpose: 'Marriage, spouse, dharma, fortune and inner strength', classical: true },
  { id: 'D10', n: 10, name: 'Daśāṁśa', purpose: 'Career, profession, status and worldly achievement', classical: true },
  { id: 'D11', n: 11, name: 'Rudrāṁśa', purpose: 'Gains, income and the fulfilment of desires', classical: false },
  { id: 'D12', n: 12, name: 'Dvādaśāṁśa', purpose: 'Parents, ancestry and inherited heritage', classical: true },
  { id: 'D16', n: 16, name: 'Ṣoḍaśāṁśa', purpose: 'Vehicles, comforts, luxuries and material happiness', classical: true },
  { id: 'D20', n: 20, name: 'Viṁśāṁśa', purpose: 'Spirituality, worship and religious devotion', classical: true },
  { id: 'D24', n: 24, name: 'Siddhāṁśa', purpose: 'Education, learning and acquired knowledge', classical: true },
  { id: 'D27', n: 27, name: 'Bhāṁśa', purpose: 'Innate strengths, weaknesses and stamina', classical: true },
  { id: 'D30', n: 30, name: 'Triṁśāṁśa', purpose: 'Misfortunes, evils, character and morals', classical: true },
  { id: 'D40', n: 40, name: 'Khavedāṁśa', purpose: 'Auspicious and inauspicious effects; maternal legacy', classical: true },
  { id: 'D45', n: 45, name: 'Akṣavedāṁśa', purpose: 'Character, conduct and paternal legacy', classical: true },
  { id: 'D60', n: 60, name: 'Ṣaṣṭyāṁśa', purpose: 'Overall karma and the fine-tuning of every matter', classical: true },
];

const norm360 = (x: number): number => ((x % 360) + 360) % 360;
const norm12 = (x: number): number => (((x % 12) + 12) % 12);
/** True for Aries, Gemini, Leo… (the 1st, 3rd, 5th… — "odd" — signs). */
const isOddSign = (s: number): boolean => s % 2 === 0;
/** 0 = movable (chara), 1 = fixed (sthira), 2 = dual (dvisvabhāva). */
const modality = (s: number): number => s % 3;
/** 0 = fire, 1 = earth, 2 = air, 3 = water. */
const element = (s: number): number => s % 4;

/** Triṁśāṁśa (D30) uses unequal parts mapped to planet-ruled signs, not equal divisions. */
function trimsamsaSign(s: number, d: number): number {
  if (isOddSign(s)) {
    if (d < 5) return 0; // Mars → Aries
    if (d < 10) return 10; // Saturn → Aquarius
    if (d < 18) return 8; // Jupiter → Sagittarius
    if (d < 25) return 2; // Mercury → Gemini
    return 6; // Venus → Libra
  }
  if (d < 5) return 1; // Venus → Taurus
  if (d < 12) return 5; // Mercury → Virgo
  if (d < 20) return 11; // Jupiter → Pisces
  if (d < 25) return 9; // Saturn → Capricorn
  return 7; // Mars → Scorpio
}

/**
 * The varga sign (0–11) for a body at rāśi sign `s` and `d` degrees into it.
 * This is the heart of the engine — one construction rule per division.
 */
export function vargaSignFor(id: VargaId, sign: number, deg: number): number {
  const s = norm12(sign);
  const d = Math.min(29.999999, Math.max(0, deg));
  switch (id) {
    case 'D1':
      return s;
    case 'D2': {
      const part = Math.floor(d / 15); // 0 or 1
      return isOddSign(s) ? (part === 0 ? 4 : 3) : part === 0 ? 3 : 4; // Leo / Cancer horas
    }
    case 'D3':
      return norm12(s + 4 * Math.floor(d / 10)); // self / 5th / 9th
    case 'D4':
      return norm12(s + 3 * Math.floor(d / 7.5)); // self / 4th / 7th / 10th
    case 'D5':
      return norm12(s + Math.floor(d / 6)); // cyclic
    case 'D6':
      return norm12(s + Math.floor(d / 5)); // cyclic
    case 'D7': {
      const start = isOddSign(s) ? s : norm12(s + 6);
      return norm12(start + Math.floor(d / (30 / 7)));
    }
    case 'D8':
      return norm12(s + Math.floor(d / 3.75)); // cyclic
    case 'D9':
      return norm12(9 * s + Math.floor(d / (30 / 9))); // movable→self, fixed→9th, dual→5th
    case 'D10': {
      const start = isOddSign(s) ? s : norm12(s + 8);
      return norm12(start + Math.floor(d / 3));
    }
    case 'D11':
      return norm12(s + Math.floor(d / (30 / 11))); // cyclic
    case 'D12':
      return norm12(s + Math.floor(d / 2.5)); // count from the sign itself
    case 'D16':
      return norm12(4 * modality(s) + Math.floor(d / (30 / 16))); // Aries/Leo/Sagittarius anchors
    case 'D20': {
      const m = modality(s);
      const start = m === 0 ? 0 : m === 1 ? 8 : 4; // Aries / Sagittarius / Leo
      return norm12(start + Math.floor(d / (30 / 20)));
    }
    case 'D24': {
      const start = isOddSign(s) ? 4 : 3; // Leo (odd) / Cancer (even)
      return norm12(start + Math.floor(d / (30 / 24)));
    }
    case 'D27':
      return norm12(3 * element(s) + Math.floor(d / (30 / 27))); // fire/earth/air/water anchors
    case 'D30':
      return trimsamsaSign(s, d);
    case 'D40': {
      const start = isOddSign(s) ? 0 : 6; // Aries (odd) / Libra (even)
      return norm12(start + Math.floor(d / (30 / 40)));
    }
    case 'D45':
      return norm12(4 * modality(s) + Math.floor(d / (30 / 45))); // Aries/Leo/Sagittarius anchors
    case 'D60':
      return norm12(s + Math.floor(d / 0.5));
  }
}

export interface VargaInput {
  ascSidLon: number;
  sunSidLon: number;
  moonSidLon: number;
  planets: { id: PlanetId; sidLon: number; retrograde: boolean }[];
}

export interface VargaResult {
  charts: VargaChart[];
  /** Vimśopaka bala 0–100 per planet across the sixteen ṣoḍaśavarga charts. */
  vimshopaka: Record<PlanetId, number>;
}

/** Dignity → strength fraction, used for both varga strength and Vimśopaka bala. */
const DIGNITY_MULT: Record<Dignity, number> = {
  exalted: 1,
  own: 1,
  friend: 0.75,
  neutral: 0.5,
  enemy: 0.25,
  debilitated: 0,
};

/**
 * Ṣoḍaśavarga Vimśopaka-bala weights (BPHS), summing to 20. A planet earns each
 * chart's weight scaled by its dignity there; the total is rescaled to 0–100.
 */
const VIMSHOPAKA_WEIGHTS: Partial<Record<VargaId, number>> = {
  D1: 3.5, D2: 1, D3: 1, D4: 0.5, D7: 0.5, D9: 3, D10: 0.5, D12: 0.5,
  D16: 2, D20: 0.5, D24: 0.5, D27: 0.5, D30: 1, D40: 0.5, D45: 0.5, D60: 4,
};

/** Natural benefic/malefic. The Moon is benefic in the bright (śukla) half. */
function isNaturalBenefic(id: PlanetId, sunLon: number, moonLon: number): boolean {
  if (id === 'Jupiter' || id === 'Venus' || id === 'Mercury') return true;
  if (id === 'Moon') {
    const elong = norm360(moonLon - sunLon); // 0 = new, 180 = full
    return elong >= 90 && elong <= 270; // waxing-bright half
  }
  return false; // Sun, Mars, Saturn, Rāhu, Ketu
}

const KENDRA = new Set([1, 4, 7, 10]);
const TRIKONA = new Set([5, 9]);
const DUSTHANA = new Set([6, 8, 12]);

/**
 * Compute every divisional chart plus Vimśopaka bala from sidereal longitudes.
 */
export function computeVargas(input: VargaInput): VargaResult {
  const sunLon = norm360(input.sunSidLon);
  const moonLon = norm360(input.moonSidLon);
  const ascLon = norm360(input.ascSidLon);
  const ascSign = Math.floor(ascLon / 30);
  const ascDeg = ascLon - ascSign * 30;

  const d1SignOf: Partial<Record<PlanetId, number>> = {};
  for (const p of input.planets) d1SignOf[p.id] = Math.floor(norm360(p.sidLon) / 30);

  const vimshopaka = {} as Record<PlanetId, number>;
  for (const p of input.planets) vimshopaka[p.id] = 0;

  const charts: VargaChart[] = VARGA_DEFS.map((def) => {
    const lagnaSign = vargaSignFor(def.id, ascSign, ascDeg);
    const weight = VIMSHOPAKA_WEIGHTS[def.id];

    const planets: VargaPlanet[] = input.planets.map((p) => {
      const lon = norm360(p.sidLon);
      const s = Math.floor(lon / 30);
      const d = lon - s * 30;
      const vSign = vargaSignFor(def.id, s, d);
      const dignity = dignityOf(p.id, vSign);
      if (weight) vimshopaka[p.id] += weight * DIGNITY_MULT[dignity];
      return {
        id: p.id,
        sign: vSign,
        signName: signName(vSign),
        house: norm12(vSign - lagnaSign) + 1,
        dignity,
        retrograde: p.retrograde,
        vargottama: vSign === d1SignOf[p.id],
        benefic: isNaturalBenefic(p.id, sunLon, moonLon),
      };
    });

    let acc = 0;
    for (const p of planets) {
      let s = DIGNITY_MULT[p.dignity] * 70; // 0–70 from dignity
      if (KENDRA.has(p.house)) s += 12;
      if (TRIKONA.has(p.house)) s += 10;
      if (DUSTHANA.has(p.house)) s -= 12;
      if (p.vargottama) s += 8;
      acc += Math.max(0, Math.min(100, s));
    }

    return {
      id: def.id,
      divisions: def.n,
      name: def.name,
      purpose: def.purpose,
      classical: def.classical,
      ascendant: { sign: lagnaSign, signName: signName(lagnaSign) },
      planets,
      benefics: planets.filter((p) => p.benefic).map((p) => p.id),
      malefics: planets.filter((p) => !p.benefic).map((p) => p.id),
      vargottamaPlanets: planets.filter((p) => p.vargottama).map((p) => p.id),
      strength: Math.round(acc / planets.length),
    };
  });

  for (const p of input.planets) vimshopaka[p.id] = Math.round((vimshopaka[p.id] / 20) * 100);

  return { charts, vimshopaka };
}
