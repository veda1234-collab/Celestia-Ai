import type { Dosha, PlanetId, PlanetPosition, Yoga } from './types';
import { signLord, signName } from './signs';

const KENDRA = new Set([1, 4, 7, 10]);
const TRIKONA = new Set([1, 5, 9]);

/** House distance (1–12) counted from sign `from` to sign `to`. */
const houseFromSign = (from: number, to: number): number => (((to - from) % 12) + 12) % 12 + 1;

const bySign = (planets: PlanetPosition[]): Map<number, PlanetPosition[]> => {
  const m = new Map<number, PlanetPosition[]>();
  for (const p of planets) {
    const arr = m.get(p.sign) ?? [];
    arr.push(p);
    m.set(p.sign, arr);
  }
  return m;
};

const PANCHA: Record<string, { planet: PlanetId; name: string }> = {
  Mars: { planet: 'Mars', name: 'Ruchaka Yoga' },
  Mercury: { planet: 'Mercury', name: 'Bhadra Yoga' },
  Jupiter: { planet: 'Jupiter', name: 'Hamsa Yoga' },
  Venus: { planet: 'Venus', name: 'Malavya Yoga' },
  Saturn: { planet: 'Saturn', name: 'Shasha Yoga' },
};

export function detectYogas(
  planets: PlanetPosition[],
  ascSign: number,
  moonSign: number,
): Yoga[] {
  const yogas: Yoga[] = [];
  const get = (id: PlanetId) => planets.find((p) => p.id === id);
  const groups = bySign(planets);

  const jup = get('Jupiter');
  if (jup) {
    const rel = houseFromSign(moonSign, jup.sign);
    if (KENDRA.has(rel)) {
      yogas.push({
        name: 'Gaja Kesari Yoga',
        description: 'Jupiter sits in an angle from the Moon — a classic sign of intelligence, prestige and enduring good fortune.',
        planets: ['Jupiter', 'Moon'],
        auspicious: true,
      });
    }
  }

  const sun = get('Sun');
  const mer = get('Mercury');
  if (sun && mer && sun.sign === mer.sign) {
    yogas.push({
      name: 'Budha-Aditya Yoga',
      description: 'Sun and Mercury unite, sharpening intellect, communication and analytical brilliance.',
      planets: ['Sun', 'Mercury'],
      auspicious: true,
    });
  }

  const moon = get('Moon');
  const mars = get('Mars');
  if (moon && mars && moon.sign === mars.sign) {
    yogas.push({
      name: 'Chandra-Mangala Yoga',
      description: 'Moon with Mars grants drive, resourcefulness and a knack for generating wealth.',
      planets: ['Moon', 'Mars'],
      auspicious: true,
    });
  }

  // Pañca Mahāpuruṣa yogas — a benefic-forming planet strong (own/exalted) in a kendra.
  for (const p of planets) {
    const spec = PANCHA[p.id];
    if (!spec) continue;
    if ((p.dignity === 'own' || p.dignity === 'exalted') && KENDRA.has(p.house)) {
      yogas.push({
        name: spec.name,
        description: `${p.id} is powerfully placed (${p.dignity}) in an angular house, forming one of the five great "Mahāpuruṣa" yogas of distinction.`,
        planets: [p.id],
        auspicious: true,
      });
    }
  }

  // Simplified Rāja Yoga: a kendra-lord and a trikona-lord conjoin.
  for (const [, sameSign] of groups) {
    if (sameSign.length < 2) continue;
    for (let a = 0; a < sameSign.length; a++) {
      for (let b = a + 1; b < sameSign.length; b++) {
        const pa = sameSign[a]!;
        const pb = sameSign[b]!;
        const rulesKendra = (id: PlanetId) => [...KENDRA].some((h) => signLord((ascSign + h - 1) % 12) === id);
        const rulesTrikona = (id: PlanetId) => [...TRIKONA].some((h) => signLord((ascSign + h - 1) % 12) === id);
        if ((rulesKendra(pa.id) && rulesTrikona(pb.id)) || (rulesKendra(pb.id) && rulesTrikona(pa.id))) {
          yogas.push({
            name: 'Rāja Yoga',
            description: `Lords of an angle and a trine join in ${signName(pa.sign)}, a powerful combination for status, authority and success.`,
            planets: [pa.id, pb.id],
            auspicious: true,
          });
        }
      }
    }
  }

  // De-duplicate by name (Rāja yoga may recur across pairs).
  const seen = new Set<string>();
  return yogas.filter((y) => (seen.has(y.name) ? false : (seen.add(y.name), true)));
}

