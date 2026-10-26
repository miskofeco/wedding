import { test } from "node:test";
import assert from "node:assert/strict";
import { clock, shadowLength, sunPosition } from "../src/lib/sun.ts";
import { sunDay } from "../src/content/sun.ts";
import { places } from "../src/content/places.ts";

const [lat, lng] = places.venue.at;
/** 29 May 2027, local summer time (UTC+2), as minutes after midnight. */
const local = (h: number, m: number, s = 0) => new Date(Date.UTC(2027, 4, 29, h - 2, m, s));
const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

test("sunrise, sunset and the twilights match sunrise-sunset.org and the U.S. Naval Observatory to a minute", () => {
  // sunrise-sunset.org for 48.96848, 21.54797: 04:36:34, 20:25:49, civil 21:06:24, nautical 22:02:12, astronomical 23:27:33.
  // USNO for 48.9685, 21.548: rise 04:37, set 20:26, end of civil twilight 21:07.
  const near = (actual: number, expected: number, what: string) =>
    assert.ok(Math.abs(actual - expected) <= 1.5, `${what}: ${clock(actual)}, expected about ${clock(expected)}`);
  const e = sunDay.events;
  near(e.sunrise.at, 4 * 60 + 36.6, "sunrise");
  near(e.sunset.at, 20 * 60 + 25.8, "sunset");
  near(e.civilDusk.at, 21 * 60 + 6.4, "civil dusk");
  near(e.nauticalDusk.at, 22 * 60 + 2.2, "nautical dusk");
  near(e.night.at, 23 * 60 + 27.6, "night");
});

test("the geometric sun sits on the conventional lines at the published times", () => {
  assert.ok(Math.abs(sunPosition(local(20, 25, 49), lat, lng).geometric + 0.833) < 0.1);
  assert.ok(Math.abs(sunPosition(local(21, 6, 24), lat, lng).geometric + 6) < 0.1);
  const noon = sunPosition(local(12, 31), lat, lng);
  assert.ok(noon.azimuth > 179 && noon.azimuth < 181);
  assert.ok(Math.abs(noon.elevation - 62.7) < 0.2);
});

test("the sun sets in the north-west, as it does at the end of May", () => {
  assert.ok(sunDay.events.sunset.azimuth > 300 && sunDay.events.sunset.azimuth < 310);
  assert.ok(sunDay.events.sunrise.azimuth > 50 && sunDay.events.sunrise.azimuth < 60);
});

test("the evening runs in order, and the sun leaves the yard before the official sunset", () => {
  const e = sunDay.events;
  const order = [e.goldenStart, e.behindHill, e.sunset, e.goldenEnd, e.civilDusk, e.nauticalDusk, e.night, sunDay.moonrise];
  for (let i = 1; i < order.length; i++) assert.ok(order[i].at > order[i - 1].at, `moment ${i} comes after moment ${i - 1}`);
  assert.ok(e.sunset.at - e.behindHill.at >= 10, "the hill hides the sun well before it reaches the flat horizon");
});

test("the minute table covers the shown evening and agrees with the algorithm", () => {
  assert.equal(sunDay.track.length, sunDay.to - sunDay.from + 1);
  assert.equal(sunDay.horizon.length, sunDay.track.length);
  const i = minutes("19:45") - sunDay.from;
  const p = sunPosition(local(19, 45), lat, lng);
  assert.ok(Math.abs(sunDay.track[i][0] - p.elevation) < 0.01);
  assert.ok(Math.abs(sunDay.track[i][1] - p.azimuth) < 0.01);
  // the sun is above the hill until behindHill and below it from then on
  const hill = sunDay.events.behindHill.at - sunDay.from;
  assert.ok(sunDay.track[hill - 1][0] >= sunDay.horizon[hill - 1]);
  assert.ok(sunDay.track[hill][0] < sunDay.horizon[hill]);
});

test("a guest's shadow grows as the sun sinks, and there is none once it is down", () => {
  assert.ok(Math.abs(shadowLength(45) - 1.7) < 1e-9);
  assert.ok(Math.round(shadowLength(6)) === 16);
  assert.ok(shadowLength(3) > shadowLength(6));
  assert.equal(shadowLength(-1), Infinity);
});

test("clock writes minutes as a Slovak time and wraps past midnight", () => {
  assert.equal(clock(1185), "19:45");
  assert.equal(clock(1110), "18:30");
  assert.equal(clock(1536), "1:36");
});
