import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { useRunPreferences } from '../context/RunPreferencesContext';
import { fetchForecast } from '../services/weatherApi';
import { getConditionText } from '../services/weatherApi/conditions';
import { bestRunHour } from '../services/weatherScoring/score';
import { filterHoursByWindows } from '../services/weatherScoring/timeWindowFilter';
import { HourlyPoint, WeatherData } from '../types/weather';

type UseWeatherDataResult = {
  city: string | null;
  state: string | null;
  weather: WeatherData | null;
  hourlyData: HourlyPoint[];
  bestTime: string | null;
  loading: boolean;
  error: string | null;
};

export function useWeatherData(): UseWeatherDataResult {
  const { activeWindows } = useRunPreferences();
  const [city, setCity] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyPoint[]>([]);
  const [bestTime, setBestTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWeather() {
      try {
        setLoading(true);
        setError(null);

        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          console.log('Permission denied');
          setError('Location permission denied');
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const { latitude, longitude } = currentLocation.coords;

        // Reverse geocoding can fail/throw on some platforms (e.g. web) —
        // don't let it block the weather fetch below.
        try {
          const address = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });

          if (address.length > 0) {
            setCity(address[0].city);
            setState(address[0].region);
          }
        } catch (geocodeError) {
          console.log('Reverse geocode error:', geocodeError);
        }

        const data = await fetchForecast(latitude, longitude);

        const i = 1; // tomorrow: daily

        setWeather({
          temperature: `${Math.round(data.daily.temperature_2m_max[i])}°F`,
          feelsLike: `${Math.round(data.daily.apparent_temperature_max[i])}°F`,
          condition: getConditionText(data.daily.weathercode[i]),
          wind: `${Math.round(data.daily.windspeed_10m_max[i])} mph`,
          humidity: `${Math.round(data.daily.relative_humidity_2m_mean[i])}%`,
          rainChance: `${Math.round(data.daily.precipitation_probability_max[i])}%`,
        });

        // Hourly data for tomorrow: indices 24–47 (index 0 = midnight today)
        const hourly: HourlyPoint[] = [];
        for (let h = 24; h < 48; h++) {
          hourly.push({
            time: data.hourly.time[h],
            feelsLike: data.hourly.apparent_temperature[h],
            humidity: data.hourly.relative_humidity_2m[h],
            rainChance: data.hourly.precipitation_probability[h],
            wind: data.hourly.windspeed_10m[h],
          });
        }
        setHourlyData(hourly);
      } catch (err) {
        console.log('Location error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load weather');
      } finally {
        setLoading(false);
      }
    }

    loadWeather();
  }, []);

  // Re-score whenever the forecast loads or the person's preferred run
  // windows change (e.g. after editing them in Settings). If no windows
  // are selected, filterHoursByWindows returns the full day unfiltered.
  useEffect(() => {
    if (hourlyData.length === 0) return;
    const candidates = filterHoursByWindows(hourlyData, activeWindows);
    setBestTime(bestRunHour(candidates).time.split('T')[1]);
  }, [hourlyData, activeWindows]);

  return { city, state, weather, hourlyData, bestTime, loading, error };
}