/**
 * Shared rate limiter contract (Spec 3 design section 7, D-07).
 * The production adapter is Postgres-backed and lands with Spec 3 task 5.
 */
export interface RateLimiter {
  check(key: string, limit: number, windowSec: number): Promise<{ allowed: boolean }>;
}

export const SEARCH_RATE_LIMIT = { limit: 30, windowSec: 60 } as const;

/**
 * Applies the search limit. Fails closed: if the limiter throws, the search is refused.
 */
export async function checkSearchRateLimit(
  limiter: RateLimiter,
  clientKey: string,
): Promise<{ allowed: boolean }> {
  try {
    return await limiter.check(
      `search:${clientKey}`,
      SEARCH_RATE_LIMIT.limit,
      SEARCH_RATE_LIMIT.windowSec,
    );
  } catch {
    return { allowed: false };
  }
}
