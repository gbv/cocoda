import { test, expect } from "@playwright/test"
import {
  openApp, selectScheme, selectConcept, conceptList, conceptListItem,
  itemDetail, queryParams, schemeItems, LEFT, RIGHT,
} from "./support/app.js"
import {
  leftScheme, rightScheme, leftScience, leftArts, leftPhysics, rightNature,
} from "./fixtures/data.js"

/**
 * Choosing schemes and concepts on both sides, and the URL query staying in
 * sync with the selection.
 *
 * The query assertions matter for the migration: the router is the only thing
 * Cocoda uses vue-router for, and store/plugins.js drives it from outside any
 * component.
 */

test("lists the configured schemes on both sides", async ({ page }) => {
  await openApp(page)

  for (const isLeft of [LEFT, RIGHT]) {
    const items = schemeItems(page, isLeft)
    await expect(items).toHaveCount(3)
    await expect(items.filter({ hasText: "LEFT" })).toBeVisible()
    await expect(items.filter({ hasText: "RIGHT" })).toBeVisible()
  }
})

test("selecting a scheme opens its concept list and updates the query", async ({ page }) => {
  await openApp(page)

  await selectScheme(page, LEFT, "LEFT")

  await expect(conceptListItem(page, LEFT, leftScience.uri)).toBeVisible()
  await expect(conceptListItem(page, LEFT, leftArts.uri)).toBeVisible()
  expect(queryParams(page).fromScheme).toBe(leftScheme.uri)
})

test("both sides can hold different schemes independently", async ({ page }) => {
  await openApp(page)

  await selectScheme(page, LEFT, "LEFT")
  await selectScheme(page, RIGHT, "RIGHT")

  await expect(conceptListItem(page, LEFT, leftScience.uri)).toBeVisible()
  await expect(conceptListItem(page, RIGHT, rightNature.uri)).toBeVisible()

  const query = queryParams(page)
  expect(query.fromScheme).toBe(leftScheme.uri)
  expect(query.toScheme).toBe(rightScheme.uri)
})

test("selecting a concept shows its details and updates the query", async ({ page }) => {
  await openApp(page)
  await selectScheme(page, LEFT, "LEFT")

  await selectConcept(page, LEFT, leftScience.uri)

  await expect(itemDetail(page, LEFT)).toContainText("Science")
  expect(queryParams(page).from).toBe(leftScience.uri)
})

test("expanding a concept loads and shows its children", async ({ page }) => {
  await openApp(page)
  await selectScheme(page, LEFT, "LEFT")

  await expect(conceptListItem(page, LEFT, leftPhysics.uri)).toHaveCount(0)
  await conceptListItem(page, LEFT, leftScience.uri).locator(".arrowBox").click()

  await expect(conceptListItem(page, LEFT, leftPhysics.uri)).toBeVisible()
})

test("a deep link restores scheme and concept", async ({ page }) => {
  const url = "/?fromScheme=" + encodeURIComponent(leftScheme.uri)
    + "&from=" + encodeURIComponent(leftScience.uri)

  await openApp(page, { path: url })

  await expect(itemDetail(page, LEFT)).toContainText("Science")
  await expect(conceptList(page, LEFT)).toBeVisible()
})
