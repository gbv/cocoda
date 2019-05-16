import jskos from "jskos-tools"
import _ from "lodash"
import axios from "axios"
import defaultConfig from "../config"
// Import registry providers
import providers from "../providers"
const buildInfo = require("../../build/build-info.json")

export default {
  loadConfig({ commit }, configFile) {
    if (!configFile) {
      configFile = "./cocoda.json"
    }
    return axios.get(configFile).then(response => response.data).catch(() => null).then(userConfig => {
      if (!_.isObject(userConfig)) {
        console.error(`Error loading config from ${configFile}: Data is not an object.`)
        userConfig = {}
      }
      let config = Object.assign({}, defaultConfig, userConfig)
      if (!config.overrideRegistries) {
        config.registries = [].concat(defaultConfig.registries || [], userConfig.registries || [])
        // Merge registries with the same URI (higher priority overrides lower priority, later in list overrides earlier in list)
        let registries = []
        for (let registry of config.registries) {
          let index = registries.findIndex(r => r.uri == registry.uri)
          if (index != -1) {
            // Compare priorities
            let prioCurrent = registry.priority || 0
            let prioExisting = registries[index].priority || 0
            // Override except if existing prio is higher than current prio
            if (!(prioExisting > prioCurrent)) {
              registries[index] = registry
            }
          } else {
            registries.push(registry)
          }
        }
        config.registries = registries
      }
      // Make new config file format (#64) compatible with current implementation.
      if (config.registries) {
        config.terminologyProviders = []
        config.mappingProviders = []
        config.occurrenceProviders = []
        for (let registry of config.registries) {
          let provider = registry.provider || ""
          if (provider.endsWith("ConceptApi")) {
            // baseUrl -> url
            registry.url = registry.baseUrl
            // schemes -> voc
            registry.voc = registry.schemes
            // Add to list
            config.terminologyProviders.push(registry)
          } else if (provider.endsWith("MappingsApi")) {
            // mappings -> url
            registry.url = registry.mappings
            // Add to list
            config.mappingProviders.push(registry)
          } else if (provider.endsWith("OccurrencesApi")) {
            // occurrences -> url
            registry.url = registry.occurrences
            // Add to list
            config.occurrenceProviders.push(registry)
          }
          // Replace provider with provider object
          try {
            registry.provider = new providers[registry.provider](registry)
          } catch(error) {
            registry.provider = null
          }
        }
      }
      // Filter out registries where no provider could be initialized
      config.registries = config.registries.filter(registry => registry.provider != null)

      // Override keyboard shortcuts
      let shortcuts = []
      for (let shortcut of (defaultConfig.shortcuts || []).concat(userConfig.shortcuts || [])) {
        let existing = shortcuts.find(s => s.id === shortcut.id)
        shortcuts = _.pullAllBy(shortcuts, [shortcut], "id")
        shortcuts.push(_.defaults(shortcut, existing || {}))
      }
      config.shortcuts = shortcuts

      // load build info into config
      config.buildInfo = buildInfo

      // Make sure auth URL always ends on a slash
      if (config.auth && !config.auth.endsWith("/")) {
        config.auth += "/"
      }

      // Save config
      commit({
        type: "setConfig",
        config,
      })
      commit({ type: "setConfigLoaded" })
      return config
    })
  },
  addSchemeToFavorites({ commit, getters }, scheme) {
    if (!scheme || !scheme.uri) {
      return
    }
    if (!jskos.isContainedIn(scheme, getters.favoriteSchemes.map(uri => { uri }))) {
      commit({
        type: "settings/set",
        prop: "favoriteSchemes",
        value: getters.favoriteSchemes.concat([scheme.uri])
      })
    }
  },
  removeSchemeFromFavorites({ commit, getters }, scheme) {
    commit({
      type: "settings/set",
      prop: "favoriteSchemes",
      value: getters.favoriteSchemes.filter(uri => !jskos.compare({ uri }, scheme))
    })
  },
  addConceptToFavorites({ commit, getters }, concept) {
    if (!concept || !concept.uri) {
      return
    }
    if (!jskos.isContainedIn(concept, getters.favoriteConcepts)) {
      // Filter properties of concepts
      let newConcept = _.pick(jskos.copyDeep(concept), ["uri", "notation", "inScheme"])
      // Prepare inScheme
      newConcept.inScheme = newConcept.inScheme.map(scheme => ({ uri: scheme.uri }))
      commit({
        type: "settings/set",
        prop: "favoriteConcepts",
        value: getters.favoriteConcepts.concat([newConcept])
      })
    }
  },
  removeConceptFromFavorites({ commit, getters }, concept) {
    commit({
      type: "settings/set",
      prop: "favoriteConcepts",
      value: getters.favoriteConcepts.filter(other => !jskos.compare(concept, other))
    })
  },

}
