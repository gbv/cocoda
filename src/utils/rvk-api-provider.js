import { BaseProvider, errors } from "cocoda-sdk"
// TODO: Maybe utils should be exported from cocoda-sdk properly.
import { listOfCapabilities } from "cocoda-sdk/dist/esm/utils"
import axios from "axios"
import jskos from "jskos-tools"
import _ from "lodash"

const rvk = {
  uri: "http://uri.gbv.de/terminology/rvk/",
  identifier: [
    "http://bartoc.org/en/node/533",
    "http://www.wikidata.org/entity/Q2137453",
  ],
  notation: ["RVK"],
  prefLabel: {
    de: "Regensburger Verbundklassifikation",
    en: "Regensburger Association Classification",
  },
  languages: ["en", "de", "it"],
  concepts: [null],
  topConcepts: [null],
  namespace: "http://rvk.uni-regensburg.de/nt/",
  notationPattern: "(LD,)?[A-Z]([A-Z]( [0-9]+([a-z]|\\.[0-9]+)?( [A-Z][0-9]*)?)?)?( - [A-Z]([A-Z]( [0-9]+([a-z]|\\.[0-9]+)?( [A-Z][0-9]*)?)?)?)?",
  API: [{
    type: "http://bartoc.org/api-type/rvk",
    url: "https://rvk.uni-regensburg.de/api_neu/",
    // url: "http://localhost:3009/api_neu/",
  }],
}

const rvkAsScheme = new jskos.ConceptScheme(rvk)

function nodeToJSKOS(node, options) {
  options = _.isObject(options) ? options : {}
  options.inScheme = options.inScheme === undefined ? true : options.inScheme
  options.topConcept = options.topConcept === undefined ? false : options.topConcept
  const concept = Object.assign({}, rvkAsScheme.conceptFromNotation(node.notation, options), {
    prefLabel: { de: node.benennung },
    narrower: node.has_children === "no" ? [] : [null],
  })
  const notes = [node.verweis, node.bemerkung].filter(Boolean)
  if (notes.length) {
    concept.editorialNote = { de: notes }
  }
  return concept
}

export default class RVKApiProvider extends BaseProvider {

  _prepare() {
    this.has.schemes = true
    this.has.top = true
    this.has.data = true
    this.has.concepts = true
    this.has.narrower = true
    this.has.ancestors = true
    this.has.suggest = true
    this.has.search = true
    // Explicitly set other capabilities to false
    listOfCapabilities.filter(c => !this.has[c]).forEach(c => {
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
  static _registryConfigForBartocApiConfig({ url } = {}) {
    if (!url) {
      return null
    }
    return {
      api: url,
    }
  }

  async getSchemes() {
    return [rvk]
  }

  async getTop() {
    const top = (await this._getChildren("")).map(node => Object.assign({}, nodeToJSKOS(node, { topConcept: true }), { ancestors: [] }))
    console.log("getTop", JSON.stringify(top[0], null, 2))
    return top
  }

  async getConcepts({ concepts }) {
    if (!concepts) {
      throw new errors.InvalidOrMissingParameterError({ parameter: "concepts" })
    }
    if (!Array.isArray(concepts)) {
      concepts = [concepts]
    }
    const results = await Promise.all(concepts.map(concept => jskos.notation(concept)).filter(Boolean).map(notation => axios.get(`${this._api.api}json/node/${notation}`)))
    return results.map(r => _.get(r, "data.node")).filter(Boolean).map(nodeToJSKOS)
  }

  async getNarrower({ concept }) {
    if (!concept || !concept.uri) {
      throw new errors.InvalidOrMissingParameterError({ parameter: "concept" })
    }
    const notation = jskos.notation(concept)
    if (!notation) { return [] }
    return (await this._getChildren(notation)).map(nodeToJSKOS)
  }

  async _getChildren(notation) {
    const result = await axios.get(`${this._api.api}json/children/${notation}`)
    return _.get(result, "data.node.children.node", [])
  }

  async getAncestors({ concept }) {
    if (!concept || !concept.uri) {
      throw new errors.InvalidOrMissingParameterError({ parameter: "concept" })
    }
    const notation = jskos.notation(concept)
    if (!notation) { return [] }
    const result = await axios.get(`${this._api.api}json/ancestors/${notation}`)
    const unwindAncestors = (node, ancestors = []) => {
      if (_.get(node, "ancestor.node")) {
        ancestors.push(node.ancestor.node)
        unwindAncestors(node.ancestor.node, ancestors)
      }
      return ancestors
    }
    return unwindAncestors(_.get(result, "data.node")).map(nodeToJSKOS)
  }

  async suggest(config) {
    const search = config.search
    const results = await this.search(config)
    return [
      search,
      results.map(r => jskos.prefLabel(r, { fallbackToUri: false })),
      [],
      results.map(r => r.uri),
    ]
  }

  async search({ scheme, search }) {
    if (!search) {
      throw new errors.InvalidOrMissingParameterError({ parameter: "search" })
    }
    if (!scheme || !jskos.compare(scheme, rvk)) {
      throw new errors.InvalidOrMissingParameterError({ parameter: "scheme" })
    }
    const result = await axios.get(`${this._api.api}json/nodes/${search}`)
    return (_.get(result, "data.node") || []).map(nodeToJSKOS)
  }

}

RVKApiProvider.providerName = "RVKApi"
RVKApiProvider.providerType = "http://bartoc.org/api-type/rvk"
