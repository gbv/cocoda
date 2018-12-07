// Import registry providers
import providers from "./registry-providers"

let defaultConfig = require("../config/cocoda.default.json")
let userConfig
try {
  userConfig = require("../config/cocoda.json")
} catch(error) {
  userConfig = {}
}
let config = Object.assign({}, defaultConfig, userConfig)

if (config.registryMode == "merge") {
  config.registries = [].concat(defaultConfig.registries || [], userConfig.registries || [])
}

// Make new config file format (#64) compatible with current implementation.
if (config.registries) {
  config.terminologyProviders = []
  config.mappingProviders = []
  config.occurrenceProviders = []
  for (let registry of config.registries) {
    if (registry.provider == "ConceptApi") {
      // baseUrl -> url
      registry.url = registry.baseUrl
      // schemes -> voc
      registry.voc = registry.schemes
      // Add to list
      config.terminologyProviders.push(registry)
    } else if (registry.provider == "MappingsApi") {
      // mappings -> url
      registry.url = registry.mappings
      // Add to list
      config.mappingProviders.push(registry)
    } else if (registry.provider == "OccurrencesApi") {
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

config.registries = config.registries.filter(registry => registry.provider != null)

// load build info into config
let buildInfo = require("../build/build-info.json")
config.buildInfo = buildInfo

export default config
