import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/drizzle/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { buildUserTasteVector, projectSparseToDense128 } from "@/lib/ranking/taste-vector";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { favoriteTags = [], preferredHours = 25, budgetPreference = "any" } = body;

    // Build sparse and dense vector from favorite tags
    const sparseVec = buildUserTasteVector([], favoriteTags);
    const dense128 = projectSparseToDense128(sparseVec);

    const tasteProfileJson = {
      topTags: favoriteTags.map((tag: string, i: number) => ({
        tag,
        weight: 100 - i * 5,
      })),
      medianPlaytimePreference: Number(preferredHours),
      budgetPreference: budgetPreference as "budget" | "any" | "sales_only",
    };

    // Update in database if connected
    try {
      await db
        .update(users)
        .set({
          tasteVector: dense128,
          tasteProfileJson,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.userId));
    } catch (dbErr) {
      console.warn("DB user taste update skipped (offline/dev fallback):", dbErr);
    }

    return NextResponse.json({
      success: true,
      tasteProfile: tasteProfileJson,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
