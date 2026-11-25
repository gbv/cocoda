import { test, expect } from "@playwright/test"
import { openApp } from "./support/app.js"

/**
 * The alerts in the top corner (store/modules/alerts.js).
 *
 * bootstrap-vue took an alert's countdown in seconds through `show`;
 * bootstrap-vue-next takes it in milliseconds through `v-model`. Passing the
 * seconds on to `show` left every alert with a countdown on screen for good,
 * and since such alerts get no close button, nothing could remove them.
 *
 * Alerts are raised through the store, as the app's own `alert()` helper
 * does: what triggers one in the UI differs from case to case, the way an
 * alert behaves does not.
 */

/** Commits `alerts/add`; a `buttonText` gets a handler that hides the alert. */
const addAlert = (page, alert) => page.evaluate(alert => {
  for (const element of document.querySelectorAll("*")) {
    const store = element.__vueParentComponent?.proxy?.$store
    if (store) {
      if (alert.buttonText) {
        alert.buttonHandler = alert => store.commit({ type: "alerts/hide", alert })
      }
      store.commit({ type: "alerts/add", ...alert })
      return
    }
  }
  throw new Error("store not found")
}, alert)

const alertWith = (page, text) => page.locator(".alertsContainer .alert", { hasText: text })

test("an alert with a countdown hides itself", async ({ page }) => {
  await openApp(page)
  await addAlert(page, { text: "Counting down", countdown: 1 })

  const alert = alertWith(page, "Counting down")
  await expect(alert).toBeVisible()
  await expect(alert.locator(".btn-close")).toHaveCount(0)
  await expect(alert).toBeHidden({ timeout: 3000 })
})

test("an alert without a countdown stays until it is closed", async ({ page }) => {
  await openApp(page)
  await addAlert(page, { text: "Staying", countdown: 0 })

  const alert = alertWith(page, "Staying")
  await page.waitForTimeout(1500)
  await expect(alert).toBeVisible()

  await alert.locator(".btn-close").click()
  await expect(alert).toBeHidden()
})

test("an alert's button can hide it", async ({ page }) => {
  await openApp(page)
  await addAlert(page, { text: "Undoable", countdown: 0, buttonText: "Undo" })

  const alert = alertWith(page, "Undoable")
  await alert.getByRole("link", { name: "Undo" }).click()
  await expect(alert).toBeHidden()
})
