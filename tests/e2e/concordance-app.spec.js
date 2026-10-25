import { test, expect } from "@playwright/test"
import { installMocks } from "./support/mock-api.js"
import { concordance } from "./fixtures/data.js"

/**
 * Cocoda mounts two separate apps (src/entry/app.js and
 * src/entry/concordanceApp.js) that today share one global Vue singleton. In
 * Vue 3 plugins, global components, mixins and globalProperties are bound to a
 * single app instance, so main.js has to become an `installCocoda(app)` that
 * *both* entry points call.
 *
 * If that restructuring is done for only one of them, this page is what breaks
 * - silently, because nobody looks at it as often as the main app.
 */

async function openConcordanceApp(page) {
  const mocks = await installMocks(page)
  const errors = []
  page.on("pageerror", error => errors.push(String(error)))
  await page.goto("/concordances.html")
  return { ...mocks, errors }
}

test("the concordance app mounts", async ({ page }) => {
  const { errors } = await openConcordanceApp(page)

  await expect(page.locator("#concordanceApp")).toBeVisible()
  expect(errors).toEqual([])
})

test("it registers the globally provided components", async ({ page }) => {
  await openConcordanceApp(page)
  await expect(page.locator("#concordanceApp")).toBeVisible()

  // FontAwesomeIcon is registered globally in main.js; if the second entry
  // point misses the shared installation, no icon renders at all.
  await expect(page.locator("#concordanceApp [data-icon]").first()).toBeVisible()
})

test("it lists the concordances from the mocked registry", async ({ page }) => {
  await openConcordanceApp(page)

  const app = page.locator("#concordanceApp")
  // The table renders source/target scheme, description and creator per row.
  await expect(app).toContainText(concordance.creator[0].prefLabel.en)
  await expect(app).toContainText("1 Concordances")
})

test("it talks to mocked backends only", async ({ page }) => {
  const { unexpected } = await openConcordanceApp(page)
  await expect(page.locator("#concordanceApp")).toBeVisible()

  expect(unexpected).toEqual([])
})
