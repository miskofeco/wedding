// Computes the evening of the wedding at Stodola Zlatník for the golden-hour section and writes
// src/content/sun.ts: the sun's height and direction minute by minute, the terrain horizon it sets
// behind, the moments of the evening, the barn's footprint and what the weather is usually like.
// Offline: the terrain and weather samples in scripts/sun/ were fetched once (each file names its
// source); the sun comes from src/lib/sun.ts. Run with `npm run sun` after changing either.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sunPosition } from "../src/lib/sun.ts";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const terrain = JSON.parse(await readFile(path.join(root, "scripts/sun/terrain.json"), "utf8"));
const weather = JSON.parse(await readFile(path.join(root, "scripts/sun/weather.json"), "utf8"));

const DATE = "2027-05-29";
const UTC_OFFSET = 2; // CEST
const [LAT, LNG] = terrain.venue.at;
const FROM = 18 * 60 + 30; // the section shows 18:30…22:30
const TO = 22 * 60 + 30;
const EYE = 1.7; // a guest standing in the yard, metres
const EARTH = 6371000;
const REFRACTION_K = 0.13; // standard terrestrial refraction for sight lines over land

// OSM way 69609630, „Stodola Zlatník“ (© OpenStreetMap contributors, ODbL), [lat, lng]. The first edge is the
// short west-south-west gable (outward normal 258°): the glazed west wall the venue describes.
const BARN = [
  [48.9685307, 21.5478258], [48.9684162, 21.5478635], [48.9684256, 21.5479297], [48.96846, 21.5479183],
  [48.9684986, 21.5481899], [48.9684572, 21.5482036], [48.9684704, 21.5482967], [48.9685574, 21.548268],
  [48.9685073, 21.5479159], [48.9685419, 21.5479045],
];
// U.S. Naval Observatory, aa.usno.navy.mil/api/rstt/oneday for 30 May 2027 at the venue, tz 2: the first
// moonrise after the wedding evening, and the waning crescent's lit share. Fetched 26 Oct 2026.
const MOONRISE = { at: 24 * 60 + 1 * 60 + 36, lit: 0.32 };

const at = (minute) => new Date(Date.UTC(2027, 4, 29, 0, 0) + (minute - UTC_OFFSET * 60) * 60000);
const sun = (minute) => sunPosition(at(minute), LAT, LNG);
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

// ---- the horizon: the highest sight line along each azimuth, earth curvature and refraction included ----
const angle = (elevation, km) => {
  const d = km * 1000;
  const drop = ((d * d) / (2 * EARTH)) * (1 - REFRACTION_K);
  return (Math.atan2(elevation - drop - (terrain.venue.elevation + EYE), d) * 180) / Math.PI;
};
const horizonByAzimuth = new Map();
const keep = (az, deg) => horizonByAzimuth.set(az, Math.max(horizonByAzimuth.get(az) ?? -90, deg));
for (const [az, samples] of Object.entries(terrain.profiles.azimuths)) {
  samples.forEach((e, i) => keep(+az, angle(e, terrain.profiles.first * terrain.profiles.ratio ** i)));
}
for (const [az, samples] of Object.entries(terrain.near.azimuths)) {
  samples.forEach((e, i) => keep(+az, angle(e, terrain.near.distances[i])));
}
const sampled = [...horizonByAzimuth].sort((a, b) => a[0] - b[0]);
const horizonAt = (az) => {
  if (az <= sampled[0][0]) return sampled[0][1];
  for (let i = 1; i < sampled.length; i++) {
    const [a1, h1] = sampled[i];
    if (az <= a1) {
      const [a0, h0] = sampled[i - 1];
      return h0 + ((h1 - h0) * (az - a0)) / (a1 - a0);
    }
  }
  return sampled.at(-1)[1];
};

// ---- the moments: the first minute (to the nearest) when the sun passes each line ----
function crossing(from, to, below) {
  for (let m = from; m <= to; m += 0.25) if (below(sun(m), m)) return Math.round(m);
  throw new Error(`no crossing between ${from} and ${to}`);
}
const going = (deg) => (p) => p.geometric < deg; // evening: the sun sinks below the line
const rising = (deg) => (p) => p.geometric > deg;
const event = (minute) => ({ at: minute, azimuth: round(sun(minute).azimuth, 1) });

