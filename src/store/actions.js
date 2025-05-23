import jskos from "@/utils/jskos.js"
import _ from "lodash"
import axios from "axios"
const axiosConfig = {
  headers: {
    "Cache-Control": "no-cache",
  },
}
import defaultConfig from "@/../config/cocoda.default.json"
import i18n from "@/utils/i18n.js"
import log from "@/utils/log.js"
// Import registry providers
import { cdk } from "cocoda-sdk"
import buildInfo from "@/../build/build-info.json"
// Import cocoda.json for hot reloading; will be ignored during build
// eslint-disable-next-line no-unused-vars
import userConfigAtBuild from "@/../config/cocoda.json"

function prepareConceptsForFavorite(concepts) {
  return concepts.map(c => ({
    uri: c.uri,
    notation: c.notation,
    inScheme: [{ uri: c.inScheme[0].uri }],
  }))
}

export default {
  async loadConfig({ commit, dispatch }, configFile) {
    if (!configFile) {
      configFile = "./cocoda.json"
    }
    let config
    let userConfig
    try {
      userConfig = (await axios.get(configFile, axiosConfig)).data
    } catch (error) {
      userConfig = null
    }
    if (!userConfig) {
      // Try again without axios config: Cache-Control header might not be allowed
      try {
        userConfig = (await axios.get(configFile)).data
      } catch (error) {
        userConfig = null
      }
    }
    if (!_.isObject(userConfig)) {
      log.error(`Error loading config from ${configFile}: Data is not an object.`)
      userConfig = { error: "malformedConfig" }
    }
    config = Object.assign({ configFile }, defaultConfig, userConfig)
    if (!config.overrideRegistries) {
      config.registries = [].concat(userConfig.registries || [], defaultConfig.registries || [])
      let registries = []
      for (let registry of config.registries) {
        registries.push(registry)
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
    // Make old config files compatible with new registry format introduced by cocoda-sdk
    for (let registry of config.registries) {
      if (registry.provider == "SearchSuggestion") {
        registry.provider = "LabelSearchSuggestion"
      }
      if (registry.provider == "OccurrencesApi") {
        if (!registry.api && registry.occurrences) {
          registry.api = registry.occurrences
          delete registry.occurrences
        }
      }
      if (registry.provider == "ReconciliationApi") {
        if (!registry.api && registry.reconcile) {
          registry.api = registry.reconcile
          delete registry.reconcile
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
    // Filter out duplicate registries
    config.registries = _.uniqBy(config.registries, r => r.uri)

    if (!config.registries.length && !config.error) {
      config.error = "noRegistries"
    }

    // Override keyboard shortcuts
    let shortcuts = []
    for (let shortcut of (defaultConfig.shortcuts || []).concat(userConfig.shortcuts || [])) {
      let existing = shortcuts.find(s => s.id === shortcut.id)
      shortcuts = _.pullAllBy(shortcuts, [shortcut], "id")
      shortcuts.push(_.defaults(shortcut, existing || {}))
    }
    config.shortcuts = shortcuts

    // Merge searchLinks field
    config.searchLinks = [].concat(defaultConfig.searchLinks || [], userConfig.searchLinks || [])
    // Add `schemes` field to searchLinks
    config.searchLinks.forEach(searchLink => {
      if (searchLink.schemes) {
        return
      }
      searchLink.schemes = (searchLink.schemeUris || []).map(uri => ({ uri }))
    })

    // load build info into config
    config.buildInfo = buildInfo

    // Make sure auth URL always ends on a slash
    if (config.auth && !config.auth.endsWith("/")) {
      config.auth += "/"
    }

    /**
     * Function to check for version compatibility
     *
     * Only supports specific version numbers and the ^ operator for versionRange.
     *
     * Examples:
     * console.log(`${versionCompatible("1.0", "^1.0")} -> true`)
     * console.log(`${versionCompatible("1.1", "^1.0")} -> true`)
     * console.log(`${versionCompatible("1.1", "1.1")} -> true`)
     * console.log(`${versionCompatible("1.1.1", "1.1")} -> true`)
     * console.log(`${versionCompatible("1.1", "^1.2")} -> false`)
     * console.log(`${versionCompatible("1.1", "1.0")} -> false`)
     * console.log(`${versionCompatible("1.9", "^2.0")} -> false`)
     * console.log(`${versionCompatible("2.0", "^1.9")} -> false`)
     *
     * @param {*} version a specific version, like 1.0 or 1.5
     * @param {*} versionRange a specific version or version range (like ^1.0), only ^ is supported
     */
    const versionCompatible = (version, versionRange) => {
      const versionParts = version.split(".").map(part => parseInt(part))
      if (!versionRange) {
        return true
      }
      // Suport || to specify multiple versions in version range
      for (const range of versionRange.split("||").map(r => r.trim())) {
        const versionRangeParts = range.slice(range.startsWith("^") ? 1 : 0).split(".").map(part => parseInt(part))
        if (!versionRange.startsWith("^")) {
          if (versionParts[0] == versionRangeParts[0] && versionParts[1] == versionRangeParts[1]) {
            return true
          }
          continue
        }
        // Fail for differing major version
        if (versionParts[0] != versionRangeParts[0]) {
          continue
        }
        // Fail if minor is higher in versionRange
        if (versionParts[1] < versionRangeParts[1]) {
          continue
        }
        return true
      }
      return false
    }

    // Initialize registries
    cdk.setConfig(config)
    await Promise.all(config.registries.map(r => r.init()))

    // Filter out incompatible registries
    let compatibleRegistries = []
    for (let registry of config.registries) {
      if (!buildInfo.jskosApi || !registry._config || !registry._config.version || versionCompatible(registry._config.version, buildInfo.jskosApi)) {
        // Make sure there is only one registry for local mappings
        if (compatibleRegistries.find(r => r.constructor.providerName == "LocalMappings") && registry.constructor.providerName == "LocalMappings") {
          log.error("There are multiple registries for LocalMappings configured. This is not supported. Please remove any additional registries for LocalMappings.")
          continue
        }
        compatibleRegistries.push(registry)
      } else {
        // Note: Text will not show in a different language because at this point, the user configured language is not yet loaded.
        const text = i18n.t("alerts.versionMismatch", { registryLabel: registry.prefLabel.en || registry.prefLabel.de, registryUri: registry.uri, registryVersion: registry._config.version, jskosApi: buildInfo.jskosApi })
        log.warn(text)
        commit("alerts/add", {
          variant: "danger",
          text,
          countdown: 0,
        }, { root: true })
      }
    }
    config.registries = compatibleRegistries

    config.conceptLists = await dispatch("loadConceptLists", config.conceptLists)

    // Set autoRefresh with default values
    config.autoRefresh = Object.assign(defaultConfig.autoRefresh, config.autoRefresh || {})

    // Save config
    commit({
      type: "setConfig",
      config,
    })
    commit({ type: "setConfigLoaded" })
    return config
  },
  addSchemeToFavorites({ commit, getters }, scheme) {
    if (!scheme || !scheme.uri) {
      return
    }
    if (!jskos.isContainedIn(scheme, getters.favoriteSchemes.map(uri => {
      uri
    }))) {
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
    // Check whether it is really a concept
    if (!jskos.isConcept(concept)) {
      // Show alert
      // Note: Text will not show in a different language because at this point, the user configured language is not yet loaded.
      const text = i18n.t("alerts.favoriteConceptsNonConcept")
      commit("alerts/add", {
        variant: "danger",
        text,
      }, { root: true })
      return
    }
    if (!jskos.isContainedIn(concept, getters.favoriteConcepts)) {
      commit({
        type: "settings/set",
        prop: "favoriteConcepts",
        value: prepareConceptsForFavorite(getters.favoriteConcepts.concat([concept])),
      })
    }
  },
  removeConceptFromFavorites({ commit, getters }, concept) {
    commit({
      type: "settings/set",
      prop: "favoriteConcepts",
      value: prepareConceptsForFavorite(getters.favoriteConcepts.filter(other => !jskos.compare(concept, other))),
    })
  },

  async loadConceptLists({ state }, _conceptLists) {
    // Load lists for "conceptLists"
    let conceptLists = []
    for (let list of _conceptLists || (state.config && state.config.conceptLists) || []) {
      if (_.isString(list)) {
        list = { url: list }
      }
      if (list.url) {
        // Load list from URL
        try {
          let url = list.url
          list = (await axios.get(url)).data
          list.url = url
        } catch (error) {
          log.warn("Could not load list from URL:", list)
        }
        if (list) {
          conceptLists.push(list)
        }
      } else {
        conceptLists.push(list)
      }
    }

    // Load concepts for concept lists if necessary
    for (let list of conceptLists) {
      if (_.isString(list.concepts)) {
        list.conceptsUrl = list.concepts
      }
      if (list.conceptsUrl) {
        let url = list.conceptsUrl
        try {
          let concepts = (await axios.get(url)).data
          list.concepts = concepts
        } catch (error) {
          log.warn("Could not load concepts for list with URL:", url)
          list.concepts = []
        }
        list.conceptsUrl = url
      } else {
        list.concepts = list.concepts || []
      }
      // Imply scheme from list if possible
      let scheme = (list.schemes || [])[0]
      if (scheme) {
        for (let concept of list.concepts) {
          if (!concept.inScheme || concept.inScheme.length == 0) {
            concept.inScheme = [scheme]
          }
        }
      }
    }
    return conceptLists
  },
  async getSearchLinks({ state }, { scheme, info, multipleConcepts }) {
    let searchLinks = []
    const infoArray = Array.isArray(info) ? info : [info]
    let notationValues = infoArray.map(item => item.notation)
    
    for (let infoItem of infoArray) {
      for (let searchLink of (state.config.searchLinks || []).filter(l => l.schemes.length === 0 || jskos.isContainedIn(scheme, l.schemes))) {
          
        // Construct URL
        let url = searchLink.url + (searchLink.urlSuffix ?? "")

        // Replace notation values
        const notationReplacement = notationValues.length > 0 && searchLink.separator
          ? notationValues.join(searchLink.separator)  // Use default separator if not provided
          : notationValues[0]

        url = url.replace(/{notation}/g, notationReplacement)

        // Replace other keys
        _.forOwn(infoItem, (value, key) => {
          if (key !== "notation") {  // Skip notation as it is handled above
            url = url.replace(new RegExp(`{${key}}`, "g"), value)
          }
        })

        // Add URL and label to searchLinks based on multipleConcepts
        if (!multipleConcepts || (multipleConcepts && searchLink.separator)) {
          searchLinks.push({
            url,
            label: jskos.prefLabel(searchLink, { language: infoItem.locale }),
          })
        }
       
      }

    }

    // Add custom WebDewey links for DDC
    if (jskos.compare(scheme, { uri: "http://bartoc.org/en/node/241" }) && infoArray.length > 0) {
      let recordIdPrefix = "ddc"
      let notation = infoArray[0].notation
      // Adjust notation
      // 1. Determine postfix
      let postfix
      const postfixMatch = /(.+):(.+)/.exec(notation)
      if (postfixMatch) {
        notation = postfixMatch[1]
        postfix = "%3b1%3b" + postfixMatch[2]
        recordIdPrefix = "int"
      } else {
        postfix = ""
      }
      // 2. Fix ranges with .
      const rangeMatch = /(.+)\.(.+)-.+\.(.+)/.exec(notation)
      if (rangeMatch) {
        notation = `${rangeMatch[1]}.${rangeMatch[2]}-.${rangeMatch[3]}`
      }
      notation += postfix
      // English
      searchLinks.push({
        url: `http://dewey.org/webdewey/index_11.html?recordId=${recordIdPrefix}%3a${notation}`,
        label: jskos.prefLabel({ prefLabel: {
          en: "WebDewey English (requires login)",
          de: "WebDewey Englisch (benötigt Login)",
        }}, { language: infoArray[0].locale }),
      })
      // German
      searchLinks.push({
        url: `https://deweyde.pansoft.de/webdewey/index_11.html?recordId=${recordIdPrefix}%3a${notation}`,
        label: jskos.prefLabel({ prefLabel: {
          en: "WebDewey German (requires login)",
          de: "WebDewey Deutsch (benötigt Login)",
        }}, { language: infoArray[0].locale }),
      })
    }
    // Filter out duplicate URLs (e.g. Wikipedia)
    searchLinks = searchLinks.filter((link, index, self) =>
      index === self.findIndex(l => (
        l.url == link.url
      )),
    )

    return searchLinks
  },

}
