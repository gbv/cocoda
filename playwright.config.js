import { defineConfig, devices } from "@playwright/test"

// Overridable because the default port is a popular one: if some other dev
// server happens to hold it, `reuseExistingServer` below would silently point
// the whole suite at that application instead.
const PORT = Number(process.env.COCODA_E2E_PORT ?? 8080)
const baseURL = `http://localhost:${PORT}`

/**
 * End-to-end tests run entirely against mocked backends (see
 * tests/e2e/support/mock-api.js): no coli-conc systems, no credentials.
 *
 * These specs are framework-agnostic on purpose - they drive the app through
 * the browser, so they stay untouched across the Vue 2 -> Vue 3 migration and
 * cover what jsdom cannot: layout geometry, scrolling and popovers.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.js",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "list" : [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
