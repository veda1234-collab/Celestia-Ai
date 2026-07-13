import type { BirthChart } from './types';
import { PLANETS, ZODIAC } from './signs';

export type Timeframe = 'today' | 'week' | 'month' | 'year';

const ELEMENT_MOOD: Record<string, string> = {
  Fire: 'bold and initiating',
  Earth: 'grounded and practical',
  Air: 'curious and communicative',
  Water: 'intuitive and feeling',
};

const FRAME_INTRO: Record<Timeframe, string> = {
  today: 'Today',
  week: 'This week',
  month: 'This month',
  year: 'This year',
};

/**
 * Lightweight, deterministic guidance woven from the chart's Moon element and
 * the current daśā lord — a tasteful placeholder the AI chat deepens on demand.
 */
export function horoscope(chart: BirthChart, frame: Timeframe): string {
  const moonSign = ZODIAC.find((z) => z.name === chart.moonSign);
  const element = moonSign?.element ?? 'Water';
  const mood = ELEMENT_MOOD[element] ?? 'reflective';
  const maha = chart.dasha.current.maha.lord;
  const antar = chart.dasha.current.antar?.lord;
  const theme = PLANETS[maha].keyword.toLowerCase();
  const lens = antar ? `${PLANETS[antar].keyword.split(',')[0]!.toLowerCase()}` : theme;

  const bodies: Record<Timeframe, string> = {
    today: `your ${element.toLowerCase()} Moon keeps you ${mood}. Your ${maha} period highlights ${theme} — a small, deliberate step toward ${lens} pays off. Favour clarity over speed.`,
    week: `themes of ${theme} come forward under your ${maha} daśā. With a ${chart.moonSign} Moon you'll navigate best by trusting your ${mood} instincts. Tend one relationship and one responsibility with equal care.`,
    month: `the ${maha}${antar ? `–${antar}` : ''} period colours the weeks ahead around ${theme} and ${lens}. Build steadily rather than chasing shortcuts; your ${chart.ascendant.signName} ascendant rewards consistency.`,
    year: `a longer arc of ${theme} defines this chapter of your ${maha} mahādaśā. Set intentions aligned with ${lens}, protect your energy, and let your ${chart.moonSign} Moon guide the pace. Meaningful growth favours patience now.`,
  };

  return `${FRAME_INTRO[frame]}, ${bodies[frame]}`;
}
