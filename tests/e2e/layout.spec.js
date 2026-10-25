import { test, expect } from "@playwright/test"
import { openApp, selectScheme, LEFT, RIGHT } from "./support/app.js"

/**
 * Minimizing panes and dragging the resizing sliders.
 *
 * This is the part of the suite that jsdom could not replace. MiniMizer and
 * ResizingSlider work purely on layout geometry - they walk the DOM for the
 * enclosing `.mainComponent`, write inline flex/min-width styles, and read
 * `dataset.minimized` off each other. In jsdom every one of those
 * measurements is 0.
 *
 * The assertions deliberately check the *observable* result - actual rendered
 * widths and the `data-minimized` marker - rather than the inline styles, so
 * they survive the planned rewrite from `__vue__` lookups to a provide/inject
 * registry.
 */

const column = (page, isLeft) => page.locator(`#browserComponent_${isLeft}`)

async function widthOf(locator) {
  const box = await locator.boundingBox()
  return box?.width ?? 0
}

/**
 * The minimize button is hidden until its `.mainComponent` is hovered
 * (src/style/main.less:21-24), so hovering is part of the interaction, not a
 * workaround.
 */
async function minimize(pane) {
  await pane.hover()
  await pane.locator("> .minimizer > .minimizeButton").click()
  await expect(pane).toHaveAttribute("data-minimized", "1")
}

async function maximize(pane) {
  await pane.locator("> .minimizer > .minimizedOverlay").click()
  await expect(pane).not.toHaveAttribute("data-minimized", "1")
}

async function setUp(page) {
  await openApp(page)
  await selectScheme(page, LEFT, "LEFT")
  await selectScheme(page, RIGHT, "RIGHT")
}

test("minimizing a column shrinks it and marks it as minimized", async ({ page }) => {
  await setUp(page)
  const left = column(page, LEFT)
  const before = await widthOf(left)
  expect(before).toBeGreaterThan(100)

  await minimize(left)

  await expect.poll(() => widthOf(left)).toBeLessThan(100)
})

test("maximizing restores the previous width", async ({ page }) => {
  await setUp(page)
  const left = column(page, LEFT)
  const before = await widthOf(left)

  await minimize(left)
  await maximize(left)

  await expect.poll(() => widthOf(left)).toBeGreaterThan(before / 2)
})

test("minimizing one column gives the other more room", async ({ page }) => {
  await setUp(page)
  const left = column(page, LEFT)
  const right = column(page, RIGHT)
  const rightBefore = await widthOf(right)

  await minimize(left)

  await expect.poll(() => widthOf(right)).toBeGreaterThan(rightBefore)
})

test("the minimized state is remembered across a reload", async ({ page }) => {
  await setUp(page)
  const left = column(page, LEFT)

  await minimize(left)

  await page.reload()

  await expect(column(page, LEFT)).toHaveAttribute("data-minimized", "1")
})

test("the mapping editor and browser can be minimized independently", async ({ page }) => {
  await setUp(page)

  for (const id of ["#mappingEditorComponent", "#mappingBrowserComponent"]) {
    await minimize(page.locator(id))
  }
})

test("dragging the column slider resizes both neighbours", async ({ page }) => {
  await setUp(page)
  const left = column(page, LEFT)
  const mappingTool = page.locator("#mappingTool")
  const leftBefore = await widthOf(left)
  const toolBefore = await widthOf(mappingTool)

  // Drag the slider between the left column and the mapping tool (App.vue
  // orders the row as column/slider/tool/slider/column). It is dragged to the
  // right on purpose: the columns start at their CSS min-width, so there is
  // only room to grow, not to shrink.
  const slider = page.locator(".resizingSliderCol").first()
  const box = await slider.boundingBox()
  expect(box).not.toBeNull()

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 15 })
  await page.mouse.up()

  await expect.poll(() => widthOf(left)).toBeGreaterThan(leftBefore + 50)
  await expect.poll(() => widthOf(mappingTool)).toBeLessThan(toolBefore - 50)
})
