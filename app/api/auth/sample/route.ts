import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth/session";
import { SAMPLE_USER } from "@/lib/sample-data/sample-user";
import { db } from "@/drizzle/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Ensure sample database fixtures exist
  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.steamId, SAMPLE_USER.steamId))
      .limit(1);

    if (existing.length === 0) {
      const { seedDatabase } = await import("@/lib/sample-data/seeder");
      await seedDatabase();
    }
  } catch (err) {
    console.warn("DB sample user auto-seed skipped (offline mode):", err);
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

