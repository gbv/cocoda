import Vue from "vue"
import Vuex from "vuex"
import config from "../config"
import selected from "./modules/selected"
import mapping from "./modules/mapping"
import alerts from "./modules/alerts"
import settings from "./modules/settings"
import { plugins } from "./plugins"
// Root store
import actions from "./actions"

Vue.use(Vuex)

const state = {
  loading: 0,
  schemes: [],
  schemesLoaded: false,
  config,
  hoveredConcept: null,
  draggedConcept: null,
  hoveredMapping: null,
  mousePosition: {
    x: 0,
    y: 0
  },
  authorized: null,
  authorizedLoadingId: null,
}

const getters = {
  favoriteSchemes: (state) => {
    return state.settings.settings.favoriteSchemes || state.config.favoriteTerminologyProviders
  },
  favoriteConcepts: (state) => {
    return state.settings.settings.favoriteConcepts || state.config.favoriteConcepts
  },
  authAvailable: (state) => {
    return state.config.registries.find(registry => registry.auth) != null
  },
}

const mutations = {
  setSchemes(state, { schemes }) {
    state.schemes = schemes
  },
  setSchemesLoaded(state, { value }) {
    state.schemesLoaded = value
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
  setDraggedConcept(state, { concept }) {
    state.draggedConcept = concept
  },
  setHoveredMapping(state, { mapping }) {
    state.hoveredMapping = mapping
  },
  setMousePosition(state, { x, y }) {
    state.mousePosition = { x, y }
  },
  setAuthorized(state, { value }) {
    state.authorized = value
  },
  setAuthorizedLoadingId(state, { value }) {
    state.authorizedLoadingId = value
  },
  setLoading(state, { value }) {
    if (value) {
      state.loading += 1
    } else {
      state.loading -= 1
    }
  },
}

const store = new Vuex.Store({
  modules: {
    selected, mapping, alerts, settings
  },
  plugins,
  state,
  getters,
  mutations,
  actions,
})

// Load settings on first launch.
store.dispatch("settings/load").then(() => {
  // Check auth once after loading
  store.dispatch("checkAuth")
})

// Check auth every 15 seconds
setInterval(() => {
  store.dispatch("checkAuth")
}, 15000)

export default store
