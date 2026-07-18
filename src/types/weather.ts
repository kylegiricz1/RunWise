
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