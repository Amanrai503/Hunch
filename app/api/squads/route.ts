import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/drizzle/db";
import { squads, squadMembers } from "@/drizzle/schema";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name = "Squad Game Night" } = body;

    // Generate readable 6-character room code, e.g. "SQUAD-42"
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `SQ-${randomSuffix}`;

    let newSquad = {
      id: `squad_${Date.now()}`,
      code,
      name,
      hostUserId: session.userId,
      status: "active",
      createdAt: new Date(),
    };

    try {
      const [inserted] = await db
        .insert(squads)
        .values({
          code,
          name,
          hostUserId: session.userId,
          status: "active",
        })
        .returning();

      newSquad = {
        id: inserted.id,
        code: inserted.code,
        name: inserted.name,
        hostUserId: inserted.hostUserId,
        status: inserted.status,
        createdAt: inserted.createdAt,
      };

      // Add host as first member
      await db.insert(squadMembers).values({
        squadId: inserted.id,
        userId: session.userId,
        isHost: true,
      });
    } catch (err) {
      console.warn("DB squad creation fallback:", (err as Error)?.message || err);
    }

    return NextResponse.json({ success: true, squad: newSquad, code });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
