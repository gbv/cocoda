// TODO: Should we use items from store here?

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
      state["scheme"][isLeft] = scheme
      state["concept"][isLeft] = concept
    } else {
      state[kind][isLeft] = value
    }
  },
  setLoadingId (state, { isLeft, loadingId } = {}) {
    state.loadingId[isLeft] = loadingId
  },
  setPreviousConcept (state, { isLeft, concept }) {
    state.previousConcept[isLeft] = concept
  },
  setNextConcept (state, { isLeft, concept }) {
    state.nextConcept[isLeft] = concept
  },
}


export default {
  namespaced: true,
  state,
  mutations,
}
