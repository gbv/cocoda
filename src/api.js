/**
 * Module for API calls
 * @module components/api
 *
 * Usage:
 * this.$api.data(scheme, uri).then(function(data) {
 *   // do something with data
 * }).catch(function(error) {
 *   // do something with error
 * })
 *
 * Note: All requests need a scheme object to determine which terminology provider to use.
 */

import axios from "axios"
import config from "./config"

/** URL for API */
const url = config.terminologyProviders[0].url

/** Property sets */
const minimumProperties = "-"
const defaultProperties = "uri,prefLabel,notation,inScheme"
const detailProperties =  "uri,prefLabel,notation,inScheme,identifier,altLabel,definition,license,publisher,created,issued,modified,scopeNote,editorialNote"
const allProperties = "*"

let schemes = []

// Initialize terminology providers
let schemeToTerminologyProvider = {}
/**
 * Uses schemeToTerminologyProvider to return the terminology provider for a specific scheme.
 *
 * @param {object} scheme
 */
let terminologyProviderForScheme = function(scheme) {
  for(let uri of [scheme.uri].concat(scheme.identifier || [])) {
    // Workaround for http vs. https problem
    let uri2
    if (uri.substring(0, 5) == "https") {
      uri2 = uri.replace("https", "http")
    } else {
      uri2 = uri.replace("http", "https")
    }
    for (let uri3 of [uri, uri2]) {
      // Workaround for / vs. no / problem
      let uri4
      if (uri3.endsWith("/")) {
        uri4 = uri3.substring(0, uri3.length - 1)
      } else {
        uri4 = uri3 + "/"
      }
      for (let uri5 of [uri3, uri4]) {
        if (schemeToTerminologyProvider[uri5]) {
          return schemeToTerminologyProvider[uri5]
        }
      }
    }
  }
  // Return null if no provider was found
  return null
}
/**
 * Saves the scheme to provider association for all schemes in provider.voc (need to be loaded before).
 *
 * @param {object} provider
 */
let saveSchemeAssociationForProvider = function(provider) {
  // Schemes need to be loaded first
  if(!Array.isArray(provider.voc)) {
    throw "Provider's vocabularies need to be loaded before using saveSchemeAssociationForProvider."
  }
  // Save assignment from scheme to provider
  for(let scheme of provider.voc) {
    for(let uri of [scheme.uri].concat(scheme.identifier || [])) {
      schemeToTerminologyProvider[uri] = provider
    }
    // Add scheme specific custom properties
    scheme.DETAILSLOADED = false
    schemes.push(scheme)
  }
}

// Prepare all terminology providers
for (let provider of config.terminologyProviders) {
  let url = provider.url || null
  if(!Array.isArray(provider.voc)) {
    // Load schemes
    let vocEndpoint = typeof(provider.voc) === "string" ? provider.voc : url + "/voc"
    if (vocEndpoint) {
      get(vocEndpoint)
        .then(function(data) {
          if (Array.isArray(data)) {
            provider.voc = data
            saveSchemeAssociationForProvider(provider)
          } else {
            console.log("Couldn't load schemes for provider", provider)
          }
        })
      // TODO: - error handling
    }
  } else {
    saveSchemeAssociationForProvider(provider)
  }
  if (!provider.data) {
    provider.data = url ? url + "/data" : null
  }
  if (!provider.suggest) {
    provider.suggest = url ? url + "/suggest" : null
  }
  if (!provider.top) {
    provider.top = url ? url + "/voc/top" : null
  }
  if (!provider.ancestors) {
    provider.ancestors = url ? url + "/ancestors" : null
  }
  if (!provider.narrower) {
    provider.narrower = url ? url + "/narrower" : null
  }
}

/**
 * Returns a new axios CancelToken source
 */
function token() {
  return axios.CancelToken.source()
}

/**
 * Loads information about a concept or a vocabulary.
 *
 * @param {object} scheme - scheme for which this request is about
 * @param {string} uri
 * @param {string} properties
 * @param {axios.cancelToken} cancelToken
 */
