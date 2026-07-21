'use client';

import Link from 'next/link';
import { MessageCircle, Plus } from 'lucide-react';
import type { BirthChart } from '@/lib/astrology/types';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { VedastraMark } from '@/components/brand/vedastra-mark';
import { AccountButton } from '@/components/account/account-button';
import { ReportButton } from './report-button';

export function DashboardHeader({
  name,
  chart,
  onNewChart,
}: {
  name: string;
  chart?: BirthChart | null;
  onNewChart: () => void;
}) {
  const first = name.trim().split(/\s+/)[0] || 'Seeker';
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-3 xl:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <VedastraMark medallion className="h-9 w-9 shrink-0" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">Vedastra</span>
            <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-2">
              {first}&apos;s chart
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <AccountButton />
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={onNewChart} className="hidden sm:inline-flex">
            <Plus className="h-4 w-4" /> New chart
          </Button>
          {chart && <ReportButton chart={chart} variant="outline" size="sm" label="Report" />}
          <Button asChild size="sm">
            <Link href="/chat">
              <MessageCircle className="h-4 w-4" /> Ask the AI
            </Link>
          </Button>
        </div>
      </div>
      {/* Drawn gold hairline under the masthead. */}
      <div className="h-px w-full bg-rule-gold" />
    </header>
  );
}
