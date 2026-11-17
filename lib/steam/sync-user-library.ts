import { db } from "@/drizzle/db";
import { users, games, gameTags, libraryItems } from "@/drizzle/schema";
import { eq, inArray, and, gt } from "drizzle-orm";
import { getOwnedGames, type SteamOwnedGame } from "./client";
import { fetchSteamSpyGame } from "./steamspy";
import {
  buildUserTasteVector,
  projectSparseToDense128,
  type LibraryGameForTaste,
} from "@/lib/ranking/taste-vector";

export interface SyncUserLibraryOptions {
  userId: string;
  steamId: string;
  apiKey?: string;
}

export interface SyncUserLibraryResult {
  success: boolean;
  gameCount: number;
  isPrivate?: boolean;
  error?: string;
}

const DEFAULT_STARTER_PROFILE = {
  topTags: [
    { tag: "Roguelike Deckbuilder", weight: 95 },
    { tag: "Strategy", weight: 88 },
    { tag: "RPG", weight: 84 },
    { tag: "Indie", weight: 80 },
    { tag: "Action", weight: 75 },
  ],
  medianPlaytimePreference: 25,
  budgetPreference: "any" as const,
};

async function ensureDefaultTasteProfile(userId: string) {
  try {
    const existing = await db
      .select({ tasteProfileJson: users.tasteProfileJson })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existing[0]?.tasteProfileJson) {
      const sparseVec = buildUserTasteVector(
        [],
        DEFAULT_STARTER_PROFILE.topTags.map((t) => t.tag)
      );
      const dense128 = projectSparseToDense128(sparseVec);

      await db
        .update(users)
        .set({
          tasteVector: dense128,
          tasteProfileJson: DEFAULT_STARTER_PROFILE,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }
  } catch (err) {
    console.warn("[Steam Sync] Could not ensure default taste profile (DB offline?):", err);
  }
}

export async function syncUserSteamLibrary({
  userId,
  steamId,
  apiKey = process.env.STEAM_API_KEY,
}: SyncUserLibraryOptions): Promise<SyncUserLibraryResult> {
  // 1. Check for API key
  if (!apiKey || apiKey === "dummy_steam_api_key_for_dev") {
    console.info(
      `[Steam Sync] STEAM_API_KEY is not configured in .env. Initializing default taste profile for user ${userId}.`
    );
    await ensureDefaultTasteProfile(userId);
    return {
      success: false,
      gameCount: 0,
      error: "STEAM_API_KEY not configured",
    };
  }

  // 2. Fetch owned games from Steam Web API
  let ownedResult;
  try {
    ownedResult = await getOwnedGames(steamId, apiKey);
  } catch (err) {
    console.warn(`[Steam Sync] Error calling getOwnedGames for ${steamId}:`, err);
    await ensureDefaultTasteProfile(userId);
    return {
      success: false,
      gameCount: 0,
      error: String(err),
    };
  }

  if (ownedResult.isPrivate) {
    console.info(`[Steam Sync] User ${steamId} has private profile or game details.`);
    try {
      await db
        .update(users)
        .set({ isPrivate: true, updatedAt: new Date() })
        .where(eq(users.id, userId));
      await ensureDefaultTasteProfile(userId);
    } catch (dbErr) {
      console.warn("[Steam Sync] Could not mark user as private in DB:", dbErr);
    }
    return {
      success: true,
      isPrivate: true,
      gameCount: 0,
    };
  }

  if (!ownedResult.success || !ownedResult.games) {
    console.warn(`[Steam Sync] Could not fetch games: ${ownedResult.error}`);
    await ensureDefaultTasteProfile(userId);
    return {
      success: false,
      gameCount: 0,
      error: ownedResult.error,
    };
  }

  const rawGames: SteamOwnedGame[] = ownedResult.games;
  if (rawGames.length === 0) {
    console.info(`[Steam Sync] User ${steamId} has 0 owned games.`);
    await ensureDefaultTasteProfile(userId);
    return {
      success: true,
      gameCount: 0,
    };
  }

  // Sort games by playtime descending, then take top 500
  const sortedGames = [...rawGames].sort(
    (a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0)
  );
  const targetGames = sortedGames.slice(0, 500);
  const appIds = targetGames.map((g) => g.appid);

  try {
    // 3. Ensure game stubs exist in "games" table
    const existingDbGames = await db
      .select({ id: games.id, steamAppId: games.steamAppId })
      .from(games)
      .where(inArray(games.steamAppId, appIds.slice(0, 500)));

    const appIdToGameId = new Map<number, string>(
      existingDbGames.map((g) => [g.steamAppId, g.id])
    );
    const missing = targetGames.filter((g) => !appIdToGameId.has(g.appid));

    if (missing.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < missing.length; i += batchSize) {
        const chunk = missing.slice(i, i + batchSize);
        try {
          const inserted = await db
            .insert(games)
            .values(
              chunk.map((g) => ({
                steamAppId: g.appid,
                name: g.name || `Steam App ${g.appid}`,
                headerImage: `https://shared.steamstatic.com/store_item_assets/steam/apps/${g.appid}/header.jpg`,
                capsuleImage: `https://shared.steamstatic.com/store_item_assets/steam/apps/${g.appid}/capsule_231x87.jpg`,
              }))
            )
            .onConflictDoNothing()
            .returning({ id: games.id, steamAppId: games.steamAppId });

          for (const row of inserted) {
            appIdToGameId.set(row.steamAppId, row.id);
          }
        } catch (insertErr) {
          console.warn("[Steam Sync] Batch insert games warning:", insertErr);
        }
      }

      // Re-query any that onConflictDoNothing skipped
      const stillMissing = appIds.filter((id) => !appIdToGameId.has(id));
      if (stillMissing.length > 0) {
        for (let i = 0; i < stillMissing.length; i += batchSize) {
          const chunk = stillMissing.slice(i, i + batchSize);
          const refetched = await db
            .select({ id: games.id, steamAppId: games.steamAppId })
            .from(games)
            .where(inArray(games.steamAppId, chunk));
          for (const row of refetched) {
            appIdToGameId.set(row.steamAppId, row.id);
          }
        }
      }
    }

    // 4. Upsert into library_items
    for (const g of targetGames) {
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

    // 5. Enrich tags for top played games if missing
    const topPlayed = targetGames.filter((g) => (g.playtime_forever || 0) >= 30).slice(0, 10);
    const topGameIds = topPlayed
      .map((g) => appIdToGameId.get(g.appid))
      .filter((id): id is string => Boolean(id));

    if (topGameIds.length > 0) {
      const existingTags = await db
        .select({ gameId: gameTags.gameId })
        .from(gameTags)
        .where(inArray(gameTags.gameId, topGameIds));

      const gamesWithTags = new Set(existingTags.map((t) => t.gameId));
      const needsTags = topPlayed.filter((g) => {
        const gid = appIdToGameId.get(g.appid);
        return gid && !gamesWithTags.has(gid);
      });

      // Enrich up to 5 top games with SteamSpy tags in parallel
      if (needsTags.length > 0) {
        await Promise.allSettled(
          needsTags.slice(0, 5).map(async (g) => {
            const gid = appIdToGameId.get(g.appid);
            if (!gid) return;
            try {
              const spy = await fetchSteamSpyGame(g.appid);
              if (spy?.tags && Object.keys(spy.tags).length > 0) {
                const tagEntries = Object.entries(spy.tags).slice(0, 12);
                for (const [tag, weight] of tagEntries) {
                  await db
                    .insert(gameTags)
                    .values({
                      gameId: gid,
                      tag,
                      weight: Number(weight) || 1,
                    })
                    .onConflictDoNothing();
                }
              }
            } catch (spyErr) {
              console.warn(`[Steam Sync] SteamSpy tag enrichment skipped for app ${g.appid}:`, spyErr);
            }
          })
        );
      }
    }

    // 6. Synthesize user taste profile & vector from played games and their tags
    const playedItems = await db
      .select({
        gameId: libraryItems.gameId,
        playtimeForeverMinutes: libraryItems.playtimeForeverMinutes,
      })
      .from(libraryItems)
      .where(
        and(
          eq(libraryItems.userId, userId),
          gt(libraryItems.playtimeForeverMinutes, 0)
        )
      );

    if (playedItems.length > 0) {
      const playedGameIds = playedItems.map((p) => p.gameId);
      const tagRows = await db
        .select({
          gameId: gameTags.gameId,
          tag: gameTags.tag,
          weight: gameTags.weight,
        })
        .from(gameTags)
        .where(inArray(gameTags.gameId, playedGameIds));

      const tagsByGame = new Map<string, { tag: string; weight: number }[]>();
      for (const row of tagRows) {
        const list = tagsByGame.get(row.gameId) || [];
        list.push({ tag: row.tag, weight: row.weight });
        tagsByGame.set(row.gameId, list);
      }

      const libraryForTaste: LibraryGameForTaste[] = [];
      const tagScores = new Map<string, number>();
      const playedHoursList: number[] = [];

      for (const item of playedItems) {
        const hours = item.playtimeForeverMinutes / 60;
        playedHoursList.push(hours);
        const tags = tagsByGame.get(item.gameId) || [];

        if (tags.length > 0) {
          libraryForTaste.push({
            playtimeForeverMinutes: item.playtimeForeverMinutes,
            tags,
          });

          const playWeight = Math.sqrt(item.playtimeForeverMinutes);
          for (const t of tags) {
            tagScores.set(t.tag, (tagScores.get(t.tag) || 0) + t.weight * playWeight);
          }
        }
      }

      // Sort tags by score
      const sortedTags = Array.from(tagScores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const topTags = sortedTags.map(([tag], idx) => ({
        tag,
        weight: Math.round(100 - idx * 5),
      }));

      // Calculate median playtime
      playedHoursList.sort((a, b) => a - b);
      const mid = Math.floor(playedHoursList.length / 2);
      const medianHours =
        playedHoursList.length > 0
          ? playedHoursList.length % 2 !== 0
            ? playedHoursList[mid]
            : (playedHoursList[mid - 1] + playedHoursList[mid]) / 2
          : 25;

      const finalTopTags =
        topTags.length > 0 ? topTags : DEFAULT_STARTER_PROFILE.topTags;

      const tasteProfileJson = {
        topTags: finalTopTags,
        medianPlaytimePreference: Math.max(5, Math.min(100, Math.round(medianHours))),
        budgetPreference: "any" as const,
      };

      const sparseVec = buildUserTasteVector(
        libraryForTaste,
        finalTopTags.map((t) => t.tag)
      );
      const dense128 = projectSparseToDense128(sparseVec);

      await db
        .update(users)
        .set({
          isPrivate: false,
          tasteVector: dense128,
          tasteProfileJson,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.info(
        `[Steam Sync] Successfully synced ${targetGames.length} games for user ${userId}. Top tags: ${finalTopTags
          .map((t) => t.tag)
          .join(", ")}`
      );
    } else {
      await ensureDefaultTasteProfile(userId);
    }

    return {
      success: true,
      gameCount: targetGames.length,
      isPrivate: false,
    };
  } catch (err) {
    console.error(`[Steam Sync] Error syncing library for user ${userId}:`, err);
    await ensureDefaultTasteProfile(userId);
    return {
      success: false,
      gameCount: 0,
      error: String(err),
    };
  }
}
