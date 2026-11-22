import type { Availability, ReadOnlyStockAvailabilityProvider } from "./provider";

/** Deterministic provider for tests, e2e and dev. Unknown keys are simply absent. */
export function createStubAvailabilityProvider(
  fixtures: Readonly<Record<string, Availability>> | ReadonlyMap<string, Availability>,
): ReadOnlyStockAvailabilityProvider & { readonly calls: number } {
  const map = fixtures instanceof Map ? fixtures : new Map(Object.entries(fixtures));
  let calls = 0;
  return {
    get calls() {
      return calls;
    },
    async getAvailability(stockKeys) {
      calls += 1;
      const out = new Map<string, Availability>();
      for (const key of stockKeys) {
        const value = map.get(key);
        if (value) out.set(key, value);
      }
      return out;
    },
  };
}
