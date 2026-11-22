import { describe, expect, it } from "vitest";
import { add, cents, formatZar, mul, MoneyError, sum } from "./money";

describe("money (integer ZAR cents)", () => {
  it("accepts safe non-negative integers", () => {
    expect(cents(0)).toBe(0);
    expect(cents(69900)).toBe(69900);
  });

  it.each([1.5, -1, Number.NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("rejects %s", (n) => {
    expect(() => cents(n)).toThrow(MoneyError);
  });

  it("adds and multiplies exactly", () => {
    expect(add(cents(10), cents(20))).toBe(30);
    expect(mul(cents(19999), 99)).toBe(1979901);
    expect(mul(cents(5), 0)).toBe(0);
  });

  it("rejects bad quantities", () => {
    expect(() => mul(cents(5), -1)).toThrow(MoneyError);
    expect(() => mul(cents(5), 1.5)).toThrow(MoneyError);
  });

  it("rejects overflow past the safe integer range", () => {
    expect(() => add(cents(Number.MAX_SAFE_INTEGER), cents(1))).toThrow(MoneyError);
    expect(() => mul(cents(Number.MAX_SAFE_INTEGER), 2)).toThrow(MoneyError);
  });

  it("sums without float drift", () => {
    const values = Array.from({ length: 1000 }, () => cents(10));
    expect(sum(values)).toBe(10000);
    expect(sum([])).toBe(0);
  });

  it("formats ZAR", () => {
    const out = formatZar(cents(123450));
    expect(out).toContain("R");
    expect(out.replace(/\s/g, "")).toMatch(/1234[,.]50/);
  });
});
