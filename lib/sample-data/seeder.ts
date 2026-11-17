import { db } from "@/drizzle/db";
import { users, games, gameTags, libraryItems } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { SAMPLE_USER } from "./sample-user";
import { SAMPLE_GAMES } from "./sample-games";

export async function seedDatabase() {
  console.log("🌱 Starting Hunch database seeding...");

  // 1. Resilient Sample User Upsert
  console.log("👤 Upserting sample user:", SAMPLE_USER.displayName);
  let userId = SAMPLE_USER.id;

  try {
    const existingBySteam = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.steamId, SAMPLE_USER.steamId))
      .limit(1);

    if (existingBySteam.length > 0) {
      userId = existingBySteam[0].id;
      await db
        .update(users)
        .set({
          displayName: SAMPLE_USER.displayName,
          avatarUrl: SAMPLE_USER.avatarUrl,
          tasteProfileJson: SAMPLE_USER.tasteProfileJson,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } else {
      const existingById = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, SAMPLE_USER.id))
        .limit(1);

      if (existingById.length > 0) {
        userId = existingById[0].id;
        await db
          .update(users)
          .set({
            steamId: SAMPLE_USER.steamId,
            displayName: SAMPLE_USER.displayName,
            avatarUrl: SAMPLE_USER.avatarUrl,
            tasteProfileJson: SAMPLE_USER.tasteProfileJson,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      } else {
        const [inserted] = await db
          .insert(users)
          .values({
            id: SAMPLE_USER.id,
            steamId: SAMPLE_USER.steamId,
            displayName: SAMPLE_USER.displayName,
            avatarUrl: SAMPLE_USER.avatarUrl,
            profileUrl: SAMPLE_USER.profileUrl,
            isPrivate: false,
            isSampleUser: true,
            tasteProfileJson: SAMPLE_USER.tasteProfileJson,
            lastSyncedAt: new Date(),
          })
          .returning();
        if (inserted) {
          userId = inserted.id;
        }
      }
    }
  } catch (userErr) {
    console.warn("User upsert fallback:", userErr);
  }

  // 2. Upsert Sample Games & Tags
  console.log(`🎮 Seeding ${SAMPLE_GAMES.length} curated games with SteamSpy tags...`);
  const gameIdMap = new Map<number, string>();

  for (const g of SAMPLE_GAMES) {
    const [savedGame] = await db
      .insert(games)
      .values({
        steamAppId: g.steamAppId,
        name: g.name,
        shortDescription: g.shortDescription,
        headerImage: g.headerImage,
        capsuleImage: g.capsuleImage,
        heroImage: `https://shared.steamstatic.com/store_item_assets/steam/apps/${g.steamAppId}/library_hero.jpg`,
        currency: g.currency,
        priceInitial: g.priceInitial,
        priceFinal: g.priceFinal,
        discountPercent: g.discountPercent,
        isFree: g.isFree,
        steamDeckCompatibility: g.steamDeckCompatibility,
        metacriticScore: g.metacriticScore,
        steamReviewScore: g.steamReviewScore,
        steamReviewSentiment: g.steamReviewSentiment,
        totalReviews: g.totalReviews,
        positiveReviews: g.positiveReviews,
        medianPlaytimeMinutes: g.medianPlaytimeMinutes,
        averagePlaytimeMinutes: g.averagePlaytimeMinutes,
        estimatedHoursToBeat: g.estimatedHoursToBeat,
        lastEnrichedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: games.steamAppId,
        set: {
          priceFinal: g.priceFinal,
          discountPercent: g.discountPercent,
          steamReviewScore: g.steamReviewScore,
          totalReviews: g.totalReviews,
          positiveReviews: g.positiveReviews,
          medianPlaytimeMinutes: g.medianPlaytimeMinutes,
          lastEnrichedAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    gameIdMap.set(g.steamAppId, savedGame.id);

    // Upsert Tags
    if (g.tags && g.tags.length > 0) {
      for (const t of g.tags) {
        await db
          .insert(gameTags)
          .values({
            gameId: savedGame.id,
            tag: t.tag,
            weight: t.weight,
          })
          .onConflictDoUpdate({
            target: [gameTags.gameId, gameTags.tag],
            set: { weight: t.weight },
          });
      }
    }
  }

  // 3. Populate Sample User's Library
  console.log("📚 Creating sample user library playtimes...");
  const samplePlaytimes: { steamAppId: number; hours: number; twoWeeksHours: number }[] = [
    { steamAppId: 646570, hours: 145, twoWeeksHours: 12 },   // Slay the Spire
    { steamAppId: 2379780, hours: 95, twoWeeksHours: 24 },   // Balatro
    { steamAppId: 1102190, hours: 42, twoWeeksHours: 0 },    // Monster Train
    { steamAppId: 1092790, hours: 18, twoWeeksHours: 0 },    // Inscryption
    { steamAppId: 1145360, hours: 35, twoWeeksHours: 2 },    // Hades
    { steamAppId: 588650, hours: 22, twoWeeksHours: 0 },     // Dead Cells
    { steamAppId: 1245620, hours: 2.5, twoWeeksHours: 0 },   // Elden Ring (abandoned)
  ];

  for (const item of samplePlaytimes) {
    const gameId = gameIdMap.get(item.steamAppId);
    if (!gameId) continue;

    await db
      .insert(libraryItems)
      .values({
        userId,
        gameId,
        playtimeForeverMinutes: Math.round(item.hours * 60),
        playtime2WeeksMinutes: Math.round(item.twoWeeksHours * 60),
        rtimeLastPlayed: new Date(Date.now() - Math.random() * 7 * 86400 * 1000),
        hasPlaytime: true,
      })
      .onConflictDoUpdate({
        target: [libraryItems.userId, libraryItems.gameId],
        set: {
          playtimeForeverMinutes: Math.round(item.hours * 60),
          playtime2WeeksMinutes: Math.round(item.twoWeeksHours * 60),
          hasPlaytime: true,
          updatedAt: new Date(),
        },
      });
  }

  console.log("✅ Hunch database seeding complete!");
}
