import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import type { BirthChart, PlanetId } from '@/lib/astrology/types';
import { LUCKY_BY_SIGN, ZODIAC } from '@/lib/astrology/signs';
import { transitsForChart } from '@/lib/astrology/transit';
import type { TransitReport } from '@/lib/astrology/transit';
import { COLOR, DIGNITY_TONE, PAGE, TYPE, toneForScore } from './theme';
import { drawNorthIndianChart, drawSouthIndianChart, drawVedastraMark, type CellPlanet } from './chart-draw';

const A4 = { w: 595.28, h: 841.89 };
const M = PAGE.margin;
const CONTENT_W = A4.w - M * 2;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const fmtMonth = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

/**
 * PDFKit's built-in Helvetica is WinAnsi-encoded and has no glyphs for the IAST
 * diacritics this report is full of (Sāḍe Sātī, daśā, rāśi, Vimśopaka). We embed
 * Liberation instead, which covers Latin Extended Additional. This fold is the
 * fallback for the case where the font files are missing at runtime — without it
 * the report would render mojibake rather than plain ASCII.
 */
function asciiFold(text: string): string {
  return text
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC');
}

const FONT_FILES = {
  serif: 'LiberationSerif-Regular.ttf',
  serifBold: 'LiberationSerif-Bold.ttf',
  serifItalic: 'LiberationSerif-Italic.ttf',
  sans: 'LiberationSans-Regular.ttf',
  sansBold: 'LiberationSans-Bold.ttf',
  // Liberation has no zodiac signs (U+2648–2653) or ℞ (U+211E); DejaVu does, so
  // it is loaded purely to set those symbols.
  symbol: 'DejaVuSans.ttf',
  // DejaVu Sans Mono — every numeral (the print echo of the on-screen mono law);
  // it also carries the IAST diacritics and ℞.
  mono: 'DejaVuSansMono.ttf',
  monoBold: 'DejaVuSansMono-Bold.ttf',
} as const;

type FontKey = keyof typeof FONT_FILES;
type FontMap = Record<FontKey, string>;

const HELVETICA_FALLBACK: FontMap = {
  serif: 'Times-Roman', serifBold: 'Times-Bold', serifItalic: 'Times-Italic',
  sans: 'Helvetica', sansBold: 'Helvetica-Bold', symbol: 'Helvetica',
  mono: 'Courier', monoBold: 'Courier-Bold',
};

/**
 * Register the embedded fonts. Returns the font-name map plus whether Unicode
 * text is safe; if any file is missing we fall back to the built-in cores and
 * fold text to ASCII rather than failing the whole report.
 */
function loadFonts(doc: PDFKit.PDFDocument): { fonts: FontMap; unicode: boolean } {
  const dir = path.join(process.cwd(), 'public', 'fonts');
  try {
    const fonts = {} as FontMap;
    for (const [key, file] of Object.entries(FONT_FILES) as [FontKey, string][]) {
      const buf = fs.readFileSync(path.join(dir, file));
      const name = `v-${key}`;
      doc.registerFont(name, buf);
      fonts[key] = name;
    }
    return { fonts, unicode: true };
  } catch (err) {
    console.error('report fonts unavailable; falling back to core fonts', err);
    return { fonts: HELVETICA_FALLBACK, unicode: false };
  }
}

