import localforage from "localforage"
import _ from "lodash"

import componentSettings from "../../../config/settings.json"

const localStorageKey = "cocoda-settings--" + window.location.pathname

let defaultSettings = {
  creator: "",
  creatorUri: "",
  mappingBrowserShowRegistry: {},
  minimized: {},
  flex: {},
  typesForSchemes: {},
  locale: window.navigator.language || "en",
  favoriteConcepts: [],
  favoriteSchemes: null,
  mappingRegistry: null,
  conceptListChoice: {
    [true]: 0,
    [false]: 0,
  },
  components: {},
}

for (let component of Object.keys(componentSettings)) {
  defaultSettings.components[component] = {}
  for (let setting of Object.keys(componentSettings[component])) {
    if (componentSettings[component][setting].sideDependent) {
      defaultSettings.components[component][setting] = {}
      defaultSettings.components[component][setting][true] = componentSettings[component][setting].default
      defaultSettings.components[component][setting][false] = componentSettings[component][setting].default
    } else {
      defaultSettings.components[component][setting] = componentSettings[component][setting].default
    }
  }
}

// initial state
const state = {
  settings: defaultSettings,
  componentSettings,
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

  setComponentSetting(state, { component, setting, isLeft, value }) {
    if (state.loaded) {
      if (isLeft !== undefined) {
        _.set(state.settings.components[component][setting], isLeft, value)
      } else {
        _.set(state.settings.components[component], setting, value)
      }
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
      // Readd component settings that didn't exist in loaded settings
      for (let component of Object.keys(defaultSettings.components)) {
        if (!newSettings.components[component]) {
          newSettings.components[component] = {}
        }
        for (let setting of Object.keys(defaultSettings.components[component])) {
          if (newSettings.components[component][setting] === undefined) {
            newSettings.components[component][setting] = defaultSettings.components[component][setting]
          }
        }
      }
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
