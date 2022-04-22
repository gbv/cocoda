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

export function displayNameForConcordance(concordance) {
  if (!concordance) {
    return ""
  }
  let name = jskos.prefLabel(concordance, { fallbackToUri: false })
    || (jskos.languageMapContent(concordance, "scopeNote") || [])[0]
    || concordance.uri
    || ""
  if (concordance.creator && concordance.creator.length) {
    let creator = jskos.prefLabel(concordance.creator[0], { fallbackToUri: false })
    if (creator) {
      name += ` (${creator})`
    }
  }
  return name
}

export function userUris(user) {
  if (!user) {
    return null
  }
  let uris = [user.uri].concat(Object.values(user.identities).map(identity => identity.uri)).filter(uri => uri != null)
  return uris
}
