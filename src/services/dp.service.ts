/**
 * Generates noise from a Laplace distribution using inverse transform sampling.
 * @param scale The scale parameter (b) of the Laplace distribution (b = sensitivity / epsilon).
 */
export function laplaceNoise(scale: number): number {
  const u = Math.random() - 0.5; // Uniform random variable between -0.5 and 0.5
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

/**
 * Adds differentially private noise to a true counting query result.
 * Since a single user's action changes a total count by at most 1, the global sensitivity is 1.
 * @param trueCount The actual database count.
 * @param epsilon The privacy budget. Lower is more private (more noise).
 */
export function addLaplaceNoise(trueCount: number, epsilon: number): number {
  const sensitivity = 1;
  const scale = sensitivity / epsilon;
  
  const noise = laplaceNoise(scale);
  let noisyCount = Math.round(trueCount + noise);
  
  // Counts can't be negative in reality, though technically bounding breaks pure DP slightly.
  // For practical public dashboards, bounding to 0 is standard.
  if (noisyCount < 0) noisyCount = 0;
  
  return noisyCount;
}
