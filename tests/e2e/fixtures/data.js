/**
 * JSKOS fixture data for the end-to-end tests.
 *
 * Everything the app sees comes from here - no remote system is contacted, so
 * the tests need no credentials and do not depend on coli-conc availability.
 *
 * The shapes follow the JSKOS API that cocoda-sdk's ConceptApi provider
 * expects. Keep them minimal but realistic: `notation` and `prefLabel` drive
 * what is rendered, `narrower: [null]` means "has children, not loaded yet",
 * and `narrower: []` means "leaf".
 */

const SCHEME_TYPE = "http://www.w3.org/2004/02/skos/core#ConceptScheme"
const CONCEPT_TYPE = "http://www.w3.org/2004/02/skos/core#Concept"

export const leftScheme = {
  uri: "http://example.org/scheme/left",
  notation: ["LEFT"],
  prefLabel: { en: "Left Test Scheme", de: "Linkes Testvokabular" },
  type: [SCHEME_TYPE],
  languages: ["en", "de"],
}

export const rightScheme = {
  uri: "http://example.org/scheme/right",
  notation: ["RIGHT"],
  prefLabel: { en: "Right Test Scheme", de: "Rechtes Testvokabular" },
  type: [SCHEME_TYPE],
  languages: ["en", "de"],
}

/**
 * A deliberately large scheme, so the concept list is actually virtualized.
 * This is what makes the virtual scroller swap.
 */
export const bigScheme = {
  uri: "http://example.org/scheme/big",
  notation: ["BIG"],
  prefLabel: { en: "Big Test Scheme" },
  type: [SCHEME_TYPE],
  languages: ["en"],
}

export const schemes = [leftScheme, rightScheme, bigScheme]

function concept({ uri, notation, prefLabel, scheme, narrower = [], broader = [] }) {
  return {
    uri,
    notation: [notation],
    prefLabel,
    type: [CONCEPT_TYPE],
    inScheme: [{ uri: scheme.uri }],
    topConceptOf: broader.length ? undefined : [{ uri: scheme.uri }],
    narrower,
    broader,
  }
}

// --- Left scheme: a two-level tree -----------------------------------------

export const leftScience = concept({
  uri: "http://example.org/left/1",
  notation: "1",
  prefLabel: { en: "Science", de: "Wissenschaft" },
  scheme: leftScheme,
  narrower: [null],
})

export const leftPhysics = concept({
  uri: "http://example.org/left/1.1",
  notation: "1.1",
  prefLabel: { en: "Physics", de: "Physik" },
  scheme: leftScheme,
  broader: [{ uri: leftScience.uri }],
})

export const leftChemistry = concept({
  uri: "http://example.org/left/1.2",
  notation: "1.2",
  prefLabel: { en: "Chemistry", de: "Chemie" },
  scheme: leftScheme,
  broader: [{ uri: leftScience.uri }],
})

export const leftArts = concept({
  uri: "http://example.org/left/2",
  notation: "2",
  prefLabel: { en: "Arts", de: "Kunst" },
  scheme: leftScheme,
})

// --- Right scheme -----------------------------------------------------------

export const rightNature = concept({
  uri: "http://example.org/right/N",
  notation: "N",
  prefLabel: { en: "Natural sciences", de: "Naturwissenschaften" },
  scheme: rightScheme,
  narrower: [null],
})

export const rightPhysik = concept({
  uri: "http://example.org/right/NP",
  notation: "NP",
  prefLabel: { en: "Physics", de: "Physik" },
  scheme: rightScheme,
  broader: [{ uri: rightNature.uri }],
})

export const rightKunst = concept({
  uri: "http://example.org/right/K",
  notation: "K",
  prefLabel: { en: "Arts", de: "Kunst" },
  scheme: rightScheme,
})

// --- Big scheme: 500 flat top concepts --------------------------------------

export const bigConcepts = Array.from({ length: 500 }, (_, i) =>
  concept({
    uri: `http://example.org/big/${i}`,
    notation: `B${String(i).padStart(3, "0")}`,
    prefLabel: { en: `Big concept number ${i}` },
    scheme: bigScheme,
  }),
)

export const concepts = [
  leftScience, leftPhysics, leftChemistry, leftArts,
  rightNature, rightPhysik, rightKunst,
  ...bigConcepts,
]

/** Top concepts per scheme URI, as returned by `/voc/top`. */
export const topConcepts = {
  [leftScheme.uri]: [leftScience, leftArts],
  [rightScheme.uri]: [rightNature, rightKunst],
  [bigScheme.uri]: bigConcepts,
}

/** Narrower concepts per parent URI, as returned by `/narrower`. */
export const narrower = {
  [leftScience.uri]: [leftPhysics, leftChemistry],
  [rightNature.uri]: [rightPhysik],
}

export const conceptsByUri = Object.fromEntries(concepts.map(c => [c.uri, c]))
export const schemesByUri = Object.fromEntries(schemes.map(s => [s.uri, s]))

// --- Concordances and mappings served by the read-only MappingsApi mock ------

export const concordance = {
  uri: "http://example.org/concordance/1",
  notation: ["TEST-1"],
  type: ["http://rdf-vocabulary.ddialliance.org/xkos#Correspondence"],
  fromScheme: { uri: leftScheme.uri },
  toScheme: { uri: rightScheme.uri },
  scopeNote: { en: "A test concordance" },
  extent: "1",
  creator: [{ prefLabel: { en: "Test Creator" } }],
}

export const remoteMapping = {
  uri: "http://example.org/mapping/1",
  type: ["http://www.w3.org/2004/02/skos/core#exactMatch"],
  fromScheme: { uri: leftScheme.uri },
  toScheme: { uri: rightScheme.uri },
  from: { memberSet: [{ uri: leftArts.uri, notation: leftArts.notation }] },
  to: { memberSet: [{ uri: rightKunst.uri, notation: rightKunst.notation }] },
  partOf: [{ uri: concordance.uri }],
}

export const concordances = [concordance]
export const mappings = [remoteMapping]
