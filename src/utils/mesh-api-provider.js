import { BaseProvider, errors } from "cocoda-sdk"
// TODO: Maybe utils should be exported from cocoda-sdk properly.
import { listOfCapabilities } from "cocoda-sdk/dist/esm/utils"
import axios from "axios"
import jskos from "jskos-tools"

const mesh = {
  uri: "http://id.nlm.nih.gov/mesh",
  identifier: [
    "http://bartoc.org/en/node/391",
    "http://www.wikidata.org/entity/Q199897",
  ],
  notation: ["MeSH"],
  prefLabel: {
    en: "Medical Subject Headings",
  },
  languages: ["en"],
  concepts: [null],
  topConcepts: [],
}
const apiBase = "https://id.nlm.nih.gov/mesh/"

function buildConceptQuery({ where }) {
  // TODO: Ordering
  return `
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX meshv: <http://id.nlm.nih.gov/mesh/vocab#>

  SELECT ?d ?name ?dateCreated ?dateRevised ?identifier (GROUP_CONCAT(?broaderDescriptor;SEPARATOR=" ") as ?broader)
  FROM <http://id.nlm.nih.gov/mesh>
  WHERE {
    ?d a meshv:Descriptor .
    ?d rdfs:label ?name .
    OPTIONAL { ?d meshv:dateCreated ?dateCreated } .
    OPTIONAL { ?d meshv:dateRevised ?dateRevised } .
    ?d meshv:identifier ?identifier .
    OPTIONAL { ?d meshv:broaderDescriptor ?broaderDescriptor } .
    ${where}
  }
  GROUP BY ?d ?name ?dateCreated ?dateRevised ?identifier
  ORDER BY ?d
  `
}
function queryResultToConcepts(result) {
  return result.data.results.bindings.map(c => {
    const concept = {
      inScheme: [mesh],
      uri: c.d.value,
      notation: [c.identifier.value],
      prefLabel: {
        [c.name["xml:lang"]]: c.name.value,
      },
      broader: (c.broader.value || "").split(" ").filter(b => b.trim() !== "").map(b => ({ uri: b })),
    }
    if (c.dateCreated && c.dateCreated.value) {
      concept.created = c.dateCreated.value
    }
    if (c.dateRevised && c.dateRevised.value) {
      concept.modified = c.dateRevised.value
    }
    return concept
  })
}

export default class MeshApiProvider extends BaseProvider {

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
    listOfCapabilities.filter(c => !this.has[c]).forEach(c => {
      this.has[c] = false
    })
    this._defaultParams = {
      format: "JSON",
      limit: 100,
      offset: 0,
      inference: true,
    }
    this._defaultHeaders = {
      // For some reason, we need weird Accept header values for this to work...
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    }
  }

  async getSchemes() {
    return [mesh]
  }

  async getTop() {
    return []
  }

  async getConcepts({ concepts, ...config }) {
    if (!concepts) {
      throw new errors.InvalidOrMissingParameterError({ parameter: "concepts" })
    }
    if (!Array.isArray(concepts)) {
      concepts = [concepts]
    }
    const query = buildConceptQuery({ where: `VALUES ?d { ${concepts.map(c => `<${c.uri}>`).join(" ")} } .` })
    const result = await axios({
      method: "get",
      url: `${apiBase}sparql`,
      params: {
        ...this._defaultParams,
        ...(config.params || {}),
        query,
      },
      headers: this._defaultHeaders,
    })
    try {
      return queryResultToConcepts(result)
    } catch (error) {
      console.error(error)
      return []
    }
  }

  async getNarrower({ concept, ...config }) {
    if (!concept || !concept.uri) {
      throw new errors.InvalidOrMissingParameterError({ parameter: "concept" })
    }
    const query = buildConceptQuery({ where: `?d meshv:broaderDescriptor <${concept.uri}> .` })
    const result = await axios({
      method: "get",
      url: `${apiBase}sparql`,
      params: {
        ...this._defaultParams,
        ...(config.params || {}),
        query,
      },
      headers: this._defaultHeaders,
    })
    try {
      return queryResultToConcepts(result)
    } catch (error) {
      console.error(error)
      return []
    }
  }

  async suggest(config) {
    const search = config.search
    const results = await this._search(config)
    return [
      search,
      results.map(r => jskos.prefLabel(r, { fallbackToUri: false })),
      [],
      results.map(r => r.uri),
    ]
  }

  async search(config) {
    return this._search(config)
  }

  async _search({ scheme, search, limit, offset, ...config }) {
    if (!search) {
      throw new errors.InvalidOrMissingParameterError({ parameter: "search" })
    }
    if (!scheme || !jskos.compare(scheme, mesh)) {
      throw new errors.InvalidOrMissingParameterError({ parameter: "scheme" })
    }
    limit = limit || this._jskos.suggestResultLimit || this._defaultParams.limit
    offset = offset || this._defaultParams.offset
    // TODO: Do we need regexp escapaing?
    search = search.replace(/"/g, "\\\"")
    const query = buildConceptQuery({ where: `FILTER(REGEX(?name,"${search}","i"))` })
    const result = await axios({
      method: "get",
      url: `${apiBase}sparql`,
      params: {
        ...this._defaultParams,
        ...(config.params || {}),
        query,
        limit,
        offset,
      },
      headers: this._defaultHeaders,
    })
    try {
      // TODO: Pagination
      return queryResultToConcepts(result)
    } catch (error) {
      console.error(error)
      return []
    }
  }

}

MeshApiProvider.providerName = "MeshApi"
MeshApiProvider.providerType = "http://bartoc.org/api-type/mesh"
