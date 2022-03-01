import _ from "lodash"
import jskos from "jskos-tools"

export function getRegistryName({ registry, locale }) {
  if (!registry) {
    return ""
  }
  let label = jskos.prefLabel(registry, { language: locale, fallbackToUri: false })
  if (label) {
    return label
  }
  // Try _config (i.e. result of /status endpoint)
  label = _.get(registry, "_config.title")
  if (label) {
    const baseUrl = _.get(registry, "_config.baseUrl")
    return baseUrl ? `${label} (${baseUrl})` : label
  }
  // Try URI
  if (registry.uri) {
    return registry.uri
  }
  // Try API URL
  label = _.get(registry, "_api.api")
  if (label) {
    return label
  }
  return ""
}
