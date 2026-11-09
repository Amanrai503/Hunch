import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/drizzle/db";
import { feedback, games } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { steamAppId, action, reason } = body;

    if (!["not_interested", "already_played", "hide"].includes(action)) {
      return NextResponse.json({ error: "Invalid feedback action" }, { status: 400 });
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
        .insert(feedback)
        .values({
          userId: session.userId,
          gameId,
          action,
          reason,
        })
        .onConflictDoNothing();
    }

    return NextResponse.json({
      success: true,
      action,
      steamAppId,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ feedback: [] });
  }

  try {
    const rows = await db
      .select({
        action: feedback.action,
        reason: feedback.reason,
        steamAppId: games.steamAppId,
        gameName: games.name,
      })
      .from(feedback)
      .innerJoin(games, eq(feedback.gameId, games.id))
      .where(eq(feedback.userId, session.userId));

    return NextResponse.json({ feedback: rows });
  } catch {
    return NextResponse.json({ feedback: [] });
  }
}
