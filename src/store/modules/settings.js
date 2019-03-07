import localforage from "localforage"

const defaultSettings = {
  creator: "",
  creatorUri: "",
  mappingBrowserAllSchemes: true,
  mappingBrowserOnlyLocal: false,
  mappingBrowserShowReverse: true,
  conceptDetailShowAllAncestors: false,
  conceptDetailDoNotTruncateNotes: false,
  mappingBrowserLocal: true,
  mappingBrowserProvider: {},
  mappingBrowserCatalog: true,
  mappingBrowserShowRegistry: {},
  minimized: {},
  flex: {},
  mappingBrowserShowAll: false,
  typesForSchemes: {},
  locale: "",
  autoInsertLabels: true,
  mappingEditorClearOnSave: true,
  favoriteConcepts: [],
  favoriteSchemes: null,
  mappingCardinality: "1-to-n",
  mappingRegistry: null,
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
      localforage.setItem("settings", settings)
    } else {
      console.warn("Tried to save settings before they were loaded.")
    }
  },

  set(state, { prop, value }) {
    if (state.loaded) {
      state.settings[prop] = value
      localforage.setItem("settings", state.settings)
    } else {
      console.warn("Tried to save settings before they were loaded.")
    }
  },

  loaded(state, { loaded = true }) {
    state.loaded = loaded
  }

}

// actions
const actions = {
  load({ commit }) {
    return localforage.getItem("settings").then(settings => {
      let newSettings = Object.assign({}, defaultSettings, settings || {})
      commit({
        type: "loaded"
      })
      commit({
        type: "save",
        settings: newSettings
      })
      return
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
}
