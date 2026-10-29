const HOUR_MS = 60 * 60 * 1000;

export function vietnamDate(offsetDays = 0): string {
  return new Date(Date.now() + (7 + offsetDays * 24) * HOUR_MS)
    .toISOString()
    .slice(0, 10);
}
