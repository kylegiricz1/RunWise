import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from '../context/LocationContext';
import { useRunPreferences } from '../context/RunPreferencesContext';
import { fetchForecast } from '../services/weatherApi';
import { getConditionText } from '../services/weatherApi/conditions';
import { bestRunHour } from '../services/weatherScoring/score';
import { filterHoursByWindows } from '../services/weatherScoring/timeWindowFilter';
import { LocationState } from '../types/location';
import { DailyBestTime, DayForecast, HourlyPoint, WeatherData } from '../types/weather';

const DEFAULT_DAY_INDEX = 1;

type UseWeatherDataResult = {
  weather: WeatherData | null;
  hourlyData: HourlyPoint[];
  bestTime: string | null;
  dailyBestTimes: DailyBestTime[];
  loading: boolean;
  error: string | null;
  days: DayForecast[];
  selectedDayIndex: number;
  selectDay: (index: number) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  canGoPreviousDay: boolean;
  canGoNextDay: boolean;
};

export function useWeatherData(overrideLocation?: LocationState | null): UseWeatherDataResult {
  const { location: contextLocation, loading: locationLoading } = useLocation();
  const location = overrideLocation !== undefined ? overrideLocation : contextLocation;

  const { activeWindows } = useRunPreferences();
  const [days, setDays] = useState<DayForecast[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(DEFAULT_DAY_INDEX);
  const [bestTime, setBestTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) {
      if (!locationLoading) {
        setLoading(false);
      }
      return;
    }

    async function loadWeather(loc: LocationState) {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchForecast(loc.latitude, loc.longitude);

        const builtDays: DayForecast[] = data.daily.time.map((date, i) => {
          const weather: WeatherData = {
            temperature: `${Math.round(data.daily.temperature_2m_max[i])}°F`,
            feelsLike: `${Math.round(data.daily.apparent_temperature_max[i])}°F`,
            condition: getConditionText(data.daily.weathercode[i]),
            wind: `${Math.round(data.daily.windspeed_10m_max[i])} mph`,
            humidity: `${Math.round(data.daily.relative_humidity_2m_mean[i])}%`,
            rainChance: `${data.daily.precipitation_probability_max[i]}%`,
          };

          const hourly: HourlyPoint[] = [];
          const startHour = i * 24;
          const endHour = startHour + 24;
          for (let h = startHour; h < endHour; h++) {
            if (!data.hourly.time[h]) continue;
            hourly.push({
              time: data.hourly.time[h],
              feelsLike: data.hourly.apparent_temperature[h],
              humidity: data.hourly.relative_humidity_2m[h],
              wind: data.hourly.windspeed_10m[h],
              rainChance: data.hourly.precipitation_probability[h],
            });
          }

          return { date, weather, hourly };
        });

        setDays(builtDays);
        setSelectedDayIndex((prev) => Math.min(prev, builtDays.length - 1));
      } catch (err) {
        console.log('Weather fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load weather');
      } finally {
        setLoading(false);
      }
    }

    loadWeather(location);
  }, [location?.latitude, location?.longitude, locationLoading]);

  const selectedDay = days[selectedDayIndex] ?? null;
  const weather = selectedDay?.weather ?? null;
  const hourlyData = useMemo(() => selectedDay?.hourly ?? [], [selectedDay]);

  const dailyBestTimes = useMemo<DailyBestTime[]>(
    () =>
      days.map((day) => {
        if (day.hourly.length === 0) {
          return { date: day.date, time: null, score: null };
        }
        const best = bestRunHour(filterHoursByWindows(day.hourly, activeWindows));
        return { date: day.date, time: best.time.split('T')[1] ?? null, score: best.score };
      }),
    [activeWindows, days]
  );

  useEffect(() => {
    setBestTime(dailyBestTimes[selectedDayIndex]?.time ?? null);
  }, [dailyBestTimes, selectedDayIndex]);

  const selectDay = useCallback(
    (index: number) => setSelectedDayIndex(Math.min(Math.max(index, 0), days.length - 1)),
    [days.length]
  );

  const goToPreviousDay = () => selectDay(selectedDayIndex - 1);
  const goToNextDay = () => selectDay(selectedDayIndex + 1);

  return {
    weather,
    hourlyData,
    bestTime,
    dailyBestTimes,
    loading: loading || locationLoading,
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
