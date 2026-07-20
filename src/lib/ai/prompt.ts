import type { BirthChart, VargaId } from '@/lib/astrology/types';
import type { TransitReport } from '@/lib/astrology/transit';
import type { RetrievedPassage } from '@/lib/rag/types';

/**
 * Build the grounding system prompt. The computed chart is injected as
 * structured context so the AI reasons from the user's actual placements
 * rather than generic astrology. `transits` is computed fresh per request —
 * it is deliberately not part of the stored chart, since it changes hourly.
 */
export function buildSystemPrompt(
  chart: BirthChart,
  language = 'en',
  transits?: TransitReport,
  passages?: RetrievedPassage[],
): string {
  const planetLines = chart.planets
    .map(
      (p) =>
        `- ${p.id}: ${p.degreeInSign.toFixed(2)}° ${p.signName} (house ${p.house}, ${p.nakshatra} pada ${p.pada}, ${p.dignity}${p.retrograde ? ', retrograde' : ''}, strength ${p.strength}/100)`,
    )
    .join('\n');

  const houseLines = chart.houses
    .map((h) => `- House ${h.house}: ${h.signName} (lord ${h.lord})${h.planets.length ? ` — ${h.planets.join(', ')}` : ''}`)
    .join('\n');

  const yogaLines = chart.yogas.length
    ? chart.yogas.map((y) => `- ${y.name}: ${y.description}`).join('\n')
    : '- None of the classical yogas tracked here are formed.';

  const doshaLines = chart.doshas
    .map((d) => `- ${d.name}: ${d.present ? `present (${d.severity})` : 'not present'}`)
    .join('\n');

  // The running mahā→antar→pratyantar→sūkṣma stack, each with its favourability.
  const LEVEL_NAMES = ['Mahādaśā', 'Antardaśā', 'Pratyantardaśā', 'Sūkṣmadaśā'] as const;
  const day = (iso: string) => iso.slice(0, 10);
  // The chart arrives from the client, so tolerate one written by an older build:
  // fall back to the mahā/antar pair that shape always carried.
  const stack = chart.dasha.stack?.length
    ? chart.dasha.stack
    : [chart.dasha.current.maha, chart.dasha.current.antar].filter((p) => p != null);
  const stackLines = stack
    .map((p) => {
      const label = LEVEL_NAMES[p.level - 1] ?? `Level ${p.level}`;
      const verdict = p.quality ? ` — ${p.quality}, favourability ${p.favorability}/100` : '';
      return `- ${label}: ${p.lord} (${day(p.startISO)} → ${day(p.endISO)})${verdict}`;
    })
    .join('\n');

  // Why each running lord scores the way it does — this is the explainability the AI cites.
  const runningLords = [...new Set(stack.map((p) => p.lord))];
  const assessmentLines = runningLords
    .map((lord) => {
      const a = chart.dasha.assessments?.[lord];
      return a ? `- ${lord} (${a.score}/100, ${a.quality}): ${a.reasons.join('; ')}` : null;
    })
    .filter(Boolean)
    .join('\n') || '- Favourability scoring is unavailable for this chart; judge the lords from their placements above.';

  const windowLine = (w: { lord: string; mahaLord: string; startISO: string; endISO: string; score: number }) =>
    `- ${w.mahaLord}/${w.lord} (${day(w.startISO)} → ${day(w.endISO)}) — ${w.score}/100`;
  const favorableLines = chart.dasha.favorablePeriods?.length
    ? chart.dasha.favorablePeriods.map(windowLine).join('\n')
    : '- No strongly favourable antardaśā stands out in the timeline ahead.';
  const challengingLines = chart.dasha.challengingPeriods?.length
    ? chart.dasha.challengingPeriods.map(windowLine).join('\n')
    : '- No especially difficult antardaśā stands out in the timeline ahead.';

  // Divisional-chart highlights — the domain-specific lenses (career, marriage…).
  const KEY_VARGAS: VargaId[] = ['D9', 'D10', 'D7', 'D4', 'D24', 'D12', 'D20', 'D30'];
  const vargaById = new Map((chart.vargas ?? []).map((v) => [v.id, v]));
  const vargaLines = KEY_VARGAS.map((id) => {
    const v = vargaById.get(id);
    if (!v) return null;
    const strong = v.planets
      .filter((p) => p.dignity === 'exalted' || p.dignity === 'own')
      .map((p) => `${p.id} ${p.dignity}`);
    const bits = [`lagna ${v.ascendant.signName}`];
    if (strong.length) bits.push(`strong: ${strong.join(', ')}`);
    if (v.vargottamaPlanets.length) bits.push(`vargottama: ${v.vargottamaPlanets.join(', ')}`);
    return `- ${v.id} ${v.name} (${v.purpose}) — ${bits.join('; ')}; strength ${v.strength}/100`;
  })
    .filter(Boolean)
    .join('\n');

  const vimLines = chart.vimshopaka
    ? Object.entries(chart.vimshopaka)
        .sort((a, b) => b[1] - a[1])
        .map(([id, v]) => `${id} ${v}`)
        .join(', ')
    : 'n/a';

  // Gochar — the live sky measured against this chart.
  const transitBlock = transits ? buildTransitBlock(transits) : '';

  // Retrieved reference material for this specific question.
  const referenceBlock = passages?.length
    ? `
## Reference Material (retrieved for this question)
Classical principles relevant to what was asked. Use these to reason correctly; do not quote them at length, and never let them override what the chart above actually says.

${passages
        .map((p, i) => `### [${i + 1}] ${p.chunk.title} — ${p.chunk.heading}\n${p.chunk.text.trim()}`)
        .join('\n\n')}
