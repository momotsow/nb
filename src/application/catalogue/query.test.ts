import { describe, expect, it, vi } from "vitest";
import {
  getRateLimiter,
  registerRateLimiter,
  resetRateLimiterForTests,
} from "@/integrations/ratelimit/config";
import { createInMemoryDevRateLimiter } from "@/integrations/ratelimit/in-memory-dev";
import { checkSearchRateLimit } from "@/integrations/ratelimit/rate-limiter";
import { parseListQuery, parseSearchQuery, parseSlug } from "./query";

describe("parseListQuery", () => {
  it("uses defaults for empty params", () => {
    expect(parseListQuery({})).toEqual({
      query: { page: 1, pageSize: 24, sort: "featured" },
      invalidSlugs: [],
    });
  });

  it("parses valid values", () => {
    const r = parseListQuery({
      page: "3",
      sort: "price_desc",
      category: "candles",
      collection: "bloom-1",
    });
    expect(r.query).toEqual({
      page: 3,
      pageSize: 24,
      sort: "price_desc",
      categorySlug: "candles",
      collectionSlug: "bloom-1",
    });
  });

  it.each(["0", "-1", "abc", "1.5", "99999", ""])("falls back to page 1 for %j", (page) => {
    expect(parseListQuery({ page }).query.page).toBe(1);
  });

  it("falls back to featured for unknown sort and takes the first array value", () => {
    expect(parseListQuery({ sort: "nope" }).query.sort).toBe("featured");
    expect(parseListQuery({ sort: ["newest", "price_asc"] }).query.sort).toBe("newest");
  });

  it("reports and drops invalid slugs", () => {
    const r = parseListQuery({ category: "Bad Slug!", collection: "ok" });
    expect(r.invalidSlugs).toEqual(["category"]);
    expect(r.query.categorySlug).toBeUndefined();
    expect(r.query.collectionSlug).toBe("ok");
  });
});

describe("parseSlug", () => {
  it("accepts kebab-case and rejects the rest", () => {
    expect(parseSlug("a-b-1")).toBe("a-b-1");
    for (const bad of ["A", "a_b", "-a", "a--b", "a/b", "", "x".repeat(101), 5, null]) {
      expect(parseSlug(bad)).toBeNull();
    }
  });
});

describe("parseSearchQuery", () => {
  it("trims, caps at 100 chars and defaults page", () => {
    const r = parseSearchQuery({ q: `  ${"a".repeat(150)}  `, page: "x" });
    expect(r.q).toHaveLength(100);
    expect(r.page).toBe(1);
  });

  it("returns empty string when q is missing", () => {
    expect(parseSearchQuery({}).q).toBe("");
  });
});

describe("rate limiting", () => {
  it("enforces the limit per window and rolls over", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    let t = 0;
    const l = createInMemoryDevRateLimiter({ appEnv: "development", now: () => t });
    expect((await l.check("k", 2, 60)).allowed).toBe(true);
    expect((await l.check("k", 2, 60)).allowed).toBe(true);
    expect((await l.check("k", 2, 60)).allowed).toBe(false);
    expect((await l.check("other", 2, 60)).allowed).toBe(true);
    t = 61_000;
    expect((await l.check("k", 2, 60)).allowed).toBe(true);
  });

  it("refuses to be constructed or resolved in production", () => {
    expect(() => createInMemoryDevRateLimiter({ appEnv: "production" })).toThrow(/production/);
    resetRateLimiterForTests();
    expect(() => getRateLimiter("production")).toThrow(/production/);
  });

  it("prefers a registered limiter, including in production", () => {
    const custom = { check: async () => ({ allowed: true }) };
    registerRateLimiter(custom);
    expect(getRateLimiter("production")).toBe(custom);
    resetRateLimiterForTests();
  });

  it("fails closed when the limiter throws", async () => {
    const broken = { check: async () => Promise.reject(new Error("db down")) };
    expect(await checkSearchRateLimit(broken, "ip")).toEqual({ allowed: false });
  });
});
