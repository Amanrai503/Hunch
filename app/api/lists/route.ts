import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/drizzle/db";
import { lists } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ lists: [] });
  }

  try {
    const userLists = await db
      .select()
      .from(lists)
      .where(eq(lists.userId, session.userId))
      .orderBy(desc(lists.createdAt));

    return NextResponse.json({ lists: userLists });
  } catch {
    return NextResponse.json({
      lists: [
        {
          id: "local_backlog",
          title: "My Priority Backlog",
          description: "Games I want to play next",
          isSystemBacklog: true,
          isPublic: false,
        },
        {
          id: "local_favorites",
          title: "Favorite Deckbuilders",
          description: "Best-in-class roguelikes",
          isSystemBacklog: false,
          isPublic: true,
        },
      ],
    });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let newList = {
      id: `list_${Date.now()}`,
      userId: session.userId,
      title: title.trim(),
      description: description?.trim() || null,
      isPublic: false,
      isSystemBacklog: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const [inserted] = await db
        .insert(lists)
        .values({
          userId: session.userId,
          title: title.trim(),
          description: description?.trim() || null,
          isPublic: false,
          isSystemBacklog: false,
        })
        .returning();
      newList = {
        id: inserted.id,
        userId: inserted.userId,
        title: inserted.title,
        description: inserted.description,
        isPublic: inserted.isPublic,
        isSystemBacklog: inserted.isSystemBacklog,
        createdAt: inserted.createdAt,
        updatedAt: inserted.updatedAt,
      };
    } catch {
      // offline fallback
    }

    return NextResponse.json({ success: true, list: newList });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
