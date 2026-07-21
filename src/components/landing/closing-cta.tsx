'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { VedastraMark } from '@/components/brand/vedastra-mark';
import { Reveal } from '@/components/ui/reveal';
import { Kicker } from '@/components/ui/plate';

/**
 * Faint gold reticle drawn directly, since the shared `<CornerTicks>` only
 * reveals inside a `.plate` surface. Here it frames the finale as a permanent
 * instrument mark rather than a hover affordance.
 */
function CornerReticle() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      <span className="absolute left-3 top-3 h-3.5 w-3.5 border-l border-t border-gold/35" />
      <span className="absolute right-3 top-3 h-3.5 w-3.5 border-r border-t border-gold/35" />
      <span className="absolute bottom-3 left-3 h-3.5 w-3.5 border-b border-l border-gold/35" />
      <span className="absolute bottom-3 right-3 h-3.5 w-3.5 border-b border-r border-gold/35" />
    </span>
  );
}

/**
 * The grand finale band that closes the landing page: a full-width plate lit by
 * a radial gold glow, the Vedastra medallion set like a wax seal, and a single
 * decisive call to begin the reading. Deliberately the most opulent moment on
 * the page — the one place the gold is allowed to bloom.
 */
export function ClosingCTA() {
  return (
    <section className="relative isolate w-full overflow-hidden border-t border-foreground/[0.06] py-32">
      {/* Radial gold glow field — the finale's one licensed bloom. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(62% 54% at 50% 40%, hsl(var(--gold) / 0.18), transparent 68%)',
          }}
        />
        <div
          className="absolute left-1/2 top-[38%] h-[460px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--gold) / 0.13), transparent)' }}
        />
        {/* Seat the bloom back onto the navy so it never floats. */}
        <div
          className="absolute inset-x-0 bottom-0 h-48"
          style={{ background: 'linear-gradient(to bottom, transparent, hsl(var(--background)))' }}
        />
      </div>

      <Reveal className="relative mx-auto max-w-3xl px-6">
        <div className="relative rounded-plate border border-foreground/10 bg-plate/25 px-8 py-16 text-center shadow-[0_60px_160px_-60px_rgba(0,0,0,0.95)] backdrop-blur-[2px] sm:px-16 sm:py-20">
          <CornerReticle />

          {/* Masthead kicker between two hairlines. */}
          <div className="mx-auto flex max-w-xs items-center justify-center gap-3">
            <span className="h-px flex-1 bg-foreground/15" />
            <Kicker gold className="whitespace-nowrap">The reading awaits</Kicker>
            <span className="h-px flex-1 bg-foreground/15" />
          </div>

          {/* The medallion, lit like a wax seal. */}
          <div className="relative mx-auto mt-9 h-28 w-28 sm:h-32 sm:w-32">
            <span
              aria-hidden
              className="absolute inset-0 -z-10 rounded-full blur-2xl"
              style={{ background: 'radial-gradient(closest-side, hsl(var(--gold) / 0.35), transparent)' }}
            />
            <VedastraMark
              medallion
              className="h-full w-full [filter:drop-shadow(0_0_26px_hsl(var(--gold)/0.32))]"
            />
          </div>

          <h2 className="display-hero mx-auto mt-9 max-w-2xl text-foreground">
            Your chart is already <span className="text-gold">written.</span>
          </h2>

          <p className="lede mx-auto mt-6 max-w-xl text-balance text-foreground/80">
            The only thing missing is you reading it.
          </p>

          <div className="mt-10 flex flex-col items-center gap-5">
            <Button asChild size="lg" variant="primary" className="px-9 text-[15px]">
              <Link href="/onboarding">Begin your reading →</Link>
            </Button>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] tabular-nums text-ink-2/70">
              No account · Takes 60 seconds · Free
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
