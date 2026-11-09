import { test, expect } from "@playwright/test"
import { openApp } from "./support/app.js"

/**
 * The settings dialog, language switching and tabs.
 *
 * Three migration targets meet here:
 *  - the dialog is a `<b-modal>`, whose control API changes with
 *    bootstrap-vue-next.
 *  - the tab strip comes from cocoda-vue-tabs, to be replaced by
 *    jskos-vue-tabs - including a CSS class rename, which is why
 *    the tab selector below is centralized in one constant.
 *  - the language dropdown is bound with `v-model="$i18n.locale"`
 *    (TheSettings.vue:155), the one place that writes the locale directly and
 *    therefore requires vue-i18n's legacy mode.
 */

const MODAL = "#settingsModal"
// cocoda-vue-tabs today, jskos-vue-tabs after migration (classes are renamed).
const TAB_HEADER = "[class*='-vue-tabs-header-item']"

async function openSettings(page) {
  await openApp(page)
  await page.locator("#settingsDropdown [data-icon='gear']").click()
  await expect(page.locator(MODAL)).toBeVisible()
}

test("the settings dialog opens", async ({ page }) => {
  await openSettings(page)

  await expect(page.locator(MODAL)).toContainText("Settings")
})

test("the dialog has one header per settings tab", async ({ page }) => {
  await openSettings(page)

  const tabs = page.locator(`${MODAL} ${TAB_HEADER}`)
  await expect(tabs.first()).toBeVisible()
  await expect(tabs.filter({ hasText: "Data Sources" })).toBeVisible()
  await expect(tabs.filter({ hasText: "User Interface" })).toBeVisible()
})

test("switching tabs changes the visible panel", async ({ page }) => {
  await openSettings(page)

  await page.locator(`${MODAL} ${TAB_HEADER}`).filter({ hasText: "Shortcuts" }).click()

  await expect(page.locator(MODAL)).toContainText("Shortcuts")
  await expect(page.locator(MODAL)).not.toContainText("Data Sources are")
})

test("switching the language translates the interface", async ({ page }) => {
  await openSettings(page)
  await page.locator(`${MODAL} ${TAB_HEADER}`).filter({ hasText: "User Interface" }).click()

  await page.locator(`${MODAL} select`).first().selectOption("de")

  await expect(page.locator(MODAL)).toContainText("Einstellungen")
  await expect(page.locator(`${MODAL} ${TAB_HEADER}`).filter({ hasText: "Oberfläche" })).toBeVisible()
})

test("the chosen language survives a reload", async ({ page }) => {
  await openSettings(page)
  await page.locator(`${MODAL} ${TAB_HEADER}`).filter({ hasText: "User Interface" }).click()
  await page.locator(`${MODAL} select`).first().selectOption("de")
  await expect(page.locator(MODAL)).toContainText("Einstellungen")

  await page.reload()
  await page.locator("#settingsDropdown [data-icon='gear']").click()

  await expect(page.locator(MODAL)).toContainText("Einstellungen")
})

test("the dialog can be closed again", async ({ page }) => {
  await openSettings(page)

  await page.locator(`${MODAL} .close, ${MODAL} .btn-close`).first().click()

  await expect(page.locator(MODAL)).not.toBeVisible()
})
