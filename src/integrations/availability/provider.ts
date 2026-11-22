import type { ErrorReporter } from "../observability/error-reporter";

export type Availability = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

/** Read-only by design: there is no write path in the catalogue spec. */
export interface ReadOnlyStockAvailabilityProvider {
  /** Batch lookup (one call for all keys, no N+1). */
  getAvailability(stockKeys: readonly string[]): Promise<ReadonlyMap<string, Availability>>;
}

export type FailClosedResult = {
  availability: ReadonlyMap<string, Availability>;
  /** True when the provider threw and every key was forced to OUT_OF_STOCK. */
  degraded: boolean;
};

export interface FailClosedAvailability {
  getAvailability(stockKeys: readonly string[]): Promise<FailClosedResult>;
}

/**
 * Wraps a provider so callers never see stock that was not positively reported.
 * - Keys missing from the provider's answer become OUT_OF_STOCK.
 * - Provider errors are reported and every key becomes OUT_OF_STOCK.
 */
export function withFailClosed(
  provider: ReadOnlyStockAvailabilityProvider,
  reporter: ErrorReporter,
): FailClosedAvailability {
  return {
    async getAvailability(stockKeys) {
      const keys = [...new Set(stockKeys)];
      if (keys.length === 0) return { availability: new Map(), degraded: false };
      try {
        const found = await provider.getAvailability(keys);
        const out = new Map<string, Availability>();
        for (const key of keys) out.set(key, found.get(key) ?? "OUT_OF_STOCK");
        return { availability: out, degraded: false };
      } catch (err) {
        try {
          reporter.capture(err, { area: "availability" });
        } catch {
          // Reporting must never change the fail-closed outcome.
        }
        const out = new Map<string, Availability>();
        for (const key of keys) out.set(key, "OUT_OF_STOCK");
        return { availability: out, degraded: true };
      }
    },
  };
}
