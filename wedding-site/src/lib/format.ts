const dateFormat = new Intl.DateTimeFormat("sk-SK", { day: "numeric", month: "long", timeZone: "Europe/Bratislava" });

/** "2027-04-30" → "30. apríla" */
export function formatDayMonth(iso: string): string {
  return dateFormat.format(new Date(`${iso}T12:00:00Z`));
}

/** "4" → "4 km", 2.5 → "2,5 km" */
export function formatKm(km: number): string {
  return `${km.toLocaleString("sk-SK")} km`;
}

/**
 * Slovak line breaks: a one-letter word (v, k, s, z, a, o, u, i) stays with the next word, and a day or
 * month number with what follows („29. mája“, „29. 05. 2027“). Only for text shown, never for URLs.
 */
export function tie(text: string): string {
  return text.replace(/(?<=^|[\s(„])([vkszaoui]) /giu, "$1 ").replace(/(?<=\b\d{1,2}\.) (?=[\p{L}\d])/gu, " ");
}
