import Vue from "vue"
import jskos from "jskos-tools"
import _ from "lodash"
import axios from "axios"

// initial state
const state = {
  /**
   * Maps URIs to objects (concept schemes and concepts).
   */
  map: new Map()
}

// getters
const getters = {
  /**
   * Returns an object in the map if it exists
   */
  get: (state) => (object) => {
    let uris = jskos.getAllUris(object)
    for (let uri of uris) {
      if (state.map.has(uri)) {
        return state.map.get(uri)
      }
    }
    return null
  }
}

const adjustObject = object => {
  // Set inScheme and type of all related nodes and add them to the store if necessary
  for (let prop of ["ancestors", "broader", "narrower"]) {
    if (object[prop]) {
      object[prop].forEach((concept, index) => {
        if (concept != null) {
          concept.inScheme = concept.inScheme || object.inScheme
          concept.type = concept.type || ["http://www.w3.org/2004/02/skos/core#Concept"]
          // Add to store if necessary
          if (!getters.get(state)(concept)) {
            mutations.save(state, { object: concept })
          } else {
            // Replace concept with concept from store
            object[prop][index] = getters.get(state)(concept)
          }
        }
      })
    }
  }
  // Use scheme's provider to adjust concepts if they haven't been adjusted yet.
  let provider = _.get(object, "inScheme[0]._provider")
  if (provider && !object._getDetails) {
    provider.adjustConcepts([object])
  } else if (!object._getDetails) {
    console.warn("Could not adjust", object)
  }
}

const integrateDetails = ({ detail, object, commit }) => {
  for (let prop of Object.keys(detail)) {
    if ((_.isEmpty(object[prop]) || Array.isArray(object[prop]) && object[prop].includes(null)) && detail[prop] != null) {
      commit({
        type: "set",
        object,
        prop,
        value: detail[prop]
      })
    }
  }
}

// mutations
const mutations = {

  /**
   * Saves an object into the map if it doesn't exist.
   *
   * Payload object: { object, force }
   * - object: object to save in map
   * - force: force saving if object already exists (default: false)
   */
  save (state, { object, force = false, scheme }) {
    // First, check if any if the URIs is already in the map
    let save = !isObjectInMap(state.map, object) || force
    // TODO: Force saving has side effects, like object references referring to an object not in map anymore.
    // Only save if it was not found
    if (save) {
      // Add all possible properties to ensure reactivity in Vue
      // 1. General properties
      object.DETAILSLOADED = object.DETAILSLOADED != null ? object.DETAILSLOADED : false
      object.INSTORE = true
      if (jskos.isConcept(object)) {
        Vue.set(object, "BROADERLOADED", false)
        Vue.set(object, "GNDTERMS", null)
        Vue.set(object, "ISOPEN", { true: false, false: false })
        Vue.set(object, "MAPPINGS", object.MAPPINGS || null)
        Vue.set(object, "ancestors", object.ancestors || [null])
        Vue.set(object, "broader", object.broader || [null])
        Vue.set(object, "narrower", object.narrower || [null])
        Vue.set(object, "editorialNote", object.editorialNote || null)
        Vue.set(object, "scopeNote", object.scopeNote || null)
        Vue.set(object, "created", object.created || null)
        Vue.set(object, "issued", object.issued || null)
        Vue.set(object, "modified", object.modified || null)
        Vue.set(object, "license", object.license || null)
        Vue.set(object, "notation", object.notation || [])
        Vue.set(object, "prefLabel", object.prefLabel || {})
        Vue.set(object, "publisher", object.publisher || null)
        if (!object.inScheme) {
          Vue.set(object, "inScheme", [scheme])
        } else {
          let inScheme = []
          for (let scheme of object.inScheme) {
            for (let uri of jskos.getAllUris(scheme)) {
              let schemeInMap = state.map.get(uri)
              let alreadyAdded = false
              for (let schemeInScheme of inScheme) {
                if (schemeInMap && compare(state, schemeInMap.uri, schemeInScheme.uri)) {
                  alreadyAdded = true
                }
              }
              if (!alreadyAdded) {
                if (schemeInMap) {
                  inScheme.push(schemeInMap)
                } else {
                  inScheme.push(scheme)
                }
              }
            }
          }
          object.inScheme = inScheme
        }
        if (object.inScheme.length == 0) {
          console.warn("inScheme has no elements", object)
        }
        // Adjust concept
        adjustObject(object)
      } else if (jskos.isScheme(object)) {
        Vue.set(object, "TOPCONCEPTS", object.TOPCONCEPTS || [null])
        Vue.set(object, "created", object.created || null)
        Vue.set(object, "issued", object.issued || null)
        Vue.set(object, "modified", object.modified || null)
        Vue.set(object, "license", object.license || null)
        Vue.set(object, "notation", object.notation || [])
        Vue.set(object, "prefLabel", object.prefLabel || {})
        Vue.set(object, "publisher", object.publisher || null)
        Vue.set(object, "types", object.types || null)
      }
      // Add to map
      let uris = jskos.getAllUris(object)
      for (let uri of uris) {
        state.map.set(uri, object)
      }
    }
    return save
  },

  /**
   * Sets a property for a value
   *
   * Payload object: { object, prop, value }
   * - object: the object to be modified (has to be in the store already)
   * - prop: the name of the property to be modified
   * - value: the new value for the property
   */
  set (state, { object, prop, value }) {
    // Set property for both object parameter and same object in store.
    let objectInStore = getters.get(state)(object)
    if (objectInStore) {
      Vue.set(objectInStore, prop, value)
    }
    Vue.set(object, prop, value)
  },

  adjust (state, { object }) {
    adjustObject(object)
  }

}

