export type PresetWindowKey =
  | 'earlyMorning'
  | 'morning'
  | 'midday'
  | 'afternoon'
  | 'evening'
  | 'night';

// startHour/endHour are 0–23.5 in 30-minute increments (e.g. 17.5 = 5:30 PM).
// endHour is exclusive and assumed to be later in the same day (no overnight
// wraparound, e.g. 22 -> 2, to keep the filtering logic simple).
export type TimeWindow = {
  id: string;
  label: string;
  startHour: number;
  endHour: number;
};

export type RunTimePreferences = {
  selectedPresets: PresetWindowKey[];
  customWindows: TimeWindow[];
};