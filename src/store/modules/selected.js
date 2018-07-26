import router from "../../router"

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

function refreshRoute() {
  // Push new route with selected schemes and concepts
  let kinds = ["scheme", "concept"]
  let sides = { true: "Left", false: "Right" }
  let query = {}
  for (let kind of kinds) {
    for (let isLeft of [true, false]) {
      let key = kind + sides[isLeft]
      let object = state[kind][isLeft]
      if (object && object.uri) {
        query[key] = object.uri
      }
    }
  }
  router.push({ query })
}

// mutations
const mutations = {
  clear (state, { kind, isLeft }) {
    state[kind][isLeft] = null
    if (kind == "scheme") {
      state["concept"][isLeft] = null
    }
    refreshRoute()
  },
  set (state, { kind, isLeft, value }) {
    state[kind][isLeft] = value
    refreshRoute()
  },
}

export default {
  namespaced: true,
  state,
  mutations,
}
