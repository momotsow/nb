"use client";

import { useSyncExternalStore } from "react";
import { isTheme, themeCookie, type Theme } from "./theme";

// Re-render when <html data-theme> changes (set by the init script or this toggle).
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  const value = document.documentElement.getAttribute("data-theme");
  return isTheme(value) ? value : "light";
}

const getServerSnapshot = (): Theme => "light";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = theme === "dark";

  function toggle() {
    const next: Theme = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    document.cookie = themeCookie(next);
  }

  // Static accessible name; state is conveyed by aria-pressed (not colour alone).
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-(--nb-border) px-4 text-sm text-(--nb-text) hover:bg-(--nb-surface)"
    >
      Dark theme
      <span aria-hidden="true">{isDark ? "On" : "Off"}</span>
    </button>
  );
}
