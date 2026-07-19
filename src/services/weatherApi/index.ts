// Shape of the fields we actually read from the Open-Meteo response.
// (Open-Meteo returns more than this; we only type what we use.)
export type ForecastResponse = {
  daily: {
    time: string[]; // "YYYY-MM-DD" per day
    temperature_2m_max: number[];
    apparent_temperature_max: number[];
    precipitation_probability_max: number[];
    windspeed_10m_max: number[];
    relative_humidity_2m_mean: number[];
    weathercode: number[];
  };
  hourly: {
    time: string[];
    apparent_temperature: number[];
    relative_humidity_2m: number[];
    precipitation_probability: number[];
    windspeed_10m: number[];
  };
};

const FORECAST_DAYS = 7;

function buildForecastUrl(latitude: number, longitude: number): string {
  return (
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&daily=temperature_2m_max,apparent_temperature_max,precipitation_probability_max,windspeed_10m_max,relative_humidity_2m_mean,weathercode` +
    `&hourly=apparent_temperature,relative_humidity_2m,precipitation_probability,windspeed_10m` +
    `&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto&forecast_days=${FORECAST_DAYS}`
  );
}

export async function fetchForecast(
  latitude: number,
  longitude: number
): Promise<ForecastResponse> {
  const response = await fetch(buildForecastUrl(latitude, longitude));

  if (!response.ok) {
    throw new Error(`Forecast request failed with status ${response.status}`);
  }

  return response.json();
}