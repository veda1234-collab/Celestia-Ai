'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import type { PlaceResult } from '@/lib/astrology/types';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';

interface Props {
  value: PlaceResult | null;
  onChange: (place: PlaceResult | null) => void;
  placeholder?: string;
  id?: string;
}

/** "City — Region", falling back to the composed name when parts are missing. */
function rowLabel(r: PlaceResult): string {
  if (r.city && r.region && r.region !== r.city) return `${r.city} — ${r.region}`;
  if (r.city) return r.city;
  const [city, region] = r.name.split(',').map((s) => s.trim());
  return region ? `${city} — ${region}` : city ?? r.name;
}

/** Right-margin coordinates in the almanac idiom: `19.07°N 72.87°E`. */
function coordsOf(r: PlaceResult): string {
  const lat = `${Math.abs(r.lat).toFixed(2)}°${r.lat >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(r.lon).toFixed(2)}°${r.lon >= 0 ? 'E' : 'W'}`;
  return `${lat} ${lon}`;
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
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-2" />
        <Input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && results.length ? `${listId}-opt-${active}` : undefined}
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
          className="pl-10 pr-9"
        />
        {loading && (
          <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gold/80" />
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-2 max-h-72 w-full divide-y divide-foreground/10 overflow-auto rounded-field glass glass-gilt animate-fade-up"
        >
          {results.map((r, i) => (
            <li key={r.id} id={`${listId}-opt-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => select(r)}
                className={cn(
                  'flex w-full items-center gap-3 border-l-2 px-3.5 py-2.5 text-left transition-colors',
                  i === active ? 'border-gold' : 'border-transparent',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{rowLabel(r)}</span>
                  <span className="mt-0.5 block font-mono text-[10.5px] tabular-nums tracking-wide text-ink-2/60">
                    {r.timezone}
                  </span>
                </span>
                <span className="shrink-0 whitespace-nowrap text-right font-mono text-[11px] tabular-nums text-ink-2">
                  {coordsOf(r)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
