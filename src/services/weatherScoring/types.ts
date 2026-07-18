export type HourlyPoint = {
  time: string;
  feelsLike: number;
  humidity: number;
  rainChance: number;
  wind: number;
};

export type ScoredHour = HourlyPoint & {
  score: number;
};