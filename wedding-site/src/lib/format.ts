const dateFormat = new Intl.DateTimeFormat("sk-SK", { day: "numeric", month: "long", timeZone: "Europe/Bratislava" });

/** "2027-04-30" → "30. apríla" */
export function formatDayMonth(iso: string): string {
  return dateFormat.format(new Date(`${iso}T12:00:00Z`));
}

/** "4" → "4 km", 2.5 → "2,5 km" */
export function formatKm(km: number): string {
  return `${km.toLocaleString("sk-SK")} km`;
}
