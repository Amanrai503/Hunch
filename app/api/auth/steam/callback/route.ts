import { NextRequest, NextResponse } from "next/server";
import { verifySteamOpenIdResponse } from "@/lib/auth/steam-openid";
import { createSessionToken, getSessionCookieOptions } from "@/lib/auth/session";
import { getAppBaseUrl } from "@/lib/auth/url-helpers";
import { syncUserSteamLibrary } from "@/lib/steam/sync-user-library";
import { db } from "@/drizzle/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const appUrl = getAppBaseUrl(req);
  const searchParams = req.nextUrl.searchParams;

  const verification = await verifySteamOpenIdResponse(searchParams, appUrl);
  if (!verification.valid || !verification.steamId) {
    const errorMsg = verification.error || "Failed to verify Steam OpenID signature";
    console.error("[Steam Auth Callback Error]", errorMsg);
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(errorMsg)}`, appUrl)
    );
  }

  const steamId = verification.steamId;
  const apiKey = process.env.STEAM_API_KEY;

  let displayName = `Steam User (${steamId.slice(-4)})`;
  let avatarUrl = "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg";
  let profileUrl = `https://steamcommunity.com/profiles/${steamId}`;
  let isPrivate = false;

  // Attempt to fetch profile summary if API key is provided
  if (apiKey && apiKey !== "dummy_steam_api_key_for_dev") {
    try {
      const summaryUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`;
      const res = await fetch(summaryUrl, { next: { revalidate: 60 } });
      if (res.ok) {
        const data = await res.json();
        const player = data.response?.players?.[0];
        if (player) {
          displayName = player.personaname || displayName;
          avatarUrl = player.avatarfull || player.avatarmedium || avatarUrl;
          profileUrl = player.profileurl || profileUrl;
          // communityvisibilitystate: 3 = public, 1 or 2 = private / friends only
          isPrivate = player.communityvisibilitystate !== 3;
        }
      }
    } catch (err) {
      console.warn("Could not fetch Steam player summary:", err);
    }
  }

  // Upsert user in Postgres DB
  let userId = `user_${steamId}`;
  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.steamId, steamId))
      .limit(1);

    if (existing.length > 0) {
      userId = existing[0].id;
      await db
        .update(users)
        .set({
          displayName,
          avatarUrl,
          profileUrl,
          isPrivate,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } else {
      const [inserted] = await db
        .insert(users)
        .values({
          steamId,
          displayName,
          avatarUrl,
          profileUrl,
          isPrivate,
          isSampleUser: false,
        })
        .returning();
      if (inserted) {
        userId = inserted.id;
      }
    }
  } catch (dbErr) {
    console.warn("DB user sync skipped (offline or not migrated yet):", dbErr);
  }

  // Synchronously sync the user's Steam library & synthesize personalized taste profile
  try {
    await syncUserSteamLibrary({ userId, steamId, apiKey });
  } catch (syncErr) {
    console.warn("Initial Steam library sync encountered warning:", syncErr);
  }

  // Also dispatch background Inngest event if Inngest is configured
  try {
    const { inngest } = await import("@/inngest/client");
    await inngest.send({
      name: "user/library.sync.requested",
      data: { userId, steamId },
    });
  } catch {
    // Inngest daemon not running in standalone container is expected
  }

  const token = await createSessionToken({
    userId,
    steamId,
    displayName,
    avatarUrl,
    isSampleUser: false,
    isPrivate,
  });

  const cookieOptions = getSessionCookieOptions(req);
  const response = NextResponse.redirect(new URL("/for-you", appUrl));
  response.cookies.set(cookieOptions.name, token, cookieOptions);
  return response;
}


