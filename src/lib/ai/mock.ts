import type { BirthChart, PlanetId, PlanetPosition } from '@/lib/astrology/types';
import { LUCKY_BY_SIGN, PLANETS, signName } from '@/lib/astrology/signs';
import type { AIProvider, StreamChatOptions } from './types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type TopicKey =
  | 'career' | 'love' | 'finance' | 'health' | 'education'
  | 'family' | 'spiritual' | 'personality' | 'lucky' | 'timing' | 'general';

const TOPIC_KEYWORDS: Record<Exclude<TopicKey, 'general'>, string[]> = {
  career: ['career', 'job', 'work', 'profession', 'business', 'promotion', 'success'],
  love: ['love', 'marriage', 'relationship', 'partner', 'spouse', 'romance', 'compatib', 'dating'],
  finance: ['money', 'finance', 'wealth', 'rich', 'income', 'invest', 'saving', 'debt'],
  health: ['health', 'illness', 'disease', 'fitness', 'body', 'energy', 'wellbeing'],
  education: ['education', 'study', 'exam', 'learn', 'college', 'degree', 'knowledge'],
  family: ['family', 'children', 'child', 'mother', 'father', 'home', 'parents'],
  spiritual: ['spiritual', 'moksha', 'meditation', 'purpose', 'dharma', 'soul', 'karma'],
  personality: ['personality', 'who am i', 'strength', 'weakness', 'nature', 'character', 'myself'],
  lucky: ['lucky', 'colour', 'color', 'gemstone', 'gem', 'number', 'remedy', 'auspicious'],
  timing: ['when', 'dasha', 'timing', 'period', 'transit', 'future', 'year', 'month'],
};

/**
 * Deterministic, chart-aware fallback astrologer. Composes a genuinely
 * personalised reading from the computed chart so the chat works without an
 * API key, then streams it token-by-token for a live typing feel.
 */
export class MockProvider implements AIProvider {
  readonly name = 'mock';
  constructor(private chart: BirthChart) {}

  async *streamChat({ messages, signal }: StreamChatOptions): AsyncIterable<string> {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    const text = this.compose(lastUser);
    const tokens = text.match(/\s+|\S+/g) ?? [text];
    for (const t of tokens) {
      if (signal?.aborted) return;
      yield t;
      await sleep(10);
    }
  }

  private planet(id: PlanetId): PlanetPosition {
    return this.chart.planets.find((p) => p.id === id)!;
  }

  private houseSign(n: number): number {
    return (this.chart.ascendant.sign + n - 1) % 12;
  }

  private houseLord(n: number): PlanetId {
    return this.chart.houses[n - 1]!.lord;
  }

  private occupants(n: number): PlanetId[] {
    return this.chart.houses[n - 1]!.planets;
  }

  private strongest(): PlanetPosition {
    return [...this.chart.planets].sort((a, b) => b.strength - a.strength)[0]!;
  }

  private detectTopic(q: string): TopicKey {
    const lower = q.toLowerCase();
    for (const [topic, words] of Object.entries(TOPIC_KEYWORDS)) {
      if (words.some((w) => lower.includes(w))) return topic as TopicKey;
    }
    return 'general';
  }

  private houseReading(n: number, label: string): string {
    const sign = signName(this.houseSign(n));
    const lord = this.houseLord(n);
    const lordPos = this.planet(lord);
    const occ = this.occupants(n);
    const occText = occ.length
      ? `**${occ.join(', ')}** ${occ.length > 1 ? 'occupy' : 'occupies'} this house, colouring it directly.`
      : 'No planets sit here, so its lord carries the story.';
    return `Your ${label} (${ordinal(n)} house) falls in **${sign}**, ruled by **${lord}**. ${occText} ${lord} is placed in **${lordPos.signName}** in your ${ordinal(lordPos.house)} house (${lordPos.dignity}, strength ${lordPos.strength}/100), which is where the results of this area tend to unfold.`;
  }