/** Build the Vedastra birth-chart report. */
export function buildReport(chart: BirthChart, generatedAt: string): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: M,
    bufferPages: true,
    autoFirstPage: false,
    info: { Title: `Vedastra Report — ${chart.meta.name}`, Author: 'Vedastra', Subject: 'Vedic birth chart analysis' },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const finished = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  const { fonts: F, unicode } = loadFonts(doc);
  /** All text passes through here so the ASCII fallback is impossible to forget. */
  const T = (s: string) => (unicode ? s : asciiFold(s));

  let y = M;
  /** Pages that carry the footer — the cover is excluded. */
  const contentPages = new Set<number>();
  let pageIndex = -1;

  const newPage = () => {
    doc.addPage();
    pageIndex += 1;
    contentPages.add(pageIndex);
    y = M + 16;
  };

  /** Ensure `h` points remain before the footer, else start a fresh page. */
  const need = (h: number) => {
    if (y + h > A4.h - PAGE.footer) newPage();
  };

  // ── Text primitives ──────────────────────────────────────────────────────
  const para = (
    text: string,
    opts: { size?: number; color?: string; font?: FontKey; gap?: number; width?: number; indent?: number } = {},
  ) => {
    const size = opts.size ?? TYPE.body;
    const width = opts.width ?? CONTENT_W;
    const x = M + (opts.indent ?? 0);
    doc.font(F[opts.font ?? 'sans']).fontSize(size).fillColor(opts.color ?? COLOR.ink);
    const t = T(text);
    const h = doc.heightOfString(t, { width });
    need(h + 6);
    doc.text(t, x, y, { width, lineGap: 1.6 });
    y += h + (opts.gap ?? 8);
  };

  /** Numbered section header: small gold label, serif title, hairline. */
  let sectionNo = 0;
  const section = (title: string, kicker?: string) => {
    sectionNo += 1;
    need(128);
    const label = `${String(sectionNo).padStart(2, '0')} — ${kicker ?? title}`;
    doc.font(F.sansBold).fontSize(TYPE.sectionLabel).fillColor(COLOR.gold);
    doc.text(T(label.toUpperCase()), M, y, { characterSpacing: 1.6, width: CONTENT_W });
    y += 14;
    doc.font(F.serifBold).fontSize(TYPE.sectionTitle).fillColor(COLOR.ink);
    doc.text(T(title), M, y, { width: CONTENT_W });
    y += TYPE.sectionTitle + 8;
    doc.moveTo(M, y).lineTo(M + CONTENT_W, y).lineWidth(0.8).stroke(COLOR.gold);
    doc.moveTo(M, y + 2).lineTo(M + CONTENT_W, y + 2).lineWidth(0.4).stroke(COLOR.line);
    y += 14;
  };

  /** A soft panel with an optional heading; returns the y after the panel. */
  const panel = (h: number, draw: (px: number, py: number, pw: number) => void, fill: string = COLOR.wash) => {
    need(h + 10);
    doc.roundedRect(M, y, CONTENT_W, h, 7).fill(fill);
    doc.roundedRect(M, y, CONTENT_W, h, 7).lineWidth(0.6).stroke(COLOR.line);
    draw(M + 14, y + 12, CONTENT_W - 28);
    y += h + 12;
  };

  /** Horizontal 0–100 meter with a tinted track. */
  const meter = (x: number, my: number, w: number, score: number, tone = toneForScore(score)) => {
    doc.roundedRect(x, my, w, 6, 3).fill(COLOR.line);
    const filled = Math.max(3, (Math.max(0, Math.min(100, score)) / 100) * w);
    doc.roundedRect(x, my, filled, 6, 3).fill(tone.fg);
  };

  /**
   * Draw a planet name and, when retrograde, the ℞ mark after it. The mark has
   * to be a separate run in the symbol font — the text face has no such glyph,
   * so inlining it would silently drop the character.
   */
  const planetName = (name: string, px: number, py: number, size: number, retro: boolean, color = COLOR.ink) => {
    doc.font(F.sansBold).fontSize(size).fillColor(color);
    doc.text(T(name), px, py, { lineBreak: false });
    if (!retro) return;
    const w = doc.widthOfString(T(name));
    // ℞ only exists in the symbol font; the core-font fallback gets "(R)".
    doc.font(unicode ? F.symbol : F.sans).fontSize(size * 0.92).fillColor(COLOR.bad);
    doc.text(unicode ? '℞' : '(R)', px + w + 2.5, py + 0.4, { lineBreak: false });
  };

  /** Small rounded chip with tinted background. */
  const chip = (x: number, cy: number, text: string, fg: string, bg: string, size = TYPE.tiny) => {
    doc.font(F.sansBold).fontSize(size);
    const w = doc.widthOfString(T(text)) + 12;
    doc.roundedRect(x, cy - 2, w, size + 7, (size + 7) / 2).fill(bg);
    doc.fillColor(fg).text(T(text), x + 6, cy + 1.5, { lineBreak: false });
    return w;
  };

  // ── Cover ────────────────────────────────────────────────────────────────
  doc.addPage();
  pageIndex += 1; // cover is page 0 and gets no footer

  doc.rect(0, 0, A4.w, A4.h).fill(COLOR.night);

  // Deterministic starfield — a seeded LCG so the same chart yields the same PDF.
  let seed = 20260720;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < 150; i++) {
    const sx = rnd() * A4.w;
    const sy = rnd() * A4.h;
    const r = rnd() * 1.25 + 0.25;
    doc.circle(sx, sy, r).fill(rnd() > 0.85 ? COLOR.goldBright : '#3B3363');
  }

  // Double gold frame.
  doc.rect(M - 12, M - 12, A4.w - (M - 12) * 2, A4.h - (M - 12) * 2).lineWidth(1.2).stroke(COLOR.gold);
  doc.rect(M - 7, M - 7, A4.w - (M - 7) * 2, A4.h - (M - 7) * 2).lineWidth(0.4).stroke('#5C4A1E');

  doc.font(F.sansBold).fontSize(TYPE.coverLabel).fillColor(COLOR.goldBright);
  doc.text(T('VEDASTRA'), M + 10, M + 34, { characterSpacing: 6, width: CONTENT_W - 20, align: 'center' });

  doc.font(F.sans).fontSize(TYPE.tiny).fillColor('#9C93C4');
  doc.text(T('VEDIC ASTROLOGY · JYOTIṢA'), M + 10, M + 50, {
    characterSpacing: 2.4, width: CONTENT_W - 20, align: 'center',
  });

  // Central emblem.
  const cx = A4.w / 2;
  const emblemY = 250;
  doc.circle(cx, emblemY, 54).lineWidth(0.7).stroke('#4B3F7A');
  doc.circle(cx, emblemY, 44).lineWidth(0.4).stroke('#3A3060');
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    doc.circle(cx + Math.cos(a) * 54, emblemY + Math.sin(a) * 54, 1.6).fill(i % 3 === 0 ? COLOR.goldBright : '#6C5FA8');
  }
  // The brand star, drawn from the same geometry as the on-screen mark.
  drawVedastraMark(doc as never, cx, emblemY, 34, COLOR.goldBright);

  // Ascendant glyph beneath it. The text faces carry no zodiac glyphs, and on
  // the core-font fallback nothing can render one, so set the sign's short name.
  if (unicode) {
    doc.font(F.symbol).fontSize(15).fillColor('#B9AFE0');
    doc.text(ZODIAC[chart.ascendant.sign]!.glyph, cx - 40, emblemY + 62, { width: 80, align: 'center' });
  } else {
    doc.font(F.serifBold).fontSize(12).fillColor('#B9AFE0');
    doc.text(chart.ascendant.signName.toUpperCase(), cx - 60, emblemY + 64, { width: 120, align: 'center' });
  }

  doc.font(F.serifBold).fontSize(TYPE.coverName).fillColor(COLOR.white);
  doc.text(T(chart.meta.name), M + 10, 362, { width: CONTENT_W - 20, align: 'center' });

  doc.font(F.serifItalic).fontSize(12).fillColor('#B9AFE0');
  doc.text(T('Birth Chart & Life Reading'), M + 10, 402, { width: CONTENT_W - 20, align: 'center' });

  doc.moveTo(cx - 60, 432).lineTo(cx + 60, 432).lineWidth(0.8).stroke(COLOR.gold);

  // Birth data grid.
  const born = new Date(chart.meta.utcISO);
  const coverRows: [string, string][] = [
    ['DATE OF BIRTH', new Date(chart.meta.localISO).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })],
    ['TIME OF BIRTH', chart.meta.localISO.slice(11, 16)],
    ['ASCENDANT', `${chart.ascendant.signName} ${chart.ascendant.degreeInSign.toFixed(2)}°`],
    ['MOON SIGN', chart.moonSign],
    ['NAKSHATRA', `${chart.nakshatra.name} · pada ${chart.nakshatra.pada}`],
    ['COORDINATES', `${chart.meta.lat.toFixed(3)}°, ${chart.meta.lon.toFixed(3)}° · ${chart.meta.timezone}`],
  ];
  let cy = 470;
  for (const [k, v] of coverRows) {
    doc.font(F.sans).fontSize(TYPE.tiny).fillColor('#8A80B4');
    doc.text(T(k), M + 70, cy, { width: 150, characterSpacing: 1.2, lineBreak: false });
    // Values in mono — the print echo of the on-screen numeral law (dateline feel).
    doc.font(F.mono).fontSize(10).fillColor(COLOR.white);
    doc.text(T(v), M + 225, cy - 1, { width: CONTENT_W - 235, lineBreak: false });
    cy += 16;
    doc.moveTo(M + 70, cy + 2).lineTo(M + CONTENT_W - 70, cy + 2).lineWidth(0.3).stroke('#2E2650');
    cy += 11;
  }

  // Closing ornament, so the lower third is not dead space.
  const ornY = cy + 34;
  doc.moveTo(cx - 78, ornY).lineTo(cx - 12, ornY).lineWidth(0.5).stroke(COLOR.gold);
  doc.moveTo(cx + 12, ornY).lineTo(cx + 78, ornY).lineWidth(0.5).stroke(COLOR.gold);
  doc.save();
  doc.rect(cx - 4, ornY - 4, 8, 8).fill(COLOR.gold);
  doc.restore();
  doc.font(F.serifItalic).fontSize(9.6).fillColor('#7A719F');
  doc.text(T('Computed from your exact moment and place of birth,'), M + 10, ornY + 22, {
    width: CONTENT_W - 20, align: 'center', lineBreak: false,
  });
  doc.text(T('using sidereal positions and the Lahiri ayanāṁśa.'), M + 10, ornY + 36, {
    width: CONTENT_W - 20, align: 'center', lineBreak: false,
  });

  doc.font(F.sans).fontSize(TYPE.tiny).fillColor('#6F669A');
  doc.text(T(`Prepared ${generatedAt}`), M + 10, A4.h - 96, { width: CONTENT_W - 20, align: 'center' });
  doc.font(F.serifItalic).fontSize(8.6).fillColor('#5B537F');
  doc.text(T('For reflection and insight — never a substitute for your own judgement.'), M + 10, A4.h - 82, {
    width: CONTENT_W - 20, align: 'center',
  });
  void born;

  // ── The Essentials ───────────────────────────────────────────────────────
  newPage();
  section('The Essentials', 'Overview');

  const maha = chart.dasha.current.maha;
  const stat: [string, string][] = [
    ['Ascendant (Lagna)', `${chart.ascendant.signName} ${chart.ascendant.degreeInSign.toFixed(2)}°`],
    ['Moon sign (Rāśi)', chart.moonSign],
    ['Sun sign', `${chart.sunSign.sidereal} · ${chart.sunSign.tropical} (West)`],
    ['Birth nakshatra', `${chart.nakshatra.name} ${chart.nakshatra.pada}`],
    ['Running mahādaśā', `${maha.lord} → ${fmtMonth(maha.endISO)}`],
    ['Ayanāṁśa (Lahiri)', `${chart.meta.ayanamsa.toFixed(3)}°`],
  ];

  // Three-across stat cards.
  const cardW = (CONTENT_W - 16) / 3;
  const cardH = 46;
  need(cardH * 2 + 22);
  stat.forEach(([k, v], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const px = M + col * (cardW + 8);
    const py = y + row * (cardH + 10);
    doc.roundedRect(px, py, cardW, cardH, 6).fill(COLOR.wash);
    doc.roundedRect(px, py, cardW, cardH, 6).lineWidth(0.6).stroke(COLOR.line);
    doc.rect(px, py + 8, 2.2, cardH - 16).fill(COLOR.gold);
    doc.font(F.sans).fontSize(TYPE.tiny).fillColor(COLOR.muted);
    doc.text(T(k), px + 11, py + 10, { width: cardW - 20 });
    doc.font(F.serifBold).fontSize(11.5).fillColor(COLOR.ink);
    doc.text(T(v), px + 11, py + 24, { width: cardW - 20, lineBreak: false, ellipsis: true });
  });
  y += cardH * 2 + 22;

  para(chart.summary, { font: 'serif', size: 11, color: COLOR.ink, gap: 12 });

  // ── Charts ───────────────────────────────────────────────────────────────
  const byHouseFrom = (planets: { id: PlanetId; house: number; retrograde?: boolean }[]) => {
    const m = new Map<number, CellPlanet[]>();
    for (const p of planets) {
      const list = m.get(p.house) ?? [];
      list.push({ id: p.id, retrograde: p.retrograde });
      m.set(p.house, list);
    }
    return m;
  };

  // The three diagrams need a full page between them; starting the section here
  // rather than letting it flow leaves a third of the previous page blank.
  newPage();
  section('The Charts', 'Rāśi & Navāṁśa');

  const d1ByHouse = byHouseFrom(chart.planets);
  const d1HouseSigns = chart.houses.map((h) => h.sign);

  const d9 = (chart.vargas ?? []).find((v) => v.id === 'D9');
  const d9Asc = d9 ? d9.ascendant.sign : chart.navamsa.ascendantSign;
  const d9HouseSigns = Array.from({ length: 12 }, (_, i) => (d9Asc + i) % 12);
  const d9ByHouse = d9
    ? byHouseFrom(d9.planets.map((p) => ({ id: p.id, house: p.house, retrograde: p.retrograde })))
    : byHouseFrom(
        chart.navamsa.positions.map((p) => ({ id: p.id, house: (((p.sign - d9Asc) % 12) + 12) % 12 + 1 })),
      );

  const chartSize = (CONTENT_W - 22) / 2;
  need(chartSize + 44);

  const captionFor = (x: number, title: string, sub: string, cyy: number) => {
    doc.font(F.sansBold).fontSize(TYPE.small).fillColor(COLOR.ink);
    doc.text(T(title), x, cyy, { width: chartSize, align: 'center' });
    doc.font(F.sans).fontSize(TYPE.tiny).fillColor(COLOR.muted);
    doc.text(T(sub), x, cyy + 11, { width: chartSize, align: 'center' });
  };

  captionFor(M, 'Rāśi — D1', 'North Indian · houses fixed', y);
  captionFor(M + chartSize + 22, 'Navāṁśa — D9', 'North Indian · houses fixed', y);
  y += 26;

  drawNorthIndianChart(doc as never, {
    x: M, y, size: chartSize, houseSigns: d1HouseSigns, byHouse: d1ByHouse,
    ascendantSign: chart.ascendant.sign, fontRegular: F.sans, fontBold: F.sansBold,
  });
  drawNorthIndianChart(doc as never, {
    x: M + chartSize + 22, y, size: chartSize, houseSigns: d9HouseSigns, byHouse: d9ByHouse,
    ascendantSign: d9Asc, fontRegular: F.sans, fontBold: F.sansBold,
  });
  y += chartSize + 18;

  para(
    'Numbers in each house are rāśi indices (1 = Aries). Planets are shown by their two-letter forms; ˚ marks retrograde motion.',
    { size: TYPE.tiny, color: COLOR.muted, gap: 14 },
  );

  // South Indian rendering of the same rāśi chart.
  const southSize = Math.min(250, CONTENT_W * 0.52);
  need(southSize + 42);
  doc.font(F.sansBold).fontSize(TYPE.small).fillColor(COLOR.ink);
  doc.text(T('Rāśi — D1 · South Indian'), M, y, { width: CONTENT_W, align: 'center' });
  doc.font(F.sans).fontSize(TYPE.tiny).fillColor(COLOR.muted);
  doc.text(T('signs fixed · ascendant marked'), M, y + 11, { width: CONTENT_W, align: 'center' });
  y += 26;
  drawSouthIndianChart(doc as never, {
    x: M + (CONTENT_W - southSize) / 2, y, size: southSize,
    houseSigns: d1HouseSigns, byHouse: d1ByHouse,
    ascendantSign: chart.ascendant.sign, fontRegular: F.sans, fontBold: F.sansBold,
  });
  y += southSize + 16;

  // ── Planetary positions ──────────────────────────────────────────────────
  newPage();
  section('Planetary Positions', 'Grahas');

  const cols = [
    { t: 'Graha', x: M, w: 62, align: 'left' as const },
    { t: 'Sign', x: M + 62, w: 104, align: 'left' as const },
    { t: 'Hse', x: M + 166, w: 30, align: 'center' as const },
    { t: 'Nakshatra', x: M + 196, w: 118, align: 'left' as const },
    { t: 'Dignity', x: M + 314, w: 78, align: 'left' as const },
    { t: 'Strength', x: M + 392, w: CONTENT_W - 392, align: 'left' as const },
  ];
  const rowH = 20;

  need(rowH * 3);
  doc.rect(M, y, CONTENT_W, rowH).fill(COLOR.night);
  doc.font(F.sansBold).fontSize(TYPE.tiny).fillColor(COLOR.goldBright);
  for (const c of cols) {
    doc.text(T(c.t.toUpperCase()), c.x + 6, y + 6.5, { width: c.w - 8, align: c.align, characterSpacing: 0.8 });
  }
  y += rowH;

  chart.planets.forEach((p, i) => {
    need(rowH);
    if (i % 2 === 1) doc.rect(M, y, CONTENT_W, rowH).fill(COLOR.wash);
    planetName(p.id, cols[0]!.x + 6, y + 6, TYPE.small, p.retrograde);
    doc.font(F.sans).fontSize(TYPE.small).fillColor(COLOR.ink);
    doc.text(T(`${p.degreeInSign.toFixed(2)}° ${p.signName}`), cols[1]!.x + 6, y + 6, { width: cols[1]!.w - 8, lineBreak: false });
    doc.text(String(p.house), cols[2]!.x + 6, y + 6, { width: cols[2]!.w - 8, align: 'center', lineBreak: false });
    doc.fillColor(COLOR.muted);
    doc.text(T(`${p.nakshatra} ${p.pada}`), cols[3]!.x + 6, y + 6, { width: cols[3]!.w - 8, lineBreak: false });
    const tone = DIGNITY_TONE[p.dignity] ?? DIGNITY_TONE.neutral!;
    chip(cols[4]!.x + 6, y + 5, p.dignity, tone.fg, tone.bg);
    // Strength as a mini meter plus the number.
    meter(cols[5]!.x + 6, y + 8.5, cols[5]!.w - 40, p.strength);
    doc.font(F.sansBold).fontSize(TYPE.tiny).fillColor(COLOR.muted);
    doc.text(String(p.strength), cols[5]!.x + cols[5]!.w - 28, y + 6, { width: 24, align: 'right', lineBreak: false });
    y += rowH;
  });
  doc.moveTo(M, y).lineTo(M + CONTENT_W, y).lineWidth(0.5).stroke(COLOR.line);
  y += 16;

  // Vimśopaka strength across the ṣoḍaśavarga.
  if (chart.vimshopaka) {
    section('Planetary Strength', 'Vimśopaka bala');
    para(
      'Vimśopaka bala aggregates each graha’s dignity across the sixteen ṣoḍaśavarga charts — a fuller measure of how reliably it can deliver its promise than the rāśi alone.',
      { size: TYPE.small, color: COLOR.muted, gap: 12 },
    );
    const entries = Object.entries(chart.vimshopaka).sort((a, b) => b[1] - a[1]);
    for (const [id, v] of entries) {
      need(17);
      doc.font(F.sansBold).fontSize(TYPE.small).fillColor(COLOR.ink);
      doc.text(T(id), M, y + 1, { width: 66, lineBreak: false });
      meter(M + 72, y + 3.5, CONTENT_W - 118, v);
      doc.font(F.sansBold).fontSize(TYPE.tiny).fillColor(toneForScore(v).fg);
      doc.text(`${v}`, M + CONTENT_W - 40, y, { width: 36, align: 'right', lineBreak: false });
      y += 17;
    }
    y += 8;
  }

  // ── Divisional charts overview ───────────────────────────────────────────
  if (chart.vargas?.length) {
    section('Divisional Charts', 'Vargas');
    para(
      'Each varga magnifies one department of life. A promise made in the rāśi is only delivered if the matching divisional chart supports it — which is why career is read in D10 and marriage in D9 rather than from the birth chart alone.',
      { size: TYPE.small, color: COLOR.muted, gap: 12 },
    );

    for (const v of chart.vargas) {
      need(30);
      doc.font(F.sansBold).fontSize(TYPE.small).fillColor(COLOR.ink);
      doc.text(T(`${v.id}`), M, y + 2, { width: 32, lineBreak: false });
      doc.font(F.serif).fontSize(TYPE.small).fillColor(COLOR.ink);
      doc.text(T(v.name), M + 34, y + 2, { width: 96, lineBreak: false, ellipsis: true });
      doc.font(F.sans).fontSize(TYPE.tiny).fillColor(COLOR.muted);
      doc.text(T(v.purpose), M + 134, y + 3, { width: CONTENT_W - 134 - 96, lineBreak: false, ellipsis: true });
      meter(M + CONTENT_W - 92, y + 4.5, 60, v.strength);
      doc.font(F.sansBold).fontSize(TYPE.tiny).fillColor(toneForScore(v.strength).fg);
      doc.text(String(v.strength), M + CONTENT_W - 28, y + 1, { width: 26, align: 'right', lineBreak: false });
      y += 15;
      if (v.vargottamaPlanets.length) {
        doc.font(F.sansBold).fontSize(TYPE.tiny).fillColor(COLOR.good);
        doc.text(T(`vargottama: ${v.vargottamaPlanets.join(', ')}`), M + 34, y, { width: CONTENT_W - 70, lineBreak: false });
        y += 11;
      }
      doc.moveTo(M, y + 1).lineTo(M + CONTENT_W, y + 1).lineWidth(0.3).stroke(COLOR.line);
      y += 6;
    }
    y += 6;
    para('Charts marked non-classical (D5, D6, D8, D11) follow a documented cyclic scheme, as the classical sources give no single agreed rule; weigh them more lightly.', {
      size: TYPE.tiny, color: COLOR.faint,
    });
  }

  // ── Daśā ─────────────────────────────────────────────────────────────────
  section('The Daśā Timeline', 'Vimśottari');

  const stack = chart.dasha.stack ?? [];
  const LEVELS = ['Mahādaśā', 'Antardaśā', 'Pratyantardaśā', 'Sūkṣmadaśā'];

  if (stack.length) {
    panel(26 + stack.length * 17, (px, py, pw) => {
      doc.font(F.sansBold).fontSize(TYPE.tiny).fillColor(COLOR.muted);
      doc.text(T('RUNNING NOW'), px, py, { characterSpacing: 1.2, width: pw });
      let ly = py + 14;
      for (const p of stack) {
        const tone = toneForScore(p.favorability ?? 50);
        doc.font(F.sans).fontSize(TYPE.tiny).fillColor(COLOR.faint);
        doc.text(T(LEVELS[p.level - 1] ?? `L${p.level}`), px, ly + 2, { width: 82, lineBreak: false });
        doc.font(F.sansBold).fontSize(TYPE.small).fillColor(COLOR.ink);
        doc.text(T(p.lord), px + 86, ly + 1, { width: 58, lineBreak: false });
        doc.font(F.sans).fontSize(TYPE.tiny).fillColor(COLOR.muted);
        doc.text(T(`${fmtDate(p.startISO)} → ${fmtDate(p.endISO)}`), px + 146, ly + 2, { width: 168, lineBreak: false });
        if (p.quality) chip(px + pw - 108, ly, `${p.quality} ${p.favorability}`, tone.fg, tone.bg);
        ly += 17;
      }
    });
  }

  const assessment = chart.dasha.assessments?.[maha.lord];
  if (assessment) {
    para(`Why ${maha.lord} behaves as it does — ${assessment.score}/100, ${assessment.quality}: ${assessment.reasons.join('; ')}.`, {
      size: TYPE.small, color: COLOR.muted, gap: 12,
    });
  }

  // Mahādaśā ribbon: proportional bars for the whole 120-year cycle.
  const seq = chart.dasha.sequence;
  if (seq.length) {
    doc.font(F.sansBold).fontSize(TYPE.tiny).fillColor(COLOR.muted);
    need(20);
    doc.text(T('THE FULL 120-YEAR CYCLE'), M, y, { characterSpacing: 1.2, width: CONTENT_W });
    y += 14;
    // The one object shared pixel-for-concept with the on-screen Plate 03: a
    // proportional 120-year band, quality-tinted fills, and a gold NOW-caret.
    const spanStart = Date.parse(seq[0]!.startISO);
    const spanMs = Date.parse(seq[seq.length - 1]!.endISO) - spanStart;
    const barH = 20;
    need(barH + 28);
    const ribbonTop = y;
    let bx = M;
    const nowMs = Date.now();
    for (const d of seq) {
      const w = (d.years / 120) * CONTENT_W;
      const tone = toneForScore(d.favorability ?? 50);
      doc.rect(bx, y, w, barH).fill(tone.bg);
      doc.rect(bx, y, w, barH).lineWidth(0.4).stroke(COLOR.paper);
      if (w > 15) {
        doc.font(F.serifBold).fontSize(7.5).fillColor(COLOR.ink);
        doc.text(T(d.lord.slice(0, 3)), bx, y + 4.5, { width: w, align: 'center', lineBreak: false });
        if (w > 26) {
          doc.font(F.mono).fontSize(6).fillColor(COLOR.muted);
          doc.text(`${d.years}y`, bx, y + 12, { width: w, align: 'center', lineBreak: false });
        }
      }
      bx += w;
    }
    doc.rect(M, ribbonTop, CONTENT_W, barH).lineWidth(0.6).stroke(COLOR.rule);
    // NOW caret
    const nowX = M + Math.max(0, Math.min(1, (nowMs - spanStart) / spanMs)) * CONTENT_W;
    doc.rect(nowX - 1, ribbonTop - 2, 2, barH + 4).fill(COLOR.goldBright);
    y += barH + 5;
    doc.font(F.mono).fontSize(TYPE.tiny).fillColor(COLOR.faint);
    doc.text(`${new Date(seq[0]!.startISO).getFullYear()}`, M, y, { width: 120, lineBreak: false });
    doc.fillColor(COLOR.gold).text('now', M, y, { width: CONTENT_W, align: 'center', lineBreak: false });
    doc.fillColor(COLOR.faint).text(`${new Date(seq[seq.length - 1]!.endISO).getFullYear()}`, M + CONTENT_W - 120, y, { width: 120, align: 'right', lineBreak: false });
    y += 16;
    para('The gold caret marks today; each block’s tint reflects that lord’s computed favourability.', {
      size: TYPE.tiny, color: COLOR.faint, gap: 12,
    });
  }

  const windowRow = (w: { mahaLord: string; lord: string; startISO: string; endISO: string; score: number }, tone: { fg: string; bg: string }) => {
    need(16);
    doc.font(F.sansBold).fontSize(TYPE.small).fillColor(COLOR.ink);
    doc.text(T(`${w.mahaLord}–${w.lord}`), M + 4, y + 1, { width: 120, lineBreak: false });
    doc.font(F.sans).fontSize(TYPE.tiny).fillColor(COLOR.muted);
    doc.text(T(`${fmtDate(w.startISO)} → ${fmtDate(w.endISO)}`), M + 130, y + 2, { width: 190, lineBreak: false });
    meter(M + CONTENT_W - 118, y + 3.5, 78, w.score, tone);
    doc.font(F.sansBold).fontSize(TYPE.tiny).fillColor(tone.fg);
    doc.text(String(w.score), M + CONTENT_W - 34, y, { width: 32, align: 'right', lineBreak: false });
    y += 16;
  };

  if (chart.dasha.favorablePeriods?.length) {
    need(30);
    doc.font(F.sansBold).fontSize(TYPE.tiny).fillColor(COLOR.good);
    doc.text(T('FAVOURABLE WINDOWS AHEAD'), M, y, { characterSpacing: 1.2, width: CONTENT_W });
    y += 14;
    for (const w of chart.dasha.favorablePeriods) windowRow(w, { fg: COLOR.good, bg: COLOR.goodWash });
    y += 8;
  }
  if (chart.dasha.challengingPeriods?.length) {
    need(30);
    doc.font(F.sansBold).fontSize(TYPE.tiny).fillColor(COLOR.bad);
    doc.text(T('WINDOWS TO NAVIGATE CAREFULLY'), M, y, { characterSpacing: 1.2, width: CONTENT_W });
    y += 14;
    for (const w of chart.dasha.challengingPeriods) windowRow(w, { fg: COLOR.bad, bg: COLOR.badWash });
    y += 8;
  }

  // ── Gochar ───────────────────────────────────────────────────────────────
  let transits: TransitReport | null = null;
  try {
    transits = transitsForChart(chart);
  } catch (err) {
    console.error('transit section skipped', err);
  }

  if (transits) {
    section('The Sky Right Now', 'Gochar');

    const tone = toneForScore(transits.score);
    panel(58, (px, py, pw) => {
      doc.font(F.sansBold).fontSize(TYPE.tiny).fillColor(COLOR.muted);
      doc.text(T('TRANSIT CLIMATE'), px, py, { characterSpacing: 1.2, width: pw });
      doc.font(F.serifBold).fontSize(22).fillColor(tone.fg);
      doc.text(`${transits.score}`, px, py + 13, { width: 60, lineBreak: false });
      doc.font(F.sans).fontSize(TYPE.tiny).fillColor(COLOR.faint);
      doc.text(T('/100'), px + 34, py + 24, { width: 30, lineBreak: false });
      doc.font(F.serifItalic).fontSize(11).fillColor(COLOR.ink);
      doc.text(T(transits.headline), px + 78, py + 18, { width: pw - 84 });
      meter(px, py + 42, pw, transits.score, tone);
    });

    for (const p of transits.positions) {
      need(15);
      const pt = p.effect === 'favourable' ? { fg: COLOR.good, bg: COLOR.goodWash }
        : p.effect === 'challenging' ? { fg: COLOR.bad, bg: COLOR.badWash }
          : { fg: COLOR.warn, bg: COLOR.warnWash };
      planetName(p.id, M + 4, y + 1, TYPE.small, p.retrograde);
      doc.font(F.sans).fontSize(TYPE.small).fillColor(COLOR.ink);
      doc.text(T(p.signName), M + 70, y + 1, { width: 78, lineBreak: false });
      doc.font(F.sans).fontSize(TYPE.tiny).fillColor(COLOR.muted);
      doc.text(T(`house ${p.houseFromMoon} from Moon`), M + 152, y + 2, { width: 130, lineBreak: false });
      chip(M + CONTENT_W - 96, y, p.effect, pt.fg, pt.bg);
      y += 15;
    }
    y += 10;

    const ss = transits.sadeSati;
    if (ss.startISO && ss.endISO) {
      panel(ss.phases.length * 14 + 40, (px, py, pw) => {
        doc.font(F.sansBold).fontSize(TYPE.tiny).fillColor(ss.active ? COLOR.bad : COLOR.muted);
        doc.text(T(ss.active ? 'SĀḌE SĀTĪ — RUNNING' : 'SĀḌE SĀTĪ — NEXT OCCURRENCE'), px, py, { characterSpacing: 1.2, width: pw });
        doc.font(F.serif).fontSize(TYPE.small).fillColor(COLOR.ink);
        doc.text(T(`${fmtDate(ss.startISO!)} → ${fmtDate(ss.endISO!)}`), px, py + 14, { width: pw });
        let ly = py + 30;
        for (const ph of ss.phases) {
          const live = ss.active && ph.phase === ss.currentPhase;
          doc.font(live ? F.sansBold : F.sans).fontSize(TYPE.tiny).fillColor(live ? COLOR.bad : COLOR.muted);
          doc.text(T(`${ph.phase} · ${ph.signName}`), px, ly, { width: 150, lineBreak: false });
          doc.text(T(`${fmtMonth(ph.startISO)} → ${fmtMonth(ph.endISO)}`), px + 160, ly, { width: 160, lineBreak: false });
          ly += 14;
        }
      }, ss.active ? COLOR.badWash : COLOR.wash);
    }

    if (transits.dhaiya.active) {
      para(transits.dhaiya.description, { size: TYPE.small, color: COLOR.ink, gap: 10 });
    }

    if (transits.upcomingIngresses.length) {
      need(26);
      doc.font(F.sansBold).fontSize(TYPE.tiny).fillColor(COLOR.muted);
      doc.text(T('UPCOMING SIGN CHANGES'), M, y, { characterSpacing: 1.2, width: CONTENT_W });
      y += 14;
      for (const ing of transits.upcomingIngresses) {
        need(14);
        doc.font(F.sans).fontSize(TYPE.small).fillColor(COLOR.ink);
        doc.text(T(`${ing.id} enters ${ing.toSignName}`), M + 4, y, { width: 220, lineBreak: false });
        doc.fillColor(COLOR.muted).fontSize(TYPE.tiny);
        doc.text(T(`${fmtDate(ing.dateISO)} · house ${ing.houseFromMoon} from Moon`), M + 230, y + 1, {
          width: CONTENT_W - 234, lineBreak: false,
        });
        y += 14;
      }
      y += 8;
    }
  }

  // ── Yogas, doshas & remedies ─────────────────────────────────────────────
  section('Yogas & Doshas', 'Combinations');

  if (chart.yogas.length) {
    for (const yg of chart.yogas) {
      need(34);
      doc.roundedRect(M, y, CONTENT_W, 1, 0).fill(COLOR.white);
      doc.font(F.serifBold).fontSize(11).fillColor(COLOR.ink);
      doc.text(T(yg.name), M + 4, y, { width: CONTENT_W - 90 });
      chip(M + CONTENT_W - 74, y - 1, 'auspicious', COLOR.gold, COLOR.warnWash);
      y += 15;
      const h = doc.font(F.sans).fontSize(TYPE.small).heightOfString(T(yg.description), { width: CONTENT_W - 8 });
      doc.fillColor(COLOR.muted).text(T(yg.description), M + 4, y, { width: CONTENT_W - 8, lineGap: 1.4 });
      y += h + 10;
      doc.moveTo(M, y - 4).lineTo(M + CONTENT_W, y - 4).lineWidth(0.3).stroke(COLOR.line);
    }
  } else {
    para('None of the classical yogas tracked here are formed — steady, self-made growth is the signature.', {
      size: TYPE.small, color: COLOR.muted,
    });
  }

  y += 6;
  for (const d of chart.doshas) {
    need(30);
    const t = d.present
      ? d.severity === 'high' ? { fg: COLOR.bad, bg: COLOR.badWash } : { fg: COLOR.warn, bg: COLOR.warnWash }
      : { fg: COLOR.good, bg: COLOR.goodWash };
    doc.font(F.serifBold).fontSize(10.5).fillColor(COLOR.ink);
    doc.text(T(d.name), M + 4, y, { width: CONTENT_W - 90, lineBreak: false });
    chip(M + CONTENT_W - 74, y - 1, d.present ? d.severity : 'clear', t.fg, t.bg);
    y += 14;
    const h = doc.font(F.sans).fontSize(TYPE.small).heightOfString(T(d.description), { width: CONTENT_W - 8 });
    doc.fillColor(COLOR.muted).text(T(d.description), M + 4, y, { width: CONTENT_W - 8, lineGap: 1.4 });
    y += h + 10;
  }

  // Remedies / lucky factors.
  section('Supportive Measures', 'Remedies');
  const lucky = LUCKY_BY_SIGN[chart.ascendant.sign]!;
  const luckyRows: [string, string][] = [
    ['Colours', lucky.colors.join(', ')],
    ['Numbers', lucky.numbers.join(', ')],
    ['Gemstone', lucky.gemstone],
    ['Day', lucky.day],
    ['Direction', lucky.direction],
  ];
  panel(luckyRows.length * 16 + 16, (px, py, pw) => {
    let ly = py;
    for (const [k, v] of luckyRows) {
      doc.font(F.sans).fontSize(TYPE.tiny).fillColor(COLOR.muted);
      doc.text(T(k.toUpperCase()), px, ly + 2, { width: 90, characterSpacing: 1 });
      doc.font(F.serifBold).fontSize(TYPE.small).fillColor(COLOR.ink);
      doc.text(T(v), px + 96, ly, { width: pw - 100, lineBreak: false, ellipsis: true });
      ly += 16;
    }
  });

  para('Consult a qualified astrologer before adopting any gemstone remedy — an ill-chosen stone can amplify exactly what you meant to soften.', {
    size: TYPE.tiny, color: COLOR.faint, gap: 14,
  });

  para(
    'This report is generated from astronomical computation and classical Jyotiṣa rules. It describes tendencies, timings and possibilities for reflection — never guaranteed outcomes — and is not a substitute for professional medical, legal or financial advice.',
    { font: 'serifItalic', size: TYPE.small, color: COLOR.muted },
  );

  // Closing colophon — turns the tail of the last page into a deliberate ending
  // rather than an accident of where the text ran out.
  y += 18;
  need(90);
  const ocx = M + CONTENT_W / 2;
  doc.moveTo(ocx - 74, y).lineTo(ocx - 12, y).lineWidth(0.5).stroke(COLOR.gold);
  doc.moveTo(ocx + 12, y).lineTo(ocx + 74, y).lineWidth(0.5).stroke(COLOR.gold);
  doc.rect(ocx - 3.5, y - 3.5, 7, 7).fill(COLOR.gold);
  doc.font(F.sansBold).fontSize(9).fillColor(COLOR.gold);
  doc.text(T('VEDASTRA'), M, y + 20, { width: CONTENT_W, align: 'center', characterSpacing: 4.5, lineBreak: false });
  doc.font(F.serifItalic).fontSize(9.4).fillColor(COLOR.faint);
  doc.text(T('May the light of the grahas fall kindly on your path.'), M, y + 38, {
    width: CONTENT_W, align: 'center', lineBreak: false,
  });

  // ── Page furniture ───────────────────────────────────────────────────────
  const range = doc.bufferedPageRange();
  const totalContent = range.count - 1; // cover excluded from numbering
  for (let i = range.start; i < range.start + range.count; i++) {
    if (!contentPages.has(i)) continue;
    doc.switchToPage(i);

    // The header and footer deliberately sit outside the text margins. PDFKit
    // treats any text past the bottom margin as an overflow and helpfully adds
    // a fresh page for it — which would append one blank page per footer. Zero
    // the margins for the duration of the furniture.
    const margins = doc.page.margins;
    doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };

    // Slim header rule with the wordmark.
    doc.font(F.sansBold).fontSize(7).fillColor(COLOR.gold);
    doc.text(T('VEDASTRA'), M, M - 14, { characterSpacing: 2.4, width: 120, lineBreak: false });
    doc.font(F.sans).fontSize(7).fillColor(COLOR.faint);
    doc.text(T(chart.meta.name), M + CONTENT_W - 220, M - 14, { width: 220, align: 'right', lineBreak: false });
    doc.moveTo(M, M - 3).lineTo(M + CONTENT_W, M - 3).lineWidth(0.4).stroke(COLOR.line);

    // Footer.
    const fy = A4.h - 34;
    doc.moveTo(M, fy - 8).lineTo(M + CONTENT_W, fy - 8).lineWidth(0.4).stroke(COLOR.line);
    doc.font(F.sans).fontSize(7.4).fillColor(COLOR.faint);
    doc.text(T(`Prepared ${generatedAt}`), M, fy, { width: CONTENT_W / 2, lineBreak: false });
    doc.text(T(`${i} of ${totalContent}`), M + CONTENT_W / 2, fy, { width: CONTENT_W / 2, align: 'right', lineBreak: false });

    doc.page.margins = margins;
  }

  doc.end();
  return finished;
}
