import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getRecommendationsForUser } from "@/lib/recommendations/get-recommendations";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const searchParams = req.nextUrl.searchParams;

  const deckVerifiedOnly = searchParams.get("deck") === "1";
  const maxPriceCents = searchParams.get("maxPrice")
    ? Number(searchParams.get("maxPrice"))
    : undefined;
  const maxHoursToBeat = searchParams.get("maxHours")
    ? Number(searchParams.get("maxHours"))
    : undefined;
  const salesOnly = searchParams.get("salesOnly") === "1";
  const selectedTag = searchParams.get("tag") || undefined;
  const searchQuery = searchParams.get("q") || undefined;

  try {
    const recommendations = await getRecommendationsForUser(session?.userId, {
      deckVerifiedOnly,
      maxPriceCents,
      maxHoursToBeat,
      salesOnly,
      selectedTag,
      searchQuery,
    });

    return NextResponse.json({
      recommendations,
      count: recommendations.length,
    });
  } catch (err) {
    console.error("Error generating recommendations:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

