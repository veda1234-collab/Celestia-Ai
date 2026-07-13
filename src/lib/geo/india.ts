import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import type { PlaceResult } from '@/lib/astrology/types';

/**
 * Comprehensive offline India gazetteer — every populated place from GeoNames
 * (cities, towns and villages across all 28 states & 8 union territories),
 * ~374k entries. Loaded lazily and cached in module scope, and only ever read
 * server-side (node fs/zlib) from the /api/places route, so the multi-megabyte
 * dataset never reaches the client bundle. India is a single time zone, so
 * every place resolves to Asia/Kolkata.
 */

const DATA_FILE = path.join(process.cwd(), 'src', 'lib', 'geo', 'data', 'india-places.tsv.gz');
const IST = 'Asia/Kolkata';

interface Gazetteer {
  name: string[];
  lc: string[]; // lowercased name, precomputed for fast case-insensitive search
  state: string[]; // deduped state/UT names
  stateIdx: Uint8Array; // index into `state`
  lat: Float32Array;
  lon: Float32Array;
  pop: Int32Array;
  size: number;
}

let cache: Gazetteer | null = null;

const empty = (): Gazetteer => ({
  name: [],
  lc: [],
  state: [],
  stateIdx: new Uint8Array(0),
  lat: new Float32Array(0),
  lon: new Float32Array(0),
  pop: new Int32Array(0),
  size: 0,
});

/** Parse the gzipped TSV once into compact parallel arrays (structure-of-arrays). */
function load(): Gazetteer {
  if (cache) return cache;
  let text: string;
  try {
    text = gunzipSync(readFileSync(DATA_FILE)).toString('utf8');
  } catch {
    // Missing/corrupt asset must not break the endpoint — degrade to the
    // curated global city list handled by the caller.
    cache = empty();
    return cache;
  }

  const lines = text.split('\n');
  const n = lines.length;
  const name = new Array<string>(n);
  const lc = new Array<string>(n);
  const lat = new Float32Array(n);
  const lon = new Float32Array(n);
  const pop = new Int32Array(n);
  const stateIdx = new Uint8Array(n);
  const state: string[] = [];
  const stateMap = new Map<string, number>();

  let size = 0;
  for (let i = 0; i < n; i++) {
    const line = lines[i];
    if (!line) continue;
    // Columns: name \t state \t lat \t lon \t population
    const t1 = line.indexOf('\t');
    const t2 = line.indexOf('\t', t1 + 1);
    const t3 = line.indexOf('\t', t2 + 1);
    const t4 = line.indexOf('\t', t3 + 1);
    if (t1 < 0 || t2 < 0 || t3 < 0 || t4 < 0) continue;

    const st = line.slice(t1 + 1, t2);
    let si = stateMap.get(st);
    if (si === undefined) {
      si = state.length;
      state.push(st);
      stateMap.set(st, si);
    }

    const nm = line.slice(0, t1);
    name[size] = nm;
    lc[size] = nm.toLowerCase();
    stateIdx[size] = si;
    lat[size] = +line.slice(t2 + 1, t3);
    lon[size] = +line.slice(t3 + 1, t4);
    pop[size] = +line.slice(t4 + 1) || 0;
    size++;
  }

  cache = { name, lc, state, stateIdx, lat, lon, pop, size };
  return cache;
}

export interface ScoredPlace {
  place: PlaceResult;
  score: number;
  pop: number;
}

/**
 * Rank India places for `query`. Exact match beats prefix beats substring; ties
 * break on population so real towns/cities surface above tiny hamlets of the
 * same name, while every village remains reachable by typing its full name.
 */
export function searchIndia(query: string, limit = 8): ScoredPlace[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const g = load();

  const matches: { i: number; score: number }[] = [];
  for (let i = 0; i < g.size; i++) {
    const s = g.lc[i]!;
    let score = 0;
    if (s === q) score = 100;
    else if (s.startsWith(q)) score = 80;
    else if (s.includes(q)) score = 45;
    else continue;
    matches.push({ i, score });
  }

  matches.sort(
    (a, b) => b.score - a.score || g.pop[b.i]! - g.pop[a.i]! || g.name[a.i]!.localeCompare(g.name[b.i]!),
  );

  return matches.slice(0, limit).map(({ i, score }) => {
    const city = g.name[i]!;
    const region = g.state[g.stateIdx[i]!]!;
    return {
      score,
      pop: g.pop[i]!,
      place: {
        id: `in-${i}`,
        name: `${city}, ${region}, India`,
        city,
        region,
        country: 'India',
        countryCode: 'IN',
        lat: g.lat[i]!,
        lon: g.lon[i]!,
        timezone: IST,
      },
    };
  });
}
