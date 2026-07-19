// Parses a "YYYY-MM-DD" string as a local calendar date (not UTC), so it
// doesn't shift a day depending on the device's timezone offset.
export function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// "Today" / "Tomorrow" for the first two days (relative to the forecast's
// own timezone-anchored day 0), otherwise the full weekday name.
export function getDayLabel(dayIndex: number, dateStr: string): string {
  if (dayIndex === 0) return 'Today';
  if (dayIndex === 1) return 'Tomorrow';
  return parseDateOnly(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
}

// Short chip label used in the horizontal day selector, e.g. { weekday: 'Wed', day: '22' }.
export function getShortDateLabel(dateStr: string): { weekday: string; day: string } {
  const date = parseDateOnly(dateStr);
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    day: String(date.getDate()),
  };
}