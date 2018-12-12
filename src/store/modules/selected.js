import _ from "lodash"
import jskos from "jskos-tools"

// initial state
const state = {
  scheme: {
    true: null,
    false: null
  },
  concept: {
    true: null,
    false: null
  }
}

// mutations
const mutations = {
  clear (state, { kind, isLeft }) {
    state[kind][isLeft] = null
    if (kind == "scheme") {
      state["concept"][isLeft] = null
    }
  },
  set (state, { kind, isLeft, value, concept, scheme }) {
    if (kind == "both") {
      state["scheme"][isLeft] = scheme
      state["concept"][isLeft] = concept
    } else {
      state[kind][isLeft] = value
    }
  },
}

const actions = {

  set({ state, commit, dispatch, rootGetters }, { concept, scheme, isLeft = true, noQueryRefresh = false } = {}) {
    let get = object => {
      return rootGetters["objects/get"](object)
    }
    scheme = _.get(concept, "inScheme[0]") || scheme
    // Check if concept and scheme is already selected
    if (jskos.compare(concept, state.concept[isLeft]) && jskos.compare(scheme, state.scheme[isLeft])) {
      return Promise.resolve(true)
    }
    if (scheme && !concept) {
      let kind = "both"
      scheme = get(scheme)
      if (scheme) {
        commit({
          type: "set",
          kind,
          isLeft,
          scheme,
          concept: null,
          noQueryRefresh,
        })
        // Load top concepts for scheme
        return dispatch("objects/top", { scheme }, { root: true }).then(() => true)
      } else {
        console.error("setSelected: could not find scheme in store.")
        return Promise.resolve(false)
      }
    } else if (concept) {
      let kind = "concept"
      scheme = get(scheme)
      if (!scheme) {
        console.error("setSelected: could not find scheme for concept in store.")
        return Promise.resolve(false)
      }
      if (!get(concept)) {
        // Set type property for object
        concept.type = concept.type || ["http://www.w3.org/2004/02/skos/core#Concept"]
        // Save concept to store.
        commit("objects/save", {
          object: concept, scheme
        }, { root: true })
      }
      concept = get(concept)
      if (!concept) {
        // This case should not happen!
        console.error("setSelected: critical error when getting/saving concept from store.")
        return Promise.resolve(false)
      }
      // Check if scheme is different from selected scheme, if not change
      if (!jskos.compare(scheme, state.scheme[isLeft])) {
        kind = "both"
      }
      let promises = []
      // Load details
      promises.push(dispatch("objects/details", { object: concept }, { root: true }))
      // Load narrower concepts
      promises.push(dispatch("objects/narrower", { object: concept }, { root: true }))
      // Load ancestor concepts and their narrower concepts
      promises.push(dispatch("objects/ancestors", { object: concept }, { root: true }))

      return Promise.all(promises).then(() => {
        // Don't select if another selection came in on the same side
        // ...
        // Get concept from store on last time
        concept = get(concept) || concept
        // Asynchronously load its ancestors narrower concepts
        if (concept && concept.ancestors) {
          for (let ancestor of concept.ancestors) {
            dispatch("objects/narrower", { object: ancestor }, { root: true })
          }
        }
        // Asynchronously load information about its broader concepts
        if (concept && concept.broader && !concept.BROADERLOADED) {
          let broaderPromises = []
          for (let broader of concept.broader) {
            broaderPromises.push(dispatch("objects/details", { object: broader }, { root: true }))
          }
          Promise.all(broaderPromises).then(() => {
            commit("objects/set", {
              object: concept,
              prop: "BROADERLOADED",
              value: true,
            }, { root: true })
          })
        }
        commit({
          type: "set",
          kind,
          isLeft,
          concept,
          scheme,
          value: concept,
          noQueryRefresh,
        })
        return true
      })
    } else if (isLeft != null) {
      commit({
        type: "clear",
        kind: "scheme",
        isLeft,
        noQueryRefresh,
      })
    } else {
      console.error("setSelected: called with no valid concept or scheme.")
      return Promise.resolve(false)
    }
  }

}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
}
