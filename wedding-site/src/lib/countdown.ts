/** Today's date in Slovakia as YYYY-MM-DD. */
export function todayInSlovakia(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bratislava" }).format(now);
}

/** Whole days from `today` to `target` (both YYYY-MM-DD). Negative once the day has passed. */
export function daysUntil(target: string, today: string): number {
  return Math.round((Date.parse(`${target}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

/** 1 deň, 2–4 dni, 0 and 5+ dní */
export function dayWord(n: number): string {
  if (n === 1) return "deň";
  if (n >= 2 && n <= 4) return "dni";
  return "dní";
}
