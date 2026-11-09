import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth/session";
import { SAMPLE_USER } from "@/lib/sample-data/sample-user";
import { db } from "@/drizzle/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Optionally ensure sample user exists in database if accessible
  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.steamId, SAMPLE_USER.steamId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(users).values({
        id: SAMPLE_USER.id,
        steamId: SAMPLE_USER.steamId,
        displayName: SAMPLE_USER.displayName,
        avatarUrl: SAMPLE_USER.avatarUrl,
        profileUrl: SAMPLE_USER.profileUrl,
        isPrivate: false,
        isSampleUser: true,
        tasteProfileJson: SAMPLE_USER.tasteProfileJson,
      });
    }
  } catch (err) {
    console.warn("DB sample user ensure skipped (offline mode):", err);
  }

  const token = await createSessionToken({
    userId: SAMPLE_USER.id,
    steamId: SAMPLE_USER.steamId,
    displayName: SAMPLE_USER.displayName,
    avatarUrl: SAMPLE_USER.avatarUrl,
    isSampleUser: true,
    isPrivate: false,
  });

  const response = NextResponse.redirect(new URL("/for-you", appUrl));
  response.cookies.set(SESSION_COOKIE_OPTIONS.name, token, SESSION_COOKIE_OPTIONS);
  return response;
}
