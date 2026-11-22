import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import type { ReactElement } from "react";

// axe probes canvas for icon-ligature checks; jsdom lacks it and logs noise.
HTMLCanvasElement.prototype.getContext = (() =>
  null) as typeof HTMLCanvasElement.prototype.getContext;

export const themes = ["light", "dark"] as const;
export type ThemeName = (typeof themes)[number];

/** Renders under <html data-theme="..."> and returns axe violations. */
export async function renderInTheme(ui: ReactElement, theme: ThemeName) {
  document.documentElement.setAttribute("data-theme", theme);
  const result = render(ui);
  const axeResults = await axe(result.container);
  return { ...result, violations: axeResults.violations };
}
