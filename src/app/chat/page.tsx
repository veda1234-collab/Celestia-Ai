'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Trash2, Volume2, VolumeX } from 'lucide-react';
import { useProfile } from '@/lib/store/profile';
import { useChat } from '@/lib/store/chat';
import { useChartRefresh, useMounted } from '@/lib/hooks';
import { CosmicBackground } from '@/components/cosmic';
import { ChatWindow } from '@/components/chat/chat-window';
import { cn } from '@/lib/utils/cn';

export default function ChatPage() {
  const router = useRouter();
  const mounted = useMounted();
  const chart = useProfile((s) => s.chart);
  const details = useProfile((s) => s.details);
  const resetChat = useChat((s) => s.reset);
  const [speak, setSpeak] = useState(false);
  const recomputing = useChartRefresh(mounted);

  useEffect(() => {
    if (mounted && !chart && !recomputing) router.replace('/onboarding');
  }, [mounted, chart, recomputing, router]);

  const toggleSpeak = () => {
    setSpeak((v) => {
      if (v && typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      return !v;
    });
  };

  if (!mounted || !chart) {
    return (
      <main className="relative grid min-h-[100svh] place-items-center">
        <CosmicBackground meteors={false} />
        <Loader2 className="relative z-10 h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="relative flex h-[100svh] flex-col">
      <CosmicBackground meteors={false} />

      <header className="relative z-10 flex items-center justify-between border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">✦</span>
          <span className="font-display text-sm font-semibold">AI Astrologer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Toggle voice output"
            onClick={toggleSpeak}
            className={cn(
              'grid h-9 w-9 place-items-center rounded-full glass transition-colors',
              speak ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {speak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            type="button"
            aria-label="Clear conversation"
            onClick={resetChat}
            className="grid h-9 w-9 place-items-center rounded-full glass text-muted-foreground transition-colors hover:text-rose-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="relative z-10 min-h-0 flex-1">
        <ChatWindow chart={chart} language={details?.language ?? 'en'} speak={speak} />
      </div>
    </main>
  );
}
