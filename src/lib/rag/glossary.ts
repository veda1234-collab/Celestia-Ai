/**
 * Sanskrit → English glossary for retrieval.
 *
 * This exists because of a measured limitation, not a hunch: the local
 * embedding model (all-MiniLM-L6-v2) scores "Shani" against "Saturn" at 0.139
 * and "vargottama" against its own definition at 0.000 — it has effectively no
 * Jyotiṣa vocabulary, while scoring ordinary English paraphrase at 0.71. Left
 * alone, dense retrieval would fail on precisely the terms this domain runs on.
 *
 * The glossary is applied twice:
 *  - at index time, appending the English gloss to a chunk's embedding text so
 *    the dense vector carries English signal for Sanskrit passages;
 *  - at query time, expanding the user's words so both retrievers can match.
 *
 * Keys must be lowercase. Diacritics are stripped before lookup, so "daśā" and
 * "dasha" both resolve.
 */
export const GLOSSARY: Record<string, string> = {
  // Grahas
  surya: 'Sun', ravi: 'Sun',
  chandra: 'Moon', soma: 'Moon',
  mangala: 'Mars', kuja: 'Mars', angaraka: 'Mars', mangal: 'Mars',
  budha: 'Mercury',
  guru: 'Jupiter', brihaspati: 'Jupiter', bruhaspati: 'Jupiter',
  shukra: 'Venus', sukra: 'Venus',
  shani: 'Saturn', sani: 'Saturn', shanaiswara: 'Saturn',
  rahu: 'Rahu north lunar node', ketu: 'Ketu south lunar node',
  graha: 'planet', grahas: 'planets', navagraha: 'the nine planets',

  // Chart structure
  lagna: 'ascendant rising sign',
  rasi: 'sign zodiac sign', rashi: 'sign zodiac sign',
  bhava: 'house', bhavas: 'houses',
  kundli: 'birth chart horoscope', kundali: 'birth chart horoscope',
  janma: 'birth', jataka: 'natal chart native',
  chandra_lagna: 'Moon sign ascendant',
  ayanamsa: 'precession offset sidereal correction',
  drishti: 'aspect planetary aspect',
  yuti: 'conjunction', yoga: 'planetary combination',
  karaka: 'significator indicator',
  atmakaraka: 'soul significator strongest planet',

  // Houses by name
  karma_bhava: 'tenth house career profession',
  dhana_bhava: 'second house wealth family',
  sukha_bhava: 'fourth house home mother happiness',
  putra_bhava: 'fifth house children intelligence',
  ari_bhava: 'sixth house enemies disease debt',
  kalatra_bhava: 'seventh house marriage spouse partnership',
  ayur_bhava: 'eighth house longevity sudden events',
  dharma_bhava: 'ninth house fortune father guru',
  labha_bhava: 'eleventh house gains income',
  vyaya_bhava: 'twelfth house loss expenditure liberation',
  kendra: 'angular house 1 4 7 10',
  trikona: 'trine house 1 5 9 fortune',
  dusthana: 'difficult house 6 8 12', duhsthana: 'difficult house 6 8 12',
  upachaya: 'growing house 3 6 10 11',
  maraka: 'death-inflicting house 2 7',

  // Dignity & strength
  uccha: 'exalted', neecha: 'debilitated', neecha_bhanga: 'cancellation of debilitation',
  swakshetra: 'own sign', moolatrikona: 'mooltrikona own strong sign',
  vargottama: 'same sign in rasi and navamsa strong divisional placement',
  bala: 'strength', shadbala: 'six-fold planetary strength',
  vimshopaka: 'divisional chart strength score',
  combust: 'too close to the Sun weakened', astangata: 'combust weakened by the Sun',
  retrograde: 'moving backwards', vakri: 'retrograde moving backwards',

  // Divisional charts
  varga: 'divisional chart', vargas: 'divisional charts',
  navamsa: 'ninth divisional chart D9 marriage dharma',
  dasamsa: 'tenth divisional chart D10 career',
  dwadasamsa: 'twelfth divisional chart D12 parents',
  saptamsa: 'seventh divisional chart D7 children',
  hora: 'second divisional chart D2 wealth',
  drekkana: 'third divisional chart D3 siblings',
  trimsamsa: 'thirtieth divisional chart D30 misfortune',
  shodasavarga: 'the sixteen divisional charts',

  // Dasha
  dasha: 'planetary period', dasa: 'planetary period',
  mahadasha: 'major planetary period', mahadasa: 'major planetary period',
  antardasha: 'sub period', antardasa: 'sub period', bhukti: 'sub period',
  pratyantardasha: 'sub sub period', sookshma: 'fourth level sub period',
  vimshottari: 'the 120-year planetary period system',

  // Transits
  gochar: 'transit current planetary movement', gochara: 'transit current planetary movement',
  sade_sati: 'seven and a half year Saturn transit over the Moon',
  sadesati: 'seven and a half year Saturn transit over the Moon',
  dhaiya: 'two and a half year Saturn transit', kantaka: 'Saturn in the fourth from the Moon',
  ashtama: 'eighth from the Moon', vedha: 'obstruction cancellation of a transit result',
  tara_bala: 'daily lunar strength from the birth star',

  // Nakshatra
  nakshatra: 'lunar mansion birth star', nakshatras: 'lunar mansions birth stars',
  pada: 'quarter of a nakshatra',

  // Doshas & remedies
  dosha: 'affliction flaw', doshas: 'afflictions flaws',
  manglik: 'Mars affliction affecting marriage', mangal_dosha: 'Mars affliction affecting marriage',
  kala_sarpa: 'all planets between Rahu and Ketu',
  pitra_dosha: 'ancestral affliction',
  upaya: 'remedy', upayas: 'remedies', parihara: 'remedy',
  mantra: 'sacred chant', ratna: 'gemstone', daan: 'charitable giving', dana: 'charitable giving',
  puja: 'worship ritual', homa: 'fire ritual', havan: 'fire ritual',

  // General
  jyotisha: 'Vedic astrology', jyotish: 'Vedic astrology',
  phala: 'result effect', karma: 'action consequence destiny',
  moksha: 'liberation', dharma: 'duty purpose righteousness',
  artha: 'wealth material purpose', kama: 'desire pleasure',
};

