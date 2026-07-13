/**
 * Astronomy core for the local calculation engine.
 *
 * Positions use Paul Schlyter's well-documented low-precision method
 * (heliocentric Keplerian elements + principal perturbation terms). Accuracy is
 * ~1–2 arc-minutes for the Moon and better for the planets over 1900–2100 —
 * ample for sign, nakshatra, house and daśā determination. For sub-arc-second
 * work, swap in a Swiss Ephemeris-backed engine via the AstrologyEngine contract.
 *
 * All angles are in degrees unless suffixed. Longitudes are geocentric,
 * tropical, of-date; convert to sidereal by subtracting the ayanāṁśa.
 */

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

export const norm360 = (x: number): number => ((x % 360) + 360) % 360;
const sind = (d: number) => Math.sin(d * DEG);
const cosd = (d: number) => Math.cos(d * DEG);
const tand = (d: number) => Math.tan(d * DEG);
const atan2d = (y: number, x: number) => Math.atan2(y, x) * RAD;

/** Julian Day (UT) from a JS Date treated as a UTC instant. */
export function julianDayFromDate(utc: Date): number {
  return utc.getTime() / 86400000 + 2440587.5;
}

/** Schlyter day number: days since 2000-01-00 00:00 UT (JD 2451543.5). */
const dayNumber = (jd: number): number => jd - 2451543.5;

/** Convert a local civil datetime at an IANA zone to a UTC Date. */
export function zonedToUtc(
  year: number,
  month: number, // 1–12
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): { utc: Date; offsetMinutes: number } {
  const asIfUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const guess = tzOffsetMinutes(asIfUtc, timeZone);
  let ts = asIfUtc - guess * 60000;
  const refined = tzOffsetMinutes(ts, timeZone);
  if (refined !== guess) ts = asIfUtc - refined * 60000;
  return { utc: new Date(ts), offsetMinutes: refined };
}

/** Offset (minutes east of UTC) that `timeZone` had at the given instant. */
export function tzOffsetMinutes(utcMillis: number, timeZone: string): number {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const parts = dtf.formatToParts(new Date(utcMillis));
    const map: Record<string, number> = {};
    for (const p of parts) if (p.type !== 'literal') map[p.type] = Number(p.value);
    const asUtc = Date.UTC(
      map.year!, (map.month ?? 1) - 1, map.day!, map.hour ?? 0, map.minute ?? 0, map.second ?? 0,
    );
    return Math.round((asUtc - utcMillis) / 60000);
  } catch {
    return 0; // Unknown zone → treat as UTC.
  }
}

/** Mean obliquity of the ecliptic (degrees). */
export function obliquity(jd: number): number {
  return 23.4393 - 3.563e-7 * dayNumber(jd);
}

/** Lahiri ayanāṁśa (degrees) — linear approximation anchored at J2000. */
export function ayanamsaLahiri(jd: number): number {
  const yearsFromJ2000 = (jd - 2451545.0) / 365.25;
  return 23.8511 + (50.2388 / 3600) * yearsFromJ2000;
}

/** Greenwich Mean Sidereal Time in degrees (Meeus). */
export function gmst(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const g =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  return norm360(g);
}

interface Elements {
  N: number; i: number; w: number; a: number; e: number; M: number;
}

/** Solve Kepler's equation for the eccentric anomaly (degrees). */
function eccentricAnomaly(M: number, e: number): number {
  let E = M + e * RAD * sind(M) * (1 + e * cosd(M));
  for (let iter = 0; iter < 12; iter++) {
    const dE = (E - e * RAD * sind(E) - M) / (1 - e * cosd(E));
    E -= dE;
    if (Math.abs(dE) < 1e-8) break;
  }
  return E;
}

