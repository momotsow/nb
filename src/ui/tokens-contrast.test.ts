import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// axe cannot resolve CSS variables in jsdom, so WCAG AA contrast (4.5:1) of the
// semantic token pairs is checked directly from globals.css.
const css = readFileSync(join(__dirname, "../app/globals.css"), "utf8");

function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  return Object.fromEntries(
    [...body.matchAll(/--(nb-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1]!, m[2]!]),
  );
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const themes = { light: block(":root"), dark: block('[data-theme="dark"]') };
const textPairs = ["nb-text", "nb-muted", "nb-danger", "nb-success"] as const;

describe.each(Object.entries(themes))("%s theme token contrast", (_name, t) => {
  it.each(textPairs)("%s on bg and surface is >= 4.5:1", (token) => {
    expect(ratio(t[token]!, t["nb-bg"]!)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t[token]!, t["nb-surface"]!)).toBeGreaterThanOrEqual(4.5);
  });
  it("focus ring and border-critical colours are >= 3:1 against bg", () => {
    expect(ratio(t["nb-focus"]!, t["nb-bg"]!)).toBeGreaterThanOrEqual(3);
    expect(ratio(t["nb-danger"]!, t["nb-bg"]!)).toBeGreaterThanOrEqual(3);
  });
});
