import { createInMemoryDevRateLimiter } from "./in-memory-dev";
import type { RateLimiter } from "./rate-limiter";

let registered: RateLimiter | undefined;
let devInstance: RateLimiter | undefined;

/** Called by Spec 3 to supply the Postgres-backed limiter. */
export function registerRateLimiter(limiter: RateLimiter): void {
  registered = limiter;
}

export function resetRateLimiterForTests(): void {
  registered = undefined;
  devInstance = undefined;
}

/**
 * A registered limiter wins. Otherwise the in-memory placeholder is used outside
 * production; in production with nothing registered this throws.
 */
export function getRateLimiter(appEnv: string | undefined = process.env.APP_ENV): RateLimiter {
  if (registered) return registered;
  if (appEnv === "production") {
    throw new Error("No RateLimiter registered in production (Spec 3, D-07).");
  }
  devInstance ??= createInMemoryDevRateLimiter({ appEnv });
  return devInstance;
}
