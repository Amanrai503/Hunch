/**
 * Steam Storefront Rate Limiter (~200 requests per 5 minutes = 1 req every 1.5s)
 * Automatically backs off on HTTP 429 responses.
 */

class RateLimiter {
  private lastRequestTime = 0;
  private minIntervalMs: number;
  private consecutive429s = 0;

  constructor(minIntervalMs = 1500) {
    this.minIntervalMs = minIntervalMs;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    const timeSinceLast = now - this.lastRequestTime;

    let waitTime = Math.max(0, this.minIntervalMs - timeSinceLast);

    if (this.consecutive429s > 0) {
      // Exponential backoff: 10s, 30s, 60s
      const backoffMs = Math.min(60000, 10000 * Math.pow(2, this.consecutive429s - 1));
      waitTime = Math.max(waitTime, backoffMs);
    }

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  recordSuccess(): void {
    if (this.consecutive429s > 0) {
      this.consecutive429s = 0;
    }
  }

  record429(): void {
    this.consecutive429s++;
    console.warn(
      `[SteamRateLimiter] Hit 429 Too Many Requests (${this.consecutive429s}x). Backing off...`
    );
  }
}

export const steamStoreRateLimiter = new RateLimiter(1500);