`
    : '';

  return `You are Vedastra, a warm, wise, and articulate AI Vedic astrologer. You speak to the user as a trusted guide — encouraging, human, and clear, never robotic.

You have the user's complete, precomputed birth chart below. Ground every answer in these specific placements. Reference actual signs, houses, nakshatras, planetary strengths, dashās, yogas, and doshas when they are relevant to the question.

# The User's Birth Chart (${chart.meta.system === 'vedic' ? 'Vedic / sidereal, Lahiri ayanāṁśa' : 'Western / tropical'})
Name: ${chart.meta.name}
Ascendant (Lagna): ${chart.ascendant.signName} ${chart.ascendant.degreeInSign.toFixed(2)}° — nakshatra ${chart.ascendant.nakshatra}, lord ${chart.ascendant.lord}
Moon sign (Rāśi): ${chart.moonSign}
Sun sign: ${chart.sunSign.sidereal} (sidereal) / ${chart.sunSign.tropical} (tropical)
Birth nakshatra: ${chart.nakshatra.name}, pada ${chart.nakshatra.pada} (lord ${chart.nakshatra.lord})

## Planetary Positions
${planetLines}

## Houses (whole-sign)
${houseLines}

## Current Daśā — the running stack, four levels deep
${stackLines}

### Why these daśā lords behave as they do
${assessmentLines}

### Most favourable antardaśā windows ahead (mahā/antar)
${favorableLines}

### Most challenging antardaśā windows ahead (mahā/antar)
${challengingLines}

## Yogas
${yogaLines}

## Doshas
${doshaLines}

## Divisional Charts (Vargas) — read the matching varga for domain questions
${vargaLines}

