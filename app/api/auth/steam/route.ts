import { NextRequest, NextResponse } from "next/server";
import { buildSteamLoginUrl } from "@/lib/auth/steam-openid";
import { getAppBaseUrl } from "@/lib/auth/url-helpers";

export async function GET(req: NextRequest) {
  const appUrl = getAppBaseUrl(req);
  const loginUrl = buildSteamLoginUrl(appUrl);
  return NextResponse.redirect(loginUrl);
}


