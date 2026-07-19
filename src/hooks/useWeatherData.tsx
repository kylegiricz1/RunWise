import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import { useRunPreferences } from '../context/RunPreferencesContext';
import { fetchForecast } from '../services/weatherApi';
import { getConditionText } from '../services/weatherApi/conditions';
import { bestRunHour } from '../services/weatherScoring/score';
import { filterHoursByWindows } from '../services/weatherScoring/timeWindowFilter';
import { DayForecast, HourlyPoint, WeatherData } from '../types/weather';

const DEFAULT_DAY_INDEX = 1; // tomorrow, matches the app's original default

type UseWeatherDataResult = {
  city: string | null;
  state: string | null;
  weather: WeatherData | null;
  hourlyData: HourlyPoint[];
  bestTime: string | null;
  loading: boolean;
  error: string | null;

  // Multi-day navigation
  days: DayForecast[];
  selectedDayIndex: number;
  selectDay: (index: number) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  canGoPreviousDay: boolean;
  canGoNextDay: boolean;
};

export function useWeatherData(): UseWeatherDataResult {
  const { activeWindows } = useRunPreferences();
  const [city, setCity] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [days, setDays] = useState<DayForecast[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(DEFAULT_DAY_INDEX);
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

        // Build one DayForecast per day the API returned, each carrying
        // its own daily summary + its 24 hourly points. Hourly data is a
        // flat array covering every day back-to-back (24 entries per day,
        // starting at day 0's midnight), so day `i`'s hours are the slice
        // [i * 24, i * 24 + 24).
        const builtDays: DayForecast[] = data.daily.time.map((date, i) => {
          const weather: WeatherData = {
            temperature: `${Math.round(data.daily.temperature_2m_max[i])}°F`,
            feelsLike: `${Math.round(data.daily.apparent_temperature_max[i])}°F`,
            condition: getConditionText(data.daily.weathercode[i]),
            wind: `${Math.round(data.daily.windspeed_10m_max[i])} mph`,
            humidity: `${Math.round(data.daily.relative_humidity_2m_mean[i])}%`,
            rainChance: `${Math.round(data.daily.precipitation_probability_max[i])}%`,
          };

          const hourly: HourlyPoint[] = [];
          const startHour = i * 24;
          const endHour = startHour + 24;
          for (let h = startHour; h < endHour; h++) {
            if (!data.hourly.time[h]) continue; // guard in case of a short final day
            hourly.push({
              time: data.hourly.time[h],
              feelsLike: data.hourly.apparent_temperature[h],
              humidity: data.hourly.relative_humidity_2m[h],
              rainChance: data.hourly.precipitation_probability[h],
              wind: data.hourly.windspeed_10m[h],
            });
          }

          return { date, weather, hourly };
        });

        setDays(builtDays);
        setSelectedDayIndex((prev) =>
          // Clamp in case a previous fetch had fewer days for some reason.
          Math.min(prev, builtDays.length - 1)
        );
      } catch (err) {
        console.log('Location error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load weather');
      } finally {
        setLoading(false);
      }
    }

    loadWeather();
  }, []);

  const selectedDay = days[selectedDayIndex] ?? null;
  const weather = selectedDay?.weather ?? null;
  const hourlyData = useMemo(() => selectedDay?.hourly ?? [], [selectedDay]);

  // Re-score whenever the selected day's hours or the person's preferred
  // run windows change. If no windows are selected, filterHoursByWindows
  // returns the full day unfiltered.
  useEffect(() => {
    if (hourlyData.length === 0) {
      setBestTime(null);
      return;
    }
    const candidates = filterHoursByWindows(hourlyData, activeWindows);
    setBestTime(bestRunHour(candidates).time.split('T')[1]);
  }, [hourlyData, activeWindows]);

  const selectDay = (index: number) => {
    setSelectedDayIndex(Math.min(Math.max(index, 0), days.length - 1));
  };

  const goToPreviousDay = () => selectDay(selectedDayIndex - 1);
  const goToNextDay = () => selectDay(selectedDayIndex + 1);

  return {
    city,
    state,
    weather,
    hourlyData,
    bestTime,
    loading,
    error,
    days,
    selectedDayIndex,
    selectDay,
    goToPreviousDay,
    goToNextDay,
    canGoPreviousDay: selectedDayIndex > 0,
    canGoNextDay: selectedDayIndex < days.length - 1,
  };
}