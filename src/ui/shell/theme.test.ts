import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { THEME_COOKIE, THEME_INIT_SCRIPT, isTheme, themeCookie } from "./theme";
import { ThemeToggle } from "./ThemeToggle";

function runScript(cookie: string, systemDark: boolean) {
  const attrs: Record<string, string> = {};
  const fakeDocument = {
    cookie,
    documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) },
  };
  const fakeWindow = { matchMedia: () => ({ matches: systemDark }) };
  new Function("document", "window", THEME_INIT_SCRIPT)(fakeDocument, fakeWindow);
  return attrs["data-theme"];
}

describe("theme init script", () => {
  it("uses the saved cookie over the system preference", () => {
    expect(runScript(`a=1; ${THEME_COOKIE}=dark`, false)).toBe("dark");
    expect(runScript(`${THEME_COOKIE}=light`, true)).toBe("light");
  });

  it("falls back to the system preference without a valid cookie", () => {
    expect(runScript("", true)).toBe("dark");
    expect(runScript(`${THEME_COOKIE}=purple`, false)).toBe("light");
  });

  it("never throws when the environment is broken", () => {
    expect(() => new Function(THEME_INIT_SCRIPT)()).not.toThrow();
  });
});

describe("theme helpers", () => {
  it("validates theme values", () => {
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("blue")).toBe(false);
  });

  it("builds a long-lived, non-HttpOnly, lax cookie", () => {
    const c = themeCookie("dark");
    expect(c).toContain(`${THEME_COOKIE}=dark`);
    expect(c).toContain("SameSite=Lax");
    expect(c).toContain("Max-Age=");
    expect(c).not.toContain("HttpOnly");
  });
});

describe("ThemeToggle", () => {
  it("renders an accessible, 44px button", () => {
    const html = renderToStaticMarkup(createElement(ThemeToggle));
    expect(html).toContain('type="button"');
    expect(html).toContain("aria-pressed");
    expect(html).toContain("Dark theme");
    expect(html).toContain("min-h-11");
    expect(html).toContain("min-w-11");
  });
});
