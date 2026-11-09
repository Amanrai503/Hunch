import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "development_secret_must_be_at_least_32_bytes_long_hunch"
);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("hunch_session")?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("login_required", "1");
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("login_required", "1");
    const response = NextResponse.redirect(url);
    response.cookies.delete("hunch_session");
    return response;
  }
}

export const config = {
  matcher: [
    "/for-you/:path*",
    "/my-games/:path*",
    "/squad/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/start/:path*",
  ],
};
