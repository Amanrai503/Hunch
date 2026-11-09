import { inngest } from "../client";
import { getOwnedGames, type SteamOwnedGame } from "@/lib/steam/client";
import { db } from "@/drizzle/db";
import { users, games, libraryItems } from "@/drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import type { InngestStep, SyncLibraryEvent } from "../types";

export const syncSteamLibraryFunction = inngest.createFunction(
  {
    id: "sync-steam-library",
    name: "Sync User Steam Library",
    triggers: [{ event: "user/library.sync.requested" }],
  },
  async ({
    event,
    step,
  }: {
    event: SyncLibraryEvent;
    step: InngestStep;
  }) => {
    const { userId, steamId } = event.data;

    // Step 1: Fetch owned games from Steam Web API
    const result = await step.run("fetch-steam-owned-games", async () => {
      return getOwnedGames(steamId);
    });

    if (!result.success && result.isPrivate) {
      await step.run("mark-user-private", async () => {
        await db
          .update(users)
          .set({ isPrivate: true, updatedAt: new Date() })
          .where(eq(users.id, userId));
      });
      return { status: "private_profile", gamesCount: 0 };
    }

    if (!result.success) {
      throw new Error(`Failed to fetch owned games: ${result.error}`);
    }

    const ownedGames: SteamOwnedGame[] = result.games;

    // Step 2: Ensure basic game records exist in DB
    await step.run("ensure-game-records", async () => {
      const appIds = ownedGames.map((g: SteamOwnedGame) => g.appid);

      // Fetch which ones exist
      const existing = await db
        .select({ steamAppId: games.steamAppId })
        .from(games)
        .where(inArray(games.steamAppId, appIds.slice(0, 500)));

      const existingSet = new Set(existing.map((g) => g.steamAppId));
      const missing = ownedGames.filter((g: SteamOwnedGame) => !existingSet.has(g.appid));

      // Insert stubs for missing games so library foreign key references succeed
      for (let i = 0; i < missing.length; i += 50) {
        const chunk = missing.slice(i, i + 50);
        await db
          .insert(games)
          .values(
            chunk.map((g: SteamOwnedGame) => ({
              steamAppId: g.appid,
              name: g.name || `Steam App ${g.appid}`,
              headerImage: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${g.appid}/header.jpg`,
              capsuleImage: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${g.appid}/capsule_231x87.jpg`,
            }))
          )
          .onConflictDoNothing();
      }
    });

    // Step 3: Upsert library items
    await step.run("upsert-library-items", async () => {
      // Map appIds to internal game UUIDs
      const appIds = ownedGames.map((g: SteamOwnedGame) => g.appid);
      const dbGames = await db
        .select({ id: games.id, steamAppId: games.steamAppId })
        .from(games)
        .where(inArray(games.steamAppId, appIds.slice(0, 500)));

      const appIdToGameId = new Map(dbGames.map((g) => [g.steamAppId, g.id]));

      for (const g of ownedGames) {
        const gameId = appIdToGameId.get(g.appid);
        if (!gameId) continue;

        const lastPlayed =
          g.rtime_last_played && g.rtime_last_played > 0
            ? new Date(g.rtime_last_played * 1000)
            : null;

        await db
          .insert(libraryItems)
          .values({
            userId,
            gameId,
            playtimeForeverMinutes: g.playtime_forever || 0,
            playtime2WeeksMinutes: g.playtime_2weeks || 0,
            rtimeLastPlayed: lastPlayed,
            hasPlaytime: (g.playtime_forever || 0) > 0,
          })
          .onConflictDoUpdate({
            target: [libraryItems.userId, libraryItems.gameId],
            set: {
              playtimeForeverMinutes: g.playtime_forever || 0,
              playtime2WeeksMinutes: g.playtime_2weeks || 0,
              rtimeLastPlayed: lastPlayed,
              hasPlaytime: (g.playtime_forever || 0) > 0,
              updatedAt: new Date(),
            },
          });
      }

      // Update user sync timestamp & public status
      await db
        .update(users)
        .set({
          isPrivate: false,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    });

    // Step 4: Dispatch taste vector recalculation
    await step.sendEvent("trigger-taste-calculation", {
      name: "user/taste.calculate.requested",
      data: { userId },
    });

    return {
      status: "synced",
      gameCount: ownedGames.length,
    };
  }
);
