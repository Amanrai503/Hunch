import { inngest } from "../client";
import { db } from "@/drizzle/db";
import { games } from "@/drizzle/schema";
import { fetchSteamStoreDetails } from "@/lib/steam/store-api";
import { sql } from "drizzle-orm";
import type { InngestStep } from "../types";

export const dailyResyncCronFunction = inngest.createFunction(
  {
    id: "daily-resync-cron",
    name: "Daily Store Prices & Catalog Resync",
    triggers: [{ cron: "0 4 * * *" }], // Daily at 04:00 UTC
  },
  async ({ step }: { step: InngestStep }) => {
    // Step 1: Select top 50 games that have stale metadata (> 3 days) or active discounts
    const staleGames: { id: string; steamAppId: number }[] = await step.run(
      "fetch-stale-games",
      async () => {
        try {
          return await db
            .select({ id: games.id, steamAppId: games.steamAppId })
            .from(games)
            .orderBy(sql`${games.lastEnrichedAt} ASC NULLS FIRST`)
            .limit(50);
        } catch (err) {
          console.warn("Daily resync DB fetch error:", err);
          return [];
        }
      }
    );

    // Step 2: Refresh prices and discounts
    let refreshed = 0;
    for (const g of staleGames) {
      await step.run(`refresh-game-${g.steamAppId}`, async () => {
        const details = await fetchSteamStoreDetails(g.steamAppId);
        if (!details) return;

        await db
          .update(games)
          .set({
            priceFinal: details.priceFinal,
            priceInitial: details.priceInitial,
            discountPercent: details.discountPercent,
            lastEnrichedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(sql`${games.id} = ${g.id}`);

        refreshed++;
      });

      // Throttle 1.5s between requests
      await step.sleep("store-throttle", "1500ms");
    }

    return {
      status: "completed",
      gamesRefreshed: refreshed,
    };
  }
);
