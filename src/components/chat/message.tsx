'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Markdown } from './markdown';

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

export function MessageBubble({
  role,
  content,
  streaming,
}: {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}) {
  const isUser = role === 'user';
  return (
    <div className={cn('flex w-full gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold',
          isUser ? 'bg-muted text-foreground' : 'bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow',
        )}
      >
        {isUser ? 'You' : <Sparkles className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3',
          isUser ? 'bg-primary/15 text-foreground' : 'glass',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        ) : content ? (
          <>
            <Markdown>{content}</Markdown>
            {streaming && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-full bg-primary align-middle" />}
          </>
        ) : (
          <TypingDots />
        )}
      </div>
    </div>
  );
}
