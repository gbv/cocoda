import { test, expect } from "@playwright/test"
import { addMappingIdentifiers } from "jskos-tools"
import { openApp, selectScheme, LEFT, RIGHT } from "./support/app.js"
import { bigScheme, bigConcepts, rightScheme, rightKunst } from "./fixtures/data.js"

/**
 * A tooltip that outlived the pointer which opened it.
 *
 * Passing quickly over an element with a hover tooltip delivers pointerenter
 * and pointerleave within one frame. bootstrap-vue-next up to 1.2 scheduled
 * the show in a requestAnimationFrame, so the hide triggered by pointerleave
 * found nothing to cancel yet, and the tooltip appeared afterwards - for the
 * rest of the session, since no further pointerleave would come. Moving the
 * mouse across the mapping table left two or three of them on screen.
 *
 * Cocoda carried a patch against bootstrap-vue-next for this until 1.3.0
 * made a hide abort a show that is still pending. This test fails with 1.1.0
 * unpatched and guards against the race coming back.
 */

const mappings = bigConcepts.slice(0, 3).map((concept, i) => addMappingIdentifiers({
  uri: `http://example.org/mapping/tooltip/${i}`,
  type: ["http://www.w3.org/2004/02/skos/core#exactMatch"],
  fromScheme: { uri: bigScheme.uri },
  toScheme: { uri: rightScheme.uri },
  from: { memberSet: [{ uri: concept.uri, notation: concept.notation }] },
  to: { memberSet: [{ uri: rightKunst.uri, notation: rightKunst.notation }] },
}))

/** Texts of all tooltips and popovers currently on screen. */
function visibleTooltips(page) {
  return page.evaluate(() => [...document.querySelectorAll(".tooltip, .popover")]
    .filter(el => getComputedStyle(el).display !== "none" && el.getBoundingClientRect().width > 0)
    .map(el => el.innerText.replace(/\s+/g, " ").trim()))
}

test("a quick pass over an element leaves no tooltip behind", async ({ page }) => {
  await openApp(page, { mappings })
  await selectScheme(page, LEFT, "LEFT")
  await selectScheme(page, RIGHT, "RIGHT")
  const browser = page.locator("#mappingBrowser")
  await browser.locator(".jskos-vue-tabs-header-item", { hasText: "Search" }).click()

  // The toolbar icons only show on a hovered row.
  const row = browser.locator(".flexibleTable-row").filter({ hasText: "B001" }).first()
  await row.hover()
  const icon = row.locator(".mappingBrowser-toolbar-button [data-icon]").last()
  await expect(icon).toBeVisible()

  // Park the pointer elsewhere, then pass over the icon within one frame.
  // Playwright's own mouse steps are too slow for that, hence the events.
  await page.mouse.move(20, 400, { steps: 6 })
  await page.waitForTimeout(300)
  await icon.evaluate(element => {
    element.dispatchEvent(new PointerEvent("pointerenter", { bubbles: false }))
    element.dispatchEvent(new PointerEvent("pointerleave", { bubbles: false }))
  })

  // Longer than any tooltip delay in Cocoda, so a late show would be visible.
  await page.waitForTimeout(1500)
  expect(await visibleTooltips(page)).toEqual([])
})
