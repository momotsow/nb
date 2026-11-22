import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const themes = ["light", "dark"] as const;

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
}

const toggle = (page: Page) => page.getByRole("button", { name: "Dark theme" });
const theme = (page: Page) => page.locator("html").getAttribute("data-theme");

for (const colorScheme of themes) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    test("home loads with no axe violations", async ({ page }) => {
      const response = await page.goto("/");
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", colorScheme);
      await expectNoAxeViolations(page);
    });

    test("unknown route renders 404 with no axe violations", async ({ page }) => {
      const response = await page.goto("/this-route-does-not-exist");
      expect(response?.status()).toBe(404);
      await expect(page.getByText("We could not find that page")).toBeVisible();
      await expectNoAxeViolations(page);
    });
  });
}

test.describe("theme toggle", () => {
  test.use({ colorScheme: "light" });

  test("switches theme, persists across reload without a flash, stays axe clean", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");

    await toggle(page).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
    await expectNoAxeViolations(page);

    // The init script must set the saved theme before first paint on reload.
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        (window as unknown as { __themeAtDcl: string | null }).__themeAtDcl =
          document.documentElement.getAttribute("data-theme");
      });
    });
    await page.reload();
    expect(
      await page.evaluate(() => (window as unknown as { __themeAtDcl: string }).__themeAtDcl),
    ).toBe("dark");
    expect(await theme(page)).toBe("dark");
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");

    await toggle(page).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expectNoAxeViolations(page);
  });
});
