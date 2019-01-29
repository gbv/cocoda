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
 *  TestProvider.providerName = "Test"
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
      canSaveMappings: registry.canSaveMappings,
      canRemoveMappings: registry.canRemoveMappings,
    }
    // Convert all values into booleans
    _.forOwn(this.has, (value, key) => {
      this.has[key] = _.isBoolean(value) ? value : value != null
    })
    // Set languages
    this.defaultLanguage = "de,en,es,nl,it,fi,pl,ru,cs,jp"
    this.language = this.defaultLanguage
    // Set properties
    this.properties = {
      minimum: "-",
      default: "uri,prefLabel,notation,inScheme",
      detail: "uri,prefLabel,notation,inScheme,identifier,altLabel,definition,license,publisher,created,issued,modified,scopeNote,editorialNote",
      all: "*",
    }
    this.auth = null
    // Save modified http methods
    this.request = (method, url, data, options, cancelToken) => {
      // Don't perform http requests if site is used via https
      if (url.startsWith("http:") && window.location.protocol == "https:") {
        return Promise.resolve([])
      }
      options = options || {}
      options.cancelToken = cancelToken
      let language = _.get(options, "params.language") || this.language || this.defaultLanguage
      _.set(options, "params.language", language)
      // Try 5 times with 1.5 second delay
      let retryCount = 5, retryDelay = 1500
      let tryRequest = (tries) => {
        if (tries == 0) {
          return Promise.reject("No retries left.")
        }
        // Set auth
        if (this.registry.auth && this.auth) {
          options.auth = this.auth
        }
        tries -= 1
        let promise
        if (method == "get") {
          promise = http.get(url, options)
        } else if (method == "post") {
          promise = http.post(url, data, options)
        } else if (method == "put") {
          promise = http.put(url, data, options)
        } else if (method == "patch") {
          promise = http.patch(url, data, options)
        } else if (method == "delete") {
          promise = http.delete(url, options)
        } else {
          promise = Promise.reject("No method called " + method)
        }
        return promise.then(response => {
          return response.data
        }).catch(error => {
          if (_.get(error, "response.status") === 401 && tries > 0) {
            console.warn(`API authorization error => trying again! (${tries})`)
            return new Promise(resolve => { setTimeout(() => { resolve() }, retryDelay) }).then(() => {
              return tryRequest(tries)
            })
          } else {
            throw error
          }
        })
      }
      return tryRequest(retryCount).catch(error => {
        console.warn("API error:", error)
        return undefined
      })
    }
    this.get = (url, options, cancelToken) => {
      return this.request("get", url, null, options, cancelToken)
    }
    this.post = (url, data, options, cancelToken) => {
      return this.request("post", url, data, options, cancelToken)
    }
    this.put = (url, data, options, cancelToken) => {
      return this.request("put", url, data, options, cancelToken)
    }
    this.patch = (url, data, options, cancelToken) => {
      return this.request("patch", url, data, options, cancelToken)
    }
    this.delete = (url, options, cancelToken) => {
      return this.request("delete", url, null, options, cancelToken)
    }

    /**
     * The following are adjustment methods for specific types of objects. These are called by the wrapper functions (those without a leading underscope) to modify the results before returning.
     * These are defined in the constructor so that they will have access to "this".
     */
    this.adjustConcepts = (concepts) => {
      for (let concept of concepts) {
        // Add _getNarrower function to concepts
        concept._getNarrower = () => {
          return this.getNarrower(concept)
        }
        // Add _getAncestors function to concepts
        concept._getAncestors = () => {
          return this.getAncestors(concept)
        }
        // Add _getDetails function to concepts
        concept._getDetails = () => {
          return this.getDetails(concept)
        }
      }
      return concepts
    }
    this.adjustRegistries = (registries) => {
      return registries
    }
    this.adjustSchemes = (schemes) => {
      for (let scheme of schemes) {
        // Add _getTop function to schemes
        scheme._getTop = () => {
          return this.getTop(scheme)
        }
        // Add _getTypes function to schemes
        scheme._getTypes = () => {
          return this.getTypes(scheme)
        }
        // Add _provider to schemes
        scheme._provider = this
        // Add _suggest function to schemes
        scheme._suggest = (search) => {
          return this.suggest(search, scheme)
        }
      }
      return schemes
    }
    this.adjustConcordances = (concordances) => {
      return concordances
    }
    this.adjustMapping = (mapping) => {
      // Add fromScheme and toScheme if missing
      for (let side of ["from", "to"]) {
        let sideScheme = `${side}Scheme`
        if (!mapping[sideScheme]) {
          mapping[sideScheme] = _.get(jskos.conceptsOfMapping(mapping, side), "[0].inScheme[0]")
        }
      }
      mapping._provider = this
      if (!mapping.identifier) {
        // Add mapping identifiers for this mapping
        let identifier = _.get(jskos.addMappingIdentifiers(mapping), "identifier")
        if (identifier) {
          mapping.identifier = identifier
        }
      }
      return mapping
    }
    this.adjustMappings = (mappings) => {
      return mappings.map(mapping => this.adjustMapping(mapping))
    }
  }

  getCancelToken() {
    return axios.CancelToken.source()
  }

  setAuth(auth) {
    this.auth = auth
  }

  /**
   * Returns a Promise with a list of registries.
   *
   * By default, the current registry is returned.
   *
   * Usually, this method has no parameters.
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
   *
   * Usually, this method has no parameters.
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
   *
   * Usually, this method has one parameter `scheme` (JSKOS object).
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
   *
   * Usually, this method has two parameters:
   * - 1. A list of JSKOS concepts to be retrieved from the API.
   * - 2. An options object currently supporting only a `properties` field which defaults to this.properties.default.
   * Note that this might change in the future.
   */
  getConcepts(...params) {
    return this._getConcepts(...params)
      .then(this.adjustConcepts)
  }
  _getConcepts() {
    return Promise.resolve([])
  }

  /**
   * Wrapper around getConcepts that returns detailed properties.
   */
  getDetails(concepts) {
    return this.getConcepts(concepts, { properties: this.properties.detail })
  }

  /**
   * Returns a Promise with a list of types of concepts.
   *
   * Usually, this method has one parameter `scheme` (JSKOS object).
   */
  getTypes(...params) {
    return this._getTypes(...params)
  }
  _getTypes() {
    return Promise.resolve([])
  }

  /**
   * Returns a Promise with a list of narrower concepts for a concept.
   *
   * Usually, this method has one parameter `concept` (JSKOS object).
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
   *
   * Usually, this method has one parameter `concept` (JSKOS object).
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
   *
   * Usually, this method has two parameters:
   * 1. A search string.
   * 2. A params/options object with the following fields:
   *    - scheme: if the search should be restricted by scheme
   *    - limit: number of results returned
   *    - types: an array of type URIs
   *    - cancelToken: an axios cancel token (e.g. provided by provider.cancelToken)
   */
  suggest(...params) {
    return this._suggest(...params)
  }
  _suggest() {
    return Promise.resolve(["", [], [], []])
  }

  /**
   * Returns a Promise with a list of search results.
   *
   * Usually, this method has the same parameters as `suggest`.
   * Note that this might change in the future.
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
   *
   * Usually, this method has no parameters.
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
   *
   * Usually, this method has one parameter which is an object containing some of the following fields:
   * - from: a JSKOS concept from which to map
   * - to: a JSKOS concept to which to map
   * - direction: one of `forward`, `backward`, or `both`
   * - mode: one of `and` or `or`
   * - identifier: a string of identifiers separated by `|`
   * - options: a raw options object for the GET request
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
   *
   * Usually, this method has one parameter which is a list of JSKOS mappings to be saved.
   */
  saveMappings(...params) {
    // Adjust created or modified date of mappings to be saved
    let promises = []
    if (Array.isArray(params[0])) {
      for (let { mapping, original } of params[0]) {
        promises.push(this.saveMapping(mapping, original))
      }
    }
    return Promise.all(promises).then(mappings => {
      return mappings
    })
  }

  /**
   * Saves a single mapping to the registry.
   * If `original` is given, there will be an attempt to find the original in the registry and override it.
   * Otherwise, the mapping will be saved as a new mapping.
   *
   * @param {*} mapping
   * @param {*} original
   */
  saveMapping(mapping, original) {
    if (!mapping) {
      return Promise.resolve(null)
    }
    if (!mapping.created) {
      mapping.created = (new Date()).toISOString()
    } else {
      mapping.modified = (new Date()).toISOString()
    }
    mapping = jskos.minifyMapping(mapping)
    mapping = jskos.addMappingIdentifiers(mapping)
    return this._saveMapping(mapping, original).then(this.adjustMapping).catch(() => null)
  }

  _saveMapping() {
    return Promise.resolve(null)
  }

  /**
   * Removes mappings from the registry. Returns a Promise with a list of booleans (true if removed) corresponding to the indexes in the mappings array.
   *
   * @param {Array} mappings
   */
  removeMappings(mappings) {
    let promises = []
    for (let mapping of mappings || []) {
      promises.push(this.removeMapping(mapping))
    }
    return Promise.all(promises)
  }

  /**
   * Removes a single mapping.
   *
   * @param {Object} mapping
   */
  removeMapping(mapping) {
    if (!mapping) {
      return
    }
    return this._removeMapping(mapping)
  }

  _removeMapping() {
    return Promise.resolve(false)
  }

  /**
   * Returns a Promise with a list of occurrences.
   *
   * Usually, this method has one parameter which is an object containing some of the following fields:
   * - from: a JSKOS concept for which to search for occurrences (for compatibility with getMappings)
   * - to: a JSKOS concept for which to search for occurrences (for compatibility with getMappings)
   * - concepts: a list of JSKOS concepts for which to search for occurrences
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
   * This method should have the same parameter as `getMappings`, with an additional field `selected` (see * below).
   *
   * (*) The selected parameter allows this method to rearrange occurrences based on already selected concept schemes. It should have the following form (same as in Cocoda):
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
