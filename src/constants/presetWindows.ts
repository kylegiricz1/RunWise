import { PresetWindowKey, TimeWindow } from '../types/settings';

export const PRESET_WINDOWS: Record<PresetWindowKey, TimeWindow> = {
  earlyMorning: { id: 'earlyMorning', label: 'Early Morning', startHour: 5, endHour: 8 },
  morning: { id: 'morning', label: 'Morning', startHour: 8, endHour: 11 },
  midday: { id: 'midday', label: 'Midday', startHour: 11, endHour: 14 },
  afternoon: { id: 'afternoon', label: 'Afternoon', startHour: 14, endHour: 17 },
  evening: { id: 'evening', label: 'Evening', startHour: 17, endHour: 20 },
  night: { id: 'night', label: 'Night', startHour: 20, endHour: 23 },
};

export const PRESET_ORDER: PresetWindowKey[] = [
  'earlyMorning',
  'morning',
  'midday',
  'afternoon',
  'evening',
  'night',
];