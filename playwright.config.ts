import { defineConfig, devices } from "@playwright/test";

// Browser tests run against the GitHub Pages export, so they also cover the
// base path and the static fallback pages. Build it first: `pnpm build:pages`.
const port = 4173;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width: 1280, height: 800 },
    timezoneId: "Asia/Singapore",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/serve-pages.mjs",
    port,
    env: { PORT: String(port) },
    reuseExistingServer: !process.env.CI,
  },
});
