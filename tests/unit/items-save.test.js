import { describe, it, expect, beforeEach } from "vitest"
import {
  saveItem,
  getItem,
  getItemByUri,
  removeItemByUri,
  compareItems,
  modifyItem,
} from "@/items"

/**
 * Tests for the item cache in src/items/index.js.
 *
 * MIGRATION NOTE (Vue 2 -> Vue 3): `_items` is `reactive({})`. In Vue 2 that is
 * the very same object that was put in; in Vue 3 it is a Proxy, so
 * `getItemByUri(uri) === theObjectWeSaved` flips from true to false.
 *
 * `saveItem` relies on exactly that identity check ("Return immediately if
 * object reference is the same"). These tests therefore assert *observable
 * behaviour* - one entry per URI, no re-initialization, no lost details -
 * rather than object identity, so they stay valid before and after the
 * migration and still fail if the `toRaw()` fix is forgotten.
 */

const uri = "http://example.org/concept/1"

function freshConcept(extra = {}) {
  return { uri, prefLabel: { en: "One" }, ...extra }
}

beforeEach(() => {
  removeItemByUri(uri)
  removeItemByUri("http://example.org/concept/2")
  removeItemByUri("urn:test:identifier:1")
})

describe("saveItem - basics", () => {
  it("rejects items without a URI", () => {
    expect(() => saveItem(null)).toThrow()
    expect(() => saveItem({ prefLabel: { en: "no uri" } })).toThrow()
  })

  it("makes the item retrievable by URI", () => {
    saveItem(freshConcept(), { type: "concept" })

    expect(getItemByUri(uri)).toBeTruthy()
    expect(getItemByUri(uri).prefLabel.en).toBe("One")
  })

  it("marks a newly saved item as saved with details not yet loaded", () => {
    const saved = saveItem(freshConcept(), { type: "concept" })

    expect(saved.__SAVED__).toBe(true)
    expect(saved.__DETAILSLOADED__).toBe(0)
  })
})

describe("saveItem - identity and idempotency", () => {
  // The core Vue 3 risk: with `_items` proxied, `existing === item` no longer
  // holds and saving the same object twice could produce a second, diverging
  // entry instead of returning the stored one.
  it("returns the same stored object when saving the same reference twice", () => {
    const concept = freshConcept()

    const first = saveItem(concept, { type: "concept" })
    const second = saveItem(concept, { type: "concept" })

    expect(second).toBe(first)
  })

  it("returns the same stored object when saving an equal but distinct object", () => {
    const first = saveItem(freshConcept(), { type: "concept" })
    const second = saveItem(freshConcept(), { type: "concept" })

    expect(second).toBe(first)
    expect(getItemByUri(uri)).toBe(first)
  })

  it("does not reset __DETAILSLOADED__ when the item is saved again", () => {
    const saved = saveItem(freshConcept(), { type: "concept" })
    modifyItem(saved, "__DETAILSLOADED__", 1)

    saveItem(freshConcept(), { type: "concept" })

    expect(getItemByUri(uri).__DETAILSLOADED__).toBe(1)
  })

  it("returns the existing item untouched with returnIfExists", () => {
    saveItem(freshConcept(), { type: "concept" })

    const result = saveItem(
      { uri, prefLabel: { de: "Eins" } },
      { type: "concept", returnIfExists: true },
    )

    expect(result.prefLabel).toEqual({ en: "One" })
    expect(result.prefLabel.de).toBeUndefined()
  })
})

describe("saveItem - merging details into an existing item", () => {
  it("fills in properties the stored item does not have yet", () => {
    saveItem(freshConcept(), { type: "concept" })

    saveItem({ uri, notation: ["1"] }, { type: "concept" })

    expect(getItemByUri(uri).notation).toEqual(["1"])
    expect(getItemByUri(uri).prefLabel.en).toBe("One")
  })

  it("adds new languages to an existing prefLabel without dropping old ones", () => {
    saveItem(freshConcept(), { type: "concept" })

    saveItem({ uri, prefLabel: { de: "Eins" } }, { type: "concept" })

    expect(getItemByUri(uri).prefLabel).toEqual({ en: "One", de: "Eins" })
  })

  it("registers the item under its identifiers as well", () => {
    saveItem(freshConcept({ identifier: ["urn:test:identifier:1"] }), { type: "concept" })

    expect(getItemByUri("urn:test:identifier:1")).toBe(getItemByUri(uri))
  })
})

describe("getItem / compareItems", () => {
  it("returns null for unknown items", () => {
    expect(getItemByUri("http://example.org/does-not-exist")).toBe(null)
  })

  it("compares via the stored item when one is available", () => {
    saveItem(freshConcept(), { type: "concept" })

    expect(compareItems({ uri }, { uri })).toBe(true)
    expect(compareItems({ uri }, { uri: "http://example.org/concept/2" })).toBe(false)
  })

  it("resolves related items to stored objects with relatedItems", () => {
    const broaderUri = "http://example.org/concept/2"
    saveItem({ uri: broaderUri, prefLabel: { en: "Two" } }, { type: "concept" })
    saveItem(freshConcept({ broader: [{ uri: broaderUri }] }), { type: "concept" })

    const resolved = getItem({ uri }, { relatedItems: true })

    expect(resolved.broader[0].prefLabel.en).toBe("Two")
  })
})
