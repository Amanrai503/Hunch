/**
 * URL and Protocol resolution helpers for robust OAuth/OpenID callbacks
 * across varied hosting environments (AWS EC2, Docker standalone, reverse proxies).
 */

export function getAppBaseUrl(req?: Request): string {
  if (req) {
    const forwardedProto = req.headers.get("x-forwarded-proto");
    const forwardedHost = req.headers.get("x-forwarded-host");
    const host = forwardedHost || req.headers.get("host");

    if (host) {
      let protocol = forwardedProto;
      if (!protocol) {
        try {
          const url = new URL(req.url);
          protocol = url.protocol.replace(":", "");
        } catch {
          protocol = "http";
        }
      }
      return `${protocol}://${host}`;
    }
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export function isSecureConnection(req?: Request): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;

  if (process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")) {
    return true;
  }

  if (req) {
    const proto = req.headers.get("x-forwarded-proto");
    if (proto === "https") return true;
    try {
      const url = new URL(req.url);
      if (url.protocol === "https:") return true;
    } catch {
      // ignore
    }
  }

  return false;
}
