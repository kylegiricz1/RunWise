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

/**
 * Returns true if the given "YYYY-MM-DD" string matches today's calendar date in local time.
 */
export function isDateToday(dateStr: string, referenceDate: Date = new Date()): boolean {
  const [year, month, day] = dateStr.split('-').map(Number);
  return (
    year === referenceDate.getFullYear() &&
    month === referenceDate.getMonth() + 1 &&
    day === referenceDate.getDate()
  );
}

/**
 * Checks whether an hourly point (e.g. "2026-10-24T16:00") is in the past.
 * An hour is considered passed if:
 * 1. Its calendar date is before today, OR
 * 2. It is today and its hour is earlier than the current hour, OR
 * 3. It is today, equal to the current hour, and >= 30 minutes into the hour have elapsed.
 */
export function isHourInPast(isoTime: string, referenceDate: Date = new Date()): boolean {
  const [datePart, timePart] = isoTime.split('T');
  if (!datePart || !timePart) return false;

  const [year, month, day] = datePart.split('-').map(Number);
  const [hour] = timePart.split(':').map(Number);

  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth() + 1;
  const refDay = referenceDate.getDate();

  // Compare calendar date first
  if (year < refYear) return true;
  if (year > refYear) return false;
  if (month < refMonth) return true;
  if (month > refMonth) return false;
  if (day < refDay) return true;
  if (day > refDay) return false;

  // It is today: compare hour and minutes
  const refHour = referenceDate.getHours();
  const refMinute = referenceDate.getMinutes();

  if (hour < refHour) return true;
  if (hour === refHour) {
    return refMinute >= 30;
  }

  return false;
}
