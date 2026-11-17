import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, getSessionCookieOptions } from "@/lib/auth/session";
import { getAppBaseUrl } from "@/lib/auth/url-helpers";
import { SAMPLE_USER } from "@/lib/sample-data/sample-user";
import { db } from "@/drizzle/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const appUrl = getAppBaseUrl(req);

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

  const cookieOptions = getSessionCookieOptions(req);
  const response = NextResponse.redirect(new URL("/for-you", appUrl));
  response.cookies.set(cookieOptions.name, token, cookieOptions);
  return response;
}


