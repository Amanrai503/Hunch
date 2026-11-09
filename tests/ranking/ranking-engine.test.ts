import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rankGamesForUser,
  RANKING_WEIGHTS,
  CandidateGameInput,
  UserProfileInput,
} from "../../lib/ranking";

test("Weights validation: factor weights must sum to exactly 1.00", () => {
  const sum =
    RANKING_WEIGHTS.tasteMatch +
    RANKING_WEIGHTS.reviewQuality +
    RANKING_WEIGHTS.regretRisk +
    RANKING_WEIGHTS.timeFit +
    RANKING_WEIGHTS.priceValue;

  assert.strictEqual(Math.round(sum * 100) / 100, 1.0);
  assert.strictEqual(RANKING_WEIGHTS.tasteMatch, 0.40);
  assert.strictEqual(RANKING_WEIGHTS.reviewQuality, 0.20);
  assert.strictEqual(RANKING_WEIGHTS.regretRisk, 0.15);
  assert.strictEqual(RANKING_WEIGHTS.timeFit, 0.15);
  assert.strictEqual(RANKING_WEIGHTS.priceValue, 0.10);
});

test("rankGamesForUser: deterministic scoring and correct descending order", () => {
  const profile: UserProfileInput = {
    userId: "user_1",
    favoriteTags: ["Roguelike Deckbuilder", "Card Battler"],
    preferredMedianHoursToBeat: 30,
    budgetPreference: "any",
  };

  const candidateA: CandidateGameInput = {
    id: "game_a",
    steamAppId: 646570,
    name: "Slay the Spire",
    precomputedSimilarity: 0.95,
    tags: [
      { tag: "Roguelike Deckbuilder", weight: 990 },
      { tag: "Card Battler", weight: 950 },
    ],
    positiveReviews: 130000,
    totalReviews: 135000,
    medianPlaytimeMinutes: 3600, // 60 hours
    averagePlaytimeMinutes: 5200,
    estimatedHoursToBeat: 35,
    priceInitialCents: 2499,
    priceFinalCents: 849,
    discountPercent: 66,
    isFree: false,
  };

  const candidateB: CandidateGameInput = {
    id: "game_b",
    steamAppId: 999999,
    name: "Low Match RPG",
    precomputedSimilarity: 0.2,
    tags: [{ tag: "MMORPG", weight: 500 }],
    positiveReviews: 500,
    totalReviews: 1000, // 50% mixed
    medianPlaytimeMinutes: 60, // 1 hour drop-off
    averagePlaytimeMinutes: 100,
    estimatedHoursToBeat: 80,
    priceInitialCents: 5999,
    priceFinalCents: 5999,
    discountPercent: 0,
    isFree: false,
  };

  const ranked = rankGamesForUser(profile, [candidateB, candidateA]);

  // A must rank above B
  assert.strictEqual(ranked.length, 2);
  assert.strictEqual(ranked[0].game.id, "game_a");
  assert.strictEqual(ranked[1].game.id, "game_b");
  assert.ok(ranked[0].totalScore > ranked[1].totalScore);

  // Check factor contributions
  const fA = ranked[0].factors;
  assert.ok(fA.tasteMatch.score >= 90);
  assert.ok(fA.reviewQuality.score >= 90);
  assert.strictEqual(fA.regretRisk.riskRating, "low");
  assert.ok(ranked[0].reasons.length >= 2);

  // High drop-off candidate B must have high regret risk
  const fB = ranked[1].factors;
  assert.strictEqual(fB.regretRisk.riskRating, "high");
});

test("rankGamesForUser: handles free-to-play games and edge cases gracefully", () => {
  const profile: UserProfileInput = {
    preferredMedianHoursToBeat: 20,
  };

  const freeGame: CandidateGameInput = {
    id: "game_free",
    steamAppId: 100000,
    name: "Free Indie Gem",
    precomputedSimilarity: 0.8,
    tags: [{ tag: "Indie", weight: 100 }],
    positiveReviews: 2000,
    totalReviews: 2100,
    medianPlaytimeMinutes: 600,
    averagePlaytimeMinutes: 900,
    estimatedHoursToBeat: 15,
    priceInitialCents: 0,
    priceFinalCents: 0,
    discountPercent: 0,
    isFree: true,
  };

  const [res] = rankGamesForUser(profile, [freeGame]);
  assert.strictEqual(res.factors.priceValue.score, 100);
  assert.ok(res.reasons.some((r) => r.toLowerCase().includes("free")));
});
