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
import util from "./util"
import store from "./store"

/** Property sets */
const minimumProperties = "-"
const defaultProperties = "uri,prefLabel,notation,inScheme"
const detailProperties =  "uri,prefLabel,notation,inScheme,identifier,altLabel,definition,license,publisher,created,issued,modified,scopeNote,editorialNote"
const allProperties = "*"

let schemes = []

function init() {
  // Prepare all terminology providers
  for (let provider of config.terminologyProviders) {
    let url = provider.url || null, saveSchemePromise = Promise.resolve(null)
    if(!Array.isArray(provider.voc)) {
      // Load schemes
      let vocEndpoint = typeof(provider.voc) === "string" ? provider.voc : url + "/voc"
      if (vocEndpoint) {
        saveSchemePromise = get(vocEndpoint)
          .then(function(data) {
            if (Array.isArray(data)) {
              provider.voc = data
              return provider
            } else {
              console.warn("Couldn't load schemes for provider", provider)
            }
          })
        // TODO: - error handling
      }
    } else {
      saveSchemePromise = Promise.resolve(provider)
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
    // Save scheme in store and in schemes array
    saveSchemePromise.then(provider => {
      if (!provider || !provider.voc) return
      provider.voc.forEach(scheme => {
        // Set provider for scheme
        scheme.PROVIDER = provider
        // Add scheme specific custom properties
        scheme.DETAILSLOADED = false
        scheme.TOPCONCEPTS = [null]
        scheme.type = scheme.type || ["http://www.w3.org/2004/02/skos/core#ConceptScheme"]
        // Check if scheme is already in store
        let otherScheme = store.getters["objects/getObject"](scheme), prio, otherPrio, override = false
        // let otherScheme = null, prio, otherPrio
        if (otherScheme) {
          prio = provider.prio || 0
          otherPrio = otherScheme.provider ? (otherScheme.provider.priority || 0) : -1
          override = otherPrio < prio
        }
        if (!otherScheme || override){
          if (override) {
            // Find and remove scheme from schemes array
            let otherSchemeIndex = -1
            for (let index = 0; index < schemes.length; index += 1) {
              if (util.compareSchemes(scheme, schemes[index])) {
                otherSchemeIndex = index
                break
              }
            }
            schemes.splice(otherSchemeIndex, 1)
          }
          // Force save into store
          store.dispatch({
            type: "objects/save",
            object: scheme,
            force: true
          })
          // Save into schemes array
          schemes.push(scheme)
        }
      })
    })
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
  let provider = scheme ? scheme.PROVIDER : null
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
  let provider = scheme ? scheme.PROVIDER : null
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
  let provider = scheme ? scheme.PROVIDER : null
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
  let provider = scheme ? scheme.PROVIDER : null
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
  let provider = scheme ? scheme.PROVIDER : null
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
 * @param {axios.config} axiosConfig - configuration object for axios call, usually contains params and cancelToken
 */
function get(url, axiosConfig) {
  if (!axiosConfig) {
    axiosConfig = {
      params: {}
    }
  }
  axiosConfig.params.language = axiosConfig.params.language || config.language
  return axios.get(url, axiosConfig)
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
          if(util.isConcept(element)) {
            element.ISOPEN = false
            element.DETAILSLOADED = false
            element.OCCURRENCES = null
            element.MAPPINGS = null
            element.ancestors = element.ancestors || [null]
            element.narrower = element.narrower || [null]
            element.editorialNote = element.editorialNote || null
            // reorder scopeNotes and editorialNotes
            if (element.scopeNote) {
              for (let lang of Object.keys(element.scopeNote)) {
                if (Array.isArray(element.scopeNote[lang])) {
                  element.scopeNote[lang] = element.scopeNote[lang].sort()
                }
              }
            }
            if (element.editorialNote) {
              for (let lang of Object.keys(element.editorialNote)) {
                if (Array.isArray(element.editorialNote[lang])) {
                  element.editorialNote[lang] = element.editorialNote[lang].sort()
                }
              }
            }
          }
        }
      })
      return data
    })
}

function mappings(params) {
  if (config.mappingProviders.length == 0) {
    return Promise.resolve([])
  }
  return axios.get(config.mappingProviders[0].url, {
    params: params
  }).then(response => {
    for (let mapping of response.data) {
      mapping.type = mapping.type || [util.defaultMappingType.uri]
    }
    return response.data
  })
}

export default { init, data, narrower, ancestors, suggest, top, get, minimumProperties, defaultProperties, detailProperties, allProperties, token, schemes, mappings }
