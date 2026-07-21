'use client';

import type { ElementType, ReactNode } from 'react';
import { CalendarDays, Compass, Gem, Hash, Palette } from 'lucide-react';
import type { BirthChart, Dosha } from '@/lib/astrology/types';
import { LUCKY_BY_SIGN } from '@/lib/astrology/signs';
import { horoscope, type Timeframe } from '@/lib/astrology/horoscope';
import { GlassCard, PlateHeader } from '@/components/ui/glass-card';
import { Kicker, Meter, Rule, SemanticTag, type Tone } from '@/components/ui/plate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/* ------------------------------------------------------------------ helpers */

const FRAMES: { value: Timeframe; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

/** Severity → meter fill (0–100). */
const SEV_PCT: Record<Dosha['severity'], number> = { none: 0, low: 34, moderate: 67, high: 100 };

/** present+high → care · present → caution · absent → good. */
function doshaTone(d: Dosha): Tone {
  if (!d.present) return 'good';
  return d.severity === 'high' ? 'care' : 'caution';
}

/**
 * Resolve a lucky-colour label to a real CSS colour for the swatch. Single-word
 * names fall through to CSS named colours (`grey`, `turquoise`, `maroon`…);
 * the map covers the compound / non-standard ones.
 */
const CSS_COLOR: Record<string, string> = {
  'emerald green': '#1f9e63',
  'sea green': '#2e8b57',
  pastel: '#d7c8ee',
  saffron: '#f4c430',
  coral: '#ff7f50',
};
function swatchColor(name: string): string {
  const key = name.toLowerCase().trim();
  return CSS_COLOR[key] ?? key.replace(/\s+/g, '');
}

const MONO_LABEL = 'font-mono text-[10px] uppercase tracking-[0.16em] text-ink-2/60';

/* ---------------------------------------------------------- content blocks  */
/* Each block renders only its ruled content (no heading) so it can be dropped
 * into the composite NotesPlate under a Kicker, or wrapped by a standalone
 * card with its own PlateHeader. */

function YogaDoshaBlock({ chart }: { chart: BirthChart }) {
  return (
    <div className="space-y-5">
      {/* Yogas — auspicious combinations, names set in Fraunces */}
      <div>
        <p className={MONO_LABEL}>Yogas</p>
        {chart.yogas.length ? (
          <ul className="mt-2 divide-y divide-foreground/8">
            {chart.yogas.map((y) => (
              <li key={y.name} className="py-3 first:pt-2 last:pb-0">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="card-subhead text-foreground">{y.name}</span>
                  {y.auspicious && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gold">
                      ✦ auspicious
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{y.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            No tracked yogas are formed — steady, self-made growth is favoured.
          </p>
        )}
      </div>

      {/* Doshas — semantic tag + severity meter for the present ones */}
      <div className="border-t border-foreground/8 pt-4">
        <p className={MONO_LABEL}>Doshas</p>
        <ul className="mt-3 space-y-3.5">
          {chart.doshas.map((d) => {
            const tone = doshaTone(d);
            return (
              <li key={d.name}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">{d.name}</span>
                  <SemanticTag tone={tone} label={d.present ? d.severity : 'clear'} />
                </div>
                {d.present && (
                  <Meter value={SEV_PCT[d.severity]} tone={tone} showValue={false} className="mt-2 max-w-[200px]" />
                )}
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{d.description}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function LuckyTile({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: ElementType;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-field plate-inset px-3.5 py-3 ${className ?? ''}`}>
      <p className="kicker flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-ink-2/70" aria-hidden />
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function LuckyBlock({ chart }: { chart: BirthChart }) {
  const lucky = LUCKY_BY_SIGN[chart.ascendant.sign]!;
  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <LuckyTile icon={Hash} label="Numbers">
          <p className="font-mono text-sm tabular-nums text-foreground">{lucky.numbers.join('  ·  ')}</p>
        </LuckyTile>
        <LuckyTile icon={CalendarDays} label="Day">
          <p className="text-sm text-foreground">{lucky.day}</p>
        </LuckyTile>
        <LuckyTile icon={Gem} label="Gemstone">
          <p className="text-sm text-foreground">{lucky.gemstone}</p>
        </LuckyTile>
        <LuckyTile icon={Compass} label="Direction">
          <p className="text-sm text-foreground">{lucky.direction}</p>
        </LuckyTile>
        <LuckyTile icon={Palette} label="Colours" className="col-span-2 sm:col-span-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {lucky.colors.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5">
                <span
                  className="h-4 w-4 shrink-0 rounded-[4px] border border-foreground/20 shadow-inner"
                  style={{ background: swatchColor(c) }}
                />
                <span className="text-[13px] text-ink-2">{c}</span>
              </span>
            ))}
          </div>
        </LuckyTile>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-ink-2/60">
        Consult a qualified astrologer before wearing any gemstone.
      </p>
    </div>
  );
}

function HoroscopeBlock({ chart }: { chart: BirthChart }) {
  return (
    <Tabs defaultValue="today">
      <TabsList>
        {FRAMES.map((f) => (
          <TabsTrigger key={f.value} value={f.value}>
            {f.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {FRAMES.map((f) => (
        <TabsContent key={f.value} value={f.value}>
          <p className="dropcap text-[15px] leading-relaxed text-foreground/90">{horoscope(chart, f.value)}</p>
        </TabsContent>
      ))}
    </Tabs>
  );
}

/* --------------------------------------------------- standalone note cards  */
/* Kept as exports for back-compat; each wraps a single block in its own plate. */

export function YogaDoshaCard({ chart }: { chart: BirthChart }) {
  return (
    <GlassCard className="h-full">
      <PlateHeader kicker="NOTES" title="Yogas & Doshas" description="Notable combinations in your chart." />
      <div className="px-6 pb-6 pt-5">
        <YogaDoshaBlock chart={chart} />
      </div>
    </GlassCard>
  );
}

export function LuckyCard({ chart }: { chart: BirthChart }) {
  return (
    <GlassCard className="h-full">
      <PlateHeader kicker="NOTES" title="Lucky Factors" description="Tuned to your ascendant & Moon." />
      <div className="px-6 pb-6 pt-5">
        <LuckyBlock chart={chart} />
      </div>
    </GlassCard>
  );
}

export function HoroscopeCard({ chart }: { chart: BirthChart }) {
  return (
    <GlassCard className="h-full">
      <PlateHeader kicker="NOTES" title="Horoscope" description="Guidance across time — ask the astrologer to go deeper." />
      <div className="px-6 pb-6 pt-5">
        <HoroscopeBlock chart={chart} />
      </div>
    </GlassCard>
  );
}

/* ------------------------------------------------------------ PLATE 06 — NOTES */

/** One cohesive plate: three ruled sub-blocks under a single editorial masthead. */
export function InsightPlate({ chart }: { chart: BirthChart }) {
  return (
    <GlassCard>
      <PlateHeader
        folio="PLATE 06"
        kicker="NOTES"
        title="Notes & Remedies"
        description="Yogas, doshas, lucky factors and guidance across time."
      />
      <div className="space-y-7 px-6 pb-7 pt-6">
        <section>
          <Kicker gold>Yogas & Doshas</Kicker>
          <p className="mb-4 mt-1 text-sm text-ink-2">Auspicious combinations, and afflictions to tend with care.</p>
          <YogaDoshaBlock chart={chart} />
        </section>

        <Rule />

        <section>
          <Kicker gold>Lucky Factors</Kicker>
          <p className="mb-4 mt-1 text-sm text-ink-2">Tuned to your ascendant &amp; Moon.</p>
          <LuckyBlock chart={chart} />
        </section>

        <Rule />

        <section>
          <Kicker gold>Horoscope</Kicker>
          <p className="mb-4 mt-1 text-sm text-ink-2">Guidance across time — ask the astrologer to go deeper.</p>
          <HoroscopeBlock chart={chart} />
        </section>
      </div>
    </GlassCard>
  );
}
