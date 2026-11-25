import { describe, it, expect } from "vitest"
import { addMappingIdentifiers } from "jskos-tools"
import cdkMixin from "@/mixins/cdk.js"

/**
 * `adjustMapping` in src/mixins/cdk.js - the identifiers part.
 *
 * cocoda-sdk up to 3.6 gave every mapping its content and members
 * identifiers. Since 3.7 only servers that store mappings provide them, and
 * OccurrencesApi delivers mappings without any. MappingBrowser calls
 * `mapping.identifier.includes(...)` to highlight matches, which then threw
 * on every render of the navigator.
 */

/** The parts of `this` that adjustMapping touches for a scheme-less mapping. */
function adjustMapping(mapping) {
  const context = {
    concordances: [],
    $jskos: {},
    $store: { state: { hoveredMapping: null, mapping: { original: {} } } },
  }
  return cdkMixin.methods.adjustMapping.call(context, mapping)
}

const occurrenceMapping = () => ({
  from: { memberSet: [{ uri: "http://example.org/from" }] },
  to: { memberSet: [{ uri: "http://example.org/to" }] },
})

describe("adjustMapping - identifiers", () => {
  it("adds content and members identifiers to a mapping that has none", () => {
    const mapping = adjustMapping(occurrenceMapping())

    expect(mapping.identifier).toEqual(addMappingIdentifiers(occurrenceMapping()).identifier)
    expect(mapping.identifier.some(id => id.startsWith("urn:jskos:mapping:content:"))).toBe(true)
    expect(mapping.identifier.some(id => id.startsWith("urn:jskos:mapping:members:"))).toBe(true)
  })

  it("leaves identifiers from the server alone", () => {
    const identifier = ["urn:jskos:mapping:content:from-the-server"]
    const mapping = adjustMapping({ ...occurrenceMapping(), identifier })

    expect(mapping.identifier).toEqual(identifier)
  })
})
