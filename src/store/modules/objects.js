import Vue from "vue"
import api from "../../api"
import util from "../../util"

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
    let uris = util.getAllUris(object)
    for (let uri of uris) {
      if (state.map.has(uri)) {
        return state.map.get(uri)
      }
    }
    return null
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
  save (state, { object, force = false }) {
    // First, check if any if the URIs is already in the map
    let save = !isObjectInMap(state.map, object) || force
    // TODO: Force saving has side effects, like object references referring to an object not in map anymore.
    // Only save if it was not found
    if (save) {
      // Add all possible properties to ensure reactivity in Vue
      if (util.isConcept(object)) {
        object.DETAILSLOADED = false
        object.BROADERLOADED = false
        object.GNDTERMS = null
        object.ISOPEN = { true: false, false: false }
        object.INSTORE = true
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
              let schemeInMap = state.map.get(uri)
              let alreadyAdded = false
              for (let schemeInScheme of inScheme) {
                if (schemeInMap && compare(state, schemeInMap.uri, schemeInScheme.uri)) {
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
        object.INSTORE = true
        object.TOPCONCEPTS = object.TOPCONCEPTS || [null]
        object.created = object.created || null
        object.issued = object.issued || null
        object.modified = object.modified || null
        object.license = object.license || null
        object.notation = object.notation || null
        object.prefLabel = object.prefLabel || {}
        object.publisher = object.publisher || null
      }
      // Add to map
      let uris = util.getAllUris(object)
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
    Vue.set(object, prop, value)
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
  return util.compareObjects(state.map.get(uri1), state.map.get(uri2))
}

/**
 * Helper function that returns whether an object is already in the map.
 */
function isObjectInMap(map, object) {
  let uris = util.getAllUris(object)
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
    if (isObjectInMap(state.map, object)) {
      return Promise.resolve(getters.get(object))
    } else {
      let schemeInMap
      scheme = scheme || (object.inScheme ? object.inScheme[0] : null)
      if (scheme.INSTORE) {
        schemeInMap = scheme
      } else if (isObjectInMap(state.map, scheme)) {
        schemeInMap = getters.get(scheme)
      } else {
        scheme = null
        console.warn("newApi/get No scheme found for", object)
      }
      return api.data(schemeInMap, object.uri).then(results => {
        if (results.length) {
          let object = results[0]
          if (isObjectInMap(state.map, object)) {
            console.warn("newApi/get, data loaded, but couldn't save", object)
            return getters.get(object)
          } else {
            commit({
              type: "save",
              object
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
      return api.top(scheme).then(results => {
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
              force
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
          value: util.sortConcepts(top)
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
  narrower({ state, commit }, { object }) {
    if (object.narrower && !object.narrower.includes(null)) {
      return Promise.resolve(object)
    } else if (!object.inScheme || object.inScheme.length == 0) {
      console.warn("newApi/narrower: No scheme found")
      return Promise.resolve(object)
    } else {
      // Load narrower
      let scheme = object.inScheme[0]
      return api.narrower(scheme, object.uri).then(results => {
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
              force
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
          value: util.sortConcepts(narrower)
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
      return api.ancestors(scheme, object.uri).then(results => {
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
              force
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
  details({ commit }, { object }) {
    if (!object || object.DETAILSLOADED) {
      return Promise.resolve(object)
    } else {
      return api.data(object.inScheme ? object.inScheme[0] : object, object.uri, api.detailProperties).then(results => {
        if (results.length) {
          let detail = results[0]
          // Integrate detail into object
          for (let prop of Object.keys(detail)) {
            if (object[prop] == null) {
              commit({
                type: "set",
                object,
                prop,
                value: detail[prop]
              })
            }
          }
          commit({
            type: "set",
            object,
            prop: "DETAILSLOADED",
            value: true
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
  }

}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
