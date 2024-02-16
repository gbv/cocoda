import _ from "lodash"
import jskos from "@/utils/jskos.js"
import { getItem } from "@/items"
import i18n from "@/utils/i18n.js"

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
    return "-"
  }
  let name = jskos.prefLabel(concordance, { fallbackToUri: false })
    || (jskos.languageMapContent(concordance, "scopeNote") || [])[0]
    || ""
  const fromScheme = jskos.notation(getItem(concordance.fromScheme)) || "?", toScheme = jskos.notation(getItem(concordance.toScheme)) || "?", creator = jskos.prefLabel(concordance?.creator?.[0], { fallbackToUri: false }) || "?"
  const extra = `${fromScheme} ${i18n.t("general.to")} ${toScheme} ${i18n.t("general.by")} ${creator}`
  if (!name) {
    name = extra
  } else {
    name += ` (${extra})`
  }
  return name
}

export function concordanceSort(a, b) {
  a = displayNameForConcordance(a)
  b = displayNameForConcordance(b)
  return (a < b) ? -1 : (a === b ? 0 : 1)
}

export function userUris(user) {
  if (!user) {
    return null
  }
  let uris = [user.uri].concat(Object.values(user.identities).map(identity => identity.uri)).filter(uri => uri != null)
  return uris
}
