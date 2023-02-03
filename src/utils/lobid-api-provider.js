import { BaseProvider, utils, errors } from "cocoda-sdk"
import axios from "axios"
import jskos from "jskos-tools"

// TODOs:
// - Fix Cocoda type filter (if `types` for a scheme changes, old filter settings are kept forever)
// - Better error handling
// - Check (and fix if necessary) _registryConfigForBartocApiConfig

const gndJson = {
  uri: "http://bartoc.org/en/node/430",
  concepts: [
    null,
  ],
  topConcepts: [],
  type: [
    "http://www.w3.org/2004/02/skos/core#ConceptScheme",
  ],
  DISPLAY: {
    hideNotation: true,
  },
  identifier: [
    "http://www.wikidata.org/entity/Q36578",
  ],
  license: [
    {
      uri: "http://creativecommons.org/publicdomain/zero/1.0/",
    },
  ],
  namespace: "https://d-nb.info/gnd/",
  notation: [
    "GND",
  ],
  notationPattern: "[0-9X-]+",
  prefLabel: {
    de: "Gemeinsame Normdatei",
    en: "Integrated Authority File",
  },
  types: [
    {
      uri: "https://d-nb.info/standards/elementset/gnd#DifferentiatedPerson",
      prefLabel: {
        de: "Person",
        en: "Person",
      },
    },
    {
      uri: "https://d-nb.info/standards/elementset/gnd#PlaceOrGeographicName",
      prefLabel: {
        de: "Geografikum",
        en: "Place",
      },
    },
    {
      uri: "https://d-nb.info/standards/elementset/gnd#CorporateBody",
      prefLabel: {
        de: "Organisation",
        en: "Organization",
      },
    },
    {
      uri: "https://d-nb.info/standards/elementset/gnd#SubjectHeading",
      prefLabel: {
        de: "Sachbegriff",
        en: "Subject",
      },
    },
    {
      uri: "https://d-nb.info/standards/elementset/gnd#Work",
      prefLabel: {
        de: "Werk",
        en: "Work",
      },
    },
    {
      uri: "https://d-nb.info/standards/elementset/gnd#ConferenceOrEvent",
      prefLabel: {
        de: "Konferenz oder Veranstaltung",
        en: "ConferenceOrEvent",
      },
    },
  ],
}

const gndTypeScheme = new jskos.ConceptScheme({
  uri: "https://d-nb.info/standards/elementset/gnd",
  namespace: "https://d-nb.info/standards/elementset/gnd#",
})
// Add notations to GND Types above
gndJson.types.forEach(type => {
  type.notation = [gndTypeScheme.notationFromUri(type.uri)]
})

const gnd = new jskos.ConceptScheme(gndJson)

const broaderProps = [
  "broaderTerm",
  "broaderTermGeneral",
  "broaderTermGeneric",
  "broaderTermInstantial",
  "broaderTermPartitive",
]

function toJSKOS(data) {
  // - type → `type` (with URI mapping)
  const concept = {
    uri: data.id,
    notation: [data.gndIdentifier],
    prefLabel: { de: data.preferredName },
    inScheme: [{ uri: gndJson.uri }],
  }
  if (data.variantName) {
    concept.altLabel = { de: data.variantName }
  }
  concept.type = data.type.map(type => gndTypeScheme.uriFromNotation(type))
  concept.broader = []
  broaderProps.forEach(prop => {
    concept.broader = concept.broader.concat(data[prop] || [])
  })
  concept.broader = concept.broader.map(broader => ({ uri: broader.id }))
  // Include old http URI for backwards compatibilty
  concept.identifier = [concept.uri.replace("https://", "http://")]
  return concept
}

// Rewrites old http URIs to https if necessary
function fixURI(uri) {
  if (uri && uri.startsWith("http://")) {
    return uri.replace("http://", "https://")
  }
  return uri
}

export default class LobidApiProvider extends BaseProvider {

  _prepare() {
    this.has.schemes = true
    this.has.top = false
    this.has.data = true
    this.has.concepts = true
    this.has.narrower = true
    this.has.ancestors = false
    this.has.suggest = true
    this.has.search = true
    // Explicitly set other capabilities to false
    utils.listOfCapabilities.filter(c => !this.has[c]).forEach(c => {
      this.has[c] = false
    })
  }

  /**
   * Used by `registryForScheme` (see src/lib/CocodaSDK.js) to determine a provider config for a concept schceme.
   *
   * @param {Object} options
   * @param {Object} options.url API URL for server
   * @returns {Object} provider configuration
   */
  static _registryConfigForBartocApiConfig({ url, scheme } = {}) {
    if (!url || !scheme) {
      return null
    }
    return {
      api: url,
      schemes: [scheme],
    }
  }

  async getSchemes() {
    return [gndJson]
  }

  async getTop() {
    return []
  }

  async getConcepts({ concepts }) {
    if (!concepts) {
      throw new errors.InvalidOrMissingParameterError({ parameter: "concepts" })
    }
    if (!Array.isArray(concepts)) {
      concepts = [concepts]
    }
    const notations = concepts.map(concept => {
      if (concept?.notation?.[0]) {
        return concept?.notation?.[0]
      }
      return gnd.notationFromUri(fixURI(concept?.uri))
    }).filter(Boolean)
    const results = await Promise.all(notations.map(async notation => {
      try {
        const result = await axios.get(`https://lobid.org/gnd/${notation}.json`)
        return toJSKOS(result.data)
      } catch (error) {
        // TODO: What to do with errors?
        return null
      }
    }))
    return results.filter(Boolean)
  }

  async getNarrower({ concept, limit = 200, offset = 0 }) {
    if (!concept || !concept.uri) {
      throw new errors.InvalidOrMissingParameterError({ parameter: "concept" })
    }
    const uri = fixURI(concept.uri)
    const q = broaderProps.map(prop => `${prop}.id:"${uri}"`).join(" OR ")
    const result = await axios.get("https://lobid.org/gnd/search", {
      params: {
        q,
        format: "json",
        size: limit,
        from: offset,
      },
    })
    return result.data.member.map(member => toJSKOS(member))
  }

  async suggest(config) {
    const results = await this._search({ ...config, format: "json:suggest" })
    return [
      config.search,
      results.map(r => r.label),
      [],
      results.map(r => r.id),
    ]
  }

  async search(config) {
    const results = await this._search(config)
    return results.member.map(member => toJSKOS(member))
  }

  async _search({ search, types, limit = 100, offset = 0, format = "json" }) {
    if (!search) {
      throw new errors.InvalidOrMissingParameterError({ parameter: "search" })
    }
    let filter = ""
    types = types?.map(type => gndTypeScheme.notationFromUri(fixURI(type))).filter(Boolean) || []
    if (types.length) {
      filter = types.map(type => `type:${type}`).join(" OR ")
    }
    const results = await axios.get("https://lobid.org/gnd/search", { params: {
      q: search,
      filter,
      format,
      size: limit,
      from: offset,
    }})
    return results.data
  }

}

LobidApiProvider.providerName = "LobidApi"
LobidApiProvider.providerType = "http://bartoc.org/api-type/lobid"
