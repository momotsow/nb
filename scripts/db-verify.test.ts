import { describe, expect, it } from "vitest";
import { ALLOWED_TABLES, verifyTables } from "./db-verify";

describe("verifyTables", () => {
  it("passes for exactly the allowed set", () => {
    expect(verifyTables([...ALLOWED_TABLES]).ok).toBe(true);
  });

  it.each([
    "StockMovement",
    "StockReservation",
    "Order",
    "OrderItem",
    "Payment",
    "Cart",
    "User",
    "Discount",
  ])("flags %s as forbidden", (name) => {
    const r = verifyTables([...ALLOWED_TABLES, name]);
    expect(r.ok).toBe(false);
    expect(r.forbidden).toEqual([name]);
  });

  it("flags unknown tables as unexpected and absent ones as missing", () => {
    const r = verifyTables([...ALLOWED_TABLES.filter((t) => t !== "Category"), "Widget"]);
    expect(r).toMatchObject({
      ok: false,
      unexpected: ["Widget"],
      missing: ["Category"],
      forbidden: [],
    });
  });
});
