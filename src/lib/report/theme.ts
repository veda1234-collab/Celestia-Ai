/**
 * Design tokens for the Vedastra PDF report.
 *
 * Kept separate from the drawing code so the palette and type scale can be
 * tuned in one place. Values are chosen to print well on paper as well as on
 * screen: the ink is a near-black indigo rather than pure black, and the golds
 * are dark enough to stay legible on white.
 */

export const COLOR = {
  /** Navy cover/bands — the same near-black navy as the screen. */
  night: '#0A0A1F',
  nightSoft: '#12132B',
  /** Gold-as-ink, darkened for legibility on ivory paper. */
  gold: '#9A7B2E',
  goldBright: '#C9A24B',
  goldDeep: '#7A5F22',
  /** Body text. */
  ink: '#14162B',
  /** Secondary text. */
  muted: '#6B6580',
  faint: '#9B94AE',
  /** Paper + hairlines. */
  paper: '#FBFAF4',
  wash: '#F7F4EC',
  line: '#E7E2D6',
  rule: '#DED7C6',
  white: '#FFFFFF',
  /** Navy-indigo pigment for the "friend" dignity (replaces violet). */
  friend: '#3A4C8A',
  friendWash: '#EAEDF6',
  /** Semantic. warn = caution pigment, bad = care pigment. */
  good: '#2E7D5B',
  goodWash: '#E7F2EC',
  warn: '#A9761B',
  warnWash: '#F6EDDA',
  bad: '#A8324A',
  badWash: '#F6E7EB',
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
  friend: { fg: COLOR.friend, bg: COLOR.friendWash },
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
