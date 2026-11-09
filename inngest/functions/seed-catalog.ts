import { inngest } from "../client";
import { fetchTopGamesByTag, fetchSteamSpyGame } from "@/lib/steam/steamspy";
import { fetchSteamStoreDetails } from "@/lib/steam/store-api";
import { db } from "@/drizzle/db";
import { games, gameTags } from "@/drizzle/schema";
import { inArray } from "drizzle-orm";
import type { InngestStep, SeedCatalogEvent } from "../types";

const CURATED_SEED_TAGS = [
  "Rogue-like",
  "Deckbuilder",
  "RPG",
  "Strategy",
  "Indie",
  "Action",
  "Souls-like",
  "Metroidvania",
  "Co-op",
  "Story Rich",
  "Turn-Based",
  "Puzzle",
];

export const seedCatalogFunction = inngest.createFunction(
  {
    id: "seed-catalog",
    name: "Seed & Enrich Steam Catalog",
    concurrency: {
      limit: 1, // Enforce single runner to respect rate limits
    },
    triggers: [{ event: "catalog/seed.requested" }],
  },
  async ({ event, step }: { event: SeedCatalogEvent; step: InngestStep }) => {
    const targetCount = event.data.targetCount || 200; // default 200, scalable up to 5000

    // Step 1: Collect top app IDs from SteamSpy across curated tags
    const candidateAppIds: number[] = await step.run("fetch-candidate-app-ids", async () => {
      const appIds = new Set<number>();

      for (const tag of CURATED_SEED_TAGS) {
        const topInTag = await fetchTopGamesByTag(tag);
        for (const item of topInTag.slice(0, 30)) {
          appIds.add(item.appid);
        }
      }

      return Array.from(appIds).slice(0, targetCount);
    });

    // Step 2: Filter out games that are already enriched recently
    const appIdsToEnrich: number[] = await step.run("filter-already-enriched", async () => {
      try {
        const existing = await db
          .select({ steamAppId: games.steamAppId })
          .from(games)
          .where(inArray(games.steamAppId, candidateAppIds.slice(0, 500)));

        const existingSet = new Set(existing.map((g) => g.steamAppId));
        return candidateAppIds.filter((id: number) => !existingSet.has(id));
      } catch (err) {
        console.warn("DB check fallback (empty existing):", err);
        return candidateAppIds;
      }
    });

    // Step 3: Batch and enrich with rate-limiting (~200 req / 5 min = 1.5s delay)
    let enrichedCount = 0;
    const batchSize = 10;

    for (let i = 0; i < appIdsToEnrich.length; i += batchSize) {
      const batch = appIdsToEnrich.slice(i, i + batchSize);

      await step.run(`enrich-batch-${i}`, async () => {
        for (const appId of batch) {
          // Fetch store details (price, deck status, images)
          const storeData = await fetchSteamStoreDetails(appId);
          if (!storeData) continue;

          // Fetch SteamSpy details (user tags, median playtime, positive/negative reviews)
          const spyData = await fetchSteamSpyGame(appId);

          const totalReviews = spyData ? spyData.positive + spyData.negative : 0;
          const positiveReviews = spyData ? spyData.positive : 0;
          const steamReviewScore =
            totalReviews > 0 ? Math.round((positiveReviews / totalReviews) * 100) : null;

          try {
            // Upsert Game
            const [savedGame] = await db
              .insert(games)
              .values({
                steamAppId: storeData.steamAppId,
                name: storeData.name,
                shortDescription: storeData.shortDescription,
                headerImage: storeData.headerImage,
                capsuleImage: storeData.capsuleImage,
                heroImage: storeData.heroImage,
                currency: storeData.currency,
                priceInitial: storeData.priceInitial,
                priceFinal: storeData.priceFinal,
                discountPercent: storeData.discountPercent,
                isFree: storeData.isFree,
                steamDeckCompatibility: storeData.steamDeckCompatibility,
                releaseDate: storeData.releaseDate,
                metacriticScore: storeData.metacriticScore,
                steamReviewScore,
                totalReviews,
                positiveReviews,
                medianPlaytimeMinutes: spyData?.median_forever || 0,
                averagePlaytimeMinutes: spyData?.average_forever || 0,
                lastEnrichedAt: new Date(),
              })
              .onConflictDoUpdate({
                target: games.steamAppId,
                set: {
                  priceFinal: storeData.priceFinal,
                  discountPercent: storeData.discountPercent,
                  steamReviewScore,
                  totalReviews,
                  positiveReviews,
                  medianPlaytimeMinutes: spyData?.median_forever || 0,
                  lastEnrichedAt: new Date(),
                  updatedAt: new Date(),
                },
              })
              .returning();

            // Insert Tags from SteamSpy
            if (spyData?.tags && Object.keys(spyData.tags).length > 0 && savedGame?.id) {
              const tagEntries = Object.entries(spyData.tags).map(([tag, weight]) => ({
                gameId: savedGame.id,
                tag,
                weight: Number(weight) || 1,
              }));

              // Insert in chunks of 20
              for (let t = 0; t < tagEntries.length; t += 20) {
                await db
                  .insert(gameTags)
                  .values(tagEntries.slice(t, t + 20))
                  .onConflictDoNothing();
              }
            }

            enrichedCount++;
          } catch (dbErr) {
            console.warn(`Error persisting game ${appId}:`, dbErr);
          }
        }

        return { processed: batch.length };
      });

      // Throttle step to stay within rate limits (~200 req / 5 min)
      if (i + batchSize < appIdsToEnrich.length) {
        await step.sleep("rate-limit-sleep", "15s"); // 15s pause between 10-game batches = ~1.5s/req
      }
    }

    return {
      status: "completed",
      totalCandidates: candidateAppIds.length,
      enrichedCount,
    };
  }
);
