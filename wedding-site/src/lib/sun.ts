// The sun's place in the sky, for the golden-hour section. NOAA's solar position algorithm (after Meeus),
// with atmospheric refraction; good to about a minute in time for the wedding's latitude and year.
// Plain TypeScript with no imports, so scripts/sun-data.mjs can load it straight from Node.

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export interface SunPosition {
  /** Degrees above the horizon as seen, refraction included (negative below it). */
  elevation: number;
  /** The same without refraction: sunrise, sunset (−0.833°) and the twilights (−6°, −12°, −18°) are defined on it. */
  geometric: number;
  /** Degrees clockwise from north. */
  azimuth: number;
}

/** Where the sun stands at `date` (any instant) as seen from `lat`, `lng` (decimal degrees, east positive). */
export function sunPosition(date: Date, lat: number, lng: number): SunPosition {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const T = (jd - 2451545) / 36525;
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C =
    Math.sin(rad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * T) +
    Math.sin(rad(3 * M)) * 0.000289;
  const omega = 125.04 - 1934.136 * T;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(rad(omega));
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(rad(omega));
  const dec = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda))));
  const y = Math.tan(rad(eps / 2)) ** 2;
  const eqTime =
    4 *
    deg(
      y * Math.sin(2 * rad(L0)) -
        2 * e * Math.sin(rad(M)) +
        4 * e * y * Math.sin(rad(M)) * Math.cos(2 * rad(L0)) -
        0.5 * y * y * Math.sin(4 * rad(L0)) -
        1.25 * e * e * Math.sin(2 * rad(M)),
    );
  const utcMinutes = (date.getTime() / 60000) % 1440;
  const trueSolar = (((utcMinutes + eqTime + 4 * lng) % 1440) + 1440) % 1440;
  const hourAngle = trueSolar / 4 - 180;
  const cosZenith =
    Math.sin(rad(lat)) * Math.sin(rad(dec)) + Math.cos(rad(lat)) * Math.cos(rad(dec)) * Math.cos(rad(hourAngle));
  const zenith = deg(Math.acos(Math.min(1, Math.max(-1, cosZenith))));
  const geometric = 90 - zenith;
  let azimuth = deg(
    Math.acos(
      Math.min(1, Math.max(-1, (Math.sin(rad(lat)) * Math.cos(rad(zenith)) - Math.sin(rad(dec))) / (Math.cos(rad(lat)) * Math.sin(rad(zenith))))),
    ),
  );
  azimuth = hourAngle > 0 ? (azimuth + 180) % 360 : (540 - azimuth) % 360;
  return { elevation: geometric + refraction(geometric) / 3600, geometric, azimuth };
}

/** Atmospheric refraction in arc seconds for a geometric elevation (NOAA's piecewise fit). */
function refraction(el: number): number {
  if (el > 85) return 0;
  const t = Math.tan(rad(el));
  if (el > 5) return 58.1 / t - 0.07 / t ** 3 + 0.000086 / t ** 5;
  if (el > -0.575) return 1735 + el * (-518.2 + el * (103.4 + el * (-12.79 + el * 0.711)));
  return -20.774 / t;
}

/** How long the shadow of someone `height` metres tall is, in metres, with the sun `elevation` degrees up. */
export function shadowLength(elevation: number, height = 1.7): number {
  return elevation > 0 ? height / Math.tan(rad(elevation)) : Infinity;
}

/** 1185 → "19:45"; minutes after local midnight, wrapping past it. */
export function clock(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
}