  private compose(q: string): string {
    const c = this.chart;
    const asc = c.ascendant.signName;
    const moon = c.moonSign;
    const nak = c.nakshatra.name;
    const maha = c.dasha.current.maha.lord;
    const antar = c.dasha.current.antar?.lord;
    const first = c.meta.name.trim().split(/\s+/)[0] || 'friend';
    const dashaLine = `You are currently in your **${maha} mahādaśā**${antar ? ` with **${antar} antardaśā**` : ''}, which sets the backdrop for this phase of life.`;

    switch (this.detectTopic(q)) {
      case 'career':
        return `**Career & Vocation, ${first}**\n\n${this.houseReading(10, 'career and public standing')}\n\n${this.houseReading(6, 'daily work and service')} With a **${asc}** ascendant, you carry the natural working style of that sign into everything you build.\n\n${dashaLine} A ${maha} period tends to spotlight the themes ${PLANETS[maha].keyword.toLowerCase()} — a useful lens for the moves you make now.\n\nYour strongest planet is **${this.strongest().id}** (${this.strongest().strength}/100) in ${this.strongest().signName}; leaning into its qualities is where you'll find the least resistance and the most recognition.`;

      case 'love':
        return `**Love & Marriage, ${first}**\n\n${this.houseReading(7, 'marriage and partnerships')}\n\nVenus, the natural significator of love, sits in **${this.planet('Venus').signName}** (house ${this.planet('Venus').house}, ${this.planet('Venus').dignity}). This shapes what you're drawn to and how you express affection. Your **${moon}** Moon means emotional security matters as much as attraction.\n\n${describeDosha(c, 'Maṅgal Dosha (Manglik)')}\n\n${dashaLine} Relationship chapters often open or deepen when the daśā lord touches the 7th house or its lord — worth watching as ${maha} unfolds.`;

      case 'finance':
        return `**Wealth & Finance, ${first}**\n\n${this.houseReading(2, 'accumulated wealth and family resources')}\n\n${this.houseReading(11, 'gains and income')} The flow between the 2nd and 11th is your money engine.\n\nJupiter, the great benefic of abundance, is in **${this.planet('Jupiter').signName}** (${this.planet('Jupiter').dignity}, strength ${this.planet('Jupiter').strength}/100). ${this.planet('Jupiter').strength >= 60 ? 'It is well-placed to attract growth and opportunity.' : 'Nurturing it — through Thursdays, generosity, and yellow tones — helps it deliver.'}\n\n${dashaLine} Treat this as guidance rather than a guarantee, and pair it with sound, professional financial planning.`;

      case 'health':
        return `**Health & Vitality, ${first}**\n\n${this.houseReading(1, 'body and constitution')}\n\n${this.houseReading(6, 'illness and recovery')} The Sun (vitality) is in **${this.planet('Sun').signName}** and the Moon (mind and fluids) in **${moon}** — together they describe your baseline energy and emotional weather.\n\nBorn under **${nak}**, you carry that nakshatra's temperament. Practices that steady your ${this.planet('Moon').dignity === 'debilitated' ? 'emotional' : 'nervous'} system — regular rhythm, breathwork, time in nature — tend to pay off most.\n\nThis is astrological guidance for self-awareness, not a diagnosis. For anything concerning, please consult a qualified doctor.`;

      case 'education':
        return `**Education & Learning, ${first}**\n\n${this.houseReading(4, 'foundational education and comfort')}\n\n${this.houseReading(5, 'intelligence and higher learning')} Mercury, the planet of intellect, is in **${this.planet('Mercury').signName}** (${this.planet('Mercury').dignity}), shaping how you absorb and express ideas.\n\nYour **${asc}** ascendant and **${nak}** nakshatra hint at the subjects and styles that come naturally. ${dashaLine} Mercury or Jupiter periods are classically favourable for study and exams.`;

      case 'family':
        return `**Family & Children, ${first}**\n\n${this.houseReading(4, 'mother and home')}\n\n${this.houseReading(5, 'children and creativity')} The Moon (mother, nurture) sits in **${moon}**, and the way it's placed colours your early home life and your instinct to care for others.\n\n${this.houseReading(9, 'father and fortune')} ${dashaLine}`;

      case 'spiritual':
        return `**Spiritual Path, ${first}**\n\n${this.houseReading(12, 'liberation, retreat and the inner world')}\n\nKetu, the planet of detachment and past-life wisdom, is in **${this.planet('Ketu').signName}** (house ${this.planet('Ketu').house}) — often a pointer to where the soul already carries mastery and seeks release. Your **${nak}** birth nakshatra (deity-linked) adds its own spiritual flavour.\n\n${dashaLine} Ketu, Saturn, and Jupiter periods frequently coincide with deepening practice. Meditation, mantra, and service aligned with your Moon in **${moon}** tend to feel most natural.`;

      case 'personality':
        return `**Your Nature, ${first}**\n\nWith a **${asc}** ascendant, that's the mask the world meets first and the engine of how you act. Your **${moon}** Moon is your inner emotional truth, and your **${c.sunSign.sidereal}** Sun is the soul-purpose you're growing toward. Born in **${nak}**, you carry its distinctive temperament.\n\n**Strengths:** your standout planet is **${this.strongest().id}** in ${this.strongest().signName} (${this.strongest().strength}/100) — ${PLANETS[this.strongest().id].keyword.toLowerCase()} come more easily to you than most.\n\n${c.yogas.length ? `**Notable combinations:** ${c.yogas.map((y) => y.name).join(', ')}. ${c.yogas[0]!.description}` : 'Your chart favours steady, self-made growth over dramatic shortcuts.'}\n\n${dashaLine}`;

      case 'lucky': {
        const lucky = LUCKY_BY_SIGN[this.chart.ascendant.sign]!;
        return `**Lucky Factors, ${first}**\n\nBased on your **${asc}** ascendant and **${moon}** Moon:\n\n- **Colours:** ${lucky.colors.join(', ')}\n- **Numbers:** ${lucky.numbers.join(', ')}\n- **Gemstone:** ${lucky.gemstone} (consult an astrologer before wearing any gem)\n- **Favourable day:** ${lucky.day}\n- **Direction:** ${lucky.direction}\n\nYour ascendant lord is **${c.ascendant.lord}**, so strengthening it — through its day, colours, and mantra — supports your overall luck. ${dashaLine}`;
      }

      case 'timing':
        return `**Timing & Periods, ${first}**\n\nVedic timing runs on the Vimśottari daśā. Right now:\n\n- **Mahādaśā:** ${maha} — ${fmtRange(c.dasha.current.maha.startISO, c.dasha.current.maha.endISO)}\n${antar ? `- **Antardaśā:** ${antar} — ${fmtRange(c.dasha.current.antar!.startISO, c.dasha.current.antar!.endISO)}\n` : ''}\nA ${maha} chapter tends to bring forward the themes of ${PLANETS[maha].keyword.toLowerCase()}. Upcoming mahādaśās in sequence: ${c.dasha.sequence.slice(1, 4).map((d) => d.lord).join(' → ')}.\n\nTransits (gochara) fine-tune this — especially Saturn and Jupiter moving over key houses from your **${moon}** Moon. Treat these as seasons of opportunity and lesson, not fixed fate.`;

      default:
        return `Hello ${first} — I've read your chart. 🌙\n\nYou rise with a **${asc}** ascendant, carry a **${moon}** Moon in **${nak}**, and a **${c.sunSign.sidereal}** Sun. ${c.yogas.length ? `Your chart forms **${c.yogas[0]!.name}**, a genuinely fortunate combination.` : ''}\n\n${dashaLine}\n\nAsk me anything — your **career**, **love & marriage**, **finances**, **health**, **education**, **spiritual path**, or **lucky colours & gemstones**. I'll ground every answer in your specific placements.`;
    }
  }
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]!);
}

function fmtRange(startISO: string, endISO: string): string {
  return `${startISO.slice(0, 10)} to ${endISO.slice(0, 10)}`;
}

function describeDosha(chart: BirthChart, name: string): string {
  const d = chart.doshas.find((x) => x.name === name);
  if (!d) return '';
  return d.present ? `Note: **${d.name}** is present (${d.severity}). ${d.description}` : `Reassuringly, **${d.name}** is not formed in your chart.`;
}
