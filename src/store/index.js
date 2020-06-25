import Vue from "vue"
import Vuex from "vuex"
import selected from "./modules/selected"
import mapping from "./modules/mapping"
import alerts from "./modules/alerts"
import auth from "./modules/auth"
import settings from "./modules/settings"
import { plugins } from "./plugins"
import jskos from "jskos-tools"
import _ from "lodash"
// Root store
import actions from "./actions"

Vue.use(Vuex)

const state = {
  loading: 0,
  config: {},
  configLoaded: false,
  hoveredConcept: null,
  draggedConcept: null,
  hoveredMapping: null,
  mousePosition: {
    x: 0,
    y: 0,
  },
}

const getters = {
  favoriteSchemes: (state) => {
    return state.settings.settings.favoriteSchemes || state.config.favoriteSchemes
  },
  favoriteConcepts: (state) => {
    return (state.settings.settings.favoriteConcepts || []).map(concept => _.pick(concept, ["uri", "notation", "inScheme"]))
  },
  authAvailable: (state) => {
    return state.config.registries.find(registry => registry.auth) != null
  },
  getCurrentRegistry: (state) => {
    // Try to find registry that fits state.settings.settings.mappingRegistry
    let registry = state.config.registries.find(registry => jskos.compare(registry, { uri: state.settings.settings.mappingRegistry }))
    if (!registry) {
      // Fallback to first registry into which the user can save
      registry = state.config.registries.find(registry => registry.isAuthorizedFor({
        type: "mappings",
        action: "create",
        user: state.auth.user,
      }))
    }
    if (!registry) {
      // Fallback to first registry which can save mappings (even if the user is not authorized for it)
      registry = state.config.registries.find(registry => _.get(registry, "has.mappings.create"))
    }
    return registry
  },
  /**
   * Returns a creator object based on the local settings.
   */
  creator: (state) => {
    let creator = {}
    let language = state.settings.settings.locale
    if (!(state.config.languages || []).includes(language)) {
      language = "en"
    }
    let name = state.settings.settings.creator
    let uri = state.settings.settings.creatorUri
    if (!jskos.isValidUri(uri)) {
      uri = null
    }
    if (uri) {
      creator.uri = uri
      // Override name with name from chosen identity
      let user = state.auth.user
      if (user) {
        let identity = Object.values(user.identities).find(identity => identity.uri === uri)
        if (identity && identity.name) {
          name = identity.name
        }
      }
    }
    if (name) {
      creator.prefLabel = { [language]: name }
    }
    return creator
  },
  /**
   * Returns the mapped status for a concept.
   */
  mappedStatus: (state) => (concept, isLeft) => {
    return !!_.get(concept, "__MAPPED__", []).find(item => item.exist.length && jskos.compare(item.registry, getters.getCurrentRegistry(state)) && jskos.compare(item.scheme, state.selected.scheme[!isLeft]))
  },
  languages: (state) => {
    const defaultLanguages = ["en", "de"]
    if (state.configLoaded) {
      return [state.settings.settings.locale].concat(state.config.languages || defaultLanguages)
    }
    return defaultLanguages
  },
}

const mutations = {
  setConfig(state, { config, option, value }) {
    if (config) {
      state.config = config
    } else {
      state.config[option] = value
    }
  },
  setConfigLoaded(state) {
    state.configLoaded = true
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
    selected, mapping, alerts, auth, settings,
  },
  plugins,
  state,
  getters,
  mutations,
  actions,
})

// Capture mouse position in store
document.onmousemove = _.throttle(event => {
  store.commit({
    type: "setMousePosition",
    x: event.pageX,
    y: event.pageY,
  })
}, 200)

export default store
