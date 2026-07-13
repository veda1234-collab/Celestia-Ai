'use client';

import Link from 'next/link';
import { MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/landing/nav';
import { AccountButton } from '@/components/account/account-button';

export function DashboardHeader({ name, onNewChart }: { name: string; onNewChart: () => void }) {
  const first = name.trim().split(/\s+/)[0] || 'Seeker';
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="hidden text-sm text-muted-foreground sm:inline">
            · {first}&apos;s cosmos
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AccountButton />
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={onNewChart} className="hidden sm:inline-flex">
            <Sparkles className="h-4 w-4" /> New chart
          </Button>
          <Button asChild size="sm">
            <Link href="/chat">
              <MessageCircle className="h-4 w-4" /> Ask the AI
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
