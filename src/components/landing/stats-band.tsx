import { Reveal } from '@/components/ui/reveal';
import { CountUp, Kicker, Rule } from '@/components/ui/plate';

/**
 * The credibility band — a full-width row of engraved figures set directly
 * beneath the hero. Each tile is a big Fraunces numeral in gold (the ink of the
 * plate) counting up in view, footed by a mono kicker. These numbers are the
 * proof: the app computes real astronomy, so the band states the instrument's
 * range in plain figures rather than adjectives.
 */
type Stat = {
  /** The headline figure (counts up when scrolled into view). */
  value: number;
  /** Optional small unit rendered beside the numeral (e.g. "yr"). */
  unit?: string;
  /** Small-caps label set beneath the figure. */
  label: string;
  /** Mono marginalia — the fine print that makes the figure legible. */
  note: string;
};

const STATS: Stat[] = [
  { value: 20, label: 'Divisional charts', note: 'D1 → D60 vargas' },
  { value: 27, label: 'Nakṣatras', note: '· 108 pādas' },
  { value: 9, label: 'Grahas & 2 nodes', note: 'incl. Rāhu · Ketu' },
  { value: 120, unit: 'yr', label: 'Daśā timeline', note: 'Vimśottari' },
  { value: 0, label: 'Guesswork', note: 'real astronomy' },
];

export function StatsBand() {
  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <Rule gold={false} />

        {/* Editorial masthead for the band — kicker at left, dateline-style
            provenance at right. No gold here: the figures carry the ink. */}
        <div className="flex items-baseline justify-between gap-4 pb-6 pt-5">
          <Kicker>By the numbers</Kicker>
          <span className="dateline hidden sm:block">
            Computed · sidereal · Lahiri ayanāṁśa
          </span>
        </div>

        <div
          className={[
            'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
            // hairline ink for every separator
            '[&>*]:border-foreground/10',
            // vertical hairlines — first column per breakpoint keeps none
            '[&>*]:border-l [&>*:nth-child(2n+1)]:border-l-0',
            'sm:[&>*]:border-l sm:[&>*:nth-child(3n+1)]:border-l-0',
            'lg:[&>*]:border-l lg:[&>*:nth-child(5n+1)]:border-l-0',
            // horizontal hairlines only appear where a row wraps
            '[&>*]:border-t [&>*:nth-child(-n+2)]:border-t-0',
            'sm:[&>*:nth-child(-n+3)]:border-t-0',
            'lg:[&>*]:border-t-0',
            // lone final tile centres itself on the narrowest layout
            '[&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1',
          ].join(' ')}
        >
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="flex flex-col items-center justify-center px-4 py-8 text-center sm:px-6"
            >
              <span className="mb-3 font-mono text-[10px] tabular-nums tracking-[0.25em] text-ink-2/35">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="flex items-baseline gap-1 text-gold">
                <CountUp
                  value={s.value}
                  className="!font-display text-[2.5rem] leading-none text-gold sm:text-[2.75rem]"
                />
                {s.unit && (
                  <span className="font-mono text-sm text-gold/60">{s.unit}</span>
                )}
              </span>
              <Kicker className="mt-3.5 text-foreground/80">{s.label}</Kicker>
              <span className="mt-1.5 font-mono text-[10.5px] tabular-nums text-ink-2/60">
                {s.note}
              </span>
            </div>
          ))}
        </div>

        <Rule gold={false} />
      </section>
    </Reveal>
  );
}
