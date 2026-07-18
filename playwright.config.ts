import { defineConfig, devices } from "@playwright/test";

// E2E smoke tests run against the Vite dev server on :5174.
// CF_PAGES=1 keeps the @cloudflare/vite-plugin (workerd) out of the dev
// server — the /api/* Cloudflare functions are stubbed in e2e/fixtures.ts.
// The speed-katakana codegen runs first because public/json/katakana/* is
// gitignored generated output.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : [["list"]],
  use: {
    baseURL: "http://localhost:5174",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "node scripts/generate-speed-katakana.mjs && pnpm exec vite --port 5174",
    url: "http://localhost:5174",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { CF_PAGES: "1" },
  },
});
