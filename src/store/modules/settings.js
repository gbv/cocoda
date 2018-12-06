import localforage from "localforage"
import nodersa from "node-rsa"

const defaultSettings = {
  creator: "",
  mappingBrowserAllSchemes: true,
  mappingBrowserOnlyLocal: false,
  mappingBrowserShowReverse: true,
  conceptDetailShowAllAncestors: false,
  conceptDetailDoNotTruncateNotes: false,
  mappingBrowserLocal: true,
  mappingBrowserProvider: {},
  mappingBrowserCatalog: true,
  minimized: {},
  flex: {},
  mappingBrowserShowAll: false,
  typesForSchemes: {},
  locale: "",
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
    localforage.getItem("settings").then(settings => {
      let newSettings = Object.assign({}, defaultSettings, settings || {})
      // Create new key pair if necessary
      if (!newSettings.key) {
        let key = new nodersa({b: 512})
        newSettings.key = {
          private: key.exportKey("private"),
          public: key.exportKey("public")
        }
      }
      commit({
        type: "loaded"
      })
      commit({
        type: "save",
        settings: newSettings
      })
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
}
