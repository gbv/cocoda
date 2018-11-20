let defaultConfig = require("../config/cocoda.default.json")
let userConfig
try {
  userConfig = require("../config/cocoda.json")
} catch(error) {
  userConfig = {}
}
let config = Object.assign({}, defaultConfig, userConfig)

// Make new config file format (#64) compatible with current implementation.
if (config.registries) {
  config.terminologyProviders = []
  config.mappingProviders = []
  config.occurrenceProviders = []
  for (let registry of config.registries) {
    if (registry.plugin == "jskos-api") {
      // baseUrl -> url
      registry.url = registry.baseUrl
      // schemes -> voc
      registry.voc = registry.schemes
      // Add to list
      config.terminologyProviders.push(registry)
    } else if (registry.plugin == "jskos-mappings") {
      // mappings -> url
      registry.url = registry.mappings
      // Add to list
      config.mappingProviders.push(registry)
    } else if (registry.plugin == "jskos-occurrences") {
      // occurrences -> url
      registry.url = registry.occurrences
      // Add to list
      config.occurrenceProviders.push(registry)
    }
  }
}

// load build info into config
let buildInfo = require("../build/build-info.json")
config.buildInfo = buildInfo

export default config
