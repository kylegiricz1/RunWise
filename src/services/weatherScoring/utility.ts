/**
 * Gaussian utility function.
 *
 * Returns a value between 0 and 1.
 * Peaks at mean.
 */
export function gaussian(
  x: number,
  mean: number,
  sigma: number
): number {
  return Math.exp(
    -Math.pow(x - mean, 2) /
      (2 * Math.pow(sigma, 2))
  );
}

/**
 * Logistic utility function.
 *
 * Returns a value between 0 and 1.
 */
export function logistic(
  x: number,
  midpoint: number,
  steepness: number
): number {
  return 1 / (1 + Math.exp(steepness * (x - midpoint)));
}