import { filterHoursByWindows } from '../src/services/weatherScoring/timeWindowFilter';
import { evaluateDayRunWindow } from '../src/services/weatherScoring/score';
import { isHourInPast, isDateToday } from '../src/utils/date';
import { HourlyPoint } from '../src/types/weather';
import { TimeWindow } from '../src/types/settings';

describe('Time Window Filtering & Past-Hour Awareness', () => {
  // Realistic day temperature curve:
  // 7 AM is ideal (58°F)
  // Afternoon 12 PM - 4 PM is hot (86°F - 90°F)
  // Evening 6 PM (18:00) is a pleasant evening window (60°F)
  const sampleDayHours: HourlyPoint[] = Array.from({ length: 24 }, (_, i) => {
    const hh = String(i).padStart(2, '0');
    let temp = 50;
    if (i === 7) temp = 58; // Prime morning
    else if (i >= 12 && i <= 16) temp = 88; // Hot afternoon
    else if (i === 18) temp = 60; // Prime evening remaining
    else if (i > 18) temp = 52;

    return {
      time: `2026-10-24T${hh}:00`,
      feelsLike: temp,
      humidity: 50,
      wind: 6,
      rainChance: 0,
    };
  });

  describe('filterHoursByWindows', () => {
    it('returns the full array unchanged when windows list is empty', () => {
      const result = filterHoursByWindows(sampleDayHours, []);
      expect(result).toHaveLength(24);
    });

    it('filters hours within a single custom window', () => {
      const morningWindow: TimeWindow[] = [
        { id: '1', label: 'Morning', startHour: 6, endHour: 10 },
      ];
      const filtered = filterHoursByWindows(sampleDayHours, morningWindow);
      expect(filtered).toHaveLength(4); // 06:00, 07:00, 08:00, 09:00
      expect(filtered.map((h) => h.time.split('T')[1])).toEqual([
        '06:00',
        '07:00',
        '08:00',
        '09:00',
      ]);
    });

    it('handles multiple overlapping or disjoint windows', () => {
      const splitWindows: TimeWindow[] = [
        { id: '1', label: 'Morning', startHour: 6, endHour: 8 },
        { id: '2', label: 'Evening', startHour: 17, endHour: 19 },
      ];
      const filtered = filterHoursByWindows(sampleDayHours, splitWindows);
      expect(filtered).toHaveLength(4); // 06:00, 07:00, 17:00, 18:00
    });

    it('falls back to full day if window does not overlap any points', () => {
      const narrowWindow: TimeWindow[] = [
        { id: '1', label: 'Narrow', startHour: 25, endHour: 26 },
      ];
      const filtered = filterHoursByWindows(sampleDayHours, narrowWindow);
      expect(filtered).toHaveLength(24);
    });
  });

  describe('isDateToday & isHourInPast date utilities', () => {
    const fixedNow = new Date(2026, 9, 24, 16, 15, 0, 0); // Oct 24, 2026 at 4:15 PM

    it('identifies today matching calendar date in local time', () => {
      expect(isDateToday('2026-10-24', fixedNow)).toBe(true);
      expect(isDateToday('2026-10-25', fixedNow)).toBe(false);
      expect(isDateToday('2026-10-23', fixedNow)).toBe(false);
    });

    it('flags earlier hours on today as passed', () => {
      expect(isHourInPast('2026-10-24T07:00', fixedNow)).toBe(true);
      expect(isHourInPast('2026-10-24T15:00', fixedNow)).toBe(true);
    });

    it('keeps current hour active within 30-minute grace window', () => {
      // At 4:15 PM, 4:00 PM is still active (< 30m elapsed)
      expect(isHourInPast('2026-10-24T16:00', fixedNow)).toBe(false);

      // At 4:35 PM, 4:00 PM is passed (>= 30m elapsed)
      const lateNow = new Date(2026, 9, 24, 16, 35, 0, 0);
      expect(isHourInPast('2026-10-24T16:00', lateNow)).toBe(true);
      expect(isHourInPast('2026-10-24T17:00', lateNow)).toBe(false);
    });

    it('never flags future dates as in the past', () => {
      expect(isHourInPast('2026-10-25T07:00', fixedNow)).toBe(false);
    });

    it('always flags yesterday hours as in the past', () => {
      expect(isHourInPast('2026-10-23T20:00', fixedNow)).toBe(true);
    });
  });

  describe('evaluateDayRunWindow evaluation engine', () => {
    it('evaluates future days considering the full day without past filtering', () => {
      const result = evaluateDayRunWindow(sampleDayHours, [], false);
      expect(result.bestHour).not.toBeNull();
      expect(result.bestHour?.time).toBe('2026-10-24T07:00'); // 7 AM is 58°F peak
      expect(result.isPrimePassed).toBe(false);
      expect(result.isOutsideWindow).toBe(false);
      expect(result.allWindowsPassed).toBe(false);
    });

    it('recommends best remaining hour when morning prime window has elapsed', () => {
      // It is 4:45 PM, so 00:00-16:00 have passed
      const afternoonNow = new Date(2026, 9, 24, 16, 45, 0, 0);
      const result = evaluateDayRunWindow(sampleDayHours, [], true, afternoonNow);

      expect(result.bestHour).not.toBeNull();
      expect(result.bestHour?.time).toBe('2026-10-24T18:00'); // 6:00 PM peak (60°F)
      expect(result.overallBestHour?.time).toBe('2026-10-24T07:00');
      expect(result.isPrimePassed).toBe(true);
      expect(result.isOutsideWindow).toBe(false);
      expect(result.allWindowsPassed).toBe(false);
    });

    it('falls back to rest of day when preferred morning window has passed', () => {
      // User preferred 6 AM - 11 AM, but it is now 1:30 PM (13:30)
      const morningWindow: TimeWindow[] = [
        { id: '1', label: 'Morning', startHour: 6, endHour: 11 },
      ];
      const middayNow = new Date(2026, 9, 24, 13, 30, 0, 0);

      const result = evaluateDayRunWindow(sampleDayHours, morningWindow, true, middayNow);

      expect(result.bestHour).not.toBeNull();
      expect(result.bestHour?.time).toBe('2026-10-24T18:00'); // Best rest of day
      expect(result.isOutsideWindow).toBe(true);
      expect(result.preferredWindowPassed).toBe(true);
      expect(result.allWindowsPassed).toBe(false);
    });

    it('marks day as allWindowsPassed when all hours have elapsed late at night', () => {
      const lateNightNow = new Date(2026, 9, 24, 23, 45, 0, 0);
      const result = evaluateDayRunWindow(sampleDayHours, [], true, lateNightNow);

      expect(result.bestHour).toBeNull();
      expect(result.allWindowsPassed).toBe(true);
      expect(result.overallBestHour?.time).toBe('2026-10-24T07:00');
    });
  });
});
