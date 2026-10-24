import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from '../context/LocationContext';
import { useRunPreferences } from '../context/RunPreferencesContext';
import { scheduleRollingRunNotifications } from '../services/notifications';
import { fetchForecast } from '../services/weatherApi';
import { getConditionText } from '../services/weatherApi/conditions';
import { evaluateDayRunWindow } from '../services/weatherScoring/score';
import { LocationState } from '../types/location';
import { DailyBestTime, DayForecast, HourlyPoint, WeatherData } from '../types/weather';
import { isDateToday } from '../utils/date';

const DEFAULT_DAY_INDEX = 0;

export type UseWeatherDataResult = {
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
  // Past-hour awareness metrics for the currently selected day
  isToday: boolean;
  isPrimePassed: boolean;
  overallBestTime: string | null;
  allWindowsPassed: boolean;
};

export function useWeatherData(overrideLocation?: LocationState | null): UseWeatherDataResult {
  const { location: contextLocation, loading: locationLoading } = useLocation();
  const location = overrideLocation !== undefined ? overrideLocation : contextLocation;

  const { activeWindows, preferences } = useRunPreferences();
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
      days.map((day, i) => {
        const isToday = i === 0 || isDateToday(day.date);
        const evalResult = evaluateDayRunWindow(day.hourly, activeWindows, isToday);

        const time = evalResult.bestHour?.time ? evalResult.bestHour.time.split('T')[1] : null;
        const overallBestTime = evalResult.overallBestHour?.time
          ? evalResult.overallBestHour.time.split('T')[1]
          : null;

        return {
          date: day.date,
          time,
          score: evalResult.bestHour?.score ?? null,
          overallBestTime,
          overallScore: evalResult.overallBestHour?.score ?? null,
          isPrimePassed: evalResult.isPrimePassed,
          allWindowsPassed: evalResult.allWindowsPassed,
          remainingHoursCount: evalResult.remainingHoursCount,
        };
      }),
    [activeWindows, days]
  );

  const selectedDayEvaluation = dailyBestTimes[selectedDayIndex] ?? null;
  const isToday =
    selectedDayIndex === 0 || (selectedDay ? isDateToday(selectedDay.date) : false);
  const isPrimePassed = isToday && (selectedDayEvaluation?.isPrimePassed ?? false);
  const allWindowsPassed = isToday && (selectedDayEvaluation?.allWindowsPassed ?? false);
  const overallBestTime = selectedDayEvaluation?.overallBestTime ?? null;

  useEffect(() => {
    setBestTime(dailyBestTimes[selectedDayIndex]?.time ?? null);
  }, [dailyBestTimes, selectedDayIndex]);

  // Synchronize rolling local notifications when forecast data or preferences change
  useEffect(() => {
    if (preferences.notifications?.enabled && days.length > 1) {
      scheduleRollingRunNotifications(
        days,
        activeWindows,
        preferences.notifications.hour ?? 20
      ).catch((err) => {
        console.warn('Failed to schedule rolling notifications:', err);
      });
    }
  }, [days, activeWindows, preferences.notifications?.enabled, preferences.notifications?.hour]);

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
    isToday,
    isPrimePassed,
    overallBestTime,
    allWindowsPassed,
  };
}