## Planetary Strength — Vimśopaka bala (0–100, aggregated across the sixteen ṣoḍaśavarga charts)
${vimLines}
${transitBlock}${referenceBlock}
# How to respond
- Answer in the user's language (BCP-47: ${language}). If it is "en", respond in English.
- Be specific and personal: tie your reading to the placements above.
- For domain-specific questions, reason from the matching divisional chart: career/profession → D10, marriage/spouse → D9, children → D7, property/home → D4, education → D24, parents → D12, spirituality → D20, misfortunes/character → D30. Weigh a planet's Vimśopaka strength when judging how strongly it delivers its results.
- Daśā says *when* a theme is due; gochar says *what the sky is doing about it now*. Read them together — a favourable daśā under a hard Saturn transit delivers slowly, not never.
- For "when" questions, time your answer from the daśā stack: the mahādaśā sets the chapter, the antardaśā the year, the pratyantar/sūkṣma the weeks. Name the actual dates and lords, and use the favourable/challenging windows above when the user asks about the road ahead.
- The favourability scores are computed from the chart, not guesswork — when you call a period strong or difficult, say briefly why (the reasons above), so the reading is explainable rather than pronounced.
- Where Reference Material is supplied, reason from it — it is this system's own doctrine and keeps your rules consistent. The chart always wins over the reference: if a principle does not apply to these placements, say so rather than forcing it.
- Explain astrological concepts in simple, human terms.
- Describe tendencies, timings, and possibilities — never present predictions as guaranteed facts. Respect uncertainty and the user's free will.
- Be encouraging and constructive. When a placement is challenging, offer perspective and practical remedies (gemstones, colours, mantras, timing) rather than fear.
- Use light Markdown (short headings, bold, bullet lists) for readability. Keep answers focused — usually 2–5 short paragraphs.
- Never give definitive medical, legal, or financial directives; frame health, wealth, and legal topics as guidance and suggest consulting professionals for decisions.`;
}

/** Render the live gochar reading as prompt context. */
function buildTransitBlock(t: TransitReport): string {
  const day = (iso: string) => iso.slice(0, 10);

  const positions = t.positions
    .map((p) => {
      const bits = [
        `${p.signName} ${p.degreeInSign.toFixed(1)}°`,
        p.retrograde ? 'retrograde' : null,
        `house ${p.houseFromMoon} from natal Moon`,
        `house ${p.houseFromLagna} from lagna`,
        p.note,
      ].filter(Boolean);
      return `- ${p.id}: ${bits.join(', ')}`;
    })
    .join('\n');

  const sadeSati = t.sadeSati.active
    ? `RUNNING — ${t.sadeSati.currentPhase} phase, whole period ${day(t.sadeSati.startISO!)} → ${day(t.sadeSati.endISO!)}.\n` +
      t.sadeSati.phases.map((p) => `  - ${p.phase}: ${p.signName}, ${day(p.startISO)} → ${day(p.endISO)} — ${p.description}`).join('\n')
    : t.sadeSati.startISO
      ? `Not running. Next: ${day(t.sadeSati.startISO)} → ${day(t.sadeSati.endISO!)}.`
      : 'Not running.';

  const ingresses = t.upcomingIngresses.length
    ? t.upcomingIngresses
        .map((i) => `- ${i.id} enters ${i.toSignName} on ${day(i.dateISO)} — house ${i.houseFromMoon} from the natal Moon (${i.effect})`)
        .join('\n')
    : '- No sign changes inside the searched horizon.';

  // Only the aspects onto the ascendant and the slow-graha contacts are worth
  // the tokens; the full list is mostly fast-moving noise.
  const keyAspects = t.aspects
    .filter((a) => a.to === 'Ascendant' || ['Saturn', 'Jupiter', 'Rahu', 'Ketu', 'Mars'].includes(a.from))
    .slice(0, 14)
    .map((a) => `- ${a.description} (${a.nature})`)
    .join('\n');

  return `
## Current Transits (Gochar) — the live sky as of ${day(t.atISO)}
Overall transit climate: ${t.score}/100 — ${t.headline}
${positions}

### Sāḍe Sātī
${sadeSati}

### Saturn's 2½-year dhaiya
${t.dhaiya.active ? `RUNNING — ${t.dhaiya.description} (${t.dhaiya.startISO ? day(t.dhaiya.startISO) : '?'} → ${t.dhaiya.endISO ? day(t.dhaiya.endISO) : '?'})` : t.dhaiya.description}

### Tārā bala today (from the transiting Moon)
Tārā ${t.taraBala.index} — ${t.taraBala.name} (${t.taraBala.nakshatra}): ${t.taraBala.meaning}. ${t.taraBala.favourable ? 'Supportive.' : 'Not supportive.'}

### Upcoming sign changes
${ingresses}

### Notable transit aspects to the natal chart
${keyAspects || '- None of note.'}
`;
}
