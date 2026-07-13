'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Mic, Square } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  streaming: boolean;
}

// Minimal typings for the Web Speech API (not in the DOM lib).
interface SpeechResultAlt {
  transcript: string;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<ArrayLike<SpeechResultAlt>>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (e: SpeechRecognitionEventLike) => void;
  onend: () => void;
  onerror: () => void;
  start(): void;
  stop(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechCtor(): SpeechRecognitionCtor | undefined {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function Composer({ onSend, onStop, streaming }: Props) {
  const [value, setValue] = useState('');
  const [listening, setListening] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);

  useEffect(() => {
    setVoiceSupported(Boolean(getSpeechCtor()));
  }, []);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [value]);

  const toggleVoice = () => {
    const Ctor = getSpeechCtor();
    if (!Ctor) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    const base = value;
    rec.onresult = (e) => {
      let transcript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i]?.[0]?.transcript ?? '';
      }
      setValue((base ? `${base} ` : '') + transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const submit = () => {
    const text = value.trim();
    if (!text || streaming) return;
    onSend(text);
    setValue('');
  };

  return (
    <div className="glass flex items-end gap-2 rounded-2xl p-2">
      {voiceSupported && (
        <button
          type="button"
          aria-label="Voice input"
          onClick={toggleVoice}
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors',
            listening ? 'bg-rose-500/20 text-rose-400' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Mic className={cn('h-5 w-5', listening && 'animate-pulse')} />
        </button>
      )}
      <textarea
        ref={taRef}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Ask about your career, love, timing, health…"
        className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
      />
      {streaming ? (
        <button
          type="button"
          aria-label="Stop"
          onClick={onStop}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground transition-colors hover:bg-foreground/10"
        >
          <Square className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          aria-label="Send"
          onClick={submit}
          disabled={!value.trim()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
