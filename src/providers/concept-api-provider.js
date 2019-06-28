// import jskos from "jskos-tools"
import _ from "lodash"
import BaseProvider from "./base-provider"

/**
 * For APIs that provide concept schemes and concepts in JSKOS format
 * like [DANTE](http://api.dante.gbv.de/).
 */
class ConceptApiProvider extends BaseProvider {

  constructor(...params) {
    super(...params)
    this.has.schemes = !!this.registry.schemes
    this.has.top = !!this.registry.top
    this.has.data = !!this.registry.data
    this.has.concepts = !!this.registry.concepts
    this.has.narrower = !!this.registry.narrower
    this.has.ancestors = !!this.registry.ancestors
    this.has.types = !!this.registry.types
    this.has.suggest = !!this.registry.suggest
    this.has.search = !!this.registry.search
  }

  _getSchemes() {
    if (!this.registry.schemes) {
      return Promise.resolve([])
    }
    if (Array.isArray(this.registry.schemes)) {
      return Promise.resolve(this.registry.schemes)
    }
    // TODO: Should we really do it this way?
    let options = {
      params: {
        limit: 500,
      },
    }
    return this.get(this.registry.schemes, options).then(schemes => schemes || [])
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
      },
    }
    return this.get(this.registry.top, options).then(top => top || [])
  }

  _getConcepts(concepts, { properties } = {}) {
    if (!this.has.data || !concepts) {
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
      },
    }
    return this.get(this.registry.data, options).then(concepts => concepts || [])
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
      },
    }
    return this.get(this.registry.narrower, options).then(narrower => narrower || [])
  }

  _getAncestors(concept) {
    if (!this.registry.ancestors || !concept || !concept.uri) {
      return Promise.resolve([])
    }
    let options = {
      params: {
        uri: concept.uri,
        properties: this.properties.default,
      },
    }
    return this.get(this.registry.ancestors, options).then(ancestors => ancestors || [])
  }

  _suggest(search, { scheme, limit, use = "notation,label", types = [], cancelToken } = {}) {
    limit = limit || this.registry.suggestResultLimit || 100
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
      },
    }
    // Some registries use URL templates with {searchTerms}
    let url = this.registry.suggest.replace("{searchTerms}", search)
    return this.get(url, options, cancelToken).then(result => result || ["", [], [], []])
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
    }).then(types => types || [])
  }

}

ConceptApiProvider.providerName = "ConceptApi"

export default ConceptApiProvider
