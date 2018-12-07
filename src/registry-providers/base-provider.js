import jskos from "jskos-tools"
import _ from "lodash"
import axios from "axios"

/**
 * An empty provider as well as superclass for Cocoda Registry Providers.
 *
 * The constructor sets the functionality object provider.has according to the provided registry object.
 *
 * Extend this class like this:
 * ```javascript
 *  class TestProvider extends BaseProvider {
 *    // override functions as needed
 *    // (usually it is recommended to only override the _ functions)
 *    // ...
 *  }
 *  TestProvider.providerName = "test"
 * ```
 * The providerName is necessary for the provider to be identified.
 */
class BaseProvider {

  /**
   *
   * @param {*} registry - a registry object
   * @param {*} http - a http object (e.g. axios)
   */
  constructor(registry = {}, http = axios) {
    this.registry = registry
    this.http = http
    // Create a dictionary with functionality of registry
    this.has = {
      registries: registry.baseUrl || registry.registries,
      schemes: registry.baseUrl || registry.schemes,
      top: registry.baseUrl || registry.top,
      concepts: registry.baseUrl || registry.concepts,
      types: registry.types,
      narrower: registry.baseUrl || registry.narrower,
      ancestors: registry.baseUrl || registry.ancestors,
      suggest: registry.baseUrl || registry.suggest,
      search: registry.baseUrl || registry.search,
      concordances: registry.concordances,
      mappings: registry.mappings,
      occurrences: registry.occurrences,
      // TODO: - Add entries for saving/editing/deleting mappings.
    }
    // Convert all values into booleans
    _.forOwn(this.has, (value, key) => {
      this.has[key] = value != null
    })
  }

  /**
   * The following are adjustment methods for specific types of objects. These are called by the wrapper functions (those without a leading underscope) to modify the results before returning.
   */
  adjustRegistries(registries) {
    return registries
  }
  adjustSchemes(schemes) {
    return schemes
  }
  adjustConcepts(concepts) {
    return concepts
  }
  adjustConcordances(concordances) {
    return concordances
  }
  adjustMappings(mappings) {
    return mappings
  }

  /**
   * Returns a Promise with a list of registries.
   *
   * By default, the current registry is returned.
   */
  getRegistries(...params) {
    return this._getRegistries(...params)
      .then(this.adjustRegistries)
  }
  _getRegistries() {
    return Promise.resolve([this.registry])
  }

  /**
   * Returns a Promise with a list of supported concept schemes.
   *
   * If registry.schemes is an array, it will be returned, otherwise an empty array will be returned by default.
   */
  getSchemes(...params) {
    return this._getSchemes(...params)
      .then(this.adjustSchemes)
  }
  _getSchemes() {
    if (Array.isArray(this.registry.schemes)) {
      return Promise.resolve(this.registry.schemes)
    }
    return Promise.resolve([])
  }

  /**
   * Returns a Promise with a list of top concepts.
   */
  getTop(...params) {
    return this._getTop(...params)
      .then(this.adjustConcepts)
  }
  _getTop() {
    return Promise.resolve([])
  }

  /**
   * Returns a Promise with a list of concepts.
   */
  getConcepts(...params) {
    return this._getConcepts(...params)
      .then(this.adjustConcepts)
  }
  _getConcepts() {
    return Promise.resolve([])
  }

  /**
   * Returns a Promise with a list of types of concepts.
   */
  getTypes(...params) {
    return this._getTypes(...params)
  }
  _getTypes() {
    return Promise.resolve([])
  }

  /**
   * Returns a Promise with a list of narrower concepts for a concept.
   */
  getNarrower(...params) {
    return this._getNarrower(...params)
      .then(this.adjustConcepts)
  }
  _getNarrower() {
    return Promise.resolve([])
  }

  /**
   * Returns a Promise with a list of ancestor concepts for a concept.
   */
  getAncestors(...params) {
    return this._getAncestors(...params)
      .then(this.adjustConcepts)
  }
  _getAncestors() {
    return Promise.resolve([])
  }

