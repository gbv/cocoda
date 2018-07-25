import Vue from "vue"
import Vuex from "vuex"
import selected from "./modules/selected"
import objects from "./modules/objects"
import mapping from "./modules/mapping"
import alerts from "./modules/alerts"
import plugins from "./plugins"
// Root store
import actions from "./actions"

Vue.use(Vuex)

const state = {
  schemes: [],
  config: {},
  hoveredConcept: null,
  hoveredMapping: null,
}

const mutations = {
  setSchemes(state, { schemes }) {
    state.schemes = schemes
  },
  setConfig(state, { config, option, value }) {
    if (config) {
      state.config = config
    } else {
      state.config[option] = value
    }
  },
  setHoveredConcept(state, { concept }) {
    state.hoveredConcept = concept
  },
  setHoveredMapping(state, { mapping }) {
    state.hoveredMapping = mapping
  },
}

export default new Vuex.Store({
  modules: {
    selected, objects, mapping, alerts
  },
  plugins,
  state,
  mutations,
  actions,
})
