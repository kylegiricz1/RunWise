import { gaussian, logistic } from '../src/services/weatherScoring/utility';
import { scoreHour, findBestRunHour, bestRunHour } from '../src/services/weatherScoring/score';
import { HourlyPoint } from '../src/types/weather';
import { HUMIDITY_MIDPOINT, HUMIDITY_STEEPNESS } from '../src/services/weatherScoring/constants';

describe('Weather Scoring Mathematical Models', () => {
  describe('gaussian function', () => {
    it('peaks at 1.0 when value equals the mean', () => {
      expect(gaussian(58, 58, 12)).toBeCloseTo(1.0, 5);
      expect(gaussian(6, 6, 5)).toBeCloseTo(1.0, 5);
    });

    it('decays symmetrically on either side of the mean', () => {
      const left = gaussian(58 - 10, 58, 12);
      const right = gaussian(58 + 10, 58, 12);
      expect(left).toBeCloseTo(right, 5);
      expect(left).toBeLessThan(1.0);
    });

    it('approaches 0 for extreme deviations', () => {
      expect(gaussian(110, 58, 12)).toBeLessThan(0.01);
      expect(gaussian(0, 58, 12)).toBeLessThan(0.01);
    });
  });

  describe('logistic function', () => {
    it('evaluates to 0.5 at the midpoint', () => {
      expect(logistic(75, 75, 0.12)).toBeCloseTo(0.5, 5);
    });

    it('decreases as humidity increases (cardiovascular strain curve)', () => {
      const lowHumidityUtility = logistic(40, HUMIDITY_MIDPOINT, HUMIDITY_STEEPNESS);
      const highHumidityUtility = logistic(90, HUMIDITY_MIDPOINT, HUMIDITY_STEEPNESS);
      expect(lowHumidityUtility).toBeGreaterThan(highHumidityUtility);
    });

    it('stays strictly bounded within (0, 1)', () => {
      expect(logistic(0, 75, 0.12)).toBeLessThanOrEqual(1.0);
      expect(logistic(0, 75, 0.12)).toBeGreaterThan(0.0);
      expect(logistic(100, 75, 0.12)).toBeLessThanOrEqual(1.0);
      expect(logistic(100, 75, 0.12)).toBeGreaterThan(0.0);
    });
  });

  describe('scoreHour utility scoring', () => {
    const idealHour: HourlyPoint = {
      time: '2026-10-24T08:00',
      feelsLike: 58,
      humidity: 45,
      wind: 6,
      rainChance: 0,
    };

    it('awards high score (> 0.85) to ideal running conditions', () => {
      const score = scoreHour(idealHour);
      expect(score).toBeGreaterThan(0.85);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('penalizes rain via quadratic penalty factor', () => {
      const dryScore = scoreHour(idealHour);
      const rainyHour: HourlyPoint = { ...idealHour, rainChance: 90 };
      const rainyScore = scoreHour(rainyHour);

      // Rain has weight 0.20, quadratic penalty (1 - 0.9)^2 = 0.01 reduces score by ~0.198
      expect(dryScore - rainyScore).toBeGreaterThan(0.18);
    });

    it('penalizes compounding heat and high humidity via interaction factor', () => {
      const hotHumidHour: HourlyPoint = {
        ...idealHour,
        feelsLike: 92,
        humidity: 90,
      };
      const score = scoreHour(hotHumidHour);
      expect(score).toBeLessThan(0.35);
    });

    it('penalizes excessive wind speeds', () => {
      const calmScore = scoreHour(idealHour);
      const galeHour: HourlyPoint = { ...idealHour, wind: 35 };
      const galeScore = scoreHour(galeHour);

      expect(galeScore).toBeLessThan(calmScore);
    });

    it('clamps scores strictly between 0 and 1', () => {
      const extremeBad: HourlyPoint = {
        time: '2026-10-24T14:00',
        feelsLike: 105,
        humidity: 98,
        wind: 50,
        rainChance: 100,
      };
      const score = scoreHour(extremeBad);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('findBestRunHour & bestRunHour', () => {
    const hours: HourlyPoint[] = [
      { time: '2026-10-24T06:00', feelsLike: 45, humidity: 60, wind: 4, rainChance: 10 },
      { time: '2026-10-24T08:00', feelsLike: 58, humidity: 45, wind: 6, rainChance: 0 }, // Optimal
      { time: '2026-10-24T12:00', feelsLike: 82, humidity: 70, wind: 10, rainChance: 40 },
    ];

    it('identifies the highest-scoring hour', () => {
      const best = bestRunHour(hours);
      expect(best.time).toBe('2026-10-24T08:00');
    });

    it('returns null safely for empty lists with findBestRunHour', () => {
      expect(findBestRunHour([])).toBeNull();
    });

    it('throws descriptive error on empty list with bestRunHour', () => {
      expect(() => bestRunHour([])).toThrow(
        'Cannot determine best run hour from an empty list of hours'
      );
    });
  });
});
