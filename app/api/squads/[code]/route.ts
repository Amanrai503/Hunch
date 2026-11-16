import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/drizzle/db";
import { squads, squadMembers, users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { SAMPLE_GAMES } from "@/lib/sample-data/sample-games";

interface SquadMemberInfo {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  isHost: boolean;
}

interface RoomData {
  id: string;
  code: string;
  name: string;
  status: string;
  members: SquadMemberInfo[];
  games: {
    steamAppId: number;
    name: string;
    headerImage: string | null;
    priceFinal: number;
    discountPercent: number;
    estimatedHours: string;
    tags: string[];
    votes: {
      picks: number;
      passes: number;
      vetos: number;
    };
  }[];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await getSession();

  const roomData: RoomData = {
    id: `squad_${code}`,
    code: code.toUpperCase(),
    name: "Co-op Game Session",
    status: "active",
    members: [
      {
        userId: session?.userId || "user_guest",
        displayName: session?.displayName || "You",
        avatarUrl:
          session?.avatarUrl ||
          "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg",
        isHost: true,
      },
    ],
    games: SAMPLE_GAMES.slice(0, 10).map((g) => ({
      steamAppId: g.steamAppId,
      name: g.name,
      headerImage: g.headerImage,
      priceFinal: g.priceFinal,
      discountPercent: g.discountPercent,
      estimatedHours: g.estimatedHoursToBeat,
      tags: g.tags.slice(0, 3).map((t) => t.tag),
      votes: {
        picks: 0,
        passes: 0,
        vetos: 0,
      },
    })),
  };

  try {
    const foundSquad = await db
      .select()
      .from(squads)
      .where(eq(squads.code, code.toUpperCase()))
      .limit(1);

    if (foundSquad.length > 0) {
      const s = foundSquad[0];
      const members = await db
        .select({
          userId: users.id,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          isHost: squadMembers.isHost,
        })
        .from(squadMembers)
        .innerJoin(users, eq(squadMembers.userId, users.id))
        .where(eq(squadMembers.squadId, s.id));

      roomData.id = s.id;
      roomData.name = s.name;
      roomData.status = s.status;
      if (members.length > 0) {
        roomData.members = members;
      }
    }
  } catch (err) {
    console.warn("DB squad fetch fallback:", (err as Error)?.message || err);
  }

  return NextResponse.json({ squad: roomData });
}
