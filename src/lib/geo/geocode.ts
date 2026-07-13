import type { PlaceResult } from '@/lib/astrology/types';
import { config } from '@/lib/config';
import { CITIES } from './cities';
import { searchIndia } from './india';

/**
 * Pluggable geocoder. Defaults to the bundled offline dataset; upgrades to
 * Google Places or Mapbox transparently when configured. All providers return
 * the same `PlaceResult` shape, so callers never change.
 */
export async function geocode(query: string, limit = 8): Promise<PlaceResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    if (config.geo.provider === 'mapbox' && config.geo.mapboxToken) {
      return await mapboxGeocode(q, limit);
    }
    if (config.geo.provider === 'google' && config.geo.googleApiKey) {
      return await googleGeocode(q, limit);
    }
  } catch {
    // Any provider failure gracefully degrades to the bundled dataset.
  }
  return localSearch(q, limit);
}

/** Metro-weight prior so curated world cities rank alongside real cities. */
const WORLD_WEIGHT = 1_500_000;

/**
 * Offline search: the comprehensive India gazetteer merged with the curated
 * global city list, ranked uniformly (match quality, then population) and
 * de-duplicated so the same place never appears twice.
 */
function localSearch(query: string, limit: number): PlaceResult[] {
  const ql = query.trim().toLowerCase();
  if (ql.length < 2) return [];

  const world = CITIES.map((place) => {
    const s = (place.city ?? place.name).toLowerCase();
    let score = 0;
    if (s === ql) score = 100;
    else if (s.startsWith(ql)) score = 80;
    else if (s.includes(ql)) score = 45;
    else if (place.name.toLowerCase().includes(ql)) score = 25;
    return { place, score, pop: WORLD_WEIGHT };
  }).filter((r) => r.score > 0);

  const merged = [...searchIndia(query, limit), ...world].sort(
    (a, b) => b.score - a.score || b.pop - a.pop || a.place.name.localeCompare(b.place.name),
  );

  const seen = new Set<string>();
  const out: PlaceResult[] = [];
  for (const { place } of merged) {
    const key = `${(place.city ?? place.name).toLowerCase()}|${(place.region ?? '').toLowerCase()}|${place.country.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(place);
    if (out.length >= limit) break;
  }
  return out;
}

async function mapboxGeocode(query: string, limit: number): Promise<PlaceResult[]> {
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
  url.searchParams.set('access_token', config.geo.mapboxToken);
  url.searchParams.set('types', 'place,locality,region');
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('mapbox failed');
  const data = (await res.json()) as { features?: MapboxFeature[] };
  return (data.features ?? []).map((f, i) => {
    const [lon, lat] = f.center;
    const country = f.context?.find((c) => c.id.startsWith('country'))?.text ?? '';
    const region = f.context?.find((c) => c.id.startsWith('region'))?.text ?? '';
    return {
      id: f.id ?? `mapbox-${i}`,
      name: f.place_name ?? f.text,
      city: f.text,
      region,
      country,
      lat,
      lon,
      // Mapbox does not return IANA tz; resolve on the client or via a tz API.
      timezone: guessTimezone(lat, lon),
    } satisfies PlaceResult;
  });
}

async function googleGeocode(query: string, limit: number): Promise<PlaceResult[]> {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', query);
  url.searchParams.set('key', config.geo.googleApiKey);
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('google failed');
  const data = (await res.json()) as { results?: GoogleResult[] };
  return (data.results ?? []).slice(0, limit).map((r, i) => {
    const { lat, lng } = r.geometry.location;
    const comp = (type: string) => r.address_components.find((c) => c.types.includes(type))?.long_name ?? '';
    return {
      id: r.place_id ?? `google-${i}`,
      name: r.formatted_address,
      city: comp('locality') || comp('administrative_area_level_2'),
      region: comp('administrative_area_level_1'),
      country: comp('country'),
      lat,
      lon: lng,
      timezone: guessTimezone(lat, lng),
    } satisfies PlaceResult;
  });
}

/** Extremely rough tz fallback for external providers (longitude → offset band). */
function guessTimezone(_lat: number, lon: number): string {
  const offset = Math.round(lon / 15);
  return `Etc/GMT${offset <= 0 ? '+' : '-'}${Math.abs(offset)}`;
}

interface MapboxFeature {
  id?: string;
  text: string;
  place_name?: string;
  center: [number, number];
  context?: { id: string; text: string }[];
}
interface GoogleResult {
  place_id?: string;
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  address_components: { long_name: string; types: string[] }[];
}
