'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { BirthChart } from '@/lib/astrology/types';
import { useChat } from '@/lib/store/chat';
import { MessageBubble } from './message';
import { Composer } from './composer';

const SUGGESTIONS = [
  'What does my chart say about my career?',
  'Tell me about my love life and marriage.',
  'What is my current planetary period about?',
  'What are my strengths and weaknesses?',
  'Which gemstones and colours are lucky for me?',
  'How is my health and vitality?',
];

function stripMarkdown(md: string): string {
  return md
    .replace(/[#*_`>-]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function ChatWindow({
  chart,
  language = 'en',
  speak,
}: {
  chart: BirthChart;
  language?: string;
  speak: boolean;
}) {
  const messages = useChat((s) => s.messages);
  const add = useChat((s) => s.add);
  const appendToLast = useChat((s) => s.appendToLast);

  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (streaming) return;
    add({ role: 'user', content: text });
    add({ role: 'assistant', content: '' });
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const history = useChat
      .getState()
      .messages.filter((m, i, arr) => !(i === arr.length - 1 && m.role === 'assistant' && m.content === ''));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, chart, language }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error('chat failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        appendToLast(chunk);
      }
      if (speak && full && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(stripMarkdown(full)));
      }
    } catch {
      if (!ctrl.signal.aborted) appendToLast('\n\n_The connection to the stars was interrupted._');
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </span>
            <h2 className="font-display text-2xl font-semibold">Ask your chart anything</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              I&apos;ve read your placements, {chart.meta.name.split(' ')[0]}. Pick a starting point or type your own.
            </p>
            <div className="mt-8 grid w-full max-w-xl gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="glass rounded-xl px-4 py-3 text-left text-sm text-foreground/90 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((m, i) => (
              <MessageBubble
                key={i}
                role={m.role}
                content={m.content}
                streaming={streaming && i === messages.length - 1 && m.role === 'assistant'}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pb-5">
        <Composer onSend={send} onStop={stop} streaming={streaming} />
        <p className="mt-2 text-center text-[11px] text-muted-foreground/70">
          Vedastra offers guidance for reflection, not guarantees. For medical, legal or financial decisions, consult a professional.
        </p>
      </div>
    </div>
  );
}
