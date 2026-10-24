export type WeatherData = {
  temperature: string;
  feelsLike: string;
  condition: string;
  wind: string;
  humidity: string;
  rainChance: string;
};

export type HourlyPoint = {
  time: string;
  feelsLike: number;
  humidity: number;
  rainChance: number;
  wind: number;
};

export type DayForecast = {
  date: string;
  weather: WeatherData;
  hourly: HourlyPoint[];
};

export type DailyBestTime = {
  date: string;
  time: string | null;
  score: number | null;
  overallBestTime?: string | null;
  overallScore?: number | null;
  isPrimePassed?: boolean;
  isOutsideWindow?: boolean;
  preferredWindowPassed?: boolean;
  allWindowsPassed?: boolean;
  remainingHoursCount?: number;
};
