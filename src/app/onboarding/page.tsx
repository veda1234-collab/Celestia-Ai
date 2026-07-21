'use client';

import { useRouter } from 'next/navigation';
import { Fragment, useCallback, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
import { VedastraMark } from '@/components/brand/vedastra-mark';
import type { BirthChart, BirthDetails, Gender, PlaceResult } from '@/lib/astrology/types';
import { CosmicLoader } from '@/components/loading/cosmic-loader';
import { PlaceAutocomplete } from '@/components/onboarding/place-autocomplete';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Dateline, Kicker, Rule } from '@/components/ui/plate';
import { useProfile } from '@/lib/store/profile';
import { DUR, easeInk, revealContainer, revealItem } from '@/lib/motion';
import { cn } from '@/lib/utils/cn';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not', label: 'Prefer not' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'te', label: 'తెలుగు (Telugu)' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
];

const LOADER_STEPS = [
  'Finding planetary positions…',
  'Calculating your Ascendant…',
  'Reading the houses…',
  'Interpreting planetary influences…',
  'Building your destiny map…',
];

const LEDGER = [
  { n: '01', label: 'Identity' },
  { n: '02', label: 'Moment' },
  { n: '03', label: 'Place' },
];

/** Faint engraved starfield — a static almanac constellation, no motion. */
const STARS: [number, number, number][] = [
  [58, 64, 1.6], [132, 40, 1], [206, 96, 1.3], [286, 58, 1], [344, 128, 1.5],
  [92, 148, 1], [168, 190, 1.4], [250, 168, 1], [318, 214, 1.2], [46, 236, 1.1],
  [128, 288, 1.5], [214, 262, 1], [300, 312, 1.3], [360, 268, 1],
];

function Constellation({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <g stroke="hsl(var(--gold))" strokeWidth="0.5" fill="none" opacity="0.55">
        <path d="M58 64 L132 40 L206 96 L286 58 L344 128" />
        <path d="M46 236 L128 288 L214 262 L300 312 L360 268" />
        <path d="M92 148 L168 190 L250 168 L318 214" />
      </g>
      {STARS.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="hsl(var(--gold))" />
      ))}
    </svg>
  );
}

interface FormData {
  fullName: string;
  gender: Gender | '';
  date: string;
  time: string;
  place: PlaceResult | null;
  email: string;
  language: string;
}

