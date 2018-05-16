/**
 * Module for API calls
 * @module components/api
 *
 * Usage:
 * import * as api from './api'
 * api.voc().then(function(data) {
 *   // do something with data
 * }).catch(function(error) {
 *   // do something with error
 * })
 */

import axios from 'axios'

/** URL for API */
const url = 'http://api.dante.gbv.de/'

/** Property sets */
const minimumProperties = '-'
const defaultProperties = 'uri,prefLabel,notation'
const detailProperties =  'uri,prefLabel,notation,identifier,altLabel,definition,license,publisher,created,issued,modified'
const allProperties = '*'

/**
 * Loads all vocabularies or information about a particular vocabulary.
 *
 * @param {string} uri - if null, load all vocabularies
 * @param {string} properties - ignored when uri is null
 * @param {axios.cancelToken} cancelToken - ignored when uri is null
 */
function voc(uri = null, properties = defaultProperties, cancelToken = null) {
  if (uri == null) {
    return get('voc', {})
  } else {
    return data(uri, properties, cancelToken);
  }
}

/**
 * Loads information about a concept or a vocabulary.
 *
 * @param {string} uri
 * @param {string} properties
 * @param {axios.cancelToken} cancelToken
 */
function data(uri, properties = defaultProperties, cancelToken = null) {
  return get('data', {
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
 * @param {string} uri
 * @param {string} properties
 * @param {axios.cancelToken} cancelToken
 */
function narrower(uri, properties = defaultProperties, cancelToken = null) {
  return get('narrower', {
    params: {
      uri: uri,
      properties: properties
    },
    cancelToken: cancelToken
  })
}

/**
 * Loads ancestor hirarchy for a concept.
 *
 * @param {string} uri
 * @param {string} properties
 * @param {axios.cancelToken} cancelToken
 */
function ancestors(uri, properties = defaultProperties, cancelToken = null) {
  return get('ancestors', {
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
 * @param {string} search - search term
 * @param {string} voc - vocabulary id/notation
 * @param {number} limit - limit number of results
 * @param {string} use - whether to include notations, labels, or both ("notation", "label", "notation,label")
 * @param {*} cancelToken
 */
function suggest(search, voc = '', limit = 0, use = "notation,label", cancelToken = null) {
  return get('suggest', {
    params: {
      search: search,
      voc: voc,
      limit: limit,
      use: use
    },
    cancelToken: cancelToken
  })
}

/**
 * Loads top concepts for vocabulary.
 * Note that this will be deprecated as soon as the API offers a way to load top concepts by uri.
 *
 * @param {*} notation
 * @param {*} properties
 * @param {*} cancelToken
 */
function topByNotation(notation, properties = defaultProperties, cancelToken = null) {
  return get(`voc/${notation}/top`, {
    params: {
      properties: properties
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
function get(endpoint, config) {
  return axios.get(url + endpoint, config)
    .then(function(response) {
      return response.data
    })
}

export { voc, data, narrower, ancestors, suggest, topByNotation, get, minimumProperties, defaultProperties, detailProperties, allProperties, url }
