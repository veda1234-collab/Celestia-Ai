import PDFDocument from 'pdfkit';
import type { BirthChart } from '@/lib/astrology/types';
import { LUCKY_BY_SIGN } from '@/lib/astrology/signs';
import { transitsForChart } from '@/lib/astrology/transit';

const INK = '#1c1533';
const VIOLET = '#6d28d9';
const GOLD = '#b7791f';
const MUTED = '#6b6580';
const LINE = '#e6e2f2';
const BAND = '#0b0820';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

/**
 * PDFKit's built-in Helvetica is WinAnsi-encoded, which has no glyphs for the
 * IAST diacritics used throughout the app (Sāḍe Sātī, daśā, rāśi, Vimśopaka) or
 * for arrows — they come out as mojibake. Fold to the nearest ASCII so the
 * report stays readable. Embedding a Unicode font would be the richer fix, but
 * it means shipping a font binary; this keeps the report dependency-free.
 */
function pdfSafe(text: string): string {
  return text
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .normalize('NFD')
    // Strip combining marks: macrons, underdots, overdots, acutes.
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC');
}

/** Build a premium, multi-page PDF report for a birth chart. */
export function buildReport(chart: BirthChart, generatedAt: string): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true, info: { Title: `Vedastra Report — ${chart.meta.name}`, Author: 'Vedastra' } });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const finished = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  const M = 50;
  const W = doc.page.width - M * 2;
  const bottom = doc.page.height - 60;
  let y = M;

  const space = (h: number) => {
    if (y + h > bottom) {
      doc.addPage();
      y = M;
    }
  };
  const heading = (t: string) => {
    space(40);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(GOLD).text(pdfSafe(t).toUpperCase(), M, y, { characterSpacing: 1 });
    y += 18;
    doc.moveTo(M, y).lineTo(M + W, y).strokeColor(LINE).lineWidth(1).stroke();
    y += 12;
  };
  const para = (raw: string, opts: { color?: string; size?: number } = {}) => {
    const t = pdfSafe(raw);
    doc.font('Helvetica').fontSize(opts.size ?? 10).fillColor(opts.color ?? INK);
    const h = doc.heightOfString(t, { width: W });
    space(h + 8);
    doc.text(t, M, y, { width: W });
    y += h + 8;
  };

  // ── Cover band ──
  doc.rect(0, 0, doc.page.width, 130).fill(BAND);
  doc.font('Helvetica-Bold').fontSize(26).fillColor('#ffffff').text('VEDASTRA', M, 34, { characterSpacing: 3 });
  doc.font('Helvetica').fontSize(10).fillColor('#c9c2e8').text('Your Personal Astrology Report', M, 68, { characterSpacing: 1 });
  doc.font('Helvetica-Bold').fontSize(15).fillColor('#f5c451').text(pdfSafe(chart.meta.name), M, 92);
  y = 155;

  // ── Key placements ──
  const asc = chart.ascendant;
  const rows: [string, string][] = [
    ['Ascendant (Lagna)', `${asc.signName} ${asc.degreeInSign.toFixed(2)}° — ${asc.nakshatra}, lord ${asc.lord}`],
    ['Moon sign (Rāśi)', chart.moonSign],
    ['Sun sign', `${chart.sunSign.sidereal} (sidereal) · ${chart.sunSign.tropical} (Western)`],
    ['Birth nakshatra', `${chart.nakshatra.name}, pada ${chart.nakshatra.pada} (lord ${chart.nakshatra.lord})`],
    ['Current Mahādaśā', `${chart.dasha.current.maha.lord} (${fmtDate(chart.dasha.current.maha.startISO)} → ${fmtDate(chart.dasha.current.maha.endISO)})`],
    ['System', chart.meta.system === 'vedic' ? 'Vedic / sidereal (Lahiri)' : 'Western / tropical'],
  ];
  heading('Key Placements');
  for (const [k, v] of rows) {
    space(16);
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(MUTED).text(pdfSafe(k), M, y, { width: 150, continued: false });
    doc.font('Helvetica').fontSize(9.5).fillColor(INK).text(pdfSafe(v), M + 155, y, { width: W - 155 });
    y += 16;
  }
  y += 6;

  heading('Overview');
  para(chart.summary);

  // ── Planetary positions table ──
  heading('Planetary Positions');
  const cols = [
    { t: 'Planet', x: M, w: 68 },
    { t: 'Sign', x: M + 68, w: 108 },
    { t: 'House', x: M + 176, w: 42 },
    { t: 'Nakshatra', x: M + 218, w: 132 },
    { t: 'Dignity', x: M + 350, w: 72 },
    { t: 'Str', x: M + 422, w: W - 422 },
  ];
  const rowH = 17;
  const drawRow = (cells: string[], header: boolean, shade: boolean) => {
    space(rowH);
    if (header) doc.rect(M, y, W, rowH).fill(VIOLET);
    else if (shade) doc.rect(M, y, W, rowH).fill('#f6f4fc');
    cells.forEach((c, i) => {
      const col = cols[i]!;
      doc
        .font(header ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(8.5)
        .fillColor(header ? '#ffffff' : INK)
        .text(pdfSafe(c), col.x + 4, y + 5, { width: col.w - 6, lineBreak: false, ellipsis: true });
    });
    y += rowH;
  };
  drawRow(cols.map((c) => c.t), true, false);
  chart.planets.forEach((p, i) => {
    drawRow(
      [
        `${p.id}${p.retrograde ? ' (R)' : ''}`,
        `${p.degreeInSign.toFixed(1)}° ${p.signName}`,
        String(p.house),
        `${p.nakshatra} ${p.pada}`,
        p.dignity,
        String(p.strength),
      ],
      false,
      i % 2 === 1,
    );
  });
  y += 10;

  // ── Dasha ──
  heading('Vimśottari Daśā');
  const maha = chart.dasha.current.maha;
  const antar = chart.dasha.current.antar;
  para(`Current mahādaśā: ${maha.lord} (${fmtDate(maha.startISO)} → ${fmtDate(maha.endISO)})${antar ? `; antardaśā: ${antar.lord} (${fmtDate(antar.startISO)} → ${fmtDate(antar.endISO)})` : ''}.`);

  const LEVEL_LABEL = ['mahādaśā', 'antardaśā', 'pratyantardaśā', 'sūkṣmadaśā'];
  const stack = (chart.dasha.stack ?? [])
    .map((p) => `${LEVEL_LABEL[p.level - 1] ?? `level ${p.level}`} ${p.lord} (${fmtDate(p.startISO)} → ${fmtDate(p.endISO)})${p.quality ? `, ${p.quality} ${p.favorability}/100` : ''}`)
    .join('; ');
  if (stack) para(`Running now — ${stack}.`, { size: 9.5 });

  const mahaAssessment = chart.dasha.assessments?.[maha.lord];
  if (mahaAssessment) {
    para(`${maha.lord} scores ${mahaAssessment.score}/100 (${mahaAssessment.quality}) as a daśā lord: ${mahaAssessment.reasons.join('; ')}.`, { color: MUTED, size: 9.5 });
  }

  const fmtWindow = (w: { mahaLord: string; lord: string; startISO: string; endISO: string; score: number }) =>
    `${w.mahaLord}–${w.lord} (${fmtDate(w.startISO)} → ${fmtDate(w.endISO)}, ${w.score}/100)`;
  if (chart.dasha.favorablePeriods?.length) {
    para(`Favourable windows ahead: ${chart.dasha.favorablePeriods.map(fmtWindow).join('; ')}.`, { size: 9.5 });
  }
  if (chart.dasha.challengingPeriods?.length) {
    para(`Windows to navigate carefully: ${chart.dasha.challengingPeriods.map(fmtWindow).join('; ')}.`, { size: 9.5 });
  }

  const upcoming = chart.dasha.sequence.filter((d) => Date.parse(d.startISO) > Date.now()).slice(0, 5);
  if (upcoming.length) para(`Upcoming mahādaśās: ${upcoming.map((d) => `${d.lord} (${fmtDate(d.startISO)})`).join(', ')}.`, { color: MUTED, size: 9.5 });

  // ── Transits (gochar) ──
  // Computed at render time, not read off the chart, so the report reflects the
  // sky on the day it was generated.
  try {
    // `generatedAt` is a localised display string, not a parseable timestamp.
    const t = transitsForChart(chart);
    heading('Current Transits (Gochar)');
    para(`Transit climate: ${t.score}/100 — ${t.headline}`);
    para(
      t.positions
        .map((p) => `${p.id} in ${p.signName}${p.retrograde ? ' (R)' : ''}, house ${p.houseFromMoon} from the Moon — ${p.effect}`)
        .join('; ') + '.',
      { size: 9.5 },
    );
    if (t.sadeSati.active && t.sadeSati.startISO && t.sadeSati.endISO) {
      para(`Sāḍe Sātī is running (${fmtDate(t.sadeSati.startISO)} → ${fmtDate(t.sadeSati.endISO)}), currently the ${t.sadeSati.currentPhase} phase.`, { size: 9.5 });
      for (const ph of t.sadeSati.phases) {
        para(`  ${ph.phase}: ${ph.signName}, ${fmtDate(ph.startISO)} → ${fmtDate(ph.endISO)} — ${ph.description}`, { color: MUTED, size: 9 });
      }
    } else if (t.sadeSati.startISO && t.sadeSati.endISO) {
      para(`Sāḍe Sātī is not running; the next begins ${fmtDate(t.sadeSati.startISO)} and ends ${fmtDate(t.sadeSati.endISO)}.`, { size: 9.5 });
    }
    if (t.dhaiya.active) para(t.dhaiya.description, { size: 9.5 });
    if (t.upcomingIngresses.length) {
      para(
        'Upcoming sign changes: ' +
          t.upcomingIngresses.map((i) => `${i.id} → ${i.toSignName} (${fmtDate(i.dateISO)})`).join(', ') + '.',
        { color: MUTED, size: 9.5 },
      );
    }
  } catch (err) {
    console.error('transit section skipped', err);
  }

  // ── Yogas & Doshas ──
  heading('Yogas & Doshas');
  if (chart.yogas.length) {
    for (const yg of chart.yogas) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(INK);
      space(14);
      doc.text(pdfSafe(`• ${yg.name}`), M, y);
      y += 14;
      para(yg.description, { color: MUTED, size: 9.5 });
    }
  } else {
    para('No tracked classical yogas are formed in this chart.', { color: MUTED });
  }
  for (const d of chart.doshas) {
    para(`${d.name}: ${d.present ? `present (${d.severity})` : 'not present'}. ${d.description}`, { size: 9.5 });
  }

  // ── Lucky ──
  const lucky = LUCKY_BY_SIGN[chart.ascendant.sign]!;
  heading('Lucky Factors');
  para(`Colours: ${lucky.colors.join(', ')}   ·   Numbers: ${lucky.numbers.join(', ')}   ·   Gemstone: ${lucky.gemstone}   ·   Day: ${lucky.day}   ·   Direction: ${lucky.direction}.`);
  para('Consult a qualified astrologer before wearing any gemstone.', { color: MUTED, size: 9 });

  // ── Footers ──
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        pdfSafe(`Vedastra · generated ${generatedAt} · for reflection, not a guarantee · page ${i + 1} of ${range.count}`),
        M,
        doc.page.height - 38,
        { width: W, align: 'center' },
      );
  }

  doc.end();
  return finished;
}
