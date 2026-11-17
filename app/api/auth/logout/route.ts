import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieOptions } from "@/lib/auth/session";
import { getAppBaseUrl } from "@/lib/auth/url-helpers";

export async function GET(req: NextRequest) {
  const appUrl = getAppBaseUrl(req);
  const cookieOptions = getSessionCookieOptions(req);
  const response = NextResponse.redirect(new URL("/", appUrl));
  response.cookies.set(cookieOptions.name, "", {
    ...cookieOptions,
    maxAge: 0,
  });
  return response;
}


