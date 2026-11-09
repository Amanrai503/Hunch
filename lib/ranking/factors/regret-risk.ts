export function evaluateRegretRisk(
  medianPlaytimeMinutes: number,
  averagePlaytimeMinutes: number,
  estimatedHoursToBeat: number | null,
  positiveReviews: number,
  totalReviews: number
): {
  score: number;
  riskRating: "low" | "medium" | "high";
  summary: string;
} {
  let penalty = 0;

  // 1. Check early abandonment / refund risk
  // Steam refund threshold is 120 minutes (2h).
  if (medianPlaytimeMinutes > 0) {
    if (medianPlaytimeMinutes < 90) {
      // Very steep early abandonment
      penalty += 0.45;
    } else if (medianPlaytimeMinutes < 180) {
      penalty += 0.25;
    } else if (medianPlaytimeMinutes > 1200) {
      // 20+ hours median playtime shows immense player retention
      penalty -= 0.15;
    }
  }

  // 2. Playtime ratio vs estimated hours to complete
  if (estimatedHoursToBeat && estimatedHoursToBeat > 0 && medianPlaytimeMinutes > 0) {
    const medianHours = medianPlaytimeMinutes / 60;
    const completionRatio = medianHours / estimatedHoursToBeat;

    if (completionRatio < 0.15 && estimatedHoursToBeat > 15) {
      // For instance, a 40h RPG where median player only lasted 3h
      penalty += 0.25;
    } else if (completionRatio > 0.6) {
      // Players consistently finish or exceed typical completion
      penalty -= 0.1;
    }
  }

  // 3. Sentiment stability penalty
  if (totalReviews > 20) {
    const ratio = positiveReviews / totalReviews;
    if (ratio < 0.7) {
      penalty += 0.3;
    } else if (ratio < 0.8) {
      penalty += 0.15;
    }
  }

  // Clamp penalty to [0, 1]
  const clampedPenalty = Math.max(0, Math.min(1, penalty));
  const score = Math.round((1 - clampedPenalty) * 100);

  let riskRating: "low" | "medium" | "high" = "low";
  let summary = "Low buyer regret risk; high player retention";

  if (score < 50) {
    riskRating = "high";
    summary = "High drop-off rate; many players abandon within 2 hours";
  } else if (score < 75) {
    riskRating = "medium";
    summary = "Moderate commitment required; mixed completion rates";
  }

  return {
    score,
    riskRating,
    summary,
  };
}
