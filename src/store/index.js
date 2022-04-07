import Vue from "vue"
import Vuex from "vuex"
import selected from "./modules/selected.js"
import mapping from "./modules/mapping.js"
import alerts from "./modules/alerts.js"
import auth from "./modules/auth.js"
import settings from "./modules/settings.js"
import { plugins } from "./plugins.js"
import jskos from "jskos-tools"
import _ from "lodash"
// Root store
import actions from "./actions.js"

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
    let registry = state.config.registries.find(registry => jskos.compareFast(registry, { uri: state.settings.settings.mappingRegistry }))
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
  concordanceRegistries: (state) => {
    return (state.config.registries || []).filter(r =>
      r.has.concordances !== false,
    )
  },
  /**
   * Returns a creator object based on the local settings.
   */
  creator: (state) => {
    let creator = {}
    let name = state.settings.settings.creator
    let uri = state.settings.settings.creatorUri
    if (!jskos.isValidUri(uri)) {
      uri = null
    }
    if (uri) {
      creator.uri = uri
    }
    if (name) {
      creator.prefLabel = { en: name }
    }
    return creator
  },
  /**
   * Returns the mapped status for a concept.
   */
  mappedStatus: (state) => (concept, isLeft) => {
    // TODO: Use concept from store?
    return !!_.get(concept, "__MAPPED__", []).find(item => item.exist.length && jskos.compareFast(item.registry, getters.getCurrentRegistry(state)) && jskos.compare(item.scheme, state.selected.scheme[!isLeft]))
  },
  languages: (state) => {
    let languages = ["en", "de"]
    if (state.configLoaded) {
      languages = _.uniq(state.settings.settings.preferredLanguages.concat(
        // Prefer interface language if no preferred languages are set
        (state.config.languages || languages).sort((a, b) => {
          if (a === state.settings.settings.locale) {
            return -1
          }
          if (b === state.settings.settings.locale) {
            return 1
          }
          return 0
        }),
      ))
    }
    return languages
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
    state.hoveredConcept = concept && { uri: concept.uri }
  },
  setDraggedConcept(state, { concept }) {
    state.draggedConcept = concept && { uri: concept.uri }
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
