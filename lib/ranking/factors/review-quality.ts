/**
 * Calculates the Wilson Score interval 95% lower bound for Bernoulli parameter.
 * Used by Reddit, SteamDB, and Yelp to rank reviews without small-sample bias.
 *
 * @param positive Number of positive reviews
 * @param total Total number of reviews (positive + negative)
 * @param z Quantile of the standard normal distribution (1.95996 for 95% CI)
 */
export function calculateWilsonLowerBound(
  positive: number,
  total: number,
  z = 1.95996
): number {
  if (total <= 0) return 0.5; // neutral baseline if unreviewed

  const p = Math.max(0, Math.min(1, positive / total));
  const z2 = z * z;
  const denominator = 1 + z2 / total;

  const center = p + z2 / (2 * total);
  const spread = z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total);

  const lowerBound = (center - spread) / denominator;
  return Math.max(0, Math.min(1, lowerBound));
}

export function evaluateReviewQuality(
  positiveReviews: number,
  totalReviews: number
): { score: number; wilsonScore: number; summary: string } {
  const wilson = calculateWilsonLowerBound(positiveReviews, totalReviews);
  const score = Math.round(wilson * 100);

  let summary = "Limited review history";
  if (totalReviews > 1000) {
    const rawPercent = Math.round((positiveReviews / totalReviews) * 100);
    summary = `${rawPercent}% positive (${totalReviews.toLocaleString()} reviews)`;
  } else if (totalReviews > 50) {
    summary = `Emerging reception: ${totalReviews} reviews`;
  }

  return {
    score,
    wilsonScore: Number(wilson.toFixed(4)),
    summary,
  };
}

