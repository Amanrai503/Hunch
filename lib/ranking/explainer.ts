import { RankedGameResult } from "./types";

/**
 * Generates transparent, human-readable rationale bullet points for the "Why this?" drawer.
 * Highlights the top-contributing positive factors and flags notable features.
 */
export function generateExplanations(result: Omit<RankedGameResult, "reasons">): string[] {
  const { factors, game } = result;
  const scoredReasons: { text: string; priority: number }[] = [];

  // Standout Price / Value Reason
  if (game.isFree) {
    scoredReasons.push({
      text: "Free to play with zero upfront financial commitment.",
      priority: 95,
    });
  } else if (factors.priceValue.discountPercent >= 40) {
    scoredReasons.push({
      text: `Deep ${factors.priceValue.discountPercent}% sale at $${(
        game.priceFinalCents / 100
      ).toFixed(2)}.`,
      priority: 85,
    });
  } else if (factors.priceValue.hourlyRateCents <= 75) {
    scoredReasons.push({
      text: `High value: estimated under $${(
        factors.priceValue.hourlyRateCents / 100
      ).toFixed(2)} per hour of entertainment.`,
      priority: 75,
    });
  }

  // Taste Match Reason
  if (factors.tasteMatch.score >= 80) {
    if (factors.tasteMatch.matchedTags.length > 0) {
      scoredReasons.push({
        text: `Strong taste alignment: directly matches your preference for ${factors.tasteMatch.matchedTags
          .slice(0, 2)
          .join(" and ")}.`,
        priority: 92,
      });
    } else {
      scoredReasons.push({
        text: `High algorithmic match (${factors.tasteMatch.score}%) based on your playtime patterns.`,
        priority: 82,
      });
    }
  }

  // Review Quality Reason (Wilson lower bound)
  if (factors.reviewQuality.score >= 85) {
    const rawPositivePercent =
      game.totalReviews > 0
        ? Math.round((game.positiveReviews / game.totalReviews) * 100)
        : 0;
    scoredReasons.push({
      text: `Extremely reliable reception: ${rawPositivePercent}% positive across ${game.totalReviews.toLocaleString()} Steam reviews.`,
      priority: 88,
    });
  } else if (factors.reviewQuality.score <= 55 && game.totalReviews > 100) {
    const scorePct =
      game.steamReviewScore ??
      (game.totalReviews > 0
        ? Math.round((game.positiveReviews / game.totalReviews) * 100)
        : 0);
    scoredReasons.push({
      text: `Mixed community reception (${scorePct}% positive).`,
      priority: 84,
    });
  }

  // Regret Risk Reason
  if (factors.regretRisk.score >= 80) {
    scoredReasons.push({
      text: "Low buyer regret risk: players stick with this game well past the 2-hour refund mark.",
      priority: 80,
    });
  } else if (factors.regretRisk.score < 50) {
    scoredReasons.push({
      text: "Caution: SteamSpy metrics show a steep drop-off within the first 2 hours of playtime.",
      priority: 90,
    });
  }

  // Time Fit Reason
  if (factors.timeFit.score >= 85) {
    scoredReasons.push({
      text: `Fits your schedule: estimated ${factors.timeFit.estimatedHours} hours to complete.`,
      priority: 70,
    });
  }

  // Sort by priority descending
  scoredReasons.sort((a, b) => b.priority - a.priority);

  const reasons = scoredReasons.map((r) => r.text);

  // Ensure at least 2 clear explanation reasons are returned
  if (reasons.length < 2) {
    reasons.push(`Ranked #${result.totalScore} match for your overall library taste profile.`);
  }

  return reasons.slice(0, 3);
}
