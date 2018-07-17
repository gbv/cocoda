import api from "../../api"
import util from "../../util"

console.log("objects module")

// initial state
const state = {
  map: new Map()
}

// mutations
const mutations = {

}

function compare(state, uri1, uri2) {
  return util.compareObjects(state.map.get(uri1), state.map.get(uri2))
}

// actions
const actions = {

  save ({ state }, { object, force }) {
    let uris = util.getAllUris(object)
    let save = true
    // First, check if any if the URIs is already in the map
    for (let uri of uris) {
      save = save && (!state.map.has(uri) || force)
    }
    // Only save if it was not found
    if (save) {
      // Add to map
      for (let uri of uris) {
        state.map.set(uri, object)
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

  get({ state, dispatch }, { uri, schemeUri }) {
    if (state.map.has(uri)) {
      return Promise.resolve(state.map.get(uri))
    } else {
      // TODO: Rethink all of this
      let scheme
      if (state.map.has(schemeUri)) {
        scheme = state.map.get(schemeUri)
      } else {
        console.warn("newApi/get No scheme found for", uri, schemeUri)
        scheme = null
      }
      return api.data(scheme, uri).then(results => {
        if (results.length) {
          let object = results[0], force = false
          return dispatch({
            type: "save",
            object,
            force
          }).then((result) => {
            if (result) {
              return object
            } else {
              console.warn("newApi/get, data loaded, but couldn't save", uri)
              return state.map.get(uri)
            }
          })
        } else {
          return null
        }
      }).catch(error => {
        console.error(error)
        return null
      })
    }
  },

  top({ state, dispatch }, { scheme }) {
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
            dispatch({
              type: "save",
              object,
              force
            })
            top.push(result)
          }
        }
        // Set ancestors to []
        for (let concept of top) {
          concept.ancestors = []
        }
        scheme.TOPCONCEPTS = util.sortConcepts(top)
        return scheme
      }).catch(error => {
        console.error("top error:", error)
        return null
      })
    }
  },

  narrower({ state, dispatch }, { object }) {
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
            dispatch({
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

  ancestors({ state, dispatch }, { object }) {
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
            dispatch({
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

  details(context, { object }) {
    if (!object || object.DETAILSLOADED) {
      return Promise.resolve(object)
    } else {
      return api.data(object.inScheme ? object.inScheme[0] : object, object.uri, api.detailProperties).then(results => {
        if (results.length) {
          let detail = results[0]
          // Integrate detail into object
          for (let prop of Object.keys(detail)) {
            if (object[prop] == null) {
              object[prop] = detail[prop]
            }
          }
          object.DETAILSLOADED = true
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
  mutations,
  actions
}
