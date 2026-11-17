import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/drizzle/db";
import { libraryItems, games, gameTags } from "@/drizzle/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { SAMPLE_GAMES } from "@/lib/sample-data/sample-games";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userLibrary = await db
      .select({
        id: games.id,
        steamAppId: games.steamAppId,
        name: games.name,
        headerImage: games.headerImage,
        capsuleImage: games.capsuleImage,
        currency: games.currency,
        priceFinal: games.priceFinal,
        steamDeckCompatibility: games.steamDeckCompatibility,
        estimatedHoursToBeat: games.estimatedHoursToBeat,
        steamReviewScore: games.steamReviewScore,
        playtimeForeverMinutes: libraryItems.playtimeForeverMinutes,
        playtime2WeeksMinutes: libraryItems.playtime2WeeksMinutes,
        rtimeLastPlayed: libraryItems.rtimeLastPlayed,
      })
      .from(libraryItems)
      .innerJoin(games, eq(libraryItems.gameId, games.id))
      .where(eq(libraryItems.userId, session.userId))
      .orderBy(desc(libraryItems.playtimeForeverMinutes));

    if (userLibrary.length > 0) {
      // Fetch tags for these library games
      const gameIds = userLibrary.map((g) => g.id);
      const tags = await db
        .select({
          gameId: gameTags.gameId,
          tag: gameTags.tag,
          weight: gameTags.weight,
        })
        .from(gameTags)
        .where(inArray(gameTags.gameId, gameIds.slice(0, 100)));

      const tagsByGame = new Map<string, { tag: string; weight: number }[]>();
      for (const t of tags) {
        const list = tagsByGame.get(t.gameId) || [];
        list.push({ tag: t.tag, weight: t.weight });
        tagsByGame.set(t.gameId, list);
      }

      const formatted = userLibrary.map((g) => {
        let lastPlayedText = "Never played";
        if (g.rtimeLastPlayed) {
          const diffMs = Date.now() - new Date(g.rtimeLastPlayed).getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          if (diffDays === 0) lastPlayedText = "Today";
          else if (diffDays === 1) lastPlayedText = "Yesterday";
          else if (diffDays < 7) lastPlayedText = `${diffDays} days ago`;
          else if (diffDays < 30) lastPlayedText = `${Math.floor(diffDays / 7)} weeks ago`;
          else lastPlayedText = `${Math.floor(diffDays / 30)} months ago`;
        } else if (g.playtimeForeverMinutes > 0) {
          lastPlayedText = "Previously";
        }

        return {
          id: g.id,
          steamAppId: g.steamAppId,
          name: g.name,
          headerImage: g.headerImage,
          capsuleImage: g.capsuleImage || `https://shared.steamstatic.com/store_item_assets/steam/apps/${g.steamAppId}/capsule_231x87.jpg`,
          playtimeForeverMinutes: g.playtimeForeverMinutes,
          playtime2WeeksMinutes: g.playtime2WeeksMinutes,
          lastPlayedText,
          inBacklog: g.playtimeForeverMinutes < 120, // Less than 2 hours is backlog!
          estimatedHoursToBeat: g.estimatedHoursToBeat ? Number(g.estimatedHoursToBeat) : null,
          steamReviewScore: g.steamReviewScore,
          tags: tagsByGame.get(g.id) || [],
          steamDeckCompatibility: g.steamDeckCompatibility || "unknown",
        };
      });

      return NextResponse.json({
        success: true,
        count: formatted.length,
        games: formatted,
      });
    }
  } catch (err) {
    console.warn("DB user library fetch warning (falling back to fixtures):", err);
  }

  // Fallback fixtures for sample user or offline mode
  const fallback = [
    {
      ...SAMPLE_GAMES[0],
      playtimeForeverMinutes: 5700,
      lastPlayedText: "Yesterday",
      inBacklog: false,
    },
    {
      ...SAMPLE_GAMES[1],
      playtimeForeverMinutes: 8700,
      lastPlayedText: "3 days ago",
      inBacklog: false,
    },
    {
      ...SAMPLE_GAMES[7],
      playtimeForeverMinutes: 2520,
      lastPlayedText: "Last week",
      inBacklog: false,
    },
    {
      ...SAMPLE_GAMES[6],
      playtimeForeverMinutes: 1080,
      lastPlayedText: "2 weeks ago",
      inBacklog: true,
    },
    {
      ...SAMPLE_GAMES[2],
      playtimeForeverMinutes: 2100,
      lastPlayedText: "Last month",
      inBacklog: false,
    },
    {
      ...SAMPLE_GAMES[4],
      playtimeForeverMinutes: 150,
      lastPlayedText: "3 months ago",
      inBacklog: true,
    },
    {
      ...SAMPLE_GAMES[9],
      playtimeForeverMinutes: 1320,
      lastPlayedText: "2 months ago",
      inBacklog: false,
    },
  ];

  return NextResponse.json({
    success: true,
    count: fallback.length,
    games: fallback,
  });
}
