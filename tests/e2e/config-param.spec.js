import { test, expect } from "@playwright/test"
import {
  openApp, selectScheme, selectConcept, queryParams, LEFT, RIGHT,
} from "./support/app.js"
import { testConfig, MOCK_API } from "./fixtures/config.js"
import { leftScheme, leftScience, leftArts } from "./fixtures/data.js"

/**
 * The `?config=` query parameter must survive every navigation.
 *
 * App.vue:515 reads it once at startup to decide which config to load, and
 * store/plugins.js re-adds it to the query on every route update. If that
 * second half breaks, the app keeps running but silently falls back to the
 * default configuration on the next navigation - which is exactly the kind of
 * regression the migration can introduce.
 */

const CUSTOM_CONFIG_URL = `${MOCK_API}/custom-config.json`

/** Serves an alternative config at a URL that `?config=` can point to. */
async function withCustomConfig(page) {
  await page.route(CUSTOM_CONFIG_URL, route => route.fulfill({
    status: 200,
    contentType: "application/json",
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ ...testConfig, title: "Cocoda Custom Config" }),
  }))
}

test("keeps ?config= when selecting a scheme", async ({ page }) => {
  await openApp(page)
  await withCustomConfig(page)
  await page.goto(`/?config=${encodeURIComponent(CUSTOM_CONFIG_URL)}`)

  await selectScheme(page, LEFT, "LEFT")

  const query = queryParams(page)
  expect(query.config).toBe(CUSTOM_CONFIG_URL)
  expect(query.fromScheme).toBe(leftScheme.uri)
})

test("keeps ?config= across a whole browsing session", async ({ page }) => {
  await openApp(page)
  await withCustomConfig(page)
  await page.goto(`/?config=${encodeURIComponent(CUSTOM_CONFIG_URL)}`)

  await selectScheme(page, LEFT, "LEFT")
  await selectConcept(page, LEFT, leftScience.uri)
  await selectScheme(page, RIGHT, "RIGHT")
  await selectConcept(page, LEFT, leftArts.uri)

  expect(queryParams(page).config).toBe(CUSTOM_CONFIG_URL)
})

test("actually loads the config the parameter points to", async ({ page }) => {
  await openApp(page)
  await withCustomConfig(page)

  await page.goto(`/?config=${encodeURIComponent(CUSTOM_CONFIG_URL)}`)

  await expect(page.locator(".navbar")).toContainText("Cocoda Custom Config")
})

test("does not add a config parameter when none was given", async ({ page }) => {
  await openApp(page)

  await selectScheme(page, LEFT, "LEFT")

  expect(queryParams(page)).not.toHaveProperty("config")
})