export function detectDoshas(
  planets: PlanetPosition[],
  moonSign: number,
  currentSaturnSiderealLon: number | null,
): Dosha[] {
  const doshas: Dosha[] = [];
  const get = (id: PlanetId) => planets.find((p) => p.id === id);

  // Maṅgal (Manglik) Dosha — Mars in 1,2,4,7,8,12 from ascendant.
  const mars = get('Mars');
  const manglikHouses = new Set([1, 2, 4, 7, 8, 12]);
  const isManglik = !!mars && manglikHouses.has(mars.house);
  doshas.push({
    name: 'Maṅgal Dosha (Manglik)',
    present: isManglik,
    severity: isManglik ? (mars && (mars.house === 7 || mars.house === 8) ? 'high' : 'moderate') : 'none',
    description: isManglik
      ? `Mars occupies the ${ordinal(mars!.house)} house, forming Maṅgal dosha — traditionally weighed in marriage matching. Remedies and compatible partners can balance it.`
      : 'Mars is not placed in the houses that form Maṅgal dosha.',
  });

  // Kāla Sarpa Dosha — all seven grahas hemmed between Rāhu and Ketu.
  const rahu = get('Rahu');
  if (rahu) {
    const arcStart = rahu.longitude;
    const others: PlanetId[] = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
    const within = others.every((id) => {
      const p = get(id);
      if (!p) return false;
      const rel = (((p.longitude - arcStart) % 360) + 360) % 360;
      return rel <= 180;
    });
    const withinOther = others.every((id) => {
      const p = get(id);
      if (!p) return false;
      const rel = (((p.longitude - arcStart) % 360) + 360) % 360;
      return rel >= 180;
    });
    const present = within || withinOther;
    doshas.push({
      name: 'Kāla Sarpa Dosha',
      present,
      severity: present ? 'moderate' : 'none',
      description: present
        ? 'All planets fall on one side of the Rāhu–Ketu axis, forming Kāla Sarpa — associated with intensity and delayed-then-decisive results.'
        : 'Planets fall on both sides of the Rāhu–Ketu axis; Kāla Sarpa dosha is not formed.',
    });
  }

  // Śani Sāḍe Sātī — transit Saturn over the 12th/1st/2nd from natal Moon.
  if (currentSaturnSiderealLon != null) {
    const satSign = Math.floor((((currentSaturnSiderealLon % 360) + 360) % 360) / 30);
    const rel = (((satSign - moonSign) % 12) + 12) % 12; // 0 = over Moon
    const inSadeSati = rel === 11 || rel === 0 || rel === 1;
    const phase = rel === 11 ? 'rising (first) phase' : rel === 0 ? 'peak (second) phase' : 'setting (third) phase';
    doshas.push({
      name: 'Śani Sāḍe Sātī',
      present: inSadeSati,
      severity: inSadeSati ? (rel === 0 ? 'high' : 'moderate') : 'none',
      description: inSadeSati
        ? `Transiting Saturn is in the ${phase} of Sāḍe Sātī relative to your Moon — a period of maturation, responsibility and lasting rewards for disciplined effort.`
        : 'Transiting Saturn is not currently in the Sāḍe Sātī zone around your natal Moon.',
    });
  }

  return doshas;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]!);
}
