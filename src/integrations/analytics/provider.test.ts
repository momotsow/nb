import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ALLOWED_EVENTS } from "./events";
import { analytics, createAnalytics } from "./provider";

// Test-only registry for the generic allow-list behaviour.
const registry = {
  test_viewed: z.strictObject({ surface: z.enum(["home", "pdp"]), count: z.number().int() }),
};

function setup() {
  const send = vi.fn();
  const report = vi.fn();
  return { send, report, track: createAnalytics(registry, { send }, report).track };
}

describe("analytics allow-list", () => {
  it("sends valid registered events", () => {
    const { send, report, track } = setup();
    track("test_viewed", { surface: "home", count: 1 });
    expect(send).toHaveBeenCalledWith("test_viewed", { surface: "home", count: 1 });
    expect(report).not.toHaveBeenCalled();
  });

  it("rejects unknown events at compile time and runtime", () => {
    const { send, report, track } = setup();
    // @ts-expect-error "nope" is not in the registry
    track("nope", {});
    expect(send).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalledWith({ name: "nope", reason: "unknown_event" });
  });

  it("rejects prototype-key event names", () => {
    const { send, report, track } = setup();
    // @ts-expect-error not a registered event
    track("toString", {});
    expect(send).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalledWith({ name: "toString", reason: "unknown_event" });
  });

  it("rejects extra keys such as PII", () => {
    const { send, report, track } = setup();
    // @ts-expect-error email is not part of the schema
    track("test_viewed", { surface: "home", count: 1, email: "a@b.co" });
    expect(send).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalledWith({ name: "test_viewed", reason: "invalid_payload" });
  });

  it("rejects PII-shaped values where the schema permits only enums and numbers", () => {
    const { send, report, track } = setup();
    // @ts-expect-error free text is not an allowed surface
    track("test_viewed", { surface: "jane@example.com", count: 1 });
    expect(send).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalledTimes(1);
  });

  it("does not leak payload values into rejection reports", () => {
    const { report, track } = setup();
    // @ts-expect-error invalid on purpose
    track("test_viewed", { surface: "jane@example.com", count: 1 });
    expect(JSON.stringify(report.mock.calls)).not.toContain("jane@example.com");
  });

  it("default provider drops events outside the allow-list", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // @ts-expect-error "anything" is not a registered event
    analytics.track("anything", {});
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("catalogue events", () => {
  const send = vi.fn();
  const report = vi.fn();
  const { track } = createAnalytics(ALLOWED_EVENTS, { send }, report);
  const valid = {
    product_viewed: { productId: "p1", productSlug: "rose-oil" },
    search_performed: { queryLength: 4, resultCount: 2 },
    collection_viewed: { collectionSlug: "spring" },
    category_viewed: { categorySlug: "oils" },
    product_relationship_clicked: { fromProductId: "p1", toProductId: "p2" },
  } as const;

  beforeEach(() => {
    send.mockClear();
    report.mockClear();
  });

  it("registers exactly the five catalogue events", () => {
    expect(Object.keys(ALLOWED_EVENTS).sort()).toEqual(Object.keys(valid).sort());
  });

  it.each(Object.entries(valid))("accepts %s", (name, props) => {
    (track as (n: string, p: unknown) => void)(name, props);
    expect(send).toHaveBeenCalledWith(name, props);
    expect(report).not.toHaveBeenCalled();
  });

  it.each(Object.entries(valid))("rejects extra keys on %s", (name, props) => {
    (track as (n: string, p: unknown) => void)(name, { ...props, email: "a@b.co" });
    expect(send).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalledWith({ name, reason: "invalid_payload" });
  });

  it("rejects unregistered events", () => {
    (track as (n: string, p: unknown) => void)("page_viewed", {});
    expect(report).toHaveBeenCalledWith({ name: "page_viewed", reason: "unknown_event" });
  });

  it("search_performed carries only queryLength and resultCount, never the raw query", () => {
    expect(Object.keys(ALLOWED_EVENTS.search_performed.shape).sort()).toEqual([
      "queryLength",
      "resultCount",
    ]);
    (track as (n: string, p: unknown) => void)("search_performed", {
      queryLength: 4,
      resultCount: 2,
      q: "rose",
    });
    expect(send).not.toHaveBeenCalled();
  });
});
