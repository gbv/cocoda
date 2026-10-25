import { describe, it, expect, beforeEach, vi } from "vitest"

// mapping.js -> utils/mapping-helpers -> @/store -> mapping.js is a cycle. The
// app never notices because it always enters through store/index.js; entering
// from here would leave the store half-built. The three helpers are only used
// by getters, not by the mutations under test, so stubbing them cuts the cycle
// without affecting what is asserted.
vi.mock("@/utils/mapping-helpers", () => ({
  canCreateMapping: () => true,
  canDeleteMapping: () => true,
  canUpdateMapping: () => true,
}))

const { default: mappingModule } = await import("@/store/modules/mapping.js")
const { default: jskos } = await import("@/utils/jskos.js")

/**
 * Tests for the four `Vue.delete` call sites in src/store/modules/mapping.js.
 *
 * MIGRATION NOTE (Vue 2 -> Vue 3): all four operate on the mapping *object*,
 * so the correct replacement is a plain `delete state.mapping.x`. That is the
 * easy case - but it is worth pinning, because the difference between
 * "property removed" and "property set to null/undefined" matters here: a
 * JSKOS mapping with `creator: undefined` still serializes the key, and the
 * mapping identifier is computed from the object's shape.
 */

const { mutations } = mappingModule

/** Fresh module state, independent per test. */
function makeState() {
  return {
    mapping: {
      from: { memberSet: [{ uri: "http://example.org/from" }] },
      to: { memberSet: [{ uri: "http://example.org/to" }] },
      fromScheme: { uri: "http://example.org/scheme/from" },
      toScheme: { uri: "http://example.org/scheme/to" },
    },
    original: { uri: null, mapping: null, registry: null },
  }
}

let state

beforeEach(() => {
  state = makeState()
})

describe("setCreator", () => {
  it("sets a creator, wrapping a single object into an array", () => {
    mutations.setCreator(state, { creator: { uri: "http://example.org/user" } })

    expect(state.mapping.creator).toEqual([{ uri: "http://example.org/user" }])
  })

  it("removes the key entirely when the creator is empty", () => {
    mutations.setCreator(state, { creator: { uri: "http://example.org/user" } })
    mutations.setCreator(state, { creator: null })

    expect("creator" in state.mapping).toBe(false)
  })

  it("removes the key entirely for an empty array", () => {
    mutations.setCreator(state, { creator: [{ uri: "http://example.org/user" }] })
    mutations.setCreator(state, { creator: [] })

    expect("creator" in state.mapping).toBe(false)
  })
})

describe("setContributor", () => {
  it("sets contributors", () => {
    mutations.setContributor(state, { contributor: [{ uri: "http://example.org/user" }] })

    expect(state.mapping.contributor).toEqual([{ uri: "http://example.org/user" }])
  })

  it("removes the key entirely when there are none", () => {
    mutations.setContributor(state, { contributor: [{ uri: "http://example.org/user" }] })
    mutations.setContributor(state, { contributor: [] })

    expect("contributor" in state.mapping).toBe(false)
  })
})

describe("setConcordance", () => {
  it("stores the concordance as partOf", () => {
    mutations.setConcordance(state, { concordance: { uri: "http://example.org/concordance" } })

    expect(state.mapping.partOf).toEqual([{ uri: "http://example.org/concordance" }])
  })

  it("removes partOf entirely when the concordance is cleared", () => {
    mutations.setConcordance(state, { concordance: { uri: "http://example.org/concordance" } })
    mutations.setConcordance(state, { concordance: null })

    expect("partOf" in state.mapping).toBe(false)
  })

  it("removes partOf when given a concordance without a URI", () => {
    mutations.setConcordance(state, { concordance: { uri: "http://example.org/concordance" } })
    mutations.setConcordance(state, { concordance: {} })

    expect("partOf" in state.mapping).toBe(false)
  })
})

describe("setIdentifier", () => {
  // Call order matters and mirrors mappingIdentifierPlugin, which commits
  // setIdentifier after every mapping mutation: the content identifiers exist
  // before any URI is assigned. Note that setIdentifier({ uri }) on a mapping
  // that has no `identifier` array yet throws (mapping.js:413) - a pre-existing
  // sharp edge, unrelated to the migration.
  beforeEach(() => {
    mutations.setIdentifier(state)
  })

  it("computes content identifiers once both schemes are set", () => {
    expect(Array.isArray(state.mapping.identifier)).toBe(true)
    expect(
      state.mapping.identifier.some(id => id.startsWith("urn:jskos:mapping:content:")),
    ).toBe(true)
  })

  it("leaves the identifier alone while no scheme is set", () => {
    const bare = { mapping: { from: { memberSet: [] }, to: { memberSet: [] } } }

    mutations.setIdentifier(bare)

    expect(bare.mapping.identifier).toBeUndefined()
  })

  it("sets the mapping URI when one is given", () => {
    mutations.setIdentifier(state, { uri: "http://example.org/mapping/1" })

    expect(state.mapping.uri).toBe("http://example.org/mapping/1")
  })

  it("keeps the identifier free of the mapping's own URI", () => {
    const uri = "http://example.org/mapping/1"

    mutations.setIdentifier(state, { uri })

    expect(state.mapping.identifier).not.toContain(uri)
  })

  it("moves a replaced URI into the identifier list", () => {
    const first = "http://example.org/mapping/1"
    const second = "http://example.org/mapping/2"

    mutations.setIdentifier(state, { uri: first })
    mutations.setIdentifier(state, { uri: second })

    expect(state.mapping.uri).toBe(second)
    expect(state.mapping.identifier).toContain(first)
  })

  it("removes the URI key entirely when passed null", () => {
    mutations.setIdentifier(state, { uri: "http://example.org/mapping/1" })

    mutations.setIdentifier(state, { uri: null })

    expect("uri" in state.mapping).toBe(false)
  })

  it("ignores an omitted uri instead of removing the existing one", () => {
    mutations.setIdentifier(state, { uri: "http://example.org/mapping/1" })

    mutations.setIdentifier(state)

    expect(state.mapping.uri).toBe("http://example.org/mapping/1")
  })
})

describe("mapping shape after removals", () => {
  // A removed key must not reappear as `undefined` - jskos serialization and
  // the content identifier both depend on the actual set of keys.
  it("does not leave undefined placeholders behind", () => {
    mutations.setCreator(state, { creator: { uri: "http://example.org/user" } })
    mutations.setConcordance(state, { concordance: { uri: "http://example.org/c" } })
    mutations.setCreator(state, { creator: null })
    mutations.setConcordance(state, { concordance: null })

    expect(Object.keys(state.mapping)).not.toContain("creator")
    expect(Object.keys(state.mapping)).not.toContain("partOf")
    expect(JSON.stringify(state.mapping)).not.toContain("creator")
  })

  it("still yields a valid mapping for jskos after removals", () => {
    mutations.setCreator(state, { creator: { uri: "http://example.org/user" } })
    mutations.setCreator(state, { creator: [] })

    expect(jskos.conceptsOfMapping(state.mapping).length).toBe(2)
  })
})
