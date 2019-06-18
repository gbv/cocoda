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
  conceptDetailShowAllAncestors: false,
  conceptDetailDoNotTruncateNotes: false,
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
    [false]: true
  },
  conceptListChoice: {
    [true]: 0,
    [false]: 0
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
  }

}

// actions
const actions = {
  load({ commit }) {
    // Migration from old local storage key to new one if necessary
    let oldLocalStorageKey = "settings"
    return Promise.all([localforage.getItem(oldLocalStorageKey), localforage.getItem(localStorageKey)]).then(results => {
      let [oldSettings, newSettings] = results
      if (oldSettings && !newSettings) {
        return localforage.setItem(localStorageKey, oldSettings).then(() => {
          console.warn(`Migrated from old local storage key (${oldLocalStorageKey}) to new one (${localStorageKey})`)
        }).catch(error => {
          console.error("Error attempting to migrate from old storage key to new one:", error)
        })
      }
      return
    }).then(() => {
      // Load settings from local storage
      return localforage.getItem(localStorageKey)
    }).then(settings => {
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
