import { NextResponse } from "next/server";
import { SESSION_COOKIE_OPTIONS } from "@/lib/auth/session";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = NextResponse.redirect(new URL("/", appUrl));
  response.cookies.set(SESSION_COOKIE_OPTIONS.name, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}

