/** Calendar date without a time or zone, e.g. "2026-11-14". */
export type DateOnly = string;
/** UTC instant as an ISO-8601 string, e.g. "2026-10-02T06:00:00.000Z". */
export type UtcInstant = string;

export const TOKYO = "Asia/Tokyo";

export function formatInstant(instant: UtcInstant, timeZone: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(instant));
}

export function formatDateOnly(date: DateOnly): string {
  // Parse as UTC noon and format in UTC so the calendar day never shifts.
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function formatRelative(instant: UtcInstant, now: Date): string {
  const minutes = Math.round((new Date(instant).getTime() - now.getTime()) / 60_000);
  const abs = Math.abs(minutes);
  const unit = abs >= 1440 ? `${Math.round(abs / 1440)}d` : abs >= 60 ? `${Math.round(abs / 60)}h` : `${abs}m`;
  return minutes >= 0 ? `in ${unit}` : `${unit} ago`;
}

/** Adds whole days to a date-only value without involving time zones. */
export function addDays(date: DateOnly, days: number): DateOnly {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}
