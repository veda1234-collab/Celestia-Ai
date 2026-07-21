'use client';

import { useMemo } from 'react';
import type { BirthChart, DashaPeriod, DashaQuality } from '@/lib/astrology/types';
import { PLANETS } from '@/lib/astrology/signs';

type DashaData = BirthChart['dasha'];
import { cn } from '@/lib/utils/cn';

const fmtYear = (iso: string) => new Date(iso).getFullYear();

/** DashaQuality → semantic pigment var. */
const QUALITY_VAR: Record<DashaQuality, string> = {
  good: 'var(--good)',
  mixed: 'var(--caution)',
  challenging: 'var(--care)',
};

interface Band {
  lord: string;
  left: number;
  width: number;
  quality?: DashaQuality;
  startISO: string;
  years: number;
}

function toBands(periods: DashaPeriod[], spanStartMs: number, spanMs: number): Band[] {
  return periods.map((p) => ({
    lord: p.lord,
    left: ((Date.parse(p.startISO) - spanStartMs) / spanMs) * 100,
    width: (Date.parse(p.startISO) < spanStartMs
      ? Date.parse(p.endISO) - spanStartMs
      : Date.parse(p.endISO) - Date.parse(p.startISO)) / spanMs * 100,
    quality: p.quality,
    startISO: p.startISO,
    years: p.years,
  }));
}

/**
 * The flagship 120-year Vimśottari ribbon — a proportional band of mahādaśās
 * with a NOW-caret, and a finer sub-ribbon zooming into the running mahā's
 * antardaśās. Planet glyphs are monochrome cream here (the quarantine); the
 * only colour is the semantic quality tint at low alpha and the gold caret.
 * Reused pixel-for-concept in the PDF report.
 */
export function DashaRibbon({ dasha, nowMs }: { dasha: DashaData; nowMs: number }) {
  const seq = dasha.sequence;
  const model = useMemo(() => {
    if (!seq.length) return null;
    const start = Date.parse(seq[0]!.startISO);
    const end = Date.parse(seq[seq.length - 1]!.endISO);
    const span = end - start;
    const bands = toBands(seq, start, span);
    const nowPct = Math.max(0, Math.min(100, ((nowMs - start) / span) * 100));

    const maha = dasha.current.maha;
    const subs = maha.sub ?? [];
    const subStart = Date.parse(maha.startISO);
    const subSpan = Date.parse(maha.endISO) - subStart;
    const subBands = subs.length ? toBands(subs, subStart, subSpan) : [];
    const subNowPct = Math.max(0, Math.min(100, ((nowMs - subStart) / subSpan) * 100));

    return { start, end, bands, nowPct, maha, subBands, subNowPct };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq, dasha.current.maha, nowMs]);

  if (!model) return null;

  const bandFill = (q?: DashaQuality) =>
    q ? `hsl(${QUALITY_VAR[q]} / 0.18)` : 'hsl(var(--inset))';

  return (
    <div>
      {/* Full 120-year band */}
      <div className="relative">
        <div className="relative h-11 w-full overflow-hidden rounded-field border border-foreground/10">
          {model.bands.map((b) => (
            <div
              key={b.startISO}
              className="absolute top-0 flex h-full items-center justify-center border-r border-foreground/10 last:border-0"
              style={{ left: `${b.left}%`, width: `${b.width}%`, background: bandFill(b.quality) }}
              title={`${b.lord} · ${fmtYear(b.startISO)} · ${b.years}y`}
            >
              {b.width > 4 && (
                <span className="flex flex-col items-center leading-none">
                  <span className="text-[13px] text-foreground/90">{PLANETS[b.lord as keyof typeof PLANETS].glyph}</span>
                  {b.width > 7 && <span className="mt-0.5 font-mono text-[8px] tabular-nums text-ink-2">{b.years}y</span>}
                </span>
              )}
            </div>
          ))}
          {/* NOW caret */}
          <div className="absolute top-0 z-10 h-full w-[2px] bg-gold" style={{ left: `calc(${model.nowPct}% - 1px)` }} />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[9px] tabular-nums text-ink-2/60">
          <span>{fmtYear(seq[0]!.startISO)}</span>
          <span className="text-gold">now</span>
          <span>{fmtYear(seq[seq.length - 1]!.endISO)}</span>
        </div>
      </div>

      {/* Sub-ribbon — the running mahā's antardaśās */}
      {model.subBands.length > 0 && (
        <div className="mt-4">
          <p className="kicker mb-1.5">
            {model.maha.lord} mahādaśā · antardaśās
          </p>
          <div className="relative h-8 w-full overflow-hidden rounded-field border border-foreground/10">
            {model.subBands.map((b) => (
              <div
                key={b.startISO}
                className="absolute top-0 flex h-full items-center justify-center border-r border-foreground/10 last:border-0"
                style={{ left: `${b.left}%`, width: `${b.width}%`, background: bandFill(b.quality) }}
                title={`${model.maha.lord}–${b.lord} · ${fmtYear(b.startISO)}`}
              >
                {b.width > 6 && (
                  <span className="text-[11px] text-foreground/85">{PLANETS[b.lord as keyof typeof PLANETS].glyph}</span>
                )}
              </div>
            ))}
            <div className="absolute top-0 z-10 h-full w-[2px] bg-gold" style={{ left: `calc(${model.subNowPct}% - 1px)` }} />
          </div>
        </div>
      )}
    </div>
  );
}
