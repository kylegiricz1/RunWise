import { getDayLabel, getShortDateLabel, parseDateOnly } from '../src/utils/date';
import { formatTimeLabel } from '../src/utils/time';

describe('Date & Time Formatting Helpers', () => {
  describe('parseDateOnly', () => {
    it('constructs a local date without timezone offset day shift', () => {
      const date = parseDateOnly('2026-10-24');
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(9); // 0-indexed October
      expect(date.getDate()).toBe(24);
    });
  });

  describe('getDayLabel', () => {
    it('returns "Today" for index 0', () => {
      expect(getDayLabel(0, '2026-10-24')).toBe('Today');
    });

    it('returns "Tomorrow" for index 1', () => {
      expect(getDayLabel(1, '2026-10-25')).toBe('Tomorrow');
    });

    it('returns the full weekday name for subsequent days', () => {
      // 2026-10-26 is a Monday
      expect(getDayLabel(2, '2026-10-26')).toBe('Monday');
    });
  });

  describe('getShortDateLabel', () => {
    it('returns short weekday and calendar day number', () => {
      const label = getShortDateLabel('2026-10-24');
      expect(label.day).toBe('24');
      expect(typeof label.weekday).toBe('string');
      expect(label.weekday.length).toBeGreaterThan(0);
    });
  });

  describe('formatTimeLabel', () => {
    it('formats morning times with AM', () => {
      expect(formatTimeLabel('07:00')).toBe('7:00 AM');
      expect(formatTimeLabel('09:30')).toBe('9:30 AM');
    });

    it('formats afternoon and evening times with PM', () => {
      expect(formatTimeLabel('13:00')).toBe('1:00 PM');
      expect(formatTimeLabel('18:45')).toBe('6:45 PM');
      expect(formatTimeLabel('23:15')).toBe('11:15 PM');
    });

    it('correctly handles 12:00 PM noon and 00:00 AM midnight', () => {
      expect(formatTimeLabel('12:00')).toBe('12:00 PM');
      expect(formatTimeLabel('00:00')).toBe('12:00 AM');
    });

    it('returns null for null, undefined, or malformed time strings', () => {
      expect(formatTimeLabel(null)).toBeNull();
      expect(formatTimeLabel(undefined)).toBeNull();
      expect(formatTimeLabel('invalid')).toBeNull();
      expect(formatTimeLabel('')).toBeNull();
    });
  });
});