  /**
   * Returns Promise with typeahead suggestions according to the OpenSearch Suggest Format.
   */
  suggest(...params) {
    return this._suggest(...params)
  }
  _suggest() {
    return Promise.resolve(["", [], [], []])
  }

  /**
   * Returns a Promise with a list of search results.
   */
  search(...params) {
    return this._search(...params)
      .then(this.adjustConcepts)
  }
  _search() {
    return Promise.resolve([])
  }

  /**
   * Returns a Promise with a list of concordances.
   */
  getConcordances(...params) {
    return this._getConcordances(...params)
      .then(this.adjustConcordances)
  }
  _getConcordances() {
    return Promise.resolve([])
  }

  /**
   * Returns a Promise with a list of mappings.
   */
  getMappings(...params) {
    return this._getMappings(...params)
      .then(this.adjustMappings)
  }
  _getMappings() {
    return Promise.resolve([])
  }

  /**
   * Saves mappings to the registry. Returns a Promise with a list of mappings that were saved.
   */
  saveMappings(...params) {
    return this._saveMappings(...params)
  }
  _saveMappings() {
    return Promise.resolve([])
  }

  /**
   * Removes mappings from the registry. Returns a Promise with a list of mappings that were removed.
   */
  removeMappings(...params) {
    return this._removeMappings(...params)
  }
  _removeMappings() {
    return Promise.resolve([])
  }

  /**
   * Returns a Promise with a list of occurrences.
   */
  getOccurrences(...params) {
    return this._getOccurrences(...params)
  }
  _getOccurrences() {
    return Promise.resolve([])
  }

  /**
   * Returns a Promise with a list of mappings, occurrences, and mapping suggestions, all converted into mappings.
   *
   * By default, it combines the results of getMappings and getOccurrences.
   *
   * @param {*} selected - an object with selected schemes and concepts, like it's used in Cocoda (*)
   *
   * (*) the selected parameter should have the following form:
   * {
   *   scheme: {
   *     [true]: {...},
   *     [false]: {...}
   *   },
   *   concept: {
   *     [true]: {...},
   *     [false]: {...}
   *   }
   * }
   */
  getAllMappings(params) {
    let { selected } = params
    let mappings = this.getMappings(params)
    let occurrences = this.getOccurrences(params).then(occurrences => {
      // Transform occurrences into mappings
      let mappings = []
      for (let occurrence of occurrences) {
        if (!occurrence) {
          continue
        }
        let mapping = {}
        mapping.from = _.get(occurrence, "memberSet[0]")
        if (mapping.from) {
          mapping.from = { memberSet: [mapping.from] }
        } else {
          mapping.from = null
        }
        mapping.fromScheme = _.get(occurrence, "memberSet[0].inScheme[0]")
        mapping.to = _.get(occurrence, "memberSet[1]")
        if (mapping.to) {
          mapping.to = { memberSet: [mapping.to] }
        } else {
          mapping.to = { memberSet: [] }
        }
        mapping.toScheme = _.get(occurrence, "memberSet[1].inScheme[0]")
        if (selected) {
          // Swap sides if necessary
          if (!jskos.compare(mapping.fromScheme, selected.scheme[true]) && !jskos.compare(mapping.toScheme, selected.scheme[false])) {
            [mapping.from, mapping.fromScheme, mapping.to, mapping.toScheme] = [mapping.to, mapping.toScheme, mapping.from, mapping.fromScheme]
          }
          mapping.toScheme = mapping.toScheme || selected.scheme[false]
        }
        mapping.type = [jskos.defaultMappingType.uri]
        mapping._occurrence = occurrence
        mapping = jskos.addMappingIdentifiers(mapping)
        if (occurrence.database) {
          mapping.creator = [occurrence.database]
        }
        mappings.push(mapping)
      }
      return mappings
    }).catch(error => {
      console.warn(error)
      return []
    })
    return Promise.all([mappings, occurrences]).then(results => {
      return _.union(...results)
    }).then(this.adjustMappings)
  }

}

BaseProvider.providerName = "Base"

export default BaseProvider