function data(scheme, uri, properties = defaultProperties, cancelToken = null) {
  let provider = terminologyProviderForScheme(scheme)
  let url = provider ? provider.data : null
  if (!url) {
    return Promise.resolve([])
  }
  return get(url, {
    params: {
      uri: uri,
      properties: properties
    },
    cancelToken: cancelToken
  })
}

/**
 * Loads direct children for a concept.
 *
 * @param {object} scheme - scheme for which this request is about
 * @param {string} uri
 * @param {string} properties
 * @param {axios.cancelToken} cancelToken
 */
function narrower(scheme, uri, properties = defaultProperties, cancelToken = null) {
  let provider = terminologyProviderForScheme(scheme)
  let url = provider ? provider.narrower : null
  if (!url) {
    return Promise.resolve([])
  }
  return get(url, {
    params: {
      uri: uri,
      properties: properties,
      limit: 10000
    },
    cancelToken: cancelToken
  })
}

/**
 * Loads ancestor hirarchy for a concept.
 *
 * @param {object} scheme - scheme for which this request is about
 * @param {string} uri
 * @param {string} properties
 * @param {axios.cancelToken} cancelToken
 */
function ancestors(scheme, uri, properties = defaultProperties, cancelToken = null) {
  let provider = terminologyProviderForScheme(scheme)
  let url = provider ? provider.ancestors : null
  if (!url) {
    return Promise.resolve([])
  }
  return get(url, {
    params: {
      uri: uri,
      properties: properties
    },
    cancelToken: cancelToken
  })
}

/**
 * Loads autocomplete suggestions.
 *
 * @param {object} scheme - scheme for which this request is about
 * @param {string} search - search term
 * @param {string} voc - vocabulary id/notation
 * @param {number} limit - limit number of results
 * @param {string} use - whether to include notations, labels, or both ("notation", "label", "notation,label")
 * @param {*} cancelToken
 */
function suggest(scheme, search, voc = "", limit = 0, use = "notation,label", cancelToken = null) {
  let provider = terminologyProviderForScheme(scheme)
  let url = provider ? provider.suggest : null
  if (!url) {
    return Promise.resolve([])
  }
  // Support for URL template with {searchTerms}
  url = url.replace("{searchTerms}", search)
  return get(url, {
    params: {
      search: search,
      voc: voc,
      limit: limit,
      count: limit, // Some endpoints use count instead of limit
      use: use
    },
    cancelToken: cancelToken
  })
}

/**
 * Loads top concepts for vocabulary.
 *
 * @param {object} scheme - scheme for which this request is about
 * @param {*} uri
 * @param {*} properties
 * @param {*} cancelToken
 */
function top(scheme, properties = defaultProperties, cancelToken = null) {
  let provider = terminologyProviderForScheme(scheme)
  let url = provider ? provider.top : null
  if (!url || !scheme.uri) {
    return Promise.resolve([])
  }
  return get(url, {
    params: {
      uri: scheme.uri,
      properties: properties,
      limit: 10000
    },
    cancelToken: cancelToken
  })
}

/**
 * Wrapper for axios.get.
 *
 * @param {string} endpoint - API endpoint to use
 * @param {axios.config} config - configuration object for axios call, usually contains params and cancelToken
 */
function get(url, config) {
  return axios.get(url, config)
    .then(function(response) {
      let data = response.data
      // Temporary fix for bug in DANTE dev-api
      if (!Array.isArray(data)) {
        if (data[0] == "<") {
          try {
            data = JSON.parse(data.substring(data.indexOf("[")))
          } catch(error) {
            // Return raw data
            return data
          }
        }
      }
      data.forEach(element => {
        if (element !== null && typeof element === "object") {
          // For concepts, add custom properties
          if(element.type && Array.isArray(element.type) && element.type.length > 0 && element.type[0] == "http://www.w3.org/2004/02/skos/core#Concept") {
            element.ISOPEN = false
            element.DETAILSLOADED = false
            element.OCCURRENCES = null
            element.MAPPINGS = null
            element.ancestors = element.ancestors || [null]
            element.narrower = element.narrower || [null]
          }
        }
      })
      return data
    })
}

export default { data, narrower, ancestors, suggest, top, get, minimumProperties, defaultProperties, detailProperties, allProperties, url, token, schemes }
