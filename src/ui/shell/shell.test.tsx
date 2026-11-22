// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { renderInTheme, themes } from "../test-utils";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { SkipLink } from "./SkipLink";

afterEach(cleanup);

const Shell = () => (
  <>
    <SkipLink />
    <Header />
    <main id="main">
      <h1>Page</h1>
    </main>
    <Footer />
  </>
);

describe.each(themes)("shell axe in %s theme", (theme) => {
  it("has no violations", async () => {
    const { violations } = await renderInTheme(<Shell />, theme);
    expect(violations).toEqual([]);
  });
});

describe("shell", () => {
  it("skip link is the first tab stop and targets main", async () => {
    const user = userEvent.setup();
    render(<Shell />);
    await user.tab();
    const link = screen.getByRole("link", { name: "Skip to main content" });
    expect(link).toBe(document.activeElement);
    expect(link.getAttribute("href")).toBe("#main");
    expect(document.getElementById("main")).not.toBeNull();
  });

  it("exposes banner, navigation and contentinfo landmarks", () => {
    render(<Shell />);
    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeTruthy();
    expect(screen.getByRole("contentinfo")).toBeTruthy();
  });
});
