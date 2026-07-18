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
export function bestRunHour(
  hours: HourlyPoint[]
): ScoredHour {

  const scored = scoreHours(hours);

  return scored.reduce((best, current) =>
    current.score > best.score
      ? current
      : best
  );
}