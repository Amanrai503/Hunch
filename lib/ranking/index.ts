import {
  UserProfileInput,
  CandidateGameInput,
  RankedGameResult,
  FactorBreakdown,
} from "./types";
import { evaluateTasteMatch } from "./factors/taste-match";
import { evaluateReviewQuality } from "./factors/review-quality";
import { evaluateRegretRisk } from "./factors/regret-risk";
import { evaluateTimeFit } from "./factors/time-fit";
import { evaluatePriceValue } from "./factors/price-value";
import { generateExplanations } from "./explainer";

export const RANKING_WEIGHTS = {
  tasteMatch: 0.40,
  reviewQuality: 0.20,
  regretRisk: 0.15,
  timeFit: 0.15,
  priceValue: 0.10,
} as const;

/**
 * PURE RANKING FUNCTION
 * Completely decoupled from database queries and network calls.
 * Evaluates candidates based strictly on plain inputs and mathematical factors.
 */
export function rankGamesForUser(
  userProfile: UserProfileInput,
  candidates: CandidateGameInput[]
): RankedGameResult[] {
  const preferredHours = userProfile.preferredMedianHoursToBeat || 25;
  const favoriteTags = userProfile.favoriteTags || [];
  const budgetPreference = userProfile.budgetPreference || "any";

  const results: RankedGameResult[] = candidates.map((game) => {
    // 1. Taste Match (Weight: 0.40)
    const taste = evaluateTasteMatch(game.precomputedSimilarity, game.tags, favoriteTags);
    const tasteBreakdown: FactorBreakdown & { matchedTags: string[] } = {
      score: taste.score,
      weight: RANKING_WEIGHTS.tasteMatch,
      contribution: taste.score * RANKING_WEIGHTS.tasteMatch,
      summary: taste.summary,
      matchedTags: taste.matchedTags,
    };

    // 2. Review Quality via Wilson lower bound (Weight: 0.20)
    const review = evaluateReviewQuality(game.positiveReviews, game.totalReviews);
    const reviewBreakdown: FactorBreakdown & { wilsonScore: number } = {
      score: review.score,
      weight: RANKING_WEIGHTS.reviewQuality,
      contribution: review.score * RANKING_WEIGHTS.reviewQuality,
      summary: review.summary,
      wilsonScore: review.wilsonScore,
    };

    // 3. Inverted Regret Risk (Weight: 0.15)
    const regret = evaluateRegretRisk(
      game.medianPlaytimeMinutes,
      game.averagePlaytimeMinutes,
      game.estimatedHoursToBeat ?? null,
      game.positiveReviews,
      game.totalReviews
    );
    const regretBreakdown: FactorBreakdown & { riskRating: "low" | "medium" | "high" } = {
      score: regret.score,
      weight: RANKING_WEIGHTS.regretRisk,
      contribution: regret.score * RANKING_WEIGHTS.regretRisk,
      summary: regret.summary,
      riskRating: regret.riskRating,
    };

    // 4. Time Fit (Weight: 0.15)
    const time = evaluateTimeFit(
      game.estimatedHoursToBeat ?? null,
      game.medianPlaytimeMinutes,
      preferredHours
    );
    const timeBreakdown: FactorBreakdown & { estimatedHours: number } = {
      score: time.score,
      weight: RANKING_WEIGHTS.timeFit,
      contribution: time.score * RANKING_WEIGHTS.timeFit,
      summary: time.summary,
      estimatedHours: time.estimatedHours,
    };

    // 5. Price & Sale Value (Weight: 0.10)
    const price = evaluatePriceValue(
      game.priceFinalCents,
      game.priceInitialCents,
      game.discountPercent,
      game.isFree,
      time.estimatedHours,
      budgetPreference
    );
    const priceBreakdown: FactorBreakdown & {
      discountPercent: number;
      hourlyRateCents: number;
    } = {
      score: price.score,
      weight: RANKING_WEIGHTS.priceValue,
      contribution: price.score * RANKING_WEIGHTS.priceValue,
      summary: price.summary,
      discountPercent: price.discountPercent,
      hourlyRateCents: price.hourlyRateCents,
    };

    // Total composite score (0 to 100)
    const rawTotal =
      tasteBreakdown.contribution +
      reviewBreakdown.contribution +
      regretBreakdown.contribution +
      timeBreakdown.contribution +
      priceBreakdown.contribution;

    const totalScore = Math.max(0, Math.min(100, Math.round(rawTotal)));

    const factors = {
      tasteMatch: tasteBreakdown,
      reviewQuality: reviewBreakdown,
      regretRisk: regretBreakdown,
      timeFit: timeBreakdown,
      priceValue: priceBreakdown,
    };

    const reasons = generateExplanations({ game, totalScore, factors });

    return {
      game,
      totalScore,
      factors,
      reasons,
    };
  });

  // Sort descending by total composite score
  return results.sort((a, b) => b.totalScore - a.totalScore);
}

export * from "./types";
export { calculateWilsonLowerBound, evaluateReviewQuality } from "./factors/review-quality";
