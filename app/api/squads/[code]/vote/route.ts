import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/drizzle/db";
import { squads, votes, games } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { steamAppId, vote } = body;

    if (!["pick", "pass", "veto"].includes(vote)) {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
    }

    // Resolve squad ID
    let squadId: string | null = null;
    let gameId: string | null = null;

    try {
      const s = await db
        .select({ id: squads.id })
        .from(squads)
        .where(eq(squads.code, code.toUpperCase()))
        .limit(1);

      if (s.length > 0) {
        squadId = s[0].id;
      }

      const g = await db
        .select({ id: games.id })
        .from(games)
        .where(eq(games.steamAppId, Number(steamAppId)))
        .limit(1);

      if (g.length > 0) {
        gameId = g[0].id;
      }

      // Enforce: max ONE veto per user per squad
      if (squadId && vote === "veto") {
        const existingVeto = await db
          .select({ id: votes.id, gameId: votes.gameId })
          .from(votes)
          .where(
            and(
              eq(votes.squadId, squadId),
              eq(votes.userId, session.userId),
              eq(votes.vote, "veto")
            )
          )
          .limit(1);

        if (existingVeto.length > 0 && existingVeto[0].gameId !== gameId) {
          return NextResponse.json(
            {
              error:
                "You have already used your single veto for this squad session. You cannot veto more than one game.",
            },
            { status: 403 }
          );
        }
      }

      if (squadId && gameId) {
        await db
          .insert(votes)
          .values({
            squadId,
            userId: session.userId,
            gameId,
            vote,
          })
          .onConflictDoUpdate({
            target: [votes.squadId, votes.userId, votes.gameId],
            set: {
              vote,
            },
          });
      }
    } catch (dbErr) {
      console.warn("DB vote recording fallback:", dbErr);
    }

    return NextResponse.json({
      success: true,
      code,
      steamAppId,
      vote,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
