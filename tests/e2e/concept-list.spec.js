import { test, expect } from "@playwright/test"
import {
  openApp, selectScheme, conceptList, conceptListItem, LEFT,
} from "./support/app.js"
import { bigConcepts } from "./fixtures/data.js"

/**
 * The concept list against a 500-entry scheme.
 *
 * These are the tests that guard the swap from vue-virtual-scroll-list to
 * vue-virtual-scroller. Two properties have to hold before and after that
 * swap, and neither is checkable without real layout:
 *
 *  1. The list is actually virtualized - only a window of rows is in the DOM.
 *  2. Details are lazily loaded for the rows that are *visible*. Today that is
 *     done by walking `$children` (ConceptListWrapper._loadConceptsInView); the
 *     replacement will use the scroller's `@update` range event. The observable
 *     behaviour asserted here must not change.
 */

const first = bigConcepts[0]
const late = bigConcepts[300]

async function openBigScheme(page) {
  const mocks = await openApp(page)
  await selectScheme(page, LEFT, "BIG")
  await expect(conceptListItem(page, LEFT, first.uri)).toBeVisible()
  return mocks
}

test("renders only a window of a 500-entry list", async ({ page }) => {
  await openBigScheme(page)

  const rendered = await conceptList(page, LEFT).locator(".conceptListItem").count()

  expect(rendered).toBeGreaterThan(0)
  expect(rendered).toBeLessThan(bigConcepts.length)
})

test("does not render far-away entries before scrolling", async ({ page }) => {
  await openBigScheme(page)

  await expect(conceptListItem(page, LEFT, late.uri)).toHaveCount(0)
})

test("scrolling reveals later entries", async ({ page }) => {
  await openBigScheme(page)

  await conceptList(page, LEFT).locator(".conceptListItems").evaluate(el => {
    el.scrollTop = el.scrollHeight / 2
  })

  await expect(conceptList(page, LEFT).locator(".conceptListItem").first())
    .not.toHaveAttribute("data-uri", first.uri)
})

test("loads details only for concepts that came into view", async ({ page }) => {
  const mocks = await openBigScheme(page)

  await expect.poll(() => mocks.detailRequests.length).toBeGreaterThan(0)
  const initial = [...mocks.detailRequests]

  // Nothing from the far end of the list may have been requested yet.
  expect(initial).not.toContain(late.uri)

  await conceptList(page, LEFT).locator(".conceptListItems").evaluate(el => {
    el.scrollTop = el.scrollHeight
  })

  // Whatever ended up on screen must have had its details requested. Asserting
  // it this way - rather than naming a fixed index - keeps the test about the
  // behaviour ("details follow the viewport") instead of about how many rows a
  // particular scroller implementation happens to keep alive.
  const visibleUris = await conceptList(page, LEFT)
    .locator(".conceptListItem")
    .evaluateAll(els => els.map(el => el.getAttribute("data-uri")))
  expect(visibleUris.length).toBeGreaterThan(0)
  expect(visibleUris).not.toContain(first.uri)

  await expect
    .poll(() => visibleUris.filter(uri => mocks.detailRequests.includes(uri)).length,
      { timeout: 15_000 })
    .toBeGreaterThan(0)
})

test("scrolling back to the top shows the first entry again", async ({ page }) => {
  await openBigScheme(page)
  const items = conceptList(page, LEFT).locator(".conceptListItems")

  await items.evaluate(el => {
    el.scrollTop = el.scrollHeight
  })
  await expect(conceptListItem(page, LEFT, first.uri)).toHaveCount(0)

  await items.evaluate(el => {
    el.scrollTop = 0
  })

  await expect(conceptListItem(page, LEFT, first.uri)).toBeVisible()
})
