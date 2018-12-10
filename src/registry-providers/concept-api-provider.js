// import jskos from "jskos-tools"
import _ from "lodash"
import BaseProvider from "./base-provider"
import util from "../util"

class ConceptApiProvider extends BaseProvider {

  constructor(...params) {
    super(...params)
    let endpointList = {
      schemes: "/voc",
      top: "/voc/top",
      concepts: "/data",
      ancestors: "/ancestors",
      narrower: "/narrower",
      suggest: "/suggest",
      search: "/search",
    }
    // Set URLs for each endpoint
    let baseUrl = this.registry.baseUrl
    _.forOwn(endpointList, (value, key) => {
      if (!this.registry[key] && baseUrl) {
        this.registry[key] = util.addEndpoint(baseUrl, value)
      }
    })
  }

  _getSchemes() {
    if (!this.registry.schemes) {
      return Promise.resolve([])
    }
    if (Array.isArray(this.registry.schemes)) {
      return Promise.resolve(this.registry.schemes)
    }
    return this.get(this.registry.schemes)
  }

  _getTop(scheme) {
    if (!this.registry.top || !scheme || !scheme.uri) {
      return Promise.resolve([])
    }
    let options = {
      params: {
        uri: scheme.uri,
        properties: this.properties.default,
        limit: 10000,
      }
    }
    return this.get(this.registry.top, options)
  }

  _getConcepts(concepts, { properties } = {}) {
    if (!this.registry.concepts || !concepts) {
      return Promise.resolve([])
    }
    if (!Array.isArray(concepts)) {
      concepts = [concepts]
    }
    let uris = concepts.map(concept => concept.uri).filter(uri => uri != null)
    properties = properties || this.properties.default
    let options = {
      params: {
        uri: uris.join("|"),
        properties,
      }
    }
    return this.get(this.registry.concepts, options)
  }

  _getNarrower(concept) {
    if (!this.registry.narrower || !concept || !concept.uri) {
      return Promise.resolve([])
    }
    let options = {
      params: {
        uri: concept.uri,
        properties: this.properties.default,
        limit: 10000,
      }
    }
    return this.get(this.registry.narrower, options)
  }

  _getAncestors(concept) {
    if (!this.registry.ancestors || !concept || !concept.uri) {
      return Promise.resolve([])
    }
    let options = {
      params: {
        uri: concept.uri,
        properties: this.properties.default,
      }
    }
    return this.get(this.registry.ancestors, options)
  }

  _suggest(search, scheme, { limit = 200, use = "notation,label", types = [] } = {}) {
    if (!this.registry.suggest || !search) {
      return Promise.resolve(["", [], [], []])
    }
    let options = {
      params: {
        search: search,
        voc: _.get(scheme, "uri", ""),
        limit: limit,
        count: limit, // Some endpoints use count instead of limit
        use,
        type: types.join("|"),
      }
    }
    // Some registries use URL templates with {searchTerms}
    let url = this.registry.suggest.replace("{searchTerms}", search)
    return this.get(url, options)
  }

  /**
   * Search not yet implemented.
   */
  _search() {
    return Promise.resolve([])
  }

  _getTypes(scheme) {
    if (!this.registry.types) {
      return Promise.resolve([])
    }
    if (Array.isArray(this.registry.types)) {
      return Promise.resolve(this.registry.types)
    }
    return this.get(this.registry.types, {
      uri: _.get(scheme, "uri"),
    })
  }

}

ConceptApiProvider.providerName = "ConceptApi"

export default ConceptApiProvider
