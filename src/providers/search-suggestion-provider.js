import _ from "lodash"
import BaseProvider from "./base-provider"
import jskos from "jskos-tools"

/**
 * Provider for search suggestions.
 *
 * The constructor requires the `registries` property in `options` (second param) which should be all available ConceptApi registries.
 */
class SearchSuggestionProvider extends BaseProvider {

  constructor(...params) {
    super(...params)
    this.has.mappings = true
    this.cache = []
    // Assemble searchUris
    let registries = (params[1] || {}).registries || []
    this.searchUris = {}
    for (let registry of registries) {
      if (registry.search) {
        this.searchUris[registry.uri] = registry.search
      }
    }
  }

  /**
   * Override `supportsScheme` to check whether a search URI is available for the scheme's registry.
   *
   * @param {object} scheme - target scheme to check for support
   */
  supportsScheme(scheme) {
    let targetRegistry = _.get(scheme, "_provider.registry.uri")
    return super.supportsScheme(scheme) && targetRegistry != null && this.searchUris && this.searchUris[targetRegistry]
  }

  _getMappings({ from, to, mode, selected }) {
    if (!this.searchUris || mode != "or" || !selected) {
      return Promise.resolve([])
    }
    let promises = []
    if (from && this.supportsScheme(selected.scheme[false])) {
      promises.push(this.__getMappings(from, selected.scheme[true], selected.scheme[false]))
    }
    if (to && this.supportsScheme(selected.scheme[true])) {
      promises.push(this.__getMappings(to, selected.scheme[false], selected.scheme[true], true))
    }
    return Promise.all(promises).then(results => {
      return _.union(...results)
    })
  }

  /**
   * Internal function to get mapping recommendations for a certain concept with sourceScheme and targetScheme.
   *
   * @param {object} concept
   * @param {object} sourceScheme
   * @param {object} targetScheme
   * @param {boolean} swap - whether to reverse the direction of the mappings
   */
  __getMappings(concept, sourceScheme, targetScheme, swap = false) {
    if (!concept || !sourceScheme || !targetScheme) {
      return Promise.resolve([])
    }
    // If source scheme is the same as target scheme, skip
    if (jskos.compare(sourceScheme, targetScheme)) {
      return Promise.resolve([])
    }
    // Prepare label
    let label = jskos.prefLabel(concept)
    if (!label) {
      return Promise.resolve([])
    }
    // Get results from API or cache
    return this.__getResults(label, targetScheme).then(results => {
      // Map results to actual mappings
      let mappings = results.map(result => ({
        fromScheme: sourceScheme,
        from: { memberSet: [concept] },
        toScheme: targetScheme,
        to: { memberSet: [result] },
        type: ["http://www.w3.org/2004/02/skos/core#mappingRelation"],
      }))
      if (swap) {
        // Swap mapping sides if only `to` was set
        mappings = mappings.map(mapping => Object.assign(mapping, {
          fromScheme: mapping.toScheme,
          from: mapping.to,
          toScheme: mapping.fromScheme,
          to: mapping.from,
        }))
      }
      return mappings
    })
  }

  /**
   * Internal function that either makes an API request or uses a local cache.
   *
   * @param {string} label
   */
  __getResults(label, targetScheme) {
    // Use local cache.
    let resultsFromCache = (this.cache[targetScheme.uri] || {})[label]
    if (resultsFromCache) {
      return Promise.resolve(resultsFromCache)
    }
    // Determine search URI for target scheme's registry
    let targetRegistry = _.get(targetScheme, "_provider.registry.uri")
    let url = targetRegistry != null && this.searchUris && this.searchUris[targetRegistry]
    if (!url || (url.startsWith("http:") && window.location.protocol == "https:")) {
      return Promise.resolve([])
    }
    // API request
    return this.get(url, {
      params: {
        query: label,
        limit: 10,
        voc: targetScheme.uri,
      },
    }).then(data => {
      data = data || []
      // Save result in cache
      if (!this.cache[targetScheme.uri]) {
        this.cache[targetScheme.uri] = {}
      }
      this.cache[targetScheme.uri][label] = data
      return data
    })
  }

}

SearchSuggestionProvider.providerName = "SearchSuggestion"
SearchSuggestionProvider.stored = false

export default SearchSuggestionProvider