/** Strip diacritics so "daśā" and "dasha" hit the same key. */
export function normalizeTerm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Terms sharing a gloss are spelling variants or synonyms of one another
 * ("dasha"/"dasa", "shani"/"sani", "upaya"/"parihara"). Grouping by gloss gives
 * a free variant table, which matters because transliteration is inconsistent:
 * the corpus writes "daśā" — normalising to "dasa" — while users type "dasha",
 * and lexical search would otherwise never connect the two.
 */
const VARIANTS_BY_GLOSS = (() => {
  const byGloss = new Map<string, string[]>();
  for (const [term, gloss] of Object.entries(GLOSSARY)) {
    const list = byGloss.get(gloss) ?? [];
    list.push(term.replace(/_/g, ' '));
    byGloss.set(gloss, list);
  }
  return byGloss;
})();

/**
 * Expand a piece of text with the English gloss of any Sanskrit terms it
 * contains, plus the alternate spellings of those terms. Multi-word keys use
 * underscores in the table but appear space- or hyphen-separated in real text,
 * so both forms are probed.
 */
export function expandWithGlossary(text: string): string {
  const normalized = normalizeTerm(text);
  const glosses = new Set<string>();
  const variants = new Set<string>();

  for (const [term, gloss] of Object.entries(GLOSSARY)) {
    const spaced = term.replace(/_/g, ' ');
    const hyphened = term.replace(/_/g, '-');
    const found =
      normalized.includes(spaced) ||
      (hyphened !== spaced && normalized.includes(hyphened));
    if (!found) continue;
    glosses.add(gloss);
    for (const v of VARIANTS_BY_GLOSS.get(gloss) ?? []) {
      if (!normalized.includes(v)) variants.add(v);
    }
  }

  if (!glosses.size) return text;
  const tail = [`[glossary: ${[...glosses].join('; ')}]`];
  if (variants.size) tail.push(`[also: ${[...variants].join(', ')}]`);
  return `${text}\n${tail.join('\n')}`;
}

/** Tokenise for lexical scoring: lowercase, de-accented, alphanumeric runs. */
export function tokenize(text: string): string[] {
  return normalizeTerm(text)
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((t) => t.length > 1);
}
