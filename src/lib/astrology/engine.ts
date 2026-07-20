import type {
  AstrologyEngine,
  BirthChart,
  BirthDetails,
  Dignity,
  HouseCusp,
  PlanetId,
  PlanetPosition,
} from './types';
import {
  ascendantTropical,
  ayanamsaLahiri,
  bodyLongitude,
  julianDayFromDate,
  norm360,
  zonedToUtc,
} from './astronomy';
import { assessDashaLords, computeVimshottari } from './dasha';
import { detectDoshas, detectYogas } from './yogas';
import { computeVargas } from './varga';
import {
  NAKSHATRAS,
  PLANET_ORDER,
  dignityOf,
  signLord,
  signName,
} from './signs';

const NAK_SPAN = 360 / 27;
const PADA_SPAN = NAK_SPAN / 4;
const NAV_SPAN = 30 / 9;

const houseFromSign = (ascSign: number, sign: number): number => (((sign - ascSign) % 12) + 12) % 12 + 1;

function strengthOf(dignity: Dignity, house: number, retrograde: boolean): number {
  let s = 50;
  s += { exalted: 35, own: 25, friend: 10, neutral: 0, enemy: -12, debilitated: -30 }[dignity];
  if ([1, 4, 7, 10].includes(house)) s += 8;
  if ([1, 5, 9].includes(house)) s += 8;
  if ([6, 8, 12].includes(house)) s += 10 * -1;
  if (retrograde) s += 4;
  return Math.max(5, Math.min(100, Math.round(s)));
}

/**
 * Local, dependency-free calculation engine.
 * Implements the `AstrologyEngine` contract so it can be swapped for an
 * ephemeris-backed provider without any UI changes.
 */
export class LocalAstrologyEngine implements AstrologyEngine {
  readonly name = 'vedastra-local-v1';