let noon = 0;
for (let m = 11 * 60; m < 14 * 60; m += 0.25) if (sun(m).elevation > sun(noon).elevation) noon = m;
const sunrise = crossing(0, 12 * 60, rising(-0.833));
const sunset = crossing(12 * 60, 24 * 60, going(-0.833));
const events = {
  sunrise: event(sunrise),
  noon: { ...event(Math.round(noon)), elevation: round(sun(noon).elevation, 1) },
  goldenStart: event(crossing(12 * 60, 24 * 60, going(6))),
  behindHill: event(crossing(17 * 60, 22 * 60, (p) => p.elevation < horizonAt(p.azimuth))),
  sunset: event(sunset),
  goldenEnd: event(crossing(12 * 60, 24 * 60, going(-4))),
  civilDusk: event(crossing(12 * 60, 24 * 60, going(-6))),
  nauticalDusk: event(crossing(12 * 60, 24 * 60, going(-12))),
  night: event(crossing(12 * 60, 24 * 60, going(-18))),
};

// ---- minute by minute through the evening ----
const track = [];
const horizon = [];
for (let m = FROM; m <= TO; m++) {
  const p = sun(m);
  track.push([round(p.elevation), round(p.azimuth)]);
  horizon.push(round(horizonAt(p.azimuth)));
}

// ---- the weather on these evenings in past years ----
const all = (key) => Object.values(weather.years).flatMap((y) => y[key]);
const quantile = (values, q) => {
  const s = [...values].sort((a, b) => a - b);
  const i = (s.length - 1) * q;
  return s[Math.floor(i)] + (s[Math.ceil(i)] - s[Math.floor(i)]) * (i - Math.floor(i));
};
const spread = (values) => ({ median: round(quantile(values, 0.5), 1), low: round(quantile(values, 0.1), 1), high: round(quantile(values, 0.9), 1) });
const clouds = all("cloud20");
const years = Object.keys(weather.years);
const evening = {
  evenings: clouds.length,
  years: `${years[0]}–${years.at(-1)}`,
  skipped: years.length < +years.at(-1) - +years[0] + 1 ? "2020" : null,
  at20: spread(all("t20")),
  at22: spread(all("t22")),
  clearAt20: round(clouds.filter((c) => c <= 30).length / clouds.length, 2),
};

// ---- write src/content/sun.ts ----
// JSON with bare keys and a space after each comma, the way the rest of src/content is written
const literal = (v) => JSON.stringify(v).replace(/"(\w+)":/g, "$1: ").replace(/,/g, ", ").replace(/{/g, "{ ").replace(/}/g, " }");
const rows = (list, perLine) => {
  const lines = [];
  for (let i = 0; i < list.length; i += perLine) lines.push(`    ${list.slice(i, i + perLine).map(literal).join(", ")},`);
  return lines.join("\n");
};
const ts = `// Generated by scripts/sun-data.mjs (npm run sun); do not edit by hand.
// The evening of ${DATE} at Stodola Zlatník (${LAT}, ${LNG}), local summer time (UTC+${UTC_OFFSET}).
// Sun: NOAA solar position with refraction (src/lib/sun.ts); checked against sunrise-sunset.org and the U.S.
// Naval Observatory. Terrain: Copernicus DEM GLO-90 via Open-Meteo. Weather: ERA5 via Open-Meteo. Barn: OSM way
// 69609630, © OpenStreetMap contributors (ODbL). Moonrise: U.S. Naval Observatory. Sources in scripts/sun/.
import type { SunDay } from "./types";

export const sunDay: SunDay = {
  date: "${DATE}",
  from: ${FROM},
  to: ${TO},
  events: {
${Object.entries(events).map(([k, e]) => `    ${k}: ${literal(e)},`).join("\n")}
  },
  moonrise: ${literal(MOONRISE)},
  dayLength: ${sunset - sunrise},
  /** [elevation, azimuth] in degrees for each minute from \`from\` to \`to\`. */
  track: [
${rows(track, 6)}
  ],
  /** The terrain horizon, in degrees, in the direction of the sun at each of those minutes. */
  horizon: [
${rows(horizon, 12)}
  ],
  barn: [
${rows(BARN, 4)}
  ],
  evening: ${literal(evening)},
};
`;
await writeFile(path.join(root, "src/content/sun.ts"), ts);
const hm = (m) => `${Math.floor(m / 60) % 24}:${String(m % 60).padStart(2, "0")}`;
console.log(Object.entries(events).map(([k, e]) => `${k} ${hm(e.at)} ${e.azimuth}°`).join("\n"));
console.log("evening", evening);
