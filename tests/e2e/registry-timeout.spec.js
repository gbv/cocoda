import { test, expect } from "@playwright/test"
import { openApp } from "./support/app.js"
import { registries } from "./fixtures/config.js"

/**
 * `registryTimeout` in the Cocoda config.
 *
 * Every registry is initialized from its status endpoint while the
 * application starts, and cocoda-sdk waits 200,000 ms per registry before
 * giving up. One unreachable registry therefore holds up the start for that
 * long - which is what a down backend looked like in practice.
 *
 * cocoda-sdk reads a `timeout` from each registry, but a registry that comes
 * from cocoda.default.json cannot be amended that way: a user entry with the
 * same URI replaces the definition rather than extending it, so shortening
 * one registry's timeout would mean copying its whole entry.
 * `registryTimeout` is the one knob that covers them all.
 */

/** The timeout each provider's axios instance ended up with. */
const timeouts = page => page.evaluate(() => {
  let store = null
  for (const element of document.querySelectorAll("*")) {
    const instance = element.__vueParentComponent?.proxy
    if (instance?.$store) {
      store = instance.$store
      break
    }
  }
  return Object.fromEntries(store.state.config.registries
    .map(registry => [registry.notation?.[0], registry.axios?.defaults?.timeout]))
})

test("without the option the sdk default applies", async ({ page }) => {
  await openApp(page, { config: { overrideRegistries: true, registries } })

  expect(await timeouts(page)).toEqual({ T: 200000, L: 200000, M: 200000 })
})

test("registryTimeout bounds every registry", async ({ page }) => {
  await openApp(page, { config: { overrideRegistries: true, registryTimeout: 4000, registries } })

  expect(await timeouts(page)).toEqual({ T: 4000, L: 4000, M: 4000 })
})

test("a registry keeps a timeout of its own", async ({ page }) => {
  const withOwnTimeout = registries.map(registry =>
    registry.notation?.[0] === "T" ? { ...registry, timeout: 1500 } : registry)

  await openApp(page, {
    config: { overrideRegistries: true, registryTimeout: 4000, registries: withOwnTimeout },
  })

  expect(await timeouts(page)).toEqual({ T: 1500, L: 4000, M: 4000 })
})
