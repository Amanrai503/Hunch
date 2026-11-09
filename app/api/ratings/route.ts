import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/drizzle/db";
import { ratings, games } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { steamAppId, score, reviewText } = body;

    const numScore = Number(score);
    if (isNaN(numScore) || numScore < 1 || numScore > 10) {
      return NextResponse.json(
        { error: "Rating score must be an integer between 1 and 10." },
        { status: 400 }
      );
    }

    // Resolve internal game UUID
    let gameId: string | null = null;
    try {
      const g = await db
        .select({ id: games.id })
        .from(games)
        .where(eq(games.steamAppId, Number(steamAppId)))
        .limit(1);

      if (g.length > 0) {
        gameId = g[0].id;
      }
    } catch {
      // offline fallback
    }

    if (gameId) {
      await db
        .insert(ratings)
        .values({
          userId: session.userId,
          gameId,
          score: Math.round(numScore),
          reviewText,
        })
        .onConflictDoUpdate({
          target: [ratings.userId, ratings.gameId],
          set: {
            score: Math.round(numScore),
            reviewText,
            updatedAt: new Date(),
          },
        });
    }

    return NextResponse.json({
      success: true,
      score: Math.round(numScore),
      steamAppId,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ratings: [] });
  }

  try {
    const rows = await db
      .select({
        score: ratings.score,
        reviewText: ratings.reviewText,
        steamAppId: games.steamAppId,
        gameName: games.name,
      })
      .from(ratings)
      .innerJoin(games, eq(ratings.gameId, games.id))
      .where(eq(ratings.userId, session.userId));

    return NextResponse.json({ ratings: rows });
  } catch {
    return NextResponse.json({ ratings: [] });
  }
}
