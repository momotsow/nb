import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;
// Second server on the same build with the stub availability provider forced to fail, so the
// fail-closed banner path is deterministic. Only the "fail-closed" spec targets it.
const failPort = 3101;
const failClosedURL = `http://127.0.0.1:${failPort}`;

// Runs against the production build (what users get). Chromium only for the smoke suite.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `npm run build && npm run start -- --hostname 127.0.0.1 --port ${port}`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
    {
      // Starts after the first server (and so after the build) is ready.
      command: `npm run start -- --hostname 127.0.0.1 --port ${failPort}`,
      url: failClosedURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { AVAILABILITY_STUB_MODE: "fail" },
    },
  ],
});
