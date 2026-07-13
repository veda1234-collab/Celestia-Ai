import type { PlaceResult } from '@/lib/astrology/types';

/**
 * Bundled offline city dataset so birthplace autocomplete works with zero API
 * keys. Tuple layout keeps it compact: [city, region, country, cc, lat, lon, IANA tz].
 * Swap for Google Places / Mapbox via the geocode provider when keys are set.
 */
type Row = [string, string, string, string, number, number, string];

const ROWS: Row[] = [
  // ── India (Vedic-first audience) ──
  ['Mumbai', 'Maharashtra', 'India', 'IN', 19.076, 72.8777, 'Asia/Kolkata'],
  ['Delhi', 'Delhi', 'India', 'IN', 28.6139, 77.209, 'Asia/Kolkata'],
  ['New Delhi', 'Delhi', 'India', 'IN', 28.6139, 77.209, 'Asia/Kolkata'],
  ['Bengaluru', 'Karnataka', 'India', 'IN', 12.9716, 77.5946, 'Asia/Kolkata'],
  ['Hyderabad', 'Telangana', 'India', 'IN', 17.385, 78.4867, 'Asia/Kolkata'],
  ['Chennai', 'Tamil Nadu', 'India', 'IN', 13.0827, 80.2707, 'Asia/Kolkata'],
  ['Kolkata', 'West Bengal', 'India', 'IN', 22.5726, 88.3639, 'Asia/Kolkata'],
  ['Pune', 'Maharashtra', 'India', 'IN', 18.5204, 73.8567, 'Asia/Kolkata'],
  ['Ahmedabad', 'Gujarat', 'India', 'IN', 23.0225, 72.5714, 'Asia/Kolkata'],
  ['Jaipur', 'Rajasthan', 'India', 'IN', 26.9124, 75.7873, 'Asia/Kolkata'],
  ['Lucknow', 'Uttar Pradesh', 'India', 'IN', 26.8467, 80.9462, 'Asia/Kolkata'],
  ['Surat', 'Gujarat', 'India', 'IN', 21.1702, 72.8311, 'Asia/Kolkata'],
  ['Kanpur', 'Uttar Pradesh', 'India', 'IN', 26.4499, 80.3319, 'Asia/Kolkata'],
  ['Nagpur', 'Maharashtra', 'India', 'IN', 21.1458, 79.0882, 'Asia/Kolkata'],
  ['Indore', 'Madhya Pradesh', 'India', 'IN', 22.7196, 75.8577, 'Asia/Kolkata'],
  ['Bhopal', 'Madhya Pradesh', 'India', 'IN', 23.2599, 77.4126, 'Asia/Kolkata'],
  ['Patna', 'Bihar', 'India', 'IN', 25.5941, 85.1376, 'Asia/Kolkata'],
  ['Varanasi', 'Uttar Pradesh', 'India', 'IN', 25.3176, 82.9739, 'Asia/Kolkata'],
  ['Chandigarh', 'Chandigarh', 'India', 'IN', 30.7333, 76.7794, 'Asia/Kolkata'],
  ['Kochi', 'Kerala', 'India', 'IN', 9.9312, 76.2673, 'Asia/Kolkata'],
  ['Thiruvananthapuram', 'Kerala', 'India', 'IN', 8.5241, 76.9366, 'Asia/Kolkata'],
  ['Visakhapatnam', 'Andhra Pradesh', 'India', 'IN', 17.6868, 83.2185, 'Asia/Kolkata'],
  ['Coimbatore', 'Tamil Nadu', 'India', 'IN', 11.0168, 76.9558, 'Asia/Kolkata'],
  ['Guwahati', 'Assam', 'India', 'IN', 26.1445, 91.7362, 'Asia/Kolkata'],
  ['Amritsar', 'Punjab', 'India', 'IN', 31.634, 74.8723, 'Asia/Kolkata'],
  // ── South & SE Asia ──
  ['Karachi', 'Sindh', 'Pakistan', 'PK', 24.8607, 67.0011, 'Asia/Karachi'],
  ['Lahore', 'Punjab', 'Pakistan', 'PK', 31.5204, 74.3587, 'Asia/Karachi'],
  ['Dhaka', 'Dhaka', 'Bangladesh', 'BD', 23.8103, 90.4125, 'Asia/Dhaka'],
  ['Kathmandu', 'Bagmati', 'Nepal', 'NP', 27.7172, 85.324, 'Asia/Kathmandu'],
  ['Colombo', 'Western', 'Sri Lanka', 'LK', 6.9271, 79.8612, 'Asia/Colombo'],
  ['Bangkok', 'Bangkok', 'Thailand', 'TH', 13.7563, 100.5018, 'Asia/Bangkok'],
  ['Singapore', 'Singapore', 'Singapore', 'SG', 1.3521, 103.8198, 'Asia/Singapore'],
  ['Kuala Lumpur', 'Kuala Lumpur', 'Malaysia', 'MY', 3.139, 101.6869, 'Asia/Kuala_Lumpur'],
  ['Jakarta', 'Jakarta', 'Indonesia', 'ID', -6.2088, 106.8456, 'Asia/Jakarta'],
  ['Manila', 'Metro Manila', 'Philippines', 'PH', 14.5995, 120.9842, 'Asia/Manila'],
  ['Hanoi', 'Hanoi', 'Vietnam', 'VN', 21.0278, 105.8342, 'Asia/Ho_Chi_Minh'],
  // ── East Asia ──
  ['Tokyo', 'Tokyo', 'Japan', 'JP', 35.6762, 139.6503, 'Asia/Tokyo'],
  ['Osaka', 'Osaka', 'Japan', 'JP', 34.6937, 135.5023, 'Asia/Tokyo'],
  ['Seoul', 'Seoul', 'South Korea', 'KR', 37.5665, 126.978, 'Asia/Seoul'],
  ['Beijing', 'Beijing', 'China', 'CN', 39.9042, 116.4074, 'Asia/Shanghai'],
  ['Shanghai', 'Shanghai', 'China', 'CN', 31.2304, 121.4737, 'Asia/Shanghai'],
  ['Hong Kong', 'Hong Kong', 'China', 'HK', 22.3193, 114.1694, 'Asia/Hong_Kong'],
  ['Taipei', 'Taipei', 'Taiwan', 'TW', 25.033, 121.5654, 'Asia/Taipei'],
  // ── Middle East ──
  ['Dubai', 'Dubai', 'United Arab Emirates', 'AE', 25.2048, 55.2708, 'Asia/Dubai'],
  ['Abu Dhabi', 'Abu Dhabi', 'United Arab Emirates', 'AE', 24.4539, 54.3773, 'Asia/Dubai'],
  ['Doha', 'Doha', 'Qatar', 'QA', 25.2854, 51.531, 'Asia/Qatar'],
  ['Riyadh', 'Riyadh', 'Saudi Arabia', 'SA', 24.7136, 46.6753, 'Asia/Riyadh'],
  ['Tehran', 'Tehran', 'Iran', 'IR', 35.6892, 51.389, 'Asia/Tehran'],
  ['Istanbul', 'Istanbul', 'Turkey', 'TR', 41.0082, 28.9784, 'Europe/Istanbul'],
  ['Tel Aviv', 'Tel Aviv', 'Israel', 'IL', 32.0853, 34.7818, 'Asia/Jerusalem'],
  // ── Europe ──
  ['London', 'England', 'United Kingdom', 'GB', 51.5074, -0.1278, 'Europe/London'],
  ['Manchester', 'England', 'United Kingdom', 'GB', 53.4808, -2.2426, 'Europe/London'],
  ['Dublin', 'Leinster', 'Ireland', 'IE', 53.3498, -6.2603, 'Europe/Dublin'],
  ['Paris', 'Île-de-France', 'France', 'FR', 48.8566, 2.3522, 'Europe/Paris'],
  ['Madrid', 'Madrid', 'Spain', 'ES', 40.4168, -3.7038, 'Europe/Madrid'],
  ['Barcelona', 'Catalonia', 'Spain', 'ES', 41.3851, 2.1734, 'Europe/Madrid'],
  ['Lisbon', 'Lisbon', 'Portugal', 'PT', 38.7223, -9.1393, 'Europe/Lisbon'],
  ['Rome', 'Lazio', 'Italy', 'IT', 41.9028, 12.4964, 'Europe/Rome'],
  ['Milan', 'Lombardy', 'Italy', 'IT', 45.4642, 9.19, 'Europe/Rome'],
  ['Berlin', 'Berlin', 'Germany', 'DE', 52.52, 13.405, 'Europe/Berlin'],
  ['Munich', 'Bavaria', 'Germany', 'DE', 48.1351, 11.582, 'Europe/Berlin'],
  ['Frankfurt', 'Hesse', 'Germany', 'DE', 50.1109, 8.6821, 'Europe/Berlin'],
  ['Amsterdam', 'North Holland', 'Netherlands', 'NL', 52.3676, 4.9041, 'Europe/Amsterdam'],
  ['Zurich', 'Zurich', 'Switzerland', 'CH', 47.3769, 8.5417, 'Europe/Zurich'],
  ['Vienna', 'Vienna', 'Austria', 'AT', 48.2082, 16.3738, 'Europe/Vienna'],
  ['Stockholm', 'Stockholm', 'Sweden', 'SE', 59.3293, 18.0686, 'Europe/Stockholm'],
  ['Copenhagen', 'Capital Region', 'Denmark', 'DK', 55.6761, 12.5683, 'Europe/Copenhagen'],
  ['Oslo', 'Oslo', 'Norway', 'NO', 59.9139, 10.7522, 'Europe/Oslo'],
  ['Warsaw', 'Masovia', 'Poland', 'PL', 52.2297, 21.0122, 'Europe/Warsaw'],
  ['Moscow', 'Moscow', 'Russia', 'RU', 55.7558, 37.6173, 'Europe/Moscow'],
  ['Athens', 'Attica', 'Greece', 'GR', 37.9838, 23.7275, 'Europe/Athens'],
  // ── Africa ──
  ['Cairo', 'Cairo', 'Egypt', 'EG', 30.0444, 31.2357, 'Africa/Cairo'],
  ['Lagos', 'Lagos', 'Nigeria', 'NG', 6.5244, 3.3792, 'Africa/Lagos'],
  ['Nairobi', 'Nairobi', 'Kenya', 'KE', -1.2921, 36.8219, 'Africa/Nairobi'],
  ['Johannesburg', 'Gauteng', 'South Africa', 'ZA', -26.2041, 28.0473, 'Africa/Johannesburg'],
  ['Cape Town', 'Western Cape', 'South Africa', 'ZA', -33.9249, 18.4241, 'Africa/Johannesburg'],
  ['Casablanca', 'Casablanca-Settat', 'Morocco', 'MA', 33.5731, -7.5898, 'Africa/Casablanca'],
  // ── North America ──
  ['New York', 'New York', 'United States', 'US', 40.7128, -74.006, 'America/New_York'],
  ['Washington', 'District of Columbia', 'United States', 'US', 38.9072, -77.0369, 'America/New_York'],
  ['Boston', 'Massachusetts', 'United States', 'US', 42.3601, -71.0589, 'America/New_York'],
  ['Atlanta', 'Georgia', 'United States', 'US', 33.749, -84.388, 'America/New_York'],
  ['Chicago', 'Illinois', 'United States', 'US', 41.8781, -87.6298, 'America/Chicago'],
  ['Houston', 'Texas', 'United States', 'US', 29.7604, -95.3698, 'America/Chicago'],
  ['Dallas', 'Texas', 'United States', 'US', 32.7767, -96.797, 'America/Chicago'],
  ['Denver', 'Colorado', 'United States', 'US', 39.7392, -104.9903, 'America/Denver'],
  ['Phoenix', 'Arizona', 'United States', 'US', 33.4484, -112.074, 'America/Phoenix'],
  ['Los Angeles', 'California', 'United States', 'US', 34.0522, -118.2437, 'America/Los_Angeles'],
  ['San Francisco', 'California', 'United States', 'US', 37.7749, -122.4194, 'America/Los_Angeles'],
  ['Seattle', 'Washington', 'United States', 'US', 47.6062, -122.3321, 'America/Los_Angeles'],
  ['Toronto', 'Ontario', 'Canada', 'CA', 43.6532, -79.3832, 'America/Toronto'],
  ['Vancouver', 'British Columbia', 'Canada', 'CA', 49.2827, -123.1207, 'America/Vancouver'],
  ['Montreal', 'Quebec', 'Canada', 'CA', 45.5017, -73.5673, 'America/Toronto'],
  ['Mexico City', 'Mexico City', 'Mexico', 'MX', 19.4326, -99.1332, 'America/Mexico_City'],
  // ── South America ──
  ['São Paulo', 'São Paulo', 'Brazil', 'BR', -23.5505, -46.6333, 'America/Sao_Paulo'],
  ['Rio de Janeiro', 'Rio de Janeiro', 'Brazil', 'BR', -22.9068, -43.1729, 'America/Sao_Paulo'],
  ['Buenos Aires', 'Buenos Aires', 'Argentina', 'AR', -34.6037, -58.3816, 'America/Argentina/Buenos_Aires'],
  ['Santiago', 'Santiago', 'Chile', 'CL', -33.4489, -70.6693, 'America/Santiago'],
  ['Lima', 'Lima', 'Peru', 'PE', -12.0464, -77.0428, 'America/Lima'],
  ['Bogotá', 'Bogotá', 'Colombia', 'CO', 4.711, -74.0721, 'America/Bogota'],
  // ── Oceania ──
  ['Sydney', 'New South Wales', 'Australia', 'AU', -33.8688, 151.2093, 'Australia/Sydney'],
  ['Melbourne', 'Victoria', 'Australia', 'AU', -37.8136, 144.9631, 'Australia/Melbourne'],
  ['Brisbane', 'Queensland', 'Australia', 'AU', -27.4698, 153.0251, 'Australia/Brisbane'],
  ['Perth', 'Western Australia', 'Australia', 'AU', -31.9523, 115.8613, 'Australia/Perth'],
  ['Auckland', 'Auckland', 'New Zealand', 'NZ', -36.8485, 174.7633, 'Pacific/Auckland'],
];

export const CITIES: PlaceResult[] = ROWS.map(([city, region, country, cc, lat, lon, tz], i) => ({
  id: `local-${i}`,
  name: `${city}, ${region === country ? country : `${region}, ${country}`}`,
  city,
  region,
  country,
  countryCode: cc,
  lat,
  lon,
  timezone: tz,
}));

/** Naive relevance ranking for the offline dataset. */
export function searchCities(query: string, limit = 8): PlaceResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = CITIES.map((c) => {
    const city = (c.city ?? '').toLowerCase();
    const hay = c.name.toLowerCase();
    let score = 0;
    if (city === q) score = 100;
    else if (city.startsWith(q)) score = 80;
    else if (city.includes(q)) score = 55;
    else if (hay.includes(q)) score = 30;
    return { c, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name));
  return scored.slice(0, limit).map((s) => s.c);
}
