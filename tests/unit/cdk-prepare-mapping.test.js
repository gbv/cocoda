import { describe, it, expect } from "vitest"
import cdkMixin from "@/mixins/cdk.js"

/**
 * Tests for `prepareMapping` in src/mixins/cdk.js - the six `$delete` call
 * sites that strip empty creator/contributor data before a mapping is sent
 * to the API.
 *
 * MIGRATION NOTE (Vue 2 -> Vue 3): all six operate on plain *objects*
 * (`mapping`, `person`, `person.prefLabel`), never on arrays, so `delete` is
 * the correct replacement for `this.$delete` here. That is worth pinning:
 * the distinction between "key removed" and "key present but empty" is what
 * these lines exist for - an empty `prefLabel: {}` or `uri: ""` sent to the
 * API is exactly what they are meant to prevent.
 */

/**
 * Calls the mixin method with the minimal `this` it actually uses.
 * `$delete` is the Vue 2 helper; in Vue 3 the production code becomes a plain
 * `delete`, and this stub can then be dropped without touching assertions.
 */
function prepareMapping(mapping, { creator = null, userUris = [] } = {}) {
  const context = {
    creator,
    userUris,
    $delete: (object, key) => {
      delete object[key]
    },
  }
  return cdkMixin.methods.prepareMapping.call(context, mapping)
}

const baseMapping = () => ({
  from: { memberSet: [{ uri: "http://example.org/from" }] },
  to: { memberSet: [{ uri: "http://example.org/to" }] },
})

describe("prepareMapping - guards", () => {
  it("returns null for a missing mapping", () => {
    expect(prepareMapping(null)).toBe(null)
  })

  it("does not mutate the mapping that was passed in", () => {
    const mapping = { ...baseMapping(), creator: [{ uri: "", prefLabel: { en: "" } }] }
    const before = JSON.parse(JSON.stringify(mapping))

    prepareMapping(mapping)

    expect(mapping).toEqual(before)
  })
})

describe("prepareMapping - stripping empty person data", () => {
  it("removes an empty uri from a contributor", () => {
    const result = prepareMapping({
      ...baseMapping(),
      contributor: [{ uri: "", prefLabel: { en: "Someone" } }],
    })

    expect("uri" in result.contributor[0]).toBe(false)
    expect(result.contributor[0].prefLabel).toEqual({ en: "Someone" })
  })

  it("removes empty prefLabel languages", () => {
    const result = prepareMapping({
      ...baseMapping(),
      contributor: [{ prefLabel: { en: "Someone", de: "" } }],
    })

    expect(result.contributor[0].prefLabel).toEqual({ en: "Someone" })
    expect("de" in result.contributor[0].prefLabel).toBe(false)
  })

  it("removes prefLabel entirely once it is empty", () => {
    const result = prepareMapping({
      ...baseMapping(),
      contributor: [{ uri: "http://example.org/user", prefLabel: { en: "" } }],
    })

    expect("prefLabel" in result.contributor[0]).toBe(false)
    expect(result.contributor[0].uri).toBe("http://example.org/user")
  })

  it("drops persons that end up completely empty", () => {
    const result = prepareMapping({
      ...baseMapping(),
      contributor: [
        { uri: "", prefLabel: { en: "" } },
        { uri: "http://example.org/user" },
      ],
    })

    expect(result.contributor).toEqual([{ uri: "http://example.org/user" }])
  })

  it("removes the contributor key when nothing is left", () => {
    const result = prepareMapping({
      ...baseMapping(),
      contributor: [{ uri: "", prefLabel: { en: "" } }],
    })

    expect("contributor" in result).toBe(false)
  })
})

describe("prepareMapping - creator handling", () => {
  it("moves previous creators to contributor and removes creator without a self", () => {
    const result = prepareMapping({
      ...baseMapping(),
      creator: [{ uri: "http://example.org/other" }],
    })

    expect("creator" in result).toBe(false)
    expect(result.contributor).toEqual([{ uri: "http://example.org/other" }])
  })

  it("sets self as the sole creator when one is configured", () => {
    const result = prepareMapping(baseMapping(), {
      creator: { uri: "http://example.org/me", prefLabel: { en: "Me" } },
      userUris: ["http://example.org/me"],
    })

    expect(result.creator).toEqual([{ uri: "http://example.org/me", prefLabel: { en: "Me" } }])
  })

  it("keeps a previous foreign creator as contributor", () => {
    const result = prepareMapping(
      { ...baseMapping(), creator: [{ uri: "http://example.org/other" }] },
      { creator: { uri: "http://example.org/me" }, userUris: ["http://example.org/me"] },
    )

    expect(result.creator).toEqual([{ uri: "http://example.org/me" }])
    expect(result.contributor).toEqual([{ uri: "http://example.org/other" }])
  })

  it("does not list self twice as contributor for a new mapping", () => {
    const result = prepareMapping(
      { ...baseMapping(), creator: [{ uri: "http://example.org/me" }] },
      { creator: { uri: "http://example.org/me" }, userUris: ["http://example.org/me"] },
    )

    expect("contributor" in result).toBe(false)
  })

  it("adds self as contributor when editing an existing mapping", () => {
    const result = prepareMapping(
      { ...baseMapping(), uri: "http://example.org/mapping/1" },
      { creator: { uri: "http://example.org/me" }, userUris: ["http://example.org/me"] },
    )

    expect(result.contributor).toEqual([{ uri: "http://example.org/me" }])
  })
})

describe("prepareMapping - serialization", () => {
  // The point of the six deletes: no empty leftovers may reach the API.
  it("leaves no empty strings or empty objects in the payload", () => {
    const result = prepareMapping({
      ...baseMapping(),
      creator: [{ uri: "", prefLabel: { en: "", de: "" } }],
      contributor: [{ uri: "http://example.org/user", prefLabel: { en: "", de: "Jemand" } }],
    })

    const json = JSON.stringify(result)
    expect(json).not.toContain("\"\"")
    expect(json).not.toContain("{}")
  })
})