/** Full born-line for the title page: "12 March 1994, 04:55". */
function fullMoment(date: string, time: string): string {
  if (!date || !time) return '';
  const d = new Date(`${date}T${time}`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Date-only echo for the moment step margin: "12 March 1994". */
function dateEcho(date: string): string {
  if (!date) return '';
  const d = new Date(`${date}T00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Almanac coordinates line: "19.07°N 72.87°E · Asia/Kolkata". */
function coordLine(p: PlaceResult): string {
  const lat = `${Math.abs(p.lat).toFixed(2)}°${p.lat >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(p.lon).toFixed(2)}°${p.lon >= 0 ? 'E' : 'W'}`;
  return `${lat} ${lon} · ${p.timezone}`;
}

/** Loader hand-off dateline from form data: "12 Mar 1994 · 04:55 · Mumbai · 19.07°N 72.87°E". */
function loaderDateline(d: FormData): string | undefined {
  if (!d.place) return undefined;
  const day = new Date(`${d.date}T${d.time || '00:00'}`);
  const dob = Number.isNaN(day.getTime())
    ? d.date
    : day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const lat = `${Math.abs(d.place.lat).toFixed(2)}°${d.place.lat >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(d.place.lon).toFixed(2)}°${d.place.lon >= 0 ? 'E' : 'W'}`;
  const city = d.place.name.split(',')[0]?.trim() ?? d.place.name;
  return `${dob} · ${d.time} · ${city} · ${lat} ${lon}`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const setProfile = useProfile((s) => s.setProfile);

  const [phase, setPhase] = useState<'welcome' | 'form' | 'loading'>('welcome');
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [chartReady, setChartReady] = useState(false);
  const [data, setData] = useState<FormData>({
    fullName: '',
    gender: '',
    date: '',
    time: '',
    place: null,
    email: '',
    language: 'en',
  });

  const update = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setData((d) => ({ ...d, [key]: val }));

  const validateStep = (s: number): string => {
    if (s === 0) {
      if (data.fullName.trim().length < 2) return 'Please enter your full name.';
      if (!data.gender) return 'Please select an option.';
    }
    if (s === 1) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) return 'Please enter your date of birth.';
      if (!/^\d{2}:\d{2}$/.test(data.time)) return 'Please enter your time of birth.';
      const year = Number(data.date.slice(0, 4));
      if (year < 1900 || year > 2100) return 'Please enter a realistic birth year.';
    }
    if (s === 2) {
      if (!data.place) return 'Please select your birthplace.';
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'That email looks off.';
    }
    return '';
  };

  const next = () => {
    const err = validateStep(step);
    if (err) return setError(err);
    setError('');
    if (step < 2) setStep(step + 1);
    else void submit();
  };

  const back = () => {
    setError('');
    if (step > 0) setStep(step - 1);
  };

  const submit = async () => {
    setPhase('loading');
    setChartReady(false);
    const payload: BirthDetails = {
      fullName: data.fullName.trim(),
      gender: data.gender as Gender,
      date: data.date,
      time: data.time,
      place: data.place!,
      email: data.email || null,
      language: data.language,
      system: 'vedic',
    };
    try {
      const res = await fetch('/api/chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('chart request failed');
      const { chart } = (await res.json()) as { chart: BirthChart };
      setProfile(payload, chart);
      setChartReady(true);
    } catch {
      setError('The stars were hard to read. Please check your details and try again.');
      setPhase('form');
    }
  };

  const finish = useCallback(() => router.push('/dashboard'), [router]);

  const bornLine = fullMoment(data.date, data.time) || dateEcho(data.date);
  const stepValid = validateStep(step) === '';

  return (
    <main className="relative min-h-[100svh] overflow-x-hidden bg-well page-grain text-foreground">
      <Constellation className="pointer-events-none fixed inset-0 h-full w-full opacity-[0.06]" />

      <AnimatePresence mode="wait">
        {phase === 'welcome' && <Welcome key="welcome" onEnter={() => setPhase('form')} />}

        {phase === 'form' && (
          <motion.div
            key="form"
            className="relative z-10 flex min-h-[100svh] items-center justify-center px-5 py-10 sm:px-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: DUR.page, ease: easeInk }}
          >
            <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-2 lg:gap-8">
              {/* ── LEFT · the live title page ─────────────────────────── */}
              <GlassCard className="relative flex flex-col overflow-hidden p-7 sm:p-9 lg:sticky lg:top-16 lg:self-start">
                <Constellation className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]" />
                <div className="relative">
                  <motion.div layoutId="medallion" className="inline-block">
                    <VedastraMark medallion className="h-12 w-12" />
                  </motion.div>
                  <Kicker className="mt-6">The title page</Kicker>
                  <Rule className="mt-3" />

                  <div className="mt-6 space-y-5">
                    <TitleLine active={step === 0}>
                      <p className="plate-title text-foreground">
                        Nativity of{' '}
                        <span className={data.fullName.trim() ? 'text-foreground' : 'text-ink-2/45'}>
                          {data.fullName.trim() || '—'}
                        </span>
                      </p>
                    </TitleLine>

                    <TitleLine active={step === 1}>
                      <Dateline className={bornLine ? 'text-ink-2' : 'text-ink-2/45'}>
                        born {bornLine || '—'}
                      </Dateline>
                    </TitleLine>

                    <TitleLine active={step === 2}>
                      <p className={cn('text-[15px]', data.place ? 'text-foreground/85' : 'text-ink-2/45')}>
                        {data.place?.name ?? '—'}
                      </p>
                      {data.place && (
                        <Dateline className="mt-1 text-[11px]">{coordLine(data.place)}</Dateline>
                      )}
                    </TitleLine>
                  </div>

                  <p className="mt-9 text-[11px] leading-relaxed text-ink-2/70">
                    Your frontispiece composes itself as you answer. Everything you enter is set into
                    this plate.
                  </p>
                </div>
              </GlassCard>

              {/* ── RIGHT · the three-page register ────────────────────── */}
              <GlassCard className="relative flex flex-col p-6 sm:p-8">
                {/* Ruled ledger step indicator */}
                <div className="flex items-baseline justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {LEDGER.map((s, i) => (
                      <Fragment key={s.n}>
                        {i > 0 && <span className="font-mono text-[11px] text-ink-2/30">—</span>}
                        <span
                          className={cn(
                            'relative font-mono text-[11px] uppercase tabular-nums tracking-[0.14em] transition-colors',
                            i === step ? 'text-gold' : i < step ? 'text-foreground/70' : 'text-ink-2/45',
                          )}
                        >
                          {s.n} · {s.label}
                          {i < step && (
                            <motion.span
                              className="absolute -bottom-1 left-0 h-px w-full bg-gold/80"
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              style={{ transformOrigin: 'left' }}
                              transition={{ duration: DUR.rule, ease: easeInk }}
                            />
                          )}
                        </span>
                      </Fragment>
                    ))}
                  </div>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-2">
                    0{step + 1} / 03
                  </span>
                </div>

                <Rule className="mt-4" animate={false} />

                {/* Sliding register pages */}
                <div className="relative mt-6 min-h-[264px]">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.5, ease: easeInk }}
                      className="space-y-5"
                    >
                      {step === 0 && (
                        <>
                          <Field label="Full name" htmlFor="fullName">
                            <Input
                              id="fullName"
                              value={data.fullName}
                              onChange={(e) => update('fullName', e.target.value)}
                              placeholder="e.g. Arjuna Sharma"
                              autoFocus
                            />
                          </Field>

                          <div>
                            <label className="kicker mb-2 block">Gender</label>
                            <div className="grid grid-cols-4 divide-x divide-foreground/10 overflow-hidden rounded-field border border-foreground/10 bg-inset">
                              {GENDERS.map((g) => {
                                const on = data.gender === g.value;
                                return (
                                  <button
                                    key={g.value}
                                    type="button"
                                    onClick={() => update('gender', g.value)}
                                    aria-pressed={on}
                                    className={cn(
                                      'relative px-1.5 py-2.5 text-[12px] transition-colors sm:text-[13px]',
                                      on ? 'text-foreground' : 'text-ink-2 hover:text-foreground',
                                    )}
                                    style={on ? { background: 'hsl(var(--gold) / 0.06)' } : undefined}
                                  >
                                    {g.label}
                                    {on && (
                                      <motion.span
                                        layoutId="gender-underline"
                                        className="absolute inset-x-0 bottom-0 h-[2px] bg-gold"
                                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                                      />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <Field label="Language" htmlFor="language">
                            <div className="relative">
                              <select
                                id="language"
                                value={data.language}
                                onChange={(e) => update('language', e.target.value)}
                                className="h-11 w-full appearance-none rounded-field border border-foreground/10 bg-inset px-3.5 pr-9 font-mono text-[13px] tabular-nums text-foreground transition-colors focus-visible:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 [color-scheme:dark]"
                              >
                                {LANGUAGES.map((l) => (
                                  <option key={l.value} value={l.value} className="bg-plate font-sans text-foreground">
                                    {l.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-2" />
                            </div>
                          </Field>
                        </>
                      )}

                      {step === 1 && (
                        <>
                          <Field
                            label="Date of birth"
                            htmlFor="dob"
                            hint={dateEcho(data.date) ? `→ ${dateEcho(data.date)}` : undefined}
                          >
                            <Input
                              id="dob"
                              type="date"
                              value={data.date}
                              min="1900-01-01"
                              max="2100-12-31"
                              onChange={(e) => update('date', e.target.value)}
                              autoFocus
                            />
                          </Field>

                          <Field
                            label="Time of birth"
                            htmlFor="tob"
                            hint={data.time ? `→ ${data.time}` : undefined}
                          >
                            <Input
                              id="tob"
                              type="time"
                              value={data.time}
                              onChange={(e) => update('time', e.target.value)}
                            />
                          </Field>

                          <p className="rounded-field plate-inset px-4 py-3 text-xs leading-relaxed text-ink-2">
                            Accurate to the minute matters most for your Ascendant. If unsure, your
                            Moon-sign reading stays meaningful either way.
                          </p>
                        </>
                      )}

                      {step === 2 && (
                        <>
                          <div>
                            <div className="mb-2 flex items-baseline justify-between gap-3">
                              <label className="kicker" htmlFor="place">
                                Place of birth
                              </label>
                              {data.place && (
                                <span className="dateline text-[11px] text-gold/80">
                                  {coordLine(data.place)}
                                </span>
                              )}
                            </div>
                            <PlaceAutocomplete
                              id="place"
                              value={data.place}
                              onChange={(p) => update('place', p)}
                            />
                          </div>

                          <Field label="Email (optional)" htmlFor="email">
                            <Input
                              id="email"
                              type="email"
                              value={data.email}
                              onChange={(e) => update('email', e.target.value)}
                              placeholder="you@example.com"
                            />
                            <p className="mt-2 text-[11px] leading-relaxed text-ink-2">
                              Used only to compute and send your report.
                            </p>
                          </Field>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {error && (
                  <p className="mt-4 flex items-start gap-2 text-[13px] text-care">
                    <span className="tone-dot mt-1.5 shrink-0" style={{ background: 'hsl(var(--care))' }} />
                    {error}
                  </p>
                )}

                <Rule className="mt-6" animate={false} />

                {/* Actions */}
                <div className="mt-5 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={back}
                    disabled={step === 0}
                    className={step === 0 ? 'invisible' : ''}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={next}
                    disabled={!stepValid}
                    className={cn('group', !stepValid && 'disabled:!opacity-40')}
                  >
                    {step === 2 ? 'Reveal my chart' : 'Continue'}
                    {step === 2 ? (
                      <Sparkles className="h-4 w-4" />
                    ) : (
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    )}
                  </Button>
                </div>
              </GlassCard>
            </div>
          </motion.div>
        )}

        {phase === 'loading' && (
          <CosmicLoader
            key="loading"
            steps={LOADER_STEPS}
            done={chartReady}
            onComplete={finish}
            dateline={loaderDateline(data)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/** A title-page line with a left registration rule that gilds on the active step. */
function TitleLine({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div className="relative pl-4">
      <span
        className={cn(
          'absolute left-0 top-1 bottom-1 rounded-full transition-all duration-300',
          active ? 'w-[2px] bg-gold' : 'w-px bg-foreground/12',
        )}
      />
      {children}
    </div>
  );
}

function Welcome({ onEnter }: { onEnter: () => void }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key="welcome"
      className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: DUR.page, ease: easeInk }}
    >
      <motion.div
        className="flex max-w-md flex-col items-center"
        variants={revealContainer}
        initial={reduce ? false : 'hidden'}
        animate="show"
      >
        <motion.div variants={revealItem} layoutId="medallion">
          <VedastraMark medallion className="h-20 w-20" />
        </motion.div>

        <motion.div variants={revealItem}>
          <Kicker className="mt-7">An editorial almanac of your nativity</Kicker>
        </motion.div>

        <motion.h1 variants={revealItem} className="display-hero mt-4">
          <span className="text-gold-ink">Vedastra</span>
        </motion.h1>

        <motion.p variants={revealItem} className="mt-5 text-[15px] leading-relaxed text-ink-2">
          A living almanac of the sky at the minute you arrived — set, page by page, as your own
          title plate.
        </motion.p>

        <motion.div variants={revealItem} className="mt-8">
          <Button size="lg" variant="primary" onClick={onEnter} className="group">
            Begin the reading
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>

        <motion.div variants={revealItem} className="mt-9 w-full max-w-xs">
          <Rule />
          <p className="mt-3 text-[11px] leading-relaxed text-ink-2/80">
            No account required. Your birth details are used only to compute your chart.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="kicker">
          {label}
        </label>
        {hint && <span className="dateline text-[11px] text-gold/80">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
