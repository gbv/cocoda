// Import registry providers
import providers from "./providers"

let defaultConfig = require("../config/cocoda.default.json")
let userConfig
try {
  userConfig = require("../config/cocoda.json")
} catch(error) {
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

// load build info into config
let buildInfo = require("../build/build-info.json")
config.buildInfo = buildInfo

export default config
