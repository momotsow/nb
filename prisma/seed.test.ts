import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { seedAvailabilityFixtures, seedCategories, seedProducts, seedVariants } from "./seed-data";
import { assertSeedAllowed, seedDatabase } from "./seed";

describe("db:seed guard", () => {
  it("refuses to run when APP_ENV=production", () => {
    expect(() => assertSeedAllowed("production")).toThrow(/production/);
  });

  it("allows other environments", () => {
    expect(() => assertSeedAllowed("development")).not.toThrow();
    expect(() => assertSeedAllowed(undefined)).not.toThrow();
  });

  it("does not touch the database when asked to seed in production", async () => {
    const queries: string[] = [];
    const run = async () => {
      assertSeedAllowed("production");
      await seedDatabase({ query: async (t) => void queries.push(t) });
    };
    await expect(run()).rejects.toThrow();
    expect(queries).toEqual([]);
  });
});

describe("seed dataset invariants", () => {
  it("has the planned shape", () => {
    expect(seedCategories).toHaveLength(2);
    expect(seedProducts).toHaveLength(4);
    expect(seedVariants.length).toBeGreaterThanOrEqual(5);
  });

  it("prefixes every SKU with SEED- and derives stockKey from it", () => {
    for (const v of seedVariants) {
      expect(v.sku.startsWith("SEED-")).toBe(true);
      expect(v.stockKey).toBe(`seed:${v.sku}`);
      expect(Number.isInteger(v.priceCents)).toBe(true);
    }
    expect(new Set(seedVariants.map((v) => v.sku)).size).toBe(seedVariants.length);
  });

  it("flags every product with a placeholder attribute", () => {
    for (const p of seedProducts) {
      expect(p.attributes.some((a) => a.key === "placeholder")).toBe(true);
    }
  });

  it("fixtures cover every stockKey and all three availability states", () => {
    const keys = seedVariants.map((v) => v.stockKey).sort();
    expect(Object.keys(seedAvailabilityFixtures).sort()).toEqual(keys);
    const states = new Set(Object.values(seedAvailabilityFixtures));
    expect(states).toEqual(new Set(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]));
  });

  it("references image files that exist under public/seed", () => {
    for (const p of seedProducts) {
      for (const img of p.images) {
        expect(img.mediaRef.startsWith("seed/")).toBe(true);
        expect(existsSync(`public/${img.mediaRef}`)).toBe(true);
      }
    }
  });

  it("uses neutral copy: no 'ritual', no medical claims", () => {
    const text = readFileSync("prisma/seed-data.ts", "utf8");
    expect(text).not.toMatch(/ritual/i);
    expect(text).not.toMatch(/\b(cure|treat|heal|therapeutic|relieve|anxiety|medical)\w*/i);
  });
});