  computeChart(details: BirthDetails, now: Date = new Date()): BirthChart {
    const system = details.system ?? 'vedic';
    const [y, mo, da] = details.date.split('-').map(Number) as [number, number, number];
    const [hh, mm] = details.time.split(':').map(Number) as [number, number];
    const { place } = details;

    const { utc, offsetMinutes } = zonedToUtc(y, mo, da, hh, mm, place.timezone);
    const jd = julianDayFromDate(utc);
    const ayan = ayanamsaLahiri(jd);
    const shift = system === 'vedic' ? ayan : 0;

    // Ascendant.
    const ascTrop = ascendantTropical(jd, place.lat, place.lon);
    const ascSid = norm360(ascTrop - ayan);
    const ascDisplay = norm360(ascTrop - shift);
    const ascSign = Math.floor(ascDisplay / 30);
    const ascNakIndex = Math.floor(ascSid / NAK_SPAN);

    // Planets.
    const dtDays = 1; // for retrograde direction test
    const planetSid: { id: PlanetId; sidLon: number; retrograde: boolean }[] = [];
    const planets: PlanetPosition[] = PLANET_ORDER.map((id): PlanetPosition => {
      const trop = bodyLongitude(id, jd);
      const sid = norm360(trop - ayan);
      const display = norm360(trop - shift);
      const sign = Math.floor(display / 30);
      const nakIndex = Math.floor(sid / NAK_SPAN);
      const pada = Math.floor((sid - nakIndex * NAK_SPAN) / PADA_SPAN) + 1;
      const house = houseFromSign(ascSign, sign);

      let retrograde = false;
      if (id === 'Rahu' || id === 'Ketu') retrograde = true;
      else if (id !== 'Sun' && id !== 'Moon') {
        const next = bodyLongitude(id, jd + dtDays);
        const delta = ((next - trop + 540) % 360) - 180; // signed shortest arc
        retrograde = delta < 0;
      }

      const dignity = dignityOf(id, sign);
      planetSid.push({ id, sidLon: sid, retrograde });
      return {
        id,
        longitude: Number(display.toFixed(4)),
        sign,
        signName: signName(sign),
        degreeInSign: Number((display - sign * 30).toFixed(4)),
        nakshatra: NAKSHATRAS[nakIndex]!.name,
        nakshatraIndex: nakIndex,
        pada,
        house,
        retrograde,
        dignity,
        strength: strengthOf(dignity, house, retrograde),
      };
    });

    const moon = planets.find((p) => p.id === 'Moon')!;
    const sun = planets.find((p) => p.id === 'Sun')!;
    const moonSid = norm360(bodyLongitude('Moon', jd) - ayan);
    const sunSid = norm360(bodyLongitude('Sun', jd) - ayan);
    const sunTrop = bodyLongitude('Sun', jd);

    // Houses (whole-sign).
    const houses: HouseCusp[] = Array.from({ length: 12 }, (_, i): HouseCusp => {
      const sign = (ascSign + i) % 12;
      return {
        house: i + 1,
        sign,
        signName: signName(sign),
        lord: signLord(sign),
        planets: planets.filter((p) => p.sign === sign).map((p) => p.id),
      };
    });

    // Navāṁśa (D9) — always from sidereal longitudes.
    const navSignOf = (sidLon: number) => Math.floor(sidLon / NAV_SPAN) % 12;
    const navamsa = {
      ascendantSign: navSignOf(ascSid),
      ascendantSignName: signName(navSignOf(ascSid)),
      positions: PLANET_ORDER.map((id) => {
        const sid = norm360(bodyLongitude(id, jd) - ayan);
        const s = navSignOf(sid);
        return { id, sign: s, signName: signName(s) };
      }),
    };

    // Divisional charts (D1–D60) + Vimśopaka bala, from sidereal longitudes.
    const { charts: vargas, vimshopaka } = computeVargas({
      ascSidLon: ascSid,
      sunSidLon: sunSid,
      moonSidLon: moonSid,
      planets: planetSid,
    });

    // Vimśottari daśā (from sidereal Moon), with explainable lord favourability.
    const dashaAssessments = assessDashaLords(planets, ascSign, vimshopaka);
    const dasha = computeVimshottari(moonSid, utc, now, dashaAssessments);

    // Yogas & doshas.
    const currentSaturnSid = norm360(
      bodyLongitude('Saturn', julianDayFromDate(now)) - ayanamsaLahiri(julianDayFromDate(now)),
    );
    const yogas = detectYogas(planets, ascSign, moon.sign);
    const doshas = detectDoshas(planets, moon.sign, currentSaturnSid);

    const nakIndex = Math.floor(moonSid / NAK_SPAN);
    const nakInfo = NAKSHATRAS[nakIndex]!;

    const summary = buildSummary({
      name: details.fullName,
      ascName: signName(ascSign),
      moonName: moon.signName,
      sunName: sun.signName,
      nak: nakInfo.name,
      mahaLord: dasha.current.maha.lord,
    });

    return {
      meta: {
        system,
        ayanamsa: Number(ayan.toFixed(4)),
        julianDayUT: Number(jd.toFixed(6)),
        utcISO: utc.toISOString(),
        localISO: `${details.date}T${details.time}:00`,
        tzOffsetMinutes: offsetMinutes,
        provider: this.name,
        generatedAtISO: now.toISOString(),
        lat: place.lat,
        lon: place.lon,
        timezone: place.timezone,
        name: details.fullName,
      },
      ascendant: {
        longitude: Number(ascDisplay.toFixed(4)),
        sign: ascSign,
        signName: signName(ascSign),
        degreeInSign: Number((ascDisplay - ascSign * 30).toFixed(4)),
        nakshatra: NAKSHATRAS[ascNakIndex]!.name,
        pada: Math.floor((ascSid - ascNakIndex * NAK_SPAN) / PADA_SPAN) + 1,
        lord: signLord(ascSign),
      },
      sunSign: { sidereal: signName(Math.floor(sunSid / 30)), tropical: signName(Math.floor(sunTrop / 30)) },
      moonSign: signName(Math.floor(moonSid / 30)),
      nakshatra: { name: nakInfo.name, index: nakIndex, pada: moon.pada, lord: nakInfo.lord },
      planets,
      houses,
      navamsa,
      vargas,
      vimshopaka,
      dasha,
      yogas,
      doshas,
      summary,
    };
  }
}

function buildSummary(p: {
  name: string;
  ascName: string;
  moonName: string;
  sunName: string;
  nak: string;
  mahaLord: PlanetId;
}): string {
  const first = p.name.trim().split(/\s+/)[0] || 'Seeker';
  return `${first}, you rise with ${p.ascName} ascendant, carry a ${p.moonName} Moon in the nakshatra of ${p.nak}, and a ${p.sunName} Sun. You are currently walking through your ${p.mahaLord} mahādaśā — a chapter that colours the themes unfolding in your life right now.`;
}

/** Singleton engine instance selected by configuration. */
export const engine: AstrologyEngine = new LocalAstrologyEngine();
