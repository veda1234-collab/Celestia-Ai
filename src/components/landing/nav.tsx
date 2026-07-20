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
    <Link href="/" className={`group flex items-center gap-2 ${className ?? ''}`}>
      <VedastraMark className="h-9 w-9 shrink-0 transition-transform duration-500 group-hover:rotate-45" />
      <span className="font-display text-xl font-semibold tracking-tight">Vedastra</span>
    </Link>
  );
}

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav className="glass flex w-full max-w-6xl items-center justify-between rounded-full px-4 py-2.5 md:px-6">
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
