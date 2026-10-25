import { describe, it, expect, beforeEach, vi } from "vitest"

/**
 * Tests for `refreshRouter` in src/store/plugins.js.
 *
 * These guard the query parameter synchronization, which is the only thing
 * Cocoda uses the router for. Two behaviours are easy to break silently:
 *
 *  1. The `config` query parameter must survive every navigation.
 *  2. Navigation must `replace` while only the mapping changes, and `push`
 *     as soon as a selected scheme or concept changes.
 *
 * MIGRATION NOTE (vue-router 3 -> 4): `router.currentRoute` becomes a `Ref`.
 * When migrating, change `setCurrentRoute` below to write into
 * `router.currentRoute.value` instead of `router.currentRoute` - every
 * assertion in this file stays as it is. If the production code is not
 * migrated along with it, these tests fail instead of the bug reaching users.
 */

const router = {
  currentRoute: { query: {} },
  push: vi.fn(() => Promise.resolve()),
  replace: vi.fn(() => Promise.resolve()),
}

function setCurrentRoute(query) {
  // vue-router 4: router.currentRoute.value = { query }
  router.currentRoute = { query }
}

vi.mock("@/router.js", () => ({ default: router }))
// Pulls in the whole store singleton otherwise; only used by another plugin.
vi.mock("@/items", () => ({ compareItems: () => false }))

const { refreshRouter } = await import("@/store/plugins.js")

/** Minimal store double shaped like the parts refreshRouter actually reads. */
function makeStore({ schemes = {}, concepts = {}, mapping = {}, original = null, hasChanged = false } = {}) {
  return {
    state: {
      selected: {
        scheme: { true: schemes.left || null, false: schemes.right || null },
        concept: { true: concepts.left || null, false: concepts.right || null },
      },
      mapping: { mapping, original },
    },
    getters: { "mapping/hasChangedFromOriginal": hasChanged },
  }
}

/**
 * Query of whichever navigation happened. Tests about the *shape* of the query
 * use this; whether it was a push or a replace is asserted separately below.
 */
function lastQuery() {
  const call = router.push.mock.calls[0] || router.replace.mock.calls[0]
  if (!call) {
    throw new Error("expected refreshRouter to navigate, but neither push nor replace was called")
  }
  return call[0].query
}

const scheme = uri => ({ uri })
const mappingWithConcepts = () => ({
  from: { memberSet: [{ uri: "http://example.org/from" }] },
  to: { memberSet: [{ uri: "http://example.org/to" }] },
})

beforeEach(() => {
  router.push.mockClear()
  router.replace.mockClear()
  setCurrentRoute({})
})

describe("refreshRouter - query building", () => {
  it("writes selected schemes and concepts into the query", async () => {
    await refreshRouter(makeStore({
      schemes: { left: scheme("scheme:left"), right: scheme("scheme:right") },
      concepts: { left: scheme("concept:left"), right: scheme("concept:right") },
    }))

    expect(lastQuery()).toMatchObject({
      fromScheme: "scheme:left",
      toScheme: "scheme:right",
      from: "concept:left",
      to: "concept:right",
    })
  })

  it("omits sides that have nothing selected", async () => {
    await refreshRouter(makeStore({ schemes: { left: scheme("scheme:left") } }))

    expect(lastQuery()).toEqual({ fromScheme: "scheme:left" })
  })

  it("only serializes the mapping when it differs from the original", async () => {
    await refreshRouter(makeStore({ mapping: mappingWithConcepts(), hasChanged: true }))
    expect(lastQuery()).toHaveProperty("mapping")

    router.push.mockClear()
    router.replace.mockClear()
    await refreshRouter(makeStore({ mapping: mappingWithConcepts(), hasChanged: false }))
    expect(lastQuery()).not.toHaveProperty("mapping")
  })

  it("keeps the original mapping's URI when there is one", async () => {
    await refreshRouter(makeStore({
      mapping: mappingWithConcepts(),
      original: { uri: "mapping:original" },
    }))

    expect(lastQuery().mappingUri).toBe("mapping:original")
  })
})

describe("refreshRouter - the `config` parameter", () => {
  // This is the regression test for the vue-router 4 `Ref` change: reading
  // `router.currentRoute.query` instead of `router.currentRoute.value.query`
  // yields undefined, so `config` silently disappears from the URL.
  it("carries `config` over from the current route", async () => {
    setCurrentRoute({ config: "https://example.org/cocoda.json" })

    await refreshRouter(makeStore({ schemes: { left: scheme("scheme:left") } }))

    expect(lastQuery().config).toBe("https://example.org/cocoda.json")
  })

  it("survives a navigation that also changes the selection", async () => {
    setCurrentRoute({ config: "cfg", fromScheme: "scheme:old" })

    await refreshRouter(makeStore({ schemes: { left: scheme("scheme:new") } }))

    expect(router.push).toHaveBeenCalledTimes(1)
    expect(router.push.mock.calls[0][0].query).toMatchObject({
      config: "cfg",
      fromScheme: "scheme:new",
    })
  })

  it("does not invent a `config` key when the route has none", async () => {
    await refreshRouter(makeStore({ schemes: { left: scheme("scheme:left") } }))

    expect(lastQuery()).not.toHaveProperty("config")
  })
})

describe("refreshRouter - push vs. replace", () => {
  it("replaces when schemes and concepts are unchanged", async () => {
    setCurrentRoute({ fromScheme: "scheme:left" })

    await refreshRouter(makeStore({ schemes: { left: scheme("scheme:left") } }))

    expect(router.replace).toHaveBeenCalledTimes(1)
    expect(router.push).not.toHaveBeenCalled()
  })

  it("pushes when a scheme changes", async () => {
    setCurrentRoute({ fromScheme: "scheme:old" })

    await refreshRouter(makeStore({ schemes: { left: scheme("scheme:new") } }))

    expect(router.push).toHaveBeenCalledTimes(1)
    expect(router.replace).not.toHaveBeenCalled()
  })

  it("pushes when a concept changes", async () => {
    setCurrentRoute({ fromScheme: "scheme:left", from: "concept:old" })

    await refreshRouter(makeStore({
      schemes: { left: scheme("scheme:left") },
      concepts: { left: scheme("concept:new") },
    }))

    expect(router.push).toHaveBeenCalledTimes(1)
  })

  it("replaces when only the mapping changed", async () => {
    setCurrentRoute({ fromScheme: "scheme:left" })

    await refreshRouter(makeStore({
      schemes: { left: scheme("scheme:left") },
      mapping: mappingWithConcepts(),
      hasChanged: true,
    }))

    expect(router.replace).toHaveBeenCalledTimes(1)
    expect(router.push).not.toHaveBeenCalled()
  })
})
