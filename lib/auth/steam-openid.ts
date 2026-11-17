const STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";
const OPENID_NS = "http://specs.openid.net/auth/2.0";

// In-memory cache for replay rejection (cleans expired nonces periodically)
const seenNonces = new Map<string, number>();

function cleanExpiredNonces() {
  const now = Date.now();
  for (const [nonce, expiresAt] of seenNonces.entries()) {
    if (expiresAt < now) {
      seenNonces.delete(nonce);
    }
  }
}

export function buildSteamLoginUrl(appUrl: string): string {
  const cleanAppUrl = appUrl.replace(/\/$/, "");
  const returnTo = `${cleanAppUrl}/api/auth/steam/callback`;
  const realm = `${cleanAppUrl}/`;

  const params = new URLSearchParams({
    "openid.ns": OPENID_NS,
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  return `${STEAM_OPENID_ENDPOINT}?${params.toString()}`;
}

export interface VerifyOpenIdResult {
  valid: boolean;
  steamId?: string;
  error?: string;
}

export async function verifySteamOpenIdResponse(
  searchParams: URLSearchParams,
  _appUrl?: string
): Promise<VerifyOpenIdResult> {
  void _appUrl;
  cleanExpiredNonces();

  // 1. Verify openid.mode is id_res
  const mode = searchParams.get("openid.mode");
  if (mode !== "id_res") {
    return { valid: false, error: `Invalid openid.mode, expected id_res, received: ${mode || "empty"}` };
  }

  // 2. Validate return_to callback route
  const returnTo = searchParams.get("openid.return_to");
  if (!returnTo) {
    return { valid: false, error: "Missing openid.return_to parameter" };
  }

  try {
    const returnToUrl = new URL(returnTo);
    if (!returnToUrl.pathname.endsWith("/api/auth/steam/callback")) {
      return { valid: false, error: `Invalid openid.return_to callback path: ${returnToUrl.pathname}` };
    }
  } catch {
    return { valid: false, error: `Malformed openid.return_to URL: ${returnTo}` };
  }

  // 3. Nonce validation and replay protection (15 minute skew window for cloud servers)
  const nonce = searchParams.get("openid.response_nonce");
  if (!nonce) {
    return { valid: false, error: "Missing openid.response_nonce" };
  }

  if (seenNonces.has(nonce)) {
    return { valid: false, error: "Nonce has already been used (replay rejected)" };
  }

  // Steam response_nonce format starts with an ISO timestamp, e.g., 2026-11-17T14:30:00Z...
  const isoMatch = nonce.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)/);
  const nonceTime = isoMatch ? Date.parse(isoMatch[1]) : Date.parse(nonce.slice(0, 20));
  const now = Date.now();
  const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

  if (isNaN(nonceTime) || Math.abs(now - nonceTime) > FIFTEEN_MINUTES_MS) {
    return {
      valid: false,
      error: `Nonce timestamp is invalid or drifted (nonce: ${nonce.slice(0, 25)}, server: ${new Date(now).toISOString()})`,
    };
  }

  // Store nonce to prevent replay
  seenNonces.set(nonce, now + FIFTEEN_MINUTES_MS);

  // 4. Extract 64-bit SteamID from openid.claimed_id
  const claimedId = searchParams.get("openid.claimed_id") || "";
  const steamIdMatch = claimedId.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17,20})$/);
  if (!steamIdMatch || !steamIdMatch[1]) {
    return { valid: false, error: `Invalid claimed_id structure: ${claimedId}` };
  }
  const steamId = steamIdMatch[1];

  // 5. Direct verification via check_authentication POST to Steam
  const verifyParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith("openid.")) {
      verifyParams.append(key, value);
    }
  }
  verifyParams.set("openid.mode", "check_authentication");

  try {
    const res = await fetch(STEAM_OPENID_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: verifyParams.toString(),
    });

    if (!res.ok) {
      return { valid: false, error: `Steam check_authentication HTTP ${res.status}` };
    }

    const text = await res.text();
    const isValid = /is_valid\s*:\s*true/i.test(text);

    if (!isValid) {
      console.error("[Steam OpenID] check_authentication failed. Response body:", text);
      return { valid: false, error: "Steam check_authentication returned is_valid:false" };
    }

    return { valid: true, steamId };
  } catch (err) {
    console.error("[Steam OpenID] Network error during check_authentication:", err);
    return { valid: false, error: `Authentication check failed: ${String(err)}` };
  }
}

