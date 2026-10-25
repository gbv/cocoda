import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  saveItem,
  getItemByUri,
  removeItemByUri,
  loadConcepts,
  loadingConcepts,
  erroredConcepts,
} from "@/items"

/**
 * Tests for the bookkeeping of `loadingConcepts` / `erroredConcepts`.
 *
 * MIGRATION NOTE (Vue 2 -> Vue 3): these arrays are currently pruned with
 * `del(loadingConcepts.value, index)`. `Vue.delete` on an array splices; the
 * naive Vue 3 replacement `delete arr[i]` would leave a hole (`empty`) and keep
 * the length unchanged, so entries would look "still loading" forever and
 * `v-for` would render undefined items.
 *
 * The assertions below therefore check length and absence of holes, not just
 * "does not contain X" - a hole would pass the weaker check.
 */

const uriA = "http://example.org/loading/a"
const uriB = "http://example.org/loading/b"

/** Fails if the array has holes, which is exactly what `delete arr[i]` leaves. */
function expectNoHoles(array) {
  expect(Object.keys(array).length).toBe(array.length)
  for (let i = 0; i < array.length; i += 1) {
    expect(Object.prototype.hasOwnProperty.call(array, i)).toBe(true)
    expect(array[i]).not.toBeUndefined()
  }
}

function makeRegistry(impl) {
  return { _defaultParams: {}, getConcepts: vi.fn(impl) }
}

beforeEach(() => {
  loadingConcepts.value.splice(0)
  erroredConcepts.value.splice(0)
  for (const uri of [uriA, uriB]) {
    removeItemByUri(uri)
    saveItem({ uri, __DETAILSLOADED__: 0 }, { type: "concept" })
  }
})

describe("loadConcepts - successful load", () => {
  it("empties loadingConcepts without leaving holes", async () => {
    const registry = makeRegistry(({ concepts }) =>
      Promise.resolve(concepts.map(c => ({ uri: c.uri, prefLabel: { en: "loaded" } }))),
    )

    await loadConcepts([{ uri: uriA }, { uri: uriB }], { registry })

    expect(loadingConcepts.value.length).toBe(0)
    expectNoHoles(loadingConcepts.value)
    expect(erroredConcepts.value.length).toBe(0)
  })

  it("marks loaded concepts as having details", async () => {
    const registry = makeRegistry(({ concepts }) =>
      Promise.resolve(concepts.map(c => ({ uri: c.uri, prefLabel: { en: "loaded" } }))),
    )

    await loadConcepts([{ uri: uriA }], { registry })

    expect(getItemByUri(uriA).__DETAILSLOADED__).toBe(1)
    expect(getItemByUri(uriA).prefLabel.en).toBe("loaded")
  })

  it("removes only the loaded concept and keeps the array dense", async () => {
    // Registry answers for A only; B stays behind in loadingConcepts.
    const registry = makeRegistry(({ concepts }) =>
      Promise.resolve(
        concepts.filter(c => c.uri === uriA).map(c => ({ uri: c.uri, prefLabel: { en: "a" } })),
      ),
    )

    await loadConcepts([{ uri: uriA }, { uri: uriB }], { registry })

    expectNoHoles(loadingConcepts.value)
    expectNoHoles(erroredConcepts.value)
    expect(loadingConcepts.value.find(c => c.uri === uriA)).toBeUndefined()
  })

  it("skips concepts that already have their details", async () => {
    const registry = makeRegistry(({ concepts }) =>
      Promise.resolve(concepts.map(c => ({ uri: c.uri }))),
    )
    await loadConcepts([{ uri: uriA }], { registry })
    registry.getConcepts.mockClear()

    await loadConcepts([{ uri: uriA }], { registry })

    expect(registry.getConcepts).not.toHaveBeenCalled()
  })

  it("reloads them anyway with force", async () => {
    const registry = makeRegistry(({ concepts }) =>
      Promise.resolve(concepts.map(c => ({ uri: c.uri }))),
    )
    await loadConcepts([{ uri: uriA }], { registry })
    registry.getConcepts.mockClear()

    await loadConcepts([{ uri: uriA }], { registry, force: true })

    expect(registry.getConcepts).toHaveBeenCalledTimes(1)
  })
})

describe("loadConcepts - failed load", () => {
  it("moves concepts to erroredConcepts and leaves both arrays dense", async () => {
    const registry = makeRegistry(() => Promise.reject(new Error("boom")))

    await loadConcepts([{ uri: uriA }, { uri: uriB }], { registry })

    expect(loadingConcepts.value.length).toBe(0)
    expectNoHoles(loadingConcepts.value)

    expect(erroredConcepts.value.length).toBe(2)
    expectNoHoles(erroredConcepts.value)
    expect(erroredConcepts.value.map(c => c.uri).sort()).toEqual([uriA, uriB].sort())
  })

  it("flags errored concepts with __DETAILSLOADED__ = -1", async () => {
    const registry = makeRegistry(() => Promise.reject(new Error("boom")))

    await loadConcepts([{ uri: uriA }], { registry })

    expect(getItemByUri(uriA).__DETAILSLOADED__).toBe(-1)
  })

  it("does not retry an errored concept without force", async () => {
    const registry = makeRegistry(() => Promise.reject(new Error("boom")))
    await loadConcepts([{ uri: uriA }], { registry })
    registry.getConcepts.mockClear()

    await loadConcepts([{ uri: uriA }], { registry })

    expect(registry.getConcepts).not.toHaveBeenCalled()
  })
})

describe("loadConcepts - request batching", () => {
  it("chunks concepts into requests of at most 15", async () => {
    const uris = Array.from({ length: 20 }, (_, i) => `http://example.org/batch/${i}`)
    for (const uri of uris) {
      removeItemByUri(uri)
      saveItem({ uri, __DETAILSLOADED__: 0 }, { type: "concept" })
    }
    const registry = makeRegistry(({ concepts }) =>
      Promise.resolve(concepts.map(c => ({ uri: c.uri }))),
    )

    await loadConcepts(uris.map(uri => ({ uri })), { registry })

    expect(registry.getConcepts).toHaveBeenCalledTimes(2)
    for (const call of registry.getConcepts.mock.calls) {
      expect(call[0].concepts.length).toBeLessThanOrEqual(15)
    }
    expect(loadingConcepts.value.length).toBe(0)
  })
})
