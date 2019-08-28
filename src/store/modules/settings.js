import localforage from "localforage"
import _ from "lodash"

const localStorageKey = "cocoda-settings--" + window.location.pathname

const defaultSettings = {
  creator: "",
  creatorUri: "",
  mappingBrowserAllSchemes: true,
  mappingBrowserResultLimit: 5,
  mappingBrowserHideEmpty: false,
  mappingBrowserShowIdentityWarning: true,
  mappingBrowserMoveCurrentRegistryToTop: false,
  conceptDetailShowAllAncestors: false,
  conceptListAddToMappingSelectsConcept: true,
  mappingBrowserShowRegistry: {},
  minimized: {},
  flex: {},
  typesForSchemes: {},
  locale: window.navigator.language || "en",
  mappingEditorClearOnSave: true,
  favoriteConcepts: [],
  favoriteSchemes: null,
  mappingCardinality: "1-to-n",
  mappingRegistry: null,
  schemeSelectionInsertPrefLabel: {
    [true]: true,
    [false]: true,
  },
  conceptListChoice: {
    [true]: 0,
    [false]: 0,
  },
  mappingNavigatorShowResultsFor: {
    [true]: true,
    [false]: true,
  },
}

// initial state
const state = {
  settings: defaultSettings,
  loaded: false,
}

// mutations
const mutations = {

  save(state, { settings }) {
    if (state.loaded) {
      state.settings = settings
      localforage.setItem(localStorageKey, settings)
    } else {
      console.warn("Tried to save settings before they were loaded.")
    }
  },

  set(state, { prop, value }) {
    if (state.loaded) {
      _.set(state.settings, prop, value)
      localforage.setItem(localStorageKey, state.settings)
    } else {
      console.warn("Tried to save settings before they were loaded.")
    }
  },

  loaded(state, { loaded = true }) {
    state.loaded = loaded
  },

}

// actions
const actions = {
  load({ commit }) {
    return localforage.getItem(localStorageKey).then(settings => {
      let newSettings = Object.assign({}, defaultSettings, settings || {})
      commit({
        type: "loaded",
      })
      commit({
        type: "save",
        settings: newSettings,
      })
      return
    })
  },
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
}
