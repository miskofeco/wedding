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

const pick = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Object.fromEntries(parts.formatToParts(d).map((x) => [x.type, x.value]));
};

/** ISO → "24. 10. 2026, 17:34" in Slovak time. */
export function formatStamp(iso: string): string {
  const p = pick(iso);
  return p ? `${p.day}. ${p.month}. ${p.year}, ${p.hour}:${p.minute}` : "";
}

/** ISO → "24. 10." (this year) or "24. 10. 2026". */
export function formatShort(iso: string, now = new Date()): string {
  const p = pick(iso);
  if (!p) return "";
  return p.year === String(now.getFullYear()) ? `${p.day}. ${p.month}.` : `${p.day}. ${p.month}. ${p.year}`;
}

/** "YYYY-MM-DD" → "29. 5. 2027" */
export function formatDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return y && m && d ? `${d}. ${m}. ${y}` : day;
}

/** Slovak plural: plural(2, ["hosť", "hostia", "hostí"]) → "hostia". */
export function plural(n: number, [one, few, many]: [string, string, string]): string {
  return n === 1 ? one : n >= 2 && n <= 4 ? few : many;
}

/** How long ago, in words: „pred 5 min“, „včera“, „pred 3 dňami“. */
export function ago(iso: string, now = new Date()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const min = Math.round((now.getTime() - t) / 60_000);
  if (min < 1) return "práve teraz";
  if (min < 60) return `pred ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `pred ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "včera";
  if (d < 30) return `pred ${d} dňami`;
  return formatShort(iso, now);
}
