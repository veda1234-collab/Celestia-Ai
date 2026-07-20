/**
 * Design tokens for the Vedastra PDF report.
 *
 * Kept separate from the drawing code so the palette and type scale can be
 * tuned in one place. Values are chosen to print well on paper as well as on
 * screen: the ink is a near-black indigo rather than pure black, and the golds
 * are dark enough to stay legible on white.
 */

export const COLOR = {
  /** Deep indigo used for full-bleed cover and section bands. */
  night: '#0B0820',
  nightSoft: '#171034',
  /** Primary brand violet. */
  violet: '#6D28D9',
  violetSoft: '#EEE8FD',
  /** Gold for rules, accents and the wordmark. */
  gold: '#B8912F',
  goldBright: '#F5C451',
  /** Body text. */
  ink: '#171233',
  /** Secondary text. */
  muted: '#6B6580',
  faint: '#9B94AE',
  /** Hairlines and table borders. */
  line: '#E4E0F0',
  /** Zebra striping / soft panels. */
  wash: '#F7F5FD',
  white: '#FFFFFF',
  /** Semantic. */
  good: '#1F7A5A',
  goodWash: '#E6F4EF',
  warn: '#A9761B',
  warnWash: '#FBF1DF',
  bad: '#A8324A',
  badWash: '#FBEAEE',
} as const;

/** Point sizes. */
export const TYPE = {
  wordmark: 30,
  coverName: 30,
  coverLabel: 8.5,
  sectionLabel: 8,
  sectionTitle: 17,
  subhead: 10.5,
  body: 9.8,
  small: 8.8,
  tiny: 7.8,
} as const;

export const PAGE = {
  margin: 46,
  /** Space reserved at the foot of each page for the footer rule + text. */
  footer: 46,
} as const;

/** Dignity → semantic colour pair, used for the chips in the planet table. */
export const DIGNITY_TONE: Record<string, { fg: string; bg: string }> = {
  exalted: { fg: COLOR.good, bg: COLOR.goodWash },
  own: { fg: COLOR.good, bg: COLOR.goodWash },
  friend: { fg: COLOR.violet, bg: COLOR.violetSoft },
  neutral: { fg: COLOR.muted, bg: COLOR.wash },
  enemy: { fg: COLOR.warn, bg: COLOR.warnWash },
  debilitated: { fg: COLOR.bad, bg: COLOR.badWash },
};

/** Score → semantic colour, shared by strength bars and meters. */
export function toneForScore(score: number): { fg: string; bg: string } {
  if (score >= 60) return { fg: COLOR.good, bg: COLOR.goodWash };
  if (score >= 40) return { fg: COLOR.warn, bg: COLOR.warnWash };
  return { fg: COLOR.bad, bg: COLOR.badWash };
}
