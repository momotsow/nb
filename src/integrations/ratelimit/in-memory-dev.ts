import type { RateLimiter } from "./rate-limiter";

/**
 * !!! DEV / TEST ONLY PLACEHOLDER !!!
 * Per-process fixed-window counter. It does NOT work across serverless instances
 * or restarts, so it gives no real protection in production. It is replaced by the
 * Postgres-backed limiter from Spec 3 task 5 (D-07). Construction throws in production.
 */
export function createInMemoryDevRateLimiter(
  options: { appEnv?: string | undefined; now?: () => number } = {},
): RateLimiter {
  const appEnv = "appEnv" in options ? options.appEnv : process.env.APP_ENV;
  if (appEnv === "production") {
    throw new Error(
      "The in-memory dev rate limiter must not run in production. " +
        "Register the Postgres RateLimiter (Spec 3, D-07) before launch.",
    );
  }
  console.warn("[ratelimit] Using in-memory DEV rate limiter. Not suitable for production.");
  const now = options.now ?? Date.now;
  const buckets = new Map<string, { windowStart: number; count: number }>();

  return {
    async check(key, limit, windowSec) {
      const t = now();
      const windowMs = windowSec * 1000;
      const windowStart = Math.floor(t / windowMs) * windowMs;
      const b = buckets.get(key);
      if (!b || b.windowStart !== windowStart) {
        // Opportunistic purge of stale buckets keeps memory bounded.
        for (const [k, v] of buckets) if (v.windowStart < windowStart - windowMs) buckets.delete(k);
        buckets.set(key, { windowStart, count: 1 });
        return { allowed: limit >= 1 };
      }
      b.count += 1;
      return { allowed: b.count <= limit };
    },
  };
}
