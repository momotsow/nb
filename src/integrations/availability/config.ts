import type { Availability, ReadOnlyStockAvailabilityProvider } from "./provider";
import { createStubAvailabilityProvider } from "./stub";

let registered: ReadOnlyStockAvailabilityProvider | undefined;

/** Called by a future Inventory spec to supply the real implementation. */
export function registerAvailabilityProvider(provider: ReadOnlyStockAvailabilityProvider): void {
  registered = provider;
}

export function resetAvailabilityProviderForTests(): void {
  registered = undefined;
}

/**
 * Selects the availability provider.
 * - A registered implementation always wins.
 * - Outside production the deterministic stub is used.
 * - In production with nothing registered this throws, so the app cannot launch on fake stock.
 */
export function getAvailabilityProvider(
  appEnv: string | undefined = process.env.APP_ENV,
  stubFixtures: Readonly<Record<string, Availability>> = {},
): ReadOnlyStockAvailabilityProvider {
  if (registered) return registered;
  if (appEnv === "production") {
    throw new Error(
      "No stock availability provider is registered in production. " +
        "Register a real implementation before launch; the stub must not run in production.",
    );
  }
  // Test-only switch so e2e can exercise the fail-closed path. Never honoured in production
  // (that branch has already returned or thrown above).
  if (process.env.AVAILABILITY_STUB_MODE === "fail") {
    return {
      getAvailability: () => Promise.reject(new Error("Stub availability provider forced to fail")),
    };
  }
  return createStubAvailabilityProvider(stubFixtures);
}
