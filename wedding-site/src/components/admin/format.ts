// Deterministic date formatting (same output on server and client).
const parts = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Bratislava",
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** ISO → "24. 10. 2026, 17:34" in Slovak time. */
export function formatStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = Object.fromEntries(parts.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.day}. ${p.month}. ${p.year}, ${p.hour}:${p.minute}`;
}
