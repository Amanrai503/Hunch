export function evaluateTimeFit(
  estimatedHoursToBeat: number | null,
  medianPlaytimeMinutes: number,
  preferredHoursToBeat = 25
): {
  score: number;
  estimatedHours: number;
  summary: string;
} {
  // Resolve effective game hours
  let effectiveHours = estimatedHoursToBeat;
  if (!effectiveHours || effectiveHours <= 0) {
    effectiveHours = medianPlaytimeMinutes > 0 ? Math.round(medianPlaytimeMinutes / 60) : 20;
  }

  // Gaussian fit: exp( - (Hg - Hu)^2 / (2 * sigma^2) )
  const sigma = 18; // 18 hours tolerance window
  const diff = effectiveHours - preferredHoursToBeat;
  const gaussian = Math.exp(-(diff * diff) / (2 * sigma * sigma));
  const score = Math.max(10, Math.min(100, Math.round(gaussian * 100)));

  let summary = `Fits your ~${preferredHoursToBeat}h target (${effectiveHours}h to beat)`;
  if (Math.abs(diff) <= 5) {
    summary = `Ideal length (${effectiveHours}h) for your schedule`;
  } else if (effectiveHours > preferredHoursToBeat + 20) {
    summary = `Longer commitment (${effectiveHours}h) than target`;
  } else if (effectiveHours < preferredHoursToBeat - 10) {
    summary = `Short, tight experience (${effectiveHours}h)`;
  }

  return {
    score,
    estimatedHours: effectiveHours,
    summary,
  };
}
