import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { isSecureConnection } from "./url-helpers";

const COOKIE_NAME = "hunch_session";
const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "development_secret_must_be_at_least_32_bytes_long_hunch"
);

export interface SessionPayload {
  userId: string;
  steamId?: string | null;
  displayName: string;
  avatarUrl: string;
  isSampleUser: boolean;
  isPrivate?: boolean;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function getSessionCookieOptions(reqOrIsSecure?: Request | boolean) {
  const isSecure =
    typeof reqOrIsSecure === "boolean"
      ? reqOrIsSecure
      : isSecureConnection(reqOrIsSecure);

  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  };
}

export const SESSION_COOKIE_OPTIONS = {
  name: COOKIE_NAME,
  httpOnly: true,
  secure: false, // Default false to prevent browser dropping cookies over plain HTTP (e.g. EC2 IP:3000)
  sameSite: "lax" as const,
  path: "/",
  maxAge: 30 * 24 * 60 * 60, // 30 days
};


