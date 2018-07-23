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
import localforage from "localforage"
import config from "./config"
import util from "./util"

/** Property sets */
const minimumProperties = "-"
const defaultProperties = "uri,prefLabel,notation,inScheme"
const detailProperties =  "uri,prefLabel,notation,inScheme,identifier,altLabel,definition,license,publisher,created,issued,modified,scopeNote,editorialNote"
const allProperties = "*"

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
      return data
    })
}

function getMappings(params) {
  let promises = []
  for (let provider of config.mappingProviders) {
    let promise = axios.get(provider.url, {
      params: params
    }).then(response => response.data)
    promises.push(promise)
  }
  promises.push(getLocalMappings(params))
  return Promise.all(promises).then(results => {
    let mappings = []
    for (let result of results) {
      for (let mapping of result) {
        mapping.type = mapping.type || [util.defaultMappingType.uri]
        mappings.push(mapping)
      }
    }
    return mappings
  })
}

function getLocalMappings(params = {}) {
  return localforage.getItem("mappings").then(mappings => mappings || []).catch(() => []).then(mappings => {
    // Filter mappings according to params (support for from + to)
    // TODO: - Support more parameters.
    // TODO: - Move to its own things.
    // TODO: - Support memberList and memberChoice.
    if (params.from) {
      mappings = mappings.filter(mapping => {
        return null != mapping.from.memberSet.find(concept => {
          return concept.uri == params.from
        })
      })
    }
    if (params.to) {
      mappings = mappings.filter(mapping => {
        return null != mapping.to.memberSet.find(concept => {
          return concept.uri == params.to
        })
      })
    }
    return mappings
  }).then(mappings => {
    // Add "LOCAL = true" for all mappings.
    // FIXME: Do this differently.
    mappings.forEach(mapping => {
      mapping.LOCAL = true
    })
    return mappings
  })
}

function saveMapping(mapping) {
  // Check for fromScheme and toScheme
  // TODO: Update mapping if possible (might need an additional parameter).
  if (!mapping.fromScheme || !mapping.toScheme) {
    return Promise.reject("Can't save mapping: Missing fromScheme or toScheme.")
  }

  return getLocalMappings().then(mappings => {
    mappings.push(mapping)
    return localforage.setItem("mappings", mappings)
  })
}

function removeMapping(mappingToRemove) {
  // FIXME: Remove by identifier
  let previousNumberOfMappings
  return getLocalMappings().then(mappings => {
    previousNumberOfMappings = mappings.length
    let newMappings = []
    for (let mapping of mappings) {
      let remove = true
      if (mapping.from.memberSet[0].uri != mappingToRemove.from.memberSet[0].uri) {
        remove = false
      }
      let toUris1 = mapping.to.memberSet.reduce((total, current) => total.concat([current.uri]), []).sort()
      let toUris2 = mappingToRemove.to.memberSet.reduce((total, current) => total.concat([current.uri]), []).sort()
      if (!_.isEqual(toUris1, toUris2)) {
        remove = false
      }
      if (!_.isEqual(mapping.type, mappingToRemove.type)) {
        remove = false
      }
      if (!remove) {
        newMappings.push(mapping)
      }
    }
    return localforage.setItem("mappings", newMappings)
  }).then(mappings => {
    return previousNumberOfMappings > mappings.length
  })
}

export default { data, narrower, ancestors, suggest, top, get, minimumProperties, defaultProperties, detailProperties, allProperties, token, getMappings, saveMapping, removeMapping }