/** Heliocentric (or, for the Moon/Sun, geocentric) ecliptic vector + lon/lat/r. */
function orbit(el: Elements): { lon: number; lat: number; r: number; x: number; y: number; z: number } {
  const E = eccentricAnomaly(norm360(el.M), el.e);
  const xv = el.a * (cosd(E) - el.e);
  const yv = el.a * (Math.sqrt(1 - el.e * el.e) * sind(E));
  const v = atan2d(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const vw = v + el.w;
  const x = r * (cosd(el.N) * cosd(vw) - sind(el.N) * sind(vw) * cosd(el.i));
  const y = r * (sind(el.N) * cosd(vw) + cosd(el.N) * sind(vw) * cosd(el.i));
  const z = r * (sind(vw) * sind(el.i));
  return { lon: norm360(atan2d(y, x)), lat: atan2d(z, Math.sqrt(x * x + y * y)), r, x, y, z };
}

// ── Orbital elements as functions of the day number d ──
const sunEl = (d: number): Elements => ({
  N: 0, i: 0,
  w: 282.9404 + 4.70935e-5 * d,
  a: 1,
  e: 0.016709 - 1.151e-9 * d,
  M: norm360(356.047 + 0.9856002585 * d),
});
const moonEl = (d: number): Elements => ({
  N: 125.1228 - 0.0529538083 * d,
  i: 5.1454,
  w: 318.0634 + 0.1643573223 * d,
  a: 60.2666,
  e: 0.0549,
  M: norm360(115.3654 + 13.0649929509 * d),
});
const PLANET_EL: Record<string, (d: number) => Elements> = {
  Mercury: (d) => ({ N: 48.3313 + 3.24587e-5 * d, i: 7.0047 + 5.0e-8 * d, w: 29.1241 + 1.01444e-5 * d, a: 0.387098, e: 0.205635 + 5.59e-10 * d, M: norm360(168.6562 + 4.0923344368 * d) }),
  Venus: (d) => ({ N: 76.6799 + 2.4659e-5 * d, i: 3.3946 + 2.75e-8 * d, w: 54.891 + 1.38374e-5 * d, a: 0.72333, e: 0.006773 - 1.302e-9 * d, M: norm360(48.0052 + 1.6021302244 * d) }),
  Mars: (d) => ({ N: 49.5574 + 2.11081e-5 * d, i: 1.8497 - 1.78e-8 * d, w: 286.5016 + 2.92961e-5 * d, a: 1.523688, e: 0.093405 + 2.516e-9 * d, M: norm360(18.6021 + 0.5240207766 * d) }),
  Jupiter: (d) => ({ N: 100.4542 + 2.76854e-5 * d, i: 1.303 - 1.557e-7 * d, w: 273.8777 + 1.64505e-5 * d, a: 5.20256, e: 0.048498 + 4.469e-9 * d, M: norm360(19.895 + 0.0830853001 * d) }),
  Saturn: (d) => ({ N: 113.6634 + 2.3898e-5 * d, i: 2.4886 - 1.081e-7 * d, w: 339.3939 + 2.97661e-5 * d, a: 9.55475, e: 0.055546 - 9.499e-9 * d, M: norm360(316.967 + 0.0334442282 * d) }),
};

/** Geocentric tropical longitude of the Sun (degrees). */
export function sunLongitude(jd: number): number {
  const d = dayNumber(jd);
  const el = sunEl(d);
  const E = eccentricAnomaly(el.M, el.e);
  const xv = cosd(E) - el.e;
  const yv = Math.sqrt(1 - el.e * el.e) * sind(E);
  const v = atan2d(yv, xv);
  return norm360(v + el.w);
}

function sunRect(d: number): { x: number; y: number; lon: number; r: number } {
  const el = sunEl(d);
  const E = eccentricAnomaly(el.M, el.e);
  const xv = cosd(E) - el.e;
  const yv = Math.sqrt(1 - el.e * el.e) * sind(E);
  const v = atan2d(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const lon = norm360(v + el.w);
  return { x: r * cosd(lon), y: r * sind(lon), lon, r };
}

/** Geocentric tropical longitude of the Moon incl. principal perturbations. */
export function moonLongitude(jd: number): number {
  const d = dayNumber(jd);
  const m = moonEl(d);
  const base = orbit(m);
  const sun = sunEl(d);

  const Ls = norm360(sun.M + sun.w);
  const Lm = norm360(m.M + m.w + m.N);
  const Ms = sun.M;
  const Mm = m.M;
  const D = norm360(Lm - Ls);
  const F = norm360(Lm - m.N);

  const pert =
    -1.274 * sind(Mm - 2 * D) +
    0.658 * sind(2 * D) -
    0.186 * sind(Ms) -
    0.059 * sind(2 * Mm - 2 * D) -
    0.057 * sind(Mm - 2 * D + Ms) +
    0.053 * sind(Mm + 2 * D) +
    0.046 * sind(2 * D - Ms) +
    0.041 * sind(Mm - Ms) -
    0.035 * sind(D) -
    0.031 * sind(Mm + Ms) -
    0.015 * sind(2 * F - 2 * D) +
    0.011 * sind(Mm - 4 * D);

  return norm360(base.lon + pert);
}

/** Geocentric tropical longitude of a planet (Mercury–Saturn), degrees. */
export function planetLongitude(name: string, jd: number): number {
  const d = dayNumber(jd);
  const elFn = PLANET_EL[name];
  if (!elFn) return 0;
  const el = elFn(d);
  const helio = orbit(el);
  let lon = helio.lon;
  const lat = helio.lat;
  const r = helio.r;

  // Principal perturbations for the slow giants (matter near sign edges).
  if (name === 'Jupiter' || name === 'Saturn') {
    const Mj = norm360(PLANET_EL.Jupiter!(d).M);
    const Msa = norm360(PLANET_EL.Saturn!(d).M);
    if (name === 'Jupiter') {
      lon +=
        -0.332 * sind(2 * Mj - 5 * Msa - 67.6) -
        0.056 * sind(2 * Mj - 2 * Msa + 21) +
        0.042 * sind(3 * Mj - 5 * Msa + 21) -
        0.036 * sind(Mj - 2 * Msa) +
        0.022 * cosd(Mj - Msa) +
        0.023 * sind(2 * Mj - 3 * Msa + 52) -
        0.016 * sind(Mj - 5 * Msa - 69);
    } else {
      lon +=
        0.812 * sind(2 * Mj - 5 * Msa - 67.6) -
        0.229 * cosd(2 * Mj - 4 * Msa - 2) +
        0.119 * sind(Mj - 2 * Msa - 3) +
        0.046 * sind(2 * Mj - 6 * Msa - 69) +
        0.014 * sind(Mj - 3 * Msa + 32);
    }
  }

  // Heliocentric → geocentric ecliptic.
  const xh = r * cosd(lon) * cosd(lat);
  const yh = r * sind(lon) * cosd(lat);
  const zh = r * sind(lat);
  const s = sunRect(d);
  return norm360(atan2d(yh + s.y, xh + s.x));
}

/** Mean lunar ascending node = Rāhu (tropical, degrees). Always retrograde. */
export function rahuLongitude(jd: number): number {
  return norm360(moonEl(dayNumber(jd)).N);
}

/** Tropical geocentric longitude of any supported body. */
export function bodyLongitude(id: string, jd: number): number {
  switch (id) {
    case 'Sun': return sunLongitude(jd);
    case 'Moon': return moonLongitude(jd);
    case 'Rahu': return rahuLongitude(jd);
    case 'Ketu': return norm360(rahuLongitude(jd) + 180);
    default: return planetLongitude(id, jd);
  }
}

/**
 * Tropical ascendant (rising ecliptic longitude) for a place & time.
 * @param jd     Julian Day (UT)
 * @param latDeg geographic latitude (north +)
 * @param lonDeg geographic longitude (east +)
 */
export function ascendantTropical(jd: number, latDeg: number, lonDeg: number): number {
  const ramc = norm360(gmst(jd) + lonDeg); // local sidereal time ≈ RA of MC
  const eps = obliquity(jd);
  const asc = atan2d(
    cosd(ramc),
    -(sind(ramc) * cosd(eps) + tand(latDeg) * sind(eps)),
  );
  return norm360(asc);
}
