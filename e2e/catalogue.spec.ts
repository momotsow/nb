import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Deterministic: relies on the seeded placeholder catalogue (prisma/seed-data.ts) and the stub
// availability fixtures (alpha-2 LOW_STOCK, bravo-1 OUT_OF_STOCK, ...). Run `npm run db:seed` first.
// Must match the second webServer in playwright.config.ts.
const FAIL_CLOSED_URL = "http://127.0.0.1:3101";

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
}

test.describe("catalogue journey (stub availability)", () => {
  test("shop → collection → product → search", async ({ page }) => {
    // Shop lists seeded products.
    await page.goto("/shop");
    await expect(page.getByRole("heading", { level: 1, name: "Shop" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sample Candle" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sample Diffuser" })).toBeVisible();
    // Fixture: bravo-1 is out of stock, so the listing says so.
    await expect(page.getByText("Out of stock").first()).toBeVisible();
    await expectNoAxeViolations(page);

    // Collection page.
    const response = await page.goto("/collections/seed-sample-collection");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "Sample Collection" })).toBeVisible();
    await page.getByRole("link", { name: "Sample Candle" }).click();

    // Product page with live stub availability (alpha defaults to the in-stock Small variant).
    await expect(page).toHaveURL(/\/products\/seed-sample-candle$/);
    await expect(page.getByRole("heading", { level: 1, name: "Sample Candle" })).toBeVisible();
    await expect(page.getByText("In stock").first()).toBeVisible();
    // (Next's route announcer is also role=alert, so match the banner text, not the role alone.)
    await expect(
      page.getByRole("alert").filter({ hasText: "Availability is temporarily unavailable" }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Add to cart" })).toBeVisible();
    await expectNoAxeViolations(page);

    // Search by a seeded name.
    await page.goto("/search");
    await page.getByRole("searchbox", { name: "Search products" }).fill("Diffuser");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/\/search\?q=Diffuser/);
    await expect(page.getByRole("link", { name: "Sample Diffuser" })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: /result/ })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("search with no matches shows the empty state", async ({ page }) => {
    await page.goto("/search?q=zzzznomatch");
    await expect(page.getByText("No results found")).toBeVisible();
  });

  test("unknown product renders the not-found page", async ({ page }) => {
    // The route streams behind loading.tsx, so the HTTP status is already committed as 200 by
    // the time notFound() runs; assert the rendered not-found content instead.
    await page.goto("/products/does-not-exist");
    await expect(page.getByText("We could not find that")).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse the shop" })).toBeVisible();
  });
});

test.describe("fail-closed availability", () => {
  test("product page shows the banner and keeps add-to-cart disabled", async ({ page }) => {
    await page.goto(`${FAIL_CLOSED_URL}/products/seed-sample-candle`);
    await expect(page.getByRole("heading", { level: 1, name: "Sample Candle" })).toBeVisible();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Availability is temporarily unavailable" })
        .first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Add to cart" })).toBeDisabled();
    await expect(page.getByText("In stock")).toHaveCount(0);
    await expectNoAxeViolations(page);
  });

  test("shop listing never shows stock it could not confirm", async ({ page }) => {
    await page.goto(`${FAIL_CLOSED_URL}/shop`);
    await expect(page.getByRole("link", { name: "Sample Candle" })).toBeVisible();
    await expect(page.getByText("Availability is temporarily unavailable").first()).toBeVisible();
    await expect(page.getByText("In stock")).toHaveCount(0);
    await expect(page.getByText("Low stock")).toHaveCount(0);
  });
});
