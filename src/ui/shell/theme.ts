// Theme preference helpers. Pure and framework-free so they can be unit tested.
// The preference cookie is non-sensitive (light | dark) and is read client-side
// only: calling cookies() on the server would make the shell dynamic under
// `cacheComponents` (design.md §11).

export type Theme = "light" | "dark";

export const THEME_COOKIE = "nb-theme";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/** Cookie string for `document.cookie`. Not HttpOnly: the script must read it. */
export function themeCookie(theme: Theme): string {
  return `${THEME_COOKIE}=${theme}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

/**
 * Inline script run in <head> before first paint. Uses the saved cookie, else the
 * system preference, and sets `data-theme` on <html>. Never throws.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(light|dark)/);var t=m?m[1]:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;