/**
 * Util wrapper to compare two URIs from state
 * FIXME: Remove because it's only used in one place.
 *
 * @param {*} state
 * @param {*} uri1
 * @param {*} uri2
 */
function compare(state, uri1, uri2) {
  return jskos.compare(state.map.get(uri1), state.map.get(uri2))
}

/**
 * Helper function that returns whether an object is already in the map.
 */
function isObjectInMap(map, object) {
  let uris = jskos.getAllUris(object)
  for (let uri of uris) {
    if (map.has(uri)) {
      return true
    }
  }
  return false
}

// actions
const actions = {

  /**
   * Returns a Promise of an object in the map for an object. Either gets it from the map or loads it using the API and adds it to the map.
   *
   * Payload object: { object, scheme }
   * - object: object to get from the map or to load
   * - scheme: scheme for concept (needed to determine provider if it's necessary to load from API)
   * "scheme" is not needed when object has the property "isScheme".
   * If just an URI is available, construct an object like this: { uri: "..." }.
   *
   * @returns a Promise of the desired object (or null if it wasn't found)
   */
  load({ state, commit, getters }, { object, scheme }) {
    if (!object) return Promise.resolve(null)
    if (isObjectInMap(state.map, object)) {
      return Promise.resolve(getters.get(object))
    } else {
      let schemeInMap
      scheme = scheme || (object.inScheme ? object.inScheme[0] : null)
      if (scheme && scheme.INSTORE) {
        schemeInMap = scheme
      } else if (isObjectInMap(state.map, scheme)) {
        schemeInMap = getters.get(scheme)
      } else {
        scheme = null
        console.warn("newApi/get No scheme found for", object)
      }
      let promise
      if (_.get(schemeInMap, "_provider.getDetails")) {
        promise = schemeInMap._provider.getDetails(object)
      } else {
        promise = Promise.resolve([object])
      }
      return promise.then(results => {
        if (results.length) {
          let object = results[0]
          if (isObjectInMap(state.map, object)) {
            let objectInMap = getters.get(object)
            integrateDetails({ detail: object, object: objectInMap, commit })
            return objectInMap
          } else {
            commit({
              type: "save",
              object,
              scheme
            })
            return object
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
   * Loads top concepts for scheme
   *
   * Payload object: { scheme }
   * - scheme: scheme to load top concepts for
   *
   * @returns a Promise with the updated scheme
   */
  top({ state, commit }, { scheme }) {
    if (!scheme || (scheme.TOPCONCEPTS && !scheme.TOPCONCEPTS.includes(null))) {
      return Promise.resolve(scheme)
    } else {
      return scheme._getTop().then(results => {
        if (scheme.TOPCONCEPTS && !scheme.TOPCONCEPTS.includes(null)) {
          return scheme
        }
        let top = []
        for (let result of results) {
          let resultInMap = state.map.get(result.uri)
          if (resultInMap) {
            top.push(resultInMap)
          } else {
            // Save into map
            let object = result, force = false
            commit({
              type: "save",
              object,
              force,
              scheme
            })
            top.push(result)
          }
        }
        // Set ancestors to []
        for (let concept of top) {
          commit({
            type: "set",
            object: concept,
            prop: "ancestors",
            value: []
          })
        }
        commit({
          type: "set",
          object: scheme,
          prop: "TOPCONCEPTS",
          value: jskos.sortConcepts(top)
        })
        return scheme
      }).catch(error => {
        console.error("top error:", error)
        return null
      })
    }
  },

  /**
   * Loads narrower concepts for an object if necessary.
   *
   * Payload object: { object }
   * - object: object to load narrower for
   *
   * @returns a Promise with the updated object
   */
  narrower({ state, commit, getters }, { object }) {
    if (object.narrower && !object.narrower.includes(null)) {
      return Promise.resolve(object)
    } else if (!object.inScheme || object.inScheme.length == 0) {
      console.warn("newApi/narrower: No scheme found")
      return Promise.resolve(object)
    } else {
      // Load narrower
      if (!getters.get(object)) {
        console.warn(JSON.stringify(jskos.deepCopy(object)))
        return Promise.resolve(object)
      }
      let scheme = object.inScheme[0]
      return object._getNarrower().then(results => {
        if (object.narrower && !object.narrower.includes(null)) {
          // Apparrently, narrower were loaded elsewhere, so abort
          return object
        }
        // Integrate resulting concepts into map
        let narrower = []
        for (let result of results) {
          let resultInMap = state.map.get(result.uri)
          if (resultInMap) {
            narrower.push(resultInMap)
          } else {
            // Save into map
            let object = result, force = false
            commit({
              type: "save",
              object,
              force,
              scheme
            })
            narrower.push(result)
          }
        }
        // Set ancestors
        for (let child of narrower) {
          if (!object.ancestors || object.ancestors.includes(null)) {
            commit({
              type: "set",
              object: child,
              prop: "ancestors",
              value: [null]
            })
          } else {
            commit({
              type: "set",
              object: child,
              prop: "ancestors",
              value: object.ancestors.concat([object])
            })
          }
        }
        // Set broader
        for (let child of narrower) {
          commit({
            type: "set",
            object: child,
            prop: "broader",
            value: [object]
          })
        }
        // Save narrower
        commit({
          type: "set",
          object,
          prop: "narrower",
          value: jskos.sortConcepts(narrower)
        })
        // Adjust object
        commit({
          type: "adjust",
          object,
        })
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
   * Payload object: { object }
   * - object: object to load ancestors for
   *
   * @returns a Promise with the updated object
   */
  ancestors({ state, commit }, { object }) {
    if (object.ancestors && !object.ancestors.includes(null)) {
      return Promise.resolve(object)
    } else if (!object.inScheme || object.inScheme.length == 0) {
      console.warn("newApi/ancestors: No scheme found")
      return Promise.resolve(object)
    } else {
      let scheme = object.inScheme[0]
      return object._getAncestors().then(results => {
        if (object.ancestors && !object.ancestors.includes(null)) {
          // Apparrently, ancestors were loaded elsewhere, so abort
          return object
        }
        // Integrate resulting concepts into map
        let ancestors = []
        for (let result of results) {
          let resultInMap = state.map.get(result.uri)
          if (resultInMap) {
            ancestors.push(resultInMap)
          } else {
            // Save into map
            let object = result, force = false
            commit({
              type: "save",
              object,
              force,
              scheme
            })
            ancestors.push(result)
          }
        }
        // Set ancestors and broader of ancestors
        let currentAncestors = []
        for (let ancestor of ancestors) {
          commit({
            type: "set",
            object: ancestor,
            prop: "ancestors",
            value: currentAncestors.slice()
          })
          commit({
            type: "set",
            object: ancestor,
            prop: "broader",
            value: currentAncestors.length > 0 ? [currentAncestors[currentAncestors.length - 1]] : []
          })
          currentAncestors.push(ancestor)
        }
        // Save ancestors
        commit({
          type: "set",
          object,
          prop: "ancestors",
          value: ancestors
        })
        // Adjust object
        commit({
          type: "adjust",
          object,
        })
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
   * Payload object: { object }
   * - object: object to load details for
   *
   * @returns a Promise with the updated object
   */
  details({ commit, getters }, { object, scheme }) {
    if (!object || object.DETAILSLOADED) {
      return Promise.resolve(object)
    } else {
      scheme = getters.get(scheme)
      let promise = (object._getDetails && object._getDetails())
        || (_.get(object, "inScheme[0]._provider.getDetails") && _.get(object, "inScheme[0]._provider").getDetails(object))
        || (_.get(scheme, "_provider.getDetails") && _.get(scheme, "_provider").getDetails(object))
      if (!promise) {
        console.warn("Object", object, "does not have _getDetails.")
        return Promise.resolve(object)
      }
      return promise.then(results => {
        if (results.length) {
          let detail = results[0]
          // Integrate detail into object
          integrateDetails({ detail, object, commit })
          commit({
            type: "set",
            object,
            prop: "DETAILSLOADED",
            value: true
          })
          // Adjust object
          commit({
            type: "adjust",
            object,
          })
          return object
        } else {
          return null
        }
      }).catch(error => {
        console.error(error)
        return null
      })
    }
  },

  types({ commit }, { scheme }) {
    let promise
    if (!scheme || !scheme._getTypes) {
      promise = Promise.resolve([])
    } else {
      promise = scheme._getTypes()
    }
    return promise.then(types => {
      commit({
        type: "set",
        object: scheme,
        prop: "types",
        value: types
      })
      return types
    })
  },

  // Loads infos from Wikipedia about a concept
  // TODO: Move this to a better place (like an information plugin system for ItemDetail)
  wikipedia({ commit }, { concept }) {
    let prefLabel = _.get(concept, "prefLabel")
    if (!prefLabel || _.get(concept, "_wikipediaResults") != null) {
      return Promise.resolve(concept)
    }
    let promises = []
    // TODO: Use current language first with fallback to other languages, maybe using util.
    for (let language of ["de", "en"]) {
      if (prefLabel[language]) {
        let results
        promises.push(axios.get(`https://${language}.wikipedia.org/w/api.php?origin=*&action=query&format=json&list=search&utf8=1`, { params: {
          srsearch: prefLabel[language]
        }}).then(response => response.data).catch(() => ({})).then(data => {
          results = _.get(data, "query.search", [])
          for (let result of results) {
            result.language = language
          }
          // Load extract for first three result
          let titles = [_.get(results, "[0].title"), _.get(results, "[1].title"), _.get(results, "[2].title")].filter(title => title != null && title != "").join("|")
          if (titles) {
            return axios.get(`https://${language}.wikipedia.org/w/api.php?origin=*&format=json&action=query&prop=extracts&exintro=&explaintext=`, { params: {
              titles: titles
            }})
          } else {
            return {}
          }
        }).then(response => response.data).catch(() => ({})).then(data => {
          let pages = _.get(data, "query.pages", {})
          // Merge extracts into results
          for (let result of results) {
            let extract = _.get(pages, `${result.pageid}.extract`)
            if (extract) {
              result.extract = extract
            }
          }
          return { [language]: results }
        }))
      }
    }
    return Promise.all(promises).then(result => {
      result = Object.assign({}, ...result)
      commit({
        type: "set",
        object: concept,
        prop: "_wikipediaResults",
        value: result
      })
      return concept
    })
  },

}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
