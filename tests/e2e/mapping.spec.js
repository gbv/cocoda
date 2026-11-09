import { test, expect } from "@playwright/test"
import {
  openApp, selectScheme, conceptList, conceptListItem, queryParams, LEFT, RIGHT,
} from "./support/app.js"
import { leftScience, rightNature } from "./fixtures/data.js"

/**
 * Building a mapping from both sides and saving it.
 *
 * Saving goes to the LocalMappings registry, which keeps mappings in the
 * browser via localforage - no account and no remote system involved.
 *
 * Toolbar buttons are addressed through their FontAwesome icon names, which
 * come from the component source and therefore survive both translation and
 * the migration; the toolbar items themselves have no stable ids.
 */

const editor = page => page.locator("#mappingEditor")
const toolbarButton = (page, icon) => editor(page).locator(`[data-icon="${icon}"]`)

async function addToMapping(page, isLeft, uri) {
  const item = conceptListItem(page, isLeft, uri)
  await expect(item).toBeVisible()
  await item.hover()
  await item.locator(".addToMapping").click()
}

async function openBothSides(page) {
  await openApp(page)
  await selectScheme(page, LEFT, "LEFT")
  await selectScheme(page, RIGHT, "RIGHT")
}

test("adding concepts from both sides fills the mapping editor", async ({ page }) => {
  await openBothSides(page)

  await addToMapping(page, LEFT, leftScience.uri)
  await addToMapping(page, RIGHT, rightNature.uri)

  await expect(editor(page)).toContainText("Science")
  await expect(editor(page)).toContainText("Natural sciences")
})

test("the mapping is reflected in the URL query", async ({ page }) => {
  await openBothSides(page)

  await addToMapping(page, LEFT, leftScience.uri)
  await addToMapping(page, RIGHT, rightNature.uri)

  // store/plugins.js serializes the unsaved mapping into ?mapping= as JSON.
  await expect.poll(() => queryParams(page).mapping).toBeTruthy()
  const mapping = JSON.parse(queryParams(page).mapping)
  expect(JSON.stringify(mapping)).toContain(leftScience.uri)
  expect(JSON.stringify(mapping)).toContain(rightNature.uri)
})

test("saving empties the editor and clears the unsaved marker", async ({ page }) => {
  await openBothSides(page)
  await addToMapping(page, LEFT, leftScience.uri)
  await addToMapping(page, RIGHT, rightNature.uri)
  await expect(editor(page)).toContainText("not saved")

  await toolbarButton(page, "floppy-disk").click()

  // The editor resets once the mapping has gone to the registry.
  await expect(editor(page)).not.toContainText("not saved")
  await expect(editor(page)).not.toContainText("Science")
})

/**
 * Reads what the LocalMappings provider stored.
 *
 * cocoda-sdk keeps local mappings in localforage under
 * `cocoda-mappings--<path>` (local-mappings-provider.js:23), which is IndexedDB
 * in Chromium. Going to storage instead of through the mapping browser makes
 * this deterministic: the browser's search only picks a freshly saved mapping
 * up after a reload, and its readiness after that reload is not observable
 * from the outside, which made the UI route unreliable.
 *
 * localforage is not framework code, so this stays valid across the migration.
 */
function readStoredMappings(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const open = indexedDB.open("localforage")
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const db = open.result
      if (!db.objectStoreNames.contains("keyvaluepairs")) {
        resolve([])
        return
      }
      const request = db
        .transaction("keyvaluepairs", "readonly")
        .objectStore("keyvaluepairs")
        .get(`cocoda-mappings--${window.location.pathname}`)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    }
  }))
}

test("saving persists the mapping, and it is still stored after a reload", async ({ page }) => {
  await openBothSides(page)
  await addToMapping(page, LEFT, leftScience.uri)
  await addToMapping(page, RIGHT, rightNature.uri)

  await toolbarButton(page, "floppy-disk").click()

  // The editor clears as soon as the save is dispatched; the write itself is
  // asynchronous, so poll until it has landed.
  await expect.poll(async () => (await readStoredMappings(page)).length,
    { timeout: 15_000 }).toBe(1)

  const [stored] = await readStoredMappings(page)
  expect(JSON.stringify(stored.from)).toContain(leftScience.uri)
  expect(JSON.stringify(stored.to)).toContain(rightNature.uri)

  await page.reload()
  await expect(conceptList(page, LEFT)).toBeVisible()

  const afterReload = await readStoredMappings(page)
  expect(afterReload).toHaveLength(1)
  expect(JSON.stringify(afterReload[0].from)).toContain(leftScience.uri)
})

test("clearing the mapping empties the editor", async ({ page }) => {
  await openBothSides(page)
  await addToMapping(page, LEFT, leftScience.uri)
  await expect(editor(page)).toContainText("Science")

  await toolbarButton(page, "ban").click()

  await expect(editor(page)).not.toContainText("Science")
})

test("swapping sides exchanges the mapped concepts", async ({ page }) => {
  await openBothSides(page)
  await addToMapping(page, LEFT, leftScience.uri)
  await addToMapping(page, RIGHT, rightNature.uri)

  await toolbarButton(page, "right-left").click()

  // Both concepts are still part of the mapping, just on the other side.
  await expect(editor(page)).toContainText("Science")
  await expect(editor(page)).toContainText("Natural sciences")
})
