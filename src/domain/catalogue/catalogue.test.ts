import { describe, expect, it } from "vitest";
import {
  bestAvailability,
  fromPrice,
  isProductVisible,
  isPurchasable,
  normalizeAvailability,
  priceRange,
  selectDefaultVariant,
  type Availability,
} from "./catalogue";

const v = (id: string, priceCents: number, active = true) => ({ id, priceCents, active });

describe("isProductVisible", () => {
  it("requires ACTIVE and an active variant", () => {
    expect(isProductVisible({ status: "ACTIVE", variants: [v("a", 100)] })).toBe(true);
    expect(isProductVisible({ status: "ACTIVE", variants: [v("a", 100, false)] })).toBe(false);
    expect(isProductVisible({ status: "ACTIVE", variants: [] })).toBe(false);
    expect(isProductVisible({ status: "DRAFT", variants: [v("a", 100)] })).toBe(false);
    expect(isProductVisible({ status: "ARCHIVED", variants: [v("a", 100)] })).toBe(false);
  });
});

describe("isPurchasable", () => {
  it("is true only for ACTIVE, active, in-stock-ish", () => {
    expect(isPurchasable("ACTIVE", { active: true }, "IN_STOCK")).toBe(true);
    expect(isPurchasable("ACTIVE", { active: true }, "LOW_STOCK")).toBe(true);
    expect(isPurchasable("ACTIVE", { active: true }, "OUT_OF_STOCK")).toBe(false);
    expect(isPurchasable("ACTIVE", { active: false }, "IN_STOCK")).toBe(false);
    expect(isPurchasable("DRAFT", { active: true }, "IN_STOCK")).toBe(false);
  });
  it("fails closed on unknown or missing availability", () => {
    expect(isPurchasable("ACTIVE", { active: true }, undefined)).toBe(false);
    expect(isPurchasable("ACTIVE", { active: true }, "PLENTY")).toBe(false);
    expect(normalizeAvailability(null)).toBe("OUT_OF_STOCK");
  });
});

describe("bestAvailability", () => {
  it("picks the best, failing closed when empty", () => {
    expect(bestAvailability(["OUT_OF_STOCK", "LOW_STOCK"])).toBe("LOW_STOCK");
    expect(bestAvailability(["LOW_STOCK", "IN_STOCK"])).toBe("IN_STOCK");
    expect(bestAvailability([])).toBe("OUT_OF_STOCK");
  });
});

describe("selectDefaultVariant", () => {
  const variants = [v("c", 500), v("a", 300), v("b", 300), v("x", 100, false)];
  it("ignores inactive and picks lowest price then id", () => {
    const stock = new Map<string, Availability>([
      ["a", "IN_STOCK"],
      ["b", "IN_STOCK"],
      ["c", "IN_STOCK"],
    ]);
    expect(selectDefaultVariant("ACTIVE", variants, stock)?.id).toBe("a");
  });
  it("prefers purchasable over cheaper out-of-stock", () => {
    const stock = new Map<string, Availability>([
      ["a", "OUT_OF_STOCK"],
      ["b", "OUT_OF_STOCK"],
      ["c", "IN_STOCK"],
    ]);
    expect(selectDefaultVariant("ACTIVE", variants, stock)?.id).toBe("c");
  });
  it("still returns an active variant when none are purchasable, null when none active", () => {
    expect(selectDefaultVariant("ACTIVE", variants)?.id).toBe("a");
    expect(selectDefaultVariant("ACTIVE", [v("x", 1, false)])).toBeNull();
  });
});

describe("price helpers", () => {
  it("computes range and from price over active variants", () => {
    const vs = [v("a", 300), v("b", 500), v("z", 10, false)];
    expect(priceRange(vs)).toEqual({ min: 300, max: 500, isRange: true });
    expect(fromPrice(vs)).toBe(300);
    expect(priceRange([v("a", 300)])?.isRange).toBe(false);
  });
  it("returns null with no active variants", () => {
    expect(priceRange([])).toBeNull();
    expect(fromPrice([v("a", 1, false)])).toBeNull();
  });
  it("rejects invalid cents", () => {
    expect(() => priceRange([v("a", 1.5)])).toThrow();
  });
});
