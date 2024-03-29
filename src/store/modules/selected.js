// TODO: Should we use items from store here?
import _ from "lodash"

// initial state
const state = {
  scheme: {
    true: null,
    false: null,
  },
  concept: {
    true: null,
    false: null,
  },
  loadingId: {
    true: "",
    false: "",
  },
  previousConcept: {
    true: null,
    false: null,
  },
  nextConcept: {
    true: null,
    false: null,
  },
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
      state["scheme"][isLeft] = scheme && _.pick(scheme, ["uri"])
      state["concept"][isLeft] = concept && _.pick(concept, ["uri"])
    } else {
      state[kind][isLeft] = _.pick(value, ["uri"])
    }
  },
  setLoadingId (state, { isLeft, loadingId } = {}) {
    state.loadingId[isLeft] = loadingId
  },
  setPreviousConcept (state, { isLeft, concept }) {
    const uri = concept && concept.uri
    state.previousConcept[isLeft] = uri ? { uri } : null
  },
  setNextConcept (state, { isLeft, concept }) {
    const uri = concept && concept.uri
    state.nextConcept[isLeft] = uri ? { uri } : null
  },
}


export default {
  namespaced: true,
  state,
  mutations,
}
