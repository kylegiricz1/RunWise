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
  isOutsideWindow: boolean;
  preferredWindowPassed: boolean;
  allWindowsPassed: boolean;
  remainingHoursCount: number;
};

/**
 * Evaluates a day's hourly forecasts against preferred run windows and current time.
 * If the day is today:
 * 1. Viable hours within the preferred windows are scored first.
 * 2. If the user's preferred windows have completely passed, the engine falls back to
 *    finding the best available hour for the rest of today (flagged with `isOutsideWindow: true`).
 * 3. If all hours of the day have elapsed (or late night), `allWindowsPassed: true` is returned.
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
      isOutsideWindow: false,
      preferredWindowPassed: false,
      allWindowsPassed: true,
      remainingHoursCount: 0,
    };
  }

  const hasCustomPreferences = windows.length > 0;
  const candidateHours = filterHoursByWindows(hourly, windows);
  const overallBestInWindow = findBestRunHour(candidateHours) ?? findBestRunHour(hourly);
  const overallBestAllDay = findBestRunHour(hourly);
  const overallBest = overallBestInWindow ?? overallBestAllDay;

  if (!overallBest) {
    return {
      bestHour: null,
      overallBestHour: null,
      isPrimePassed: false,
      isOutsideWindow: false,
      preferredWindowPassed: false,
      allWindowsPassed: true,
      remainingHoursCount: 0,
    };
  }

  // Future days: all hours are upcoming
  if (!isToday) {
    return {
      bestHour: overallBestInWindow ?? overallBest,
      overallBestHour: overallBest,
      isPrimePassed: false,
      isOutsideWindow: false,
      preferredWindowPassed: false,
      allWindowsPassed: false,
      remainingHoursCount: candidateHours.length,
    };
  }

  // Today: check remaining hours
  const remainingInWindow = candidateHours.filter((h) => !isHourInPast(h.time, referenceDate));
  const remainingAllDay = hourly.filter((h) => !isHourInPast(h.time, referenceDate));

  // Case 1: Candidate hours still remain within preferred windows
  if (remainingInWindow.length > 0) {
    const remainingBest = findBestRunHour(remainingInWindow)!;
    const isPrimePassed = isHourInPast(overallBest.time, referenceDate);

    return {
      bestHour: remainingBest,
      overallBestHour: overallBest,
      isPrimePassed,
      isOutsideWindow: false,
      preferredWindowPassed: false,
      allWindowsPassed: false,
      remainingHoursCount: remainingInWindow.length,
    };
  }

  // Case 2: User's preferred window has passed, but hours remain in the rest of the day
  if (remainingAllDay.length > 0) {
    const bestRestOfDay = findBestRunHour(remainingAllDay)!;

    return {
      bestHour: bestRestOfDay,
      overallBestHour: overallBest,
      isPrimePassed: true,
      isOutsideWindow: hasCustomPreferences,
      preferredWindowPassed: hasCustomPreferences,
      allWindowsPassed: false,
      remainingHoursCount: remainingAllDay.length,
    };
  }

  // Case 3: All hours for the entire day have elapsed
  return {
    bestHour: null,
    overallBestHour: overallBest,
    isPrimePassed: true,
    isOutsideWindow: false,
    preferredWindowPassed: hasCustomPreferences,
    allWindowsPassed: true,
    remainingHoursCount: 0,
  };
}
