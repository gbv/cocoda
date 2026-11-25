import { test, expect } from "@playwright/test"
import { addMappingIdentifiers } from "jskos-tools"
import { openApp, selectScheme, LEFT, RIGHT } from "./support/app.js"
import { bigScheme, bigConcepts, rightScheme, rightKunst } from "./fixtures/data.js"

/**
 * Paging through mappings in the MappingBrowser.
 *
 * bootstrap-vue's b-pagination reported a page change through `change`;
 * bootstrap-vue-next's reports it through `page-click` and v-model. With the
 * old listeners left in place the pagination switched its own highlight but
 * nobody heard of it, so the list never moved past the first page.
 *
 * Twelve mappings at the default of five per page make three pages.
 */

const pagedMappings = bigConcepts.slice(0, 12).map((concept, i) => addMappingIdentifiers({
  uri: `http://example.org/mapping/paged/${i}`,
  type: ["http://www.w3.org/2004/02/skos/core#exactMatch"],
  fromScheme: { uri: bigScheme.uri },
  toScheme: { uri: rightScheme.uri },
  from: { memberSet: [{ uri: concept.uri, notation: concept.notation }] },
  to: { memberSet: [{ uri: rightKunst.uri, notation: rightKunst.notation }] },
}))

const mappingBrowser = page => page.locator("#mappingBrowser")
/** A row shows its notation more than once, hence `.first()` for visibility. */
const entry = (page, notation) => mappingBrowser(page).getByText(notation, { exact: true })
const pageButton = (page, label) => mappingBrowser(page)
  .locator(".mappingBrowser-pagination .page-link")
  .filter({ hasText: new RegExp(`^${label}$`) })

// Without a scheme on either side the MappingBrowser offers links instead of
// its tabs.
async function openSearch(page) {
  const mocks = await openApp(page, { mappings: pagedMappings })
  await selectScheme(page, LEFT, "LEFT")
  await selectScheme(page, RIGHT, "RIGHT")
  await mappingBrowser(page).locator(".jskos-vue-tabs-header-item", { hasText: "Search" }).click()
  await expect(entry(page, "B000").first()).toBeVisible()
  return mocks
}

test("the search starts on the first page", async ({ page }) => {
  await openSearch(page)

  await expect(entry(page, "B004").first()).toBeVisible()
  await expect(entry(page, "B005")).toHaveCount(0)
  await expect(pageButton(page, "3")).toBeVisible()
})

test("choosing a page loads and shows that page", async ({ page }) => {
  const { mappingRequests } = await openSearch(page)

  await pageButton(page, "2").click()

  await expect(entry(page, "B005").first()).toBeVisible()
  await expect(entry(page, "B009").first()).toBeVisible()
  await expect(entry(page, "B000")).toHaveCount(0)
  expect(mappingRequests.at(-1).searchParams.get("offset")).toBe("5")
})

test("the last page holds the remainder", async ({ page }) => {
  await openSearch(page)

  await pageButton(page, "3").click()

  await expect(entry(page, "B010").first()).toBeVisible()
  await expect(entry(page, "B011").first()).toBeVisible()
  await expect(entry(page, "B009")).toHaveCount(0)
})
