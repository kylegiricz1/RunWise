import {
  HEAT_HUMIDITY_FACTOR,
  HUMIDITY_MIDPOINT,
  HUMIDITY_STEEPNESS,
  IDEAL_TEMP,
  IDEAL_WIND,
  TEMP_SIGMA,
  WEIGHTS,
  WIND_SIGMA,
} from "./constants";
import { gaussian, logistic } from "./utility";
import { HourlyPoint, ScoredHour } from "./types";
import { TimeWindow } from "../../types/settings";
import { isHourInPast } from "../../utils/date";
import { filterHoursByWindows } from "./timeWindowFilter";

export function scoreHour(hour: HourlyPoint): number {
  const temperatureUtility = gaussian(
    hour.feelsLike,
    IDEAL_TEMP,
    TEMP_SIGMA
  );

  const humidityUtility = logistic(
    hour.humidity,
    HUMIDITY_MIDPOINT,
    HUMIDITY_STEEPNESS
  );

  const windUtility = gaussian(
    hour.wind,
    IDEAL_WIND,
    WIND_SIGMA
  );

  const rainUtility =
    Math.pow(1 - hour.rainChance / 100, 2);

  const interaction =
    HEAT_HUMIDITY_FACTOR *
    (1 - temperatureUtility) *
    (1 - humidityUtility);

  const score =
    WEIGHTS.temperature * temperatureUtility +
    WEIGHTS.humidity * humidityUtility +
    WEIGHTS.wind * windUtility +
    WEIGHTS.rain * rainUtility -
    interaction;

  return Math.max(0, Math.min(score, 1));
}

export function scoreHours(
  hours: HourlyPoint[]
): ScoredHour[] {
  return hours.map(hour => ({
    ...hour,
    score: scoreHour(hour),
  }));
}

export function findBestRunHour(
  hours: HourlyPoint[]
): ScoredHour | null {
  if (!hours || hours.length === 0) return null;
  const scored = scoreHours(hours);
  if (scored.length === 0) return null;
  return scored.reduce((best, current) =>
    current.score > best.score
      ? current
      : best
  );
}

export function bestRunHour(
  hours: HourlyPoint[]
): ScoredHour {
  const scored = scoreHours(hours);
  if (scored.length === 0) {
    throw new Error('Cannot determine best run hour from an empty list of hours');
  }

  return scored.reduce((best, current) =>
    current.score > best.score
      ? current
      : best
  );
}

export type DayScoreEvaluation = {
  bestHour: ScoredHour | null;
  overallBestHour: ScoredHour | null;
  isPrimePassed: boolean;
  allWindowsPassed: boolean;
  remainingHoursCount: number;
};

/**
 * Evaluates a day's hourly forecasts against preferred run windows and current time.
 * If the day is today, past hours are filtered out from the active recommendation:
 * - If remaining candidate hours exist, the best remaining hour is returned.
 * - If the overall prime window was in the past, `isPrimePassed` is set to true.
 * - If all candidate hours today have elapsed, `allWindowsPassed` is set to true.
 */
export function evaluateDayRunWindow(
  hourly: HourlyPoint[],
  windows: TimeWindow[],
  isToday: boolean,
  referenceDate: Date = new Date()
): DayScoreEvaluation {
  if (!hourly || hourly.length === 0) {
    return {
      bestHour: null,
      overallBestHour: null,
      isPrimePassed: false,
      allWindowsPassed: true,
      remainingHoursCount: 0,
    };
  }

  // 1. Filter by user's preferred run windows
  const candidateHours = filterHoursByWindows(hourly, windows);
  const overallBest = findBestRunHour(candidateHours) ?? findBestRunHour(hourly);

  if (!overallBest) {
    return {
      bestHour: null,
      overallBestHour: null,
      isPrimePassed: false,
      allWindowsPassed: true,
      remainingHoursCount: 0,
    };
  }

  // Future days: all hours are upcoming
  if (!isToday) {
    return {
      bestHour: overallBest,
      overallBestHour: overallBest,
      isPrimePassed: false,
      allWindowsPassed: false,
      remainingHoursCount: candidateHours.length,
    };
  }

  // 2. Today: filter out hours that have already passed
  const remainingHours = candidateHours.filter((h) => !isHourInPast(h.time, referenceDate));

  if (remainingHours.length === 0) {
    // All candidate windows for today have elapsed
    return {
      bestHour: null,
      overallBestHour: overallBest,
      isPrimePassed: true,
      allWindowsPassed: true,
      remainingHoursCount: 0,
    };
  }

  // 3. Find the best remaining hour
  const remainingBest = findBestRunHour(remainingHours)!;
  const isPrimePassed = isHourInPast(overallBest.time, referenceDate);

  return {
    bestHour: remainingBest,
    overallBestHour: overallBest,
    isPrimePassed,
    allWindowsPassed: false,
    remainingHoursCount: remainingHours.length,
  };
}
