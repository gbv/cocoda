import jskos from "jskos-tools"
import _ from "lodash"
import axios from "axios"
import defaultConfig from "../config"
import i18n from "../util/i18n"
// Import registry providers
import providers from "../providers"
let buildInfo
try {
  buildInfo = require("../../build/build-info.json")
} catch(error) {
  buildInfo = {}
}

export default {
  loadConfig({ commit }, configFile) {
    if (!configFile) {
      configFile = "./cocoda.json"
    }
    let config
    return axios.get(configFile).then(response => response.data).catch(() => null).then(userConfig => {
      if (!_.isObject(userConfig)) {
        console.error(`Error loading config from ${configFile}: Data is not an object.`)
        // Show UI alert
        commit("alerts/add", {
          variant: "danger",
          countdown: 0,
          text: i18n.t("general.malformedConfig", { file: configFile }),
        }, { root: true })
        userConfig = {}
      }
      config = Object.assign({}, defaultConfig, userConfig)
      if (!config.overrideRegistries) {
        config.registries = [].concat(userConfig.registries || [], defaultConfig.registries || [])
        let registries = []
        for (let registry of config.registries) {
          let index = registries.findIndex(r => r.uri == registry.uri)
          // Ignore if it's already in the list (the earlier the registry, the higher the priority)
          if (index == -1) {
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
        }
      }
      // Assign priority values to registries (for easier comparison at other points)
      let priority = config.registries.length
      for (let registry of config.registries) {
        registry.priority = priority
        priority -= 1
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

      // Load status endpoint for each registry
      let statusPromises = config.registries.map(registry =>
        registry.status
          ? (
            _.isString(registry.status)
              // For strings, make a request
              ? axios.get(registry.status).then(response => response.data).catch(() => {})
              // Otherwise assume an object
              : registry.status
          )
          : Promise.resolve({}))
      return Promise.all(statusPromises)
    }).then(statusResults => {
      for (let index = 0; index < config.registries.length; index += 1) {
        let registry = config.registries[index]
        let status = statusResults[index]
        if (_.isObject(status) && !_.isEmpty(status)) {
          // Merge status result and registry
          // (registry always has priority)
          config.registries[index] = _.merge({}, status, registry)
        }
      }

      // Initialize providers for registries
      let options = { registries: config.registries, http: axios }
      for (let registry of config.registries) {
        // Replace provider with provider object
        try {
          registry.provider = new providers[registry.provider](registry, options)
        } catch(error) {
          registry.provider = null
        }
      }

      // Remove all registries without provider
      config.registries = config.registries.filter(registry => registry.provider != null)

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
        value: getters.favoriteSchemes.concat([scheme.uri]),
      })
    }
  },
  removeSchemeFromFavorites({ commit, getters }, scheme) {
    commit({
      type: "settings/set",
      prop: "favoriteSchemes",
      value: getters.favoriteSchemes.filter(uri => !jskos.compare({ uri }, scheme)),
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
        value: getters.favoriteConcepts.concat([newConcept]),
      })
    }
  },
  removeConceptFromFavorites({ commit, getters }, concept) {
    commit({
      type: "settings/set",
      prop: "favoriteConcepts",
      value: getters.favoriteConcepts.filter(other => !jskos.compare(concept, other)),
    })
  },

}
