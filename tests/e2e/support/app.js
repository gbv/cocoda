import { expect } from "@playwright/test"
import { installMocks } from "./mock-api.js"

/**
 * Page-object style helpers for driving Cocoda's two-column layout.
 *
 * Selectors deliberately use structural ids and classes that exist for the
 * app's own layout logic (`#browserComponent_true`, `.conceptListItem`,
 * `[data-uri]`) rather than text, so the specs keep working across the
 * Vue 2 -> Vue 3 migration and across translations.
 */

/** Left side is `true`, right side is `false` - the app's own convention. */
export const LEFT = true
export const RIGHT = false

export function column(page, isLeft) {
  return page.locator(`#browserComponent_${isLeft}`)
}

export function conceptList(page, isLeft) {
  return page.locator(`#conceptListComponent_${isLeft}`)
}

export function itemDetail(page, isLeft) {
  return page.locator(`#itemDetailComponent_${isLeft}`)
}

/**
 * Boots the app with every backend mocked and waits until it is interactive.
 *
 * Waits for the scheme selection component rather than for the scheme *list*:
 * when a scheme is preselected (deep link), the selection collapses and the
 * list is not rendered at all.
 */
export async function openApp(page, { path = "/", config } = {}) {
  const mocks = await installMocks(page, config ? { config } : {})
  await page.goto(path)
  await expect(page.locator("#app")).toBeVisible()
  await expect(column(page, LEFT).locator(".conceptSchemeSelection")).toBeVisible()
  return mocks
}

/**
 * The scheme rows that actually hold an item; the list's footer shares the
 * same class (ConceptSchemeSelection.vue), so filter by content.
 */
export function schemeItems(page, isLeft) {
  return column(page, isLeft).locator(".conceptSchemeSelection-schemeList-item .itemName")
}

/**
 * ItemName only turns into a router-link once it has been hovered - the flag
 * is computed in its mouseover handler (ItemName.vue:214). Clicking without
 * hovering first therefore hits an inert div.
 */
async function clickItemName(itemName) {
  await itemName.hover()
  await itemName.locator(".itemName-inner").click()
}

/** Picks a concept scheme by its notation, e.g. "LEFT". */
export async function selectScheme(page, isLeft, notation) {
  const item = schemeItems(page, isLeft).filter({ hasText: notation }).first()
  await expect(item).toBeVisible()
  await clickItemName(item)
  await expect(conceptList(page, isLeft)).toBeVisible()
}

/**
 * A single row in a concept list, addressed by concept URI.
 *
 * `:visible` filters out the copy the virtual scroller keeps hidden while it
 * measures a row's height.
 */
export function conceptListItem(page, isLeft, uri) {
  return conceptList(page, isLeft).locator(`.conceptListItem[data-uri="${uri}"]:visible`)
}

/** Clicks a concept in the list and waits for the selection to reach the URL. */
export async function selectConcept(page, isLeft, uri) {
  const item = conceptListItem(page, isLeft, uri)
  await expect(item).toBeVisible()
  await clickItemName(item.locator(".itemName").first())
  await expect.poll(() => queryParams(page)[isLeft ? "from" : "to"]).toBe(uri)
}

/** Query parameters of the current page URL. */
export function queryParams(page) {
  return Object.fromEntries(new URL(page.url()).searchParams.entries())
}
