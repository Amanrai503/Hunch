import { db } from "@/drizzle/db";
import { games, gameTags, libraryItems, feedback, users } from "@/drizzle/schema";
import { eq, inArray, and } from "drizzle-orm";
import {
  rankGamesForUser,
  RankedGameResult,
  CandidateGameInput,
  UserProfileInput,
} from "@/lib/ranking";
import {
  buildGameTagVector,
  buildUserTasteVector,
  calculateSparseCosineSimilarity,
  SparseVector,
} from "@/lib/ranking/taste-vector";
import { SAMPLE_GAMES } from "@/lib/sample-data/sample-games";

export interface RecommendationFilters {
  deckVerifiedOnly?: boolean;
  maxPriceCents?: number;
  maxHoursToBeat?: number;
  salesOnly?: boolean;
  selectedTag?: string;
  searchQuery?: string;
}

export async function getRecommendationsForUser(
  userId?: string,
  filters: RecommendationFilters = {}
): Promise<RankedGameResult[]> {
  let userProfile: UserProfileInput = {
    favoriteTags: ["Roguelike Deckbuilder", "Card Battler", "Strategy"],
    preferredMedianHoursToBeat: 25,
    budgetPreference: "any",
  };

  let userTasteVector: SparseVector = {};
  const excludedAppIds = new Set<number>();

  // 1. Fetch user data, library, and feedback exclusions from DB if userId provided
  if (userId) {
    try {
      const userRows = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userRows.length > 0) {
        const u = userRows[0];
        if (u.tasteProfileJson) {
          userProfile = {
            userId: u.id,
            favoriteTags: u.tasteProfileJson.topTags?.map((t) => t.tag) || [],
            preferredMedianHoursToBeat: u.tasteProfileJson.medianPlaytimePreference || 25,
            budgetPreference: u.tasteProfileJson.budgetPreference || "any",
          };
        }
      }

      // Exclude owned library games
      const owned = await db
        .select({ steamAppId: games.steamAppId })
        .from(libraryItems)
        .innerJoin(games, eq(libraryItems.gameId, games.id))
        .where(eq(libraryItems.userId, userId));

      for (const row of owned) {
        excludedAppIds.add(row.steamAppId);
      }

      // Exclude dismissed feedback games (not interested, hide, already played)
      const dismissed = await db
        .select({ steamAppId: games.steamAppId })
        .from(feedback)
        .innerJoin(games, eq(feedback.gameId, games.id))
        .where(
          and(
            eq(feedback.userId, userId),
            inArray(feedback.action, ["not_interested", "hide", "already_played"])
          )
        );

      for (const row of dismissed) {
        excludedAppIds.add(row.steamAppId);
      }
    } catch (err) {
      console.warn("DB user fetch error in recommendations (falling back):", err);
    }
  }

  // 2. Fetch Candidate Games from DB or fallback to SAMPLE_GAMES fixtures
  let rawCandidates: CandidateGameInput[] = [];

  try {
    const dbGames = await db.select().from(games).limit(100);

    if (dbGames.length > 0) {
      const allTags = await db.select().from(gameTags);
      const gameTagsMap = new Map<string, { tag: string; weight: number }[]>();

      for (const t of allTags) {
        const list = gameTagsMap.get(t.gameId) || [];
        list.push({ tag: t.tag, weight: t.weight });
        gameTagsMap.set(t.gameId, list);
      }

      rawCandidates = dbGames.map((g) => ({
        id: g.id,
        steamAppId: g.steamAppId,
        name: g.name,
        headerImage: g.headerImage,
        capsuleImage: g.capsuleImage || undefined,
        precomputedSimilarity: 0.5,
        tags: gameTagsMap.get(g.id) || [],
        positiveReviews: g.positiveReviews,
        totalReviews: g.totalReviews,
        steamReviewScore: g.steamReviewScore,
        medianPlaytimeMinutes: g.medianPlaytimeMinutes,
        averagePlaytimeMinutes: g.averagePlaytimeMinutes,
        estimatedHoursToBeat: g.estimatedHoursToBeat ? Number(g.estimatedHoursToBeat) : null,
        priceFinalCents: g.priceFinal,
        priceInitialCents: g.priceInitial,
        discountPercent: g.discountPercent,
        isFree: g.isFree,
        releaseDate: g.releaseDate,
        steamDeckCompatibility: (g.steamDeckCompatibility as "verified" | "playable" | "unsupported" | "unknown") || "unknown",
      }));
    }
  } catch (err) {
    console.warn("DB candidates fetch fallback:", err);
  }

  // Fallback to rich sample fixtures if DB has no games or is offline
  if (rawCandidates.length === 0) {
    rawCandidates = SAMPLE_GAMES.map((g) => ({
      id: `sample_game_${g.steamAppId}`,
      steamAppId: g.steamAppId,
      name: g.name,
      headerImage: g.headerImage,
      capsuleImage: g.capsuleImage,
      precomputedSimilarity: 0.5,
      tags: g.tags,
      positiveReviews: g.positiveReviews,
      totalReviews: g.totalReviews,
      steamReviewScore: g.steamReviewScore,
      medianPlaytimeMinutes: g.medianPlaytimeMinutes,
      averagePlaytimeMinutes: g.averagePlaytimeMinutes,
      estimatedHoursToBeat: g.estimatedHoursToBeat ? Number(g.estimatedHoursToBeat) : null,
      priceFinalCents: g.priceFinal,
      priceInitialCents: g.priceInitial,
      discountPercent: g.discountPercent,
      isFree: g.isFree,
      releaseDate: new Date(),
      steamDeckCompatibility: g.steamDeckCompatibility,
    }));
  }

  // 3. Build user taste vector from favorite tags & sample history
  userTasteVector = buildUserTasteVector([], userProfile.favoriteTags || []);

  // 4. Calculate tag similarity for each candidate
  for (const c of rawCandidates) {
    const gameVec = buildGameTagVector(c.tags);
    c.precomputedSimilarity = calculateSparseCosineSimilarity(userTasteVector, gameVec);
  }

  // 5. Evaluate candidates with pure ranking engine
  const ranked = rankGamesForUser(userProfile, rawCandidates);

  // 6. Apply filter parameters
  let filtered = ranked;

  // Filter out excluded games (unless only 1-2 remain)
  if (filtered.length > excludedAppIds.size + 2) {
    filtered = filtered.filter((r) => !excludedAppIds.has(r.game.steamAppId));
  }

  if (filters.deckVerifiedOnly) {
    filtered = filtered.filter(
      (r) => r.game.steamDeckCompatibility === "verified"
    );
  }

  if (filters.maxPriceCents !== undefined && filters.maxPriceCents > 0) {
    filtered = filtered.filter((r) => r.game.priceFinalCents <= filters.maxPriceCents!);
  }

  if (filters.maxHoursToBeat !== undefined && filters.maxHoursToBeat > 0) {
    filtered = filtered.filter(
      (r) =>
        (r.game.estimatedHoursToBeat || r.game.medianPlaytimeMinutes / 60) <=
        filters.maxHoursToBeat!
    );
  }

  if (filters.salesOnly) {
    filtered = filtered.filter((r) => r.game.discountPercent > 0);
  }

  if (filters.selectedTag) {
    const target = filters.selectedTag.toLowerCase().trim();
    filtered = filtered.filter((r) =>
      r.game.tags.some((t) => t.tag.toLowerCase().includes(target))
    );
  }

  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (r) =>
        r.game.name.toLowerCase().includes(q) ||
        r.game.tags.some((t) => t.tag.toLowerCase().includes(q))
    );
  }

  return filtered;
}
