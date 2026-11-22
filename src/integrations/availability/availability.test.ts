import { afterEach, describe, expect, it } from "vitest";
import {
  getAvailabilityProvider,
  registerAvailabilityProvider,
  resetAvailabilityProviderForTests,
} from "./config";
import { withFailClosed, type ReadOnlyStockAvailabilityProvider } from "./provider";
import { createStubAvailabilityProvider } from "./stub";
import type { ErrorReporter } from "../observability/error-reporter";

function spyReporter() {
  const errors: unknown[] = [];
  const reporter: ErrorReporter = { capture: (e) => void errors.push(e) };
  return { reporter, errors };
}

describe("AVAILABILITY_STUB_MODE=fail", () => {
  afterEach(() => {
    delete process.env.AVAILABILITY_STUB_MODE;
  });

  it("makes the non-production provider reject, and is ignored in production", async () => {
    process.env.AVAILABILITY_STUB_MODE = "fail";
    await expect(getAvailabilityProvider("development").getAvailability(["a"])).rejects.toThrow();
    expect(() => getAvailabilityProvider("production")).toThrow(/production/);
  });
});

describe("withFailClosed", () => {
  it("passes through known keys and fails unknown keys closed", async () => {
    const stub = createStubAvailabilityProvider({ a: "IN_STOCK", b: "LOW_STOCK" });
    const { availability, degraded } = await withFailClosed(
      stub,
      spyReporter().reporter,
    ).getAvailability(["a", "b", "nope"]);
    expect(degraded).toBe(false);
    expect(availability.get("a")).toBe("IN_STOCK");
    expect(availability.get("b")).toBe("LOW_STOCK");
    expect(availability.get("nope")).toBe("OUT_OF_STOCK");
  });

  it("fails every key closed and reports when the provider throws", async () => {
    const boom = new Error("down");
    const failing: ReadOnlyStockAvailabilityProvider = {
      getAvailability: () => Promise.reject(boom),
    };
    const { reporter, errors } = spyReporter();
    const { availability, degraded } = await withFailClosed(failing, reporter).getAvailability([
      "a",
      "b",
    ]);
    expect(degraded).toBe(true);
    expect([...availability.values()]).toEqual(["OUT_OF_STOCK", "OUT_OF_STOCK"]);
    expect(errors).toEqual([boom]);
  });

  it("makes a single batch call for many keys", async () => {
    const stub = createStubAvailabilityProvider({ a: "IN_STOCK" });
    await withFailClosed(stub, spyReporter().reporter).getAvailability(["a", "b", "c", "a"]);
    expect(stub.calls).toBe(1);
  });
});

describe("getAvailabilityProvider", () => {
  afterEach(resetAvailabilityProviderForTests);

  it("uses the stub outside production", async () => {
    const p = getAvailabilityProvider("development");
    expect((await p.getAvailability(["x"])).size).toBe(0);
  });

  it("throws loudly in production without a registered implementation", () => {
    expect(() => getAvailabilityProvider("production")).toThrow(/production/);
  });

  it("allows production when an implementation is registered", () => {
    const real = createStubAvailabilityProvider({});
    registerAvailabilityProvider(real);
    expect(getAvailabilityProvider("production")).toBe(real);
  });
});
