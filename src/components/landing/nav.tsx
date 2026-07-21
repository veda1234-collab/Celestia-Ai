'use client';

import Link from 'next/link';
import { VedastraMark } from '@/components/brand/vedastra-mark';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const links = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#testimonials', label: 'Voices' },
  { href: '#faq', label: 'FAQ' },
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`group flex items-center gap-2.5 ${className ?? ''}`}>
      <VedastraMark
        medallion
        className="h-11 w-11 shrink-0 drop-shadow-[0_1px_6px_rgba(217,174,82,0.35)] transition-transform duration-500 group-hover:rotate-[30deg]"
      />
      <span className="flex flex-col leading-none">
        <span className="text-gradient-gold font-display text-2xl font-bold tracking-tight">Vedastra</span>
        <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.32em] text-gold/70">AI Astrology</span>
      </span>
    </Link>
  );
}

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      {/* Full-width bar so the brand lockup pins to the top-left rather than
          floating in a centred pill. */}
      <nav className="glass mx-auto flex w-full max-w-7xl items-center justify-between rounded-2xl px-4 py-2.5 md:px-6">
        <Logo />
        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/onboarding">Begin</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
