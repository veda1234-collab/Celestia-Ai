'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import type { PlaceResult } from '@/lib/astrology/types';
import { cn } from '@/lib/utils/cn';

interface Props {
  value: PlaceResult | null;
  onChange: (place: PlaceResult | null) => void;
  placeholder?: string;
  id?: string;
}

/** Debounced birthplace combobox backed by the /api/places endpoint. */
export function PlaceAutocomplete({ value, onChange, placeholder = 'Search a city…', id }: Props) {
  const [query, setQuery] = useState(value?.name ?? '');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (value) setQuery(value.name);
  }, [value]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2 || query === value?.name) {
      setResults([]);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`, { signal: ctrl.signal });
        const data = (await res.json()) as { results: PlaceResult[] };
        setResults(data.results ?? []);
        setActive(0);
        setOpen(true);
      } catch {
        /* aborted or offline */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, value?.name]);

  const select = (place: PlaceResult) => {
    onChange(place);
    setQuery(place.name);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value) onChange(null);
          }}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={(e) => {
            if (!open || !results.length) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              const chosen = results[active];
              if (chosen) select(chosen);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          className="flex h-12 w-full rounded-xl border border-input bg-background/40 pl-10 pr-10 text-sm backdrop-blur-sm transition-all placeholder:text-muted-foreground/70 focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
        />
        {loading && <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />}
      </div>

      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-xl glass-strong p-1.5 shadow-card animate-fade-up"
        >
          {results.map((r, i) => (
            <li key={r.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => select(r)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  i === active ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:bg-foreground/5',
                )}
              >
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="flex-1 truncate">{r.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground/70">{r.timezone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
