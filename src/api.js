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
import jskos from "jskos-tools"
import store from "./store"

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
  }).then(results => {
    for (let result of results) {
      if (jskos.isConcept(result)) {
        if (!jskos.validate.concept(result)) {
          console.warn("API: Invalid JSKOS for concept", result)
        }
      } else {
        if (!jskos.validate.scheme(result)) {
          console.warn("API: Invalid JSKOS for scheme", result)
        }
      }
    }
    return results
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
  }).then(results => {
    for (let result of results) {
      if (!jskos.validate.concept(result)) {
        console.warn("API: Invalid JSKOS for concept", result)
      }
    }
    return results
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
  }).then(results => {
    for (let result of results) {
      if (!jskos.validate.concept(result)) {
        console.warn("API: Invalid JSKOS for concept", result)
      }
    }
    return results
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
function suggest(scheme, search, limit = 0, use = "notation,label", cancelToken = null) {
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
      voc: scheme.uri,
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
  }).then(results => {
    for (let result of results) {
      if (!jskos.validate.concept(result)) {
        console.warn("API: Invalid JSKOS for concept", result)
      }
    }
    return results
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
    }).catch(error => {
      console.log("API-Error:", error)
      return null
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
        // Add mapping type if not available
        mapping.type = mapping.type || [util.defaultMappingType.uri]
        // Add JSKOS mapping identifiers
        mapping = jskos.addMappingIdentifiers(mapping)
        mappings.push(mapping)
      }
    }
    return mappings
  }).then(mappings => {
    for (let mapping of mappings) {
      if (!jskos.validate.mapping(mapping)) {
        console.warn("API: Invalid JSKOS for mapping", mapping)
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
    if (params.identifier) {
      mappings = mappings.filter(mapping => {
        return params.identifier.split("|").map(identifier => {
          return (mapping.identifier || []).includes(identifier)
        }).reduce((current, total) => current || total)
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
  if (!mapping.fromScheme || !mapping.toScheme) {
    return Promise.reject("Can't save mapping: Missing fromScheme or toScheme.")
  }
  mapping.LOCAL = true

  return getLocalMappings().then(mappings => {
    mapping = jskos.addMappingIdentifiers(mapping)
    // Override local mappings with same members
    // FIXME: This is only temporary to demonstrate local saving of mappings. The actual solution to this problem may be way more complicated.
    mappings = mappings.filter(m => {
      let findContentId = id => id.startsWith("urn:jskos:mapping:members:")
      let id1 = m.identifier ? m.identifier.find(findContentId) : null
      let id2 = mapping.identifier ? mapping.identifier.find(findContentId) : null
      return id1 == null || id2 == null || id1 != id2
    })
    // Add mapping
    mappings.push(mapping)
    // FIXME: This fixes old invalid mappings in local storage and should be removed later.
    for (let mapping of mappings) {
      if (mapping.creator) {
        let creators = []
        for (let creator of mapping.creator) {
          if (typeof creator === "object") {
            creators.push(creator)
          } else {
            creators.push({ prefLabel: { de: creator } })
            console.log("Fixed mapping in local storage.")
          }
        }
        if (creators.length) {
          mapping.creator = creators
        }
      }
    }
    return saveMappings(mappings)
  })
}

function saveMappings(mappings) {
  return localforage.setItem("mappings", mappings)
}

function removeMapping(mapping) {
  let previousNumberOfMappings = 0
  return getLocalMappings().then(mappings => {
    previousNumberOfMappings = mappings.length
    // Remove by content identifier
    mappings = mappings.filter(m => {
      let findContentId = id => id.startsWith("urn:jskos:mapping:content:")
      let id1 = m.identifier ? m.identifier.find(findContentId) : null
      let id2 = mapping.identifier ? mapping.identifier.find(findContentId) : null
      return id1 == null || id2 == null || id1 != id2
    })
    return localforage.setItem("mappings", mappings)
  }).then(mappings => {
    let removed = previousNumberOfMappings > mappings.length
    if (removed) {
      // Check Vuex if original mapping was the same as deleted mapping; if yes, clear original mapping.
      if (jskos.compareMappings(mapping, store.state.mapping.original)) {
        store.commit({
          type: "mapping/set",
          original: null
        })
      }
    }
    return removed
  })
}

export default { data, narrower, ancestors, suggest, top, get, minimumProperties, defaultProperties, detailProperties, allProperties, token, getMappings, getLocalMappings, saveMapping, saveMappings, removeMapping }
