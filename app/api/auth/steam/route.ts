import { NextResponse } from "next/server";
import { buildSteamLoginUrl } from "@/lib/auth/steam-openid";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const loginUrl = buildSteamLoginUrl(appUrl);
  return NextResponse.redirect(loginUrl);
}
