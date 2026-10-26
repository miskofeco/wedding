import { test } from "node:test";
import assert from "node:assert/strict";
import { events } from "../src/content/events.ts";
import { places } from "../src/content/places.ts";

// The site address is read when the module loads, so each setting gets its own copy.
const load = (copy: string): Promise<typeof import("../src/lib/calendar.ts")> => import(`../src/lib/calendar.ts?${copy}`);
delete process.env.NEXT_PUBLIC_SITE_URL;
const plain = await load("no-url");
process.env.NEXT_PUBLIC_SITE_URL = "https://svadba.example.invalid/";
const withUrl = await load("url");
delete process.env.NEXT_PUBLIC_SITE_URL;

const at = (time: string | null) => ({ events: events.map((e, i) => (i === 0 ? { ...e, time } : e)), places });
const now = new Date("2027-01-02T03:04:05.678Z");
/** The unfolded VEVENT lines. */
const lines = (ics: string) => ics.replace(/\r\n /g, "").split("\r\n");

test("until the ceremony has a time, the event is all day, ending the next day", () => {
  const ics = lines(plain.icsFile(at(null), now));
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20270529"));
  assert.ok(ics.includes("DTEND;VALUE=DATE:20270530"));
  assert.ok(ics.includes("DTSTAMP:20270102T030405Z"));
  assert.ok(!ics.some((l) => /^DTSTART:/.test(l)));
  assert.match(plain.googleCalendarUrl(at(null)), /dates=20270529%2F20270530/);
});

test("with a ceremony time, the event is timed in UTC (summer time, UTC+2)", () => {
  const ics = lines(plain.icsFile(at("14:30"), now));
  assert.ok(ics.includes("DTSTART:20270529T123000Z"));
  assert.ok(ics.includes("DTEND:20270529T215900Z"));
  assert.ok(!ics.some((l) => l.includes("VALUE=DATE")));
  assert.match(plain.googleCalendarUrl(at("14:30")), /dates=20270529T123000Z%2F20270529T215900Z/);
});

test("the title keeps its emoji in the file and the Google link", () => {
  const ics = lines(plain.icsFile(at(null), now));
  assert.ok(ics.includes("SUMMARY:💒 Baška a Mišo svadba"));
  assert.equal(new URL(plain.googleCalendarUrl(at(null))).searchParams.get("text"), "💒 Baška a Mišo svadba");
});

test("URL: only when NEXT_PUBLIC_SITE_URL is set, without its trailing slash", () => {
  const without = lines(plain.icsFile(at(null), now));
  assert.ok(!without.some((l) => l.startsWith("URL:")));
  assert.ok(!without.join("\n").includes("example.invalid"));

  const ics = lines(withUrl.icsFile(at(null), now));
  assert.ok(ics.includes("URL:https://svadba.example.invalid"));
  assert.ok(ics.find((l) => l.startsWith("DESCRIPTION:Obrad"))?.includes("https://svadba.example.invalid"));
});

test("the file is CRLF-terminated with lines of at most 75 octets", () => {
  const ics = withUrl.icsFile(at("14:30"), now);
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n"));
  for (const l of ics.split("\r\n")) assert.ok(new TextEncoder().encode(l).length <= 75, l);
});
