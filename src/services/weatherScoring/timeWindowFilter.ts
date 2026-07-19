import { TimeWindow } from '../../types/settings';
import { HourlyPoint } from '../../types/weather';

function hourOf(point: HourlyPoint): number {
  const timePart = point.time.split('T')[1] ?? point.time;
  const [h, m] = timePart.split(':').map(Number);
  return h + (m ?? 0) / 60;
}

// Returns only the hourly points that fall within at least one of the given
// windows. If `windows` is empty, returns `hourly` unchanged (no preference
// set = consider the whole day, same as the app's original behavior).
export function filterHoursByWindows(
  hourly: HourlyPoint[],
  windows: TimeWindow[]
): HourlyPoint[] {
  if (windows.length === 0) return hourly;

  const filtered = hourly.filter((point) => {
    const h = hourOf(point);
    return windows.some((w) => h >= w.startHour && h < w.endHour);
  });

  // Safety net: if the selected windows don't overlap any hour in the data
  // (e.g. a very narrow custom window), fall back to the full day rather
  // than scoring an empty list.
  return filtered.length > 0 ? filtered : hourly;
}