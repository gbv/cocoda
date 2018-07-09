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

/**
 * An object to provide all functionality in regards to objects (schemes, concepts)
 */
let objects = {

  // This maps object's URIs to their respective object
  map: new Map(),

  /**
   * Saves an object into the map if it doesn't exist.
   *
   * @param {object} object - the object to be saved in the map
   * @param {boolean} force - override object reference if true
   *
   * @returns a boolean whether the object was saved
   */
  save(object, force = false) {
    let uris = util.getAllUris(object)
    let save = true
    // First, check if any if the URIs is already in the map
    for (let uri of uris) {
      save = save && (!this.map.has(uri) || force)
    }
    // Only save if it was not found
    if (save) {
      // Add to map
      for (let uri of uris) {
        this.map.set(uri, object)
      }
      // Add all possible properties to ensure reactivity in Vue
      if (util.isConcept(object)) {
        object.DETAILSLOADED = false
        object.BROADERLOADED = false
        object.GNDTERMS = null
        object.ISOPEN = false
        object.MAPPINGS = object.MAPPINGS || null
        object.ancestors = object.ancestors || [null]
        object.broader = object.broader || [null]
        object.narrower = object.narrower || [null]
        object.editorialNote = object.editorialNote || null
        object.scopeNote = object.scopeNote || null
        object.created = object.created || null
        object.issued = object.issued || null
        object.modified = object.modified || null
        object.license = object.license || null
        object.notation = object.notation || null
        object.prefLabel = object.prefLabel || {}
        object.publisher = object.publisher || null
        if (!object.inScheme) {
          object.inScheme = [scheme]
        } else {
          let inScheme = []
          for (let scheme of object.inScheme) {
            for (let uri of util.getAllUris(scheme)) {
              let schemeInMap = this.map.get(uri)
              let alreadyAdded = false
              for (let schemeInScheme of inScheme) {
                if (schemeInMap && this.compare(schemeInMap.uri, schemeInScheme.uri)) {
                  alreadyAdded = true
                }
              }
              if (!alreadyAdded && schemeInMap) {
                inScheme.push(schemeInMap)
              }
            }
          }
          object.inScheme = inScheme
        }
      } else if (util.isScheme(object)) {
        object.DETAILSLOADED = false
        object.TOPCONCEPTS = object.TOPCONCEPTS || [null]
        object.created = object.created || null
        object.issued = object.issued || null
        object.modified = object.modified || null
        object.license = object.license || null
        object.notation = object.notation || null
        object.prefLabel = object.prefLabel || {}
        object.publisher = object.publisher || null
      }
    }
    return save
  },

  /**
   * Returns a Promise of an object for an URI. Either gets it from the map or loads it using the API.
   *
   * @param {string} uri
   * @param {string} schemeUri
   *
   * @returns a Promise of the desired object (or null if it wasn't found)
   */
  get(uri, schemeUri) {
    console.log("newApi/get", uri, schemeUri)
    if (this.map.has(uri)) {
      console.log("newApi/get Immediately return")
      return Promise.resolve(this.map.get(uri))
    } else {
      // TODO: Rethink all of this
      let scheme
      if (this.map.has(schemeUri)) {
        scheme = this.map.get(schemeUri)
      } else {
        console.warn("newApi/get No scheme found for", uri, schemeUri)
        scheme = null
      }
      console.log("newApi/get, data with", scheme)
      return data(scheme, uri).then(results => {
        if (results.length) {
          let object = results[0]
          if (this.save(object)) {
            return object
          } else {
            // Apparently, object was loaded elsewhere in the meantime
            console.warn("newApi/get, data loaded, but couldn't save", uri)
            return this.map.get(uri)
          }
        } else {
          return null
        }
      }).catch(error => {
        console.error(error)
        return null
      })
    }
  },

  /**
   * Checks if two URIs are the same object
   *
   * @param {string} uri1
   * @param {string} uri2
   *
   * @returns a boolean
   */
  compare(uri1, uri2) {
    return util.compareObjects(this.map.get(uri1), this.map.get(uri2))
  },

  /**
   * Loads top concepts for scheme
   *
   * @param {object} scheme
   *
   * @returns a Promise with the updated scheme
   */
  top(scheme) {
    if (!scheme || (scheme.TOPCONCEPTS && !scheme.TOPCONCEPTS.includes(null))) {
      console.log("newApi/top: Immediately return")
      return Promise.resolve(scheme)
    } else {
      return top(scheme).then(results => {
        if (scheme.TOPCONCEPTS && !scheme.TOPCONCEPTS.includes(null)) {
          console.log("newApi/top: loaded elsewhere")
          return scheme
        }
        console.log("newApi/top: loaded", results)
        let top = []
        for (let result of results) {
          let resultInMap = this.map.get(result.uri)
          if (resultInMap) {
            top.push(resultInMap)
          } else {
            // Save into map
            this.save(result)
            top.push(result)
          }
        }
        // Set ancestors to []
        for (let concept of top) {
          concept.ancestors = []
        }
        scheme.TOPCONCEPTS = util.sortConcepts(top)
        console.log("newApi/top: saved", scheme)
        return scheme
      }).catch(error => {
        console.error(error)
        return null
      })
    }
  },

  /**
   * Loads narrower concepts for an object if necessary.
   *
   * @param {object} object
   *
   * @returns a Promise with the updated object
   */
  narrower(object) {
    console.log("narrower for", object)
    if (object.narrower && !object.narrower.includes(null)) {
      console.log("newApi/narrower: Immediately return")
      return Promise.resolve(object)
    } else if (!object.inScheme || object.inScheme.length == 0) {
      console.warn("newApi/narrower: No scheme found")
      return Promise.resolve(object)
    } else {
      // Load narrower
      let scheme = object.inScheme[0]
      return narrower(scheme, object.uri).then(results => {
        if (object.narrower && !object.narrower.includes(null)) {
          // Apparrently, narrower were loaded elsewhere, so abort
          console.log("newApi/narrower: loaded elsewhere")
          return object
        }
        console.log("newApi/narrower: loaded")
        // Integrate resulting concepts into map
        let narrower = []
        for (let result of results) {
          let resultInMap = this.map.get(result.uri)
          if (resultInMap) {
            narrower.push(resultInMap)
          } else {
            // Save into map
            this.save(result)
            narrower.push(result)
          }
        }
        // Set ancestors
        for (let child of narrower) {
          if (!object.ancestors || object.ancestors.includes(null)) {
            child.ancestors = [null]
          } else {
            child.ancestors = object.ancestors.concat([object])
          }
        }
        // Set broader
        for (let child of narrower) {
          child.broader = [object]
        }
        // Save narrower
        object.narrower = util.sortConcepts(narrower)
        return object
      }).catch(error => {
        console.error(error)
        return null
      })
    }
  },

  /**
   * Loads ancestor concepts for an object if necessary
   *
   * @param {object} object
   *
   * @returns a Promise with the updated object
   */
  ancestors(object) {
    console.log("ancestors for", object)
    if (object.ancestors && !object.ancestors.includes(null)) {
      console.log("newApi/ancestors: Immediately return")
      return Promise.resolve(object)
    } else if (!object.inScheme || object.inScheme.length == 0) {
      console.warn("newApi/ancestors: No scheme found")
      return Promise.resolve(object)
    } else {
      let scheme = object.inScheme[0]
      return ancestors(scheme, object.uri).then(results => {
        if (object.ancestors && !object.ancestors.includes(null)) {
          // Apparrently, ancestors were loaded elsewhere, so abort
          console.log("newApi/ancestors: loaded elsewhere")
          return object
        }
        console.log("newApi/ancestors: loaded")
        // Integrate resulting concepts into map
        let ancestors = []
        for (let result of results) {
          let resultInMap = this.map.get(result.uri)
          if (resultInMap) {
            ancestors.push(resultInMap)
          } else {
            // Save into map
            this.save(result)
            ancestors.push(result)
          }
        }
        // Set ancestors and broader of ancestors
        let currentAncestors = []
        for (let ancestor of ancestors) {
          ancestor.ancestors = currentAncestors.slice()
          ancestor.broader = currentAncestors.length > 0 ? [currentAncestors[currentAncestors.length - 1]] : []
          currentAncestors.push(ancestor)
        }
        // Save ancestors
        object.ancestors = ancestors
        return object
      }).catch(error => {
        console.error(error)
        return null
      })
    }
  },

  /**
   * Loads detailed properties for an object if necessary
   *
   * @param {object} object
   *
   * @returns a Promise with the updated object
   */
  details(object) {
    console.log("newApi/details", object)
    if (!object || object.DETAILSLOADED) {
      console.log("newApi/details immeditately return")
      return Promise.resolve(object)
    } else {
      console.log("newApi/details load")
      return data(object.inScheme ? object.inScheme[0] : object, object.uri, detailProperties).then(results => {
        if (results.length) {
          let detail = results[0]
          // Integrate detail into object
          for (let prop of Object.keys(detail)) {
            if (object[prop] == null) {
              object[prop] = detail[prop]
            }
          }
          object.DETAILSLOADED = true
          console.log("newApi/details loaded")
          return object
        } else {
          return null
        }
      }).catch(error => {
        console.error(error)
        return null
      })
    }
  }

}

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
  let defaultProvider = config.terminologyProviders[0]
  if (!scheme) return defaultProvider
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
  // Default to the first terminology provider in config
  return defaultProvider
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
    let uris = util.getAllUris(scheme)
    // Check if any of the scheme's URIs have already been saved
    // Priorities can be set in the config file. Just add a new property "priority" to the providers. Default is 0.
    let otherProvider
    for (let uri of uris) {
      if (Object.keys(schemeToTerminologyProvider).includes(uri)) {
        otherProvider = schemeToTerminologyProvider[uri]
        break
      }
    }
    if (otherProvider) {
      let prio = provider.priority || 0
      let otherPrio = otherProvider.priority || 0
      if (otherPrio > prio) {
        // skip this scheme
        continue
      } else if (prio > otherPrio) {
        // remove existing scheme from schemes and schemeToTerminologyProvider
        let otherSchemeIndex = -1
        for (let index = 0; index < schemes.length; index += 1) {
          if (util.compareSchemes(scheme, schemes[index])) {
            otherSchemeIndex = index
            break
          }
        }
        let otherUris = util.getAllUris(schemes[otherSchemeIndex])
        schemes.splice(otherSchemeIndex, 1)
        for (let uri of otherUris) {
          delete schemeToTerminologyProvider[uri]
        }
      } else {
        // same prio, show warning and skip
        console.warn("Found two identical schemes from different providers with same priorities, skipping...", provider, otherProvider)
        continue
      }
    }

    for(let uri of uris) {
      schemeToTerminologyProvider[uri] = provider
    }
    // Add scheme specific custom properties
    scheme.DETAILSLOADED = false
    scheme.TOPCONCEPTS = [null]
    scheme.type = scheme.type || ["http://www.w3.org/2004/02/skos/core#ConceptScheme"]
    schemes.push(scheme)
    // Force save scheme in new API
    objects.save(scheme, true)
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
            console.warn("Couldn't load schemes for provider", provider)
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

export default { data, narrower, ancestors, suggest, top, get, minimumProperties, defaultProperties, detailProperties, allProperties, token, schemes, mappings, objects }
