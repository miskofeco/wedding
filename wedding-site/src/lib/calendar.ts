// One source for the "add to calendar" event: the Google link and the .ics file.
import { events, places, site } from "@/content";
import { escapeText, fold } from "./ics";

/** Public site address for the event description, e.g. https://svadba.example.sk (optional). */
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "") || null;

const ymd = site.date.replace(/-/g, ""); // 20270529
const nextDay = (() => {
  const d = new Date(`${site.date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
})();

// Late May is summer time in Slovakia (UTC+2).
const SUMMER_OFFSET_H = 2;
const toUtcStamp = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(Date.UTC(Number(site.date.slice(0, 4)), Number(site.date.slice(5, 7)) - 1, Number(site.date.slice(8, 10)), h - SUMMER_OFFSET_H, m));
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
};

/** The ceremony time once confirmed in content/events.ts; until then the event is all-day. */
const start = events[0]?.time ?? null;

export const calendarEvent = {
  title: site.calendarTitle,
  // The day starts at the church, so that is the event's location; the barn is in the description.
  location: [places.church.name ?? "Kostol v Hlinnom", places.church.address ?? "Hlinné"].join(", "),
  description: [
    `Obrad: ${[places.church.name ?? "kostol v Hlinnom", places.church.address].filter(Boolean).join(", ")}.`,
    `Oslava: ${[places.venue.name ?? "Stodola Zlatník", places.venue.address].filter(Boolean).join(", ")}.`,
    siteUrl ? `Program, mapa a potvrdenie účasti: ${siteUrl}` : "Program a mapu nájdete na pozvánke.",
  ].join(" "),
  allDay: start === null,
  // All-day: the date and the next day (end is exclusive). Timed: ceremony until 23:59.
  startStamp: start ? toUtcStamp(start) : ymd,
  endStamp: start ? toUtcStamp("23:59") : nextDay,
};

export function googleCalendarUrl(): string {
  const e = calendarEvent;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${e.startStamp}/${e.endStamp}`,
    details: e.description,
    location: e.location,
    ctz: "Europe/Bratislava",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function icsFile(now = new Date()): string {
  const e = calendarEvent;
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Barbora a Michal//Svadba//SK",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:svadba-${ymd}@barbora-michal`,
    `DTSTAMP:${stamp}`,
    e.allDay ? `DTSTART;VALUE=DATE:${e.startStamp}` : `DTSTART:${e.startStamp}`,
    e.allDay ? `DTEND;VALUE=DATE:${e.endStamp}` : `DTEND:${e.endStamp}`,
    `SUMMARY:${escapeText(e.title)}`,
    `LOCATION:${escapeText(e.location)}`,
    `DESCRIPTION:${escapeText(e.description)}`,
    ...(siteUrl ? [`URL:${siteUrl}`] : []),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:-P7D",
    `DESCRIPTION:${escapeText("O týždeň je naša svadba.")}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
