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
}

// initial state
const state = {
  settings: defaultSettings
}

// mutations
const mutations = {

  save(state, { settings }) {
    state.settings = settings
    localforage.setItem("settings", settings)
  },

  set(state, { prop, value }) {
    state.settings[prop] = value
    localforage.setItem("settings", state.settings)
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
