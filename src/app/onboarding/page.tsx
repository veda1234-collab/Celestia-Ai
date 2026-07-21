'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Globe, Sparkles, User } from 'lucide-react';
import { VedastraMark } from '@/components/brand/vedastra-mark';
import type { BirthChart, BirthDetails, Gender, PlaceResult } from '@/lib/astrology/types';
import { CinematicBackground } from '@/components/cosmic';
import { CosmicLoader } from '@/components/loading/cosmic-loader';
import { PlaceAutocomplete } from '@/components/onboarding/place-autocomplete';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/landing/nav';
import { useProfile } from '@/lib/store/profile';
import { cn } from '@/lib/utils/cn';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not', label: 'Prefer not to say' },
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

interface FormData {
  fullName: string;
  gender: Gender | '';
  date: string;
  time: string;
  place: PlaceResult | null;
  email: string;
  language: string;
}

const STEP_TITLES = ['Who are you?', 'When did you arrive?', 'Where were you born?'];

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

  return (
    <main className="relative min-h-[100svh]">
      <CinematicBackground />

      <AnimatePresence mode="wait">
        {phase === 'welcome' && <Welcome key="welcome" onEnter={() => setPhase('form')} />}

        {phase === 'form' && (
          <motion.div
            key="form"
            className="relative z-10 mx-auto flex min-h-[100svh] max-w-lg flex-col justify-center px-6 py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="mb-8 flex items-center justify-between">
              <Logo />
              <div className="flex gap-1.5">
                {STEP_TITLES.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-500',
                      i === step ? 'w-8 bg-gradient-to-r from-primary to-accent' : i < step ? 'w-1.5 bg-primary/60' : 'w-1.5 bg-muted',
                    )}
                  />
                ))}
              </div>
            </div>

            <GlassCard className="p-7">
              <p className="text-sm text-muted-foreground">Step {step + 1} of 3</p>
              <h1 className="mt-1 font-display text-2xl font-semibold">{STEP_TITLES[step]}</h1>

              <div className="mt-6 min-h-[220px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-5"
                  >
                    {step === 0 && (
                      <>
                        <Field icon={User} label="Full name" htmlFor="fullName">
                          <Input
                            id="fullName"
                            value={data.fullName}
                            onChange={(e) => update('fullName', e.target.value)}
                            placeholder="e.g. Arjuna Sharma"
                            autoFocus
                          />
                        </Field>
                        <div>
                          <Label className="mb-2 block">Gender</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {GENDERS.map((g) => (
                              <button
                                key={g.value}
                                type="button"
                                onClick={() => update('gender', g.value)}
                                className={cn(
                                  'rounded-xl border px-3 py-2.5 text-sm transition-all',
                                  data.gender === g.value
                                    ? 'border-primary/60 bg-primary/15 text-foreground shadow-glow'
                                    : 'border-border text-muted-foreground hover:border-primary/40',
                                )}
                              >
                                {g.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <Field icon={Globe} label="Language" htmlFor="language">
                          <select
                            id="language"
                            value={data.language}
                            onChange={(e) => update('language', e.target.value)}
                            className="flex h-12 w-full rounded-xl border border-input bg-background/40 px-4 text-sm backdrop-blur-sm focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                          >
                            {LANGUAGES.map((l) => (
                              <option key={l.value} value={l.value} className="bg-background text-foreground">
                                {l.label}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </>
                    )}

                    {step === 1 && (
                      <>
                        <Field icon={CalendarDays} label="Date of birth" htmlFor="dob">
                          <Input id="dob" type="date" value={data.date} min="1900-01-01" max="2100-12-31" onChange={(e) => update('date', e.target.value)} autoFocus />
                        </Field>
                        <Field icon={Clock} label="Time of birth" htmlFor="tob">
                          <Input id="tob" type="time" value={data.time} onChange={(e) => update('time', e.target.value)} />
                        </Field>
                        <p className="rounded-xl bg-primary/10 p-3 text-xs leading-relaxed text-muted-foreground">
                          Accurate to the minute matters most for your Ascendant. If unsure, use your best estimate — your Moon-sign reading stays meaningful either way.
                        </p>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <div>
                          <Label className="mb-2 block">Place of birth</Label>
                          <PlaceAutocomplete value={data.place} onChange={(p) => update('place', p)} />
                          {data.place && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {data.place.lat.toFixed(2)}°, {data.place.lon.toFixed(2)}° · {data.place.timezone}
                            </p>
                          )}
                        </div>
                        <Field label="Email (optional)" htmlFor="email">
                          <Input id="email" type="email" value={data.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" />
                        </Field>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}

              <div className="mt-6 flex items-center justify-between gap-3">
                <Button type="button" variant="ghost" onClick={back} disabled={step === 0} className={step === 0 ? 'invisible' : ''}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button type="button" onClick={next} className="group">
                  {step === 2 ? 'Reveal my chart' : 'Continue'}
                  {step === 2 ? <Sparkles className="h-4 w-4" /> : <ArrowRight className="transition-transform group-hover:translate-x-1" />}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {phase === 'loading' && <CosmicLoader key="loading" steps={LOADER_STEPS} done={chartReady} onComplete={finish} />}
      </AnimatePresence>
    </main>
  );
}

function Welcome({ onEnter }: { onEnter: () => void }) {
  return (
    <motion.div
      key="welcome"
      className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-6 text-center"
      initial={{ opacity: 0, scale: 1.4 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <VedastraMark medallion className="mx-auto mb-6 h-20 w-20 drop-shadow-[0_2px_12px_rgba(217,174,82,0.4)]" />
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">
          Welcome to <span className="text-gradient-gold">Vedastra</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          You&apos;re about to enter a living map of your cosmos. Let&apos;s begin with the moment you arrived.
        </p>
        <Button size="lg" className="mt-8" onClick={onEnter}>
          Enter the cosmos <ArrowRight />
        </Button>
      </motion.div>
    </motion.div>
  );
}

function Field({
  icon: Icon,
  label,
  htmlFor,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="mb-2 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </Label>
      {children}
    </div>
  );
}
