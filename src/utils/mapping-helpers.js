import _ from "lodash"
import jskos from "jskos-tools"
import { userUris } from "@/utils"
import { concordances } from "@/items"
import store from "@/store"

/**
 * Returns registry object from config for a registry or URI. Fallback to current registry if it's null.
 *
 * @param {Object|string} registry
 */
export function getRegistry(registry) {
  registry = registry || store.getters.currentRegistry
  // Keep backward compatibility with old way of calling
  if (_.isString(registry)) {
    registry = { uri: registry }
  }
  registry = (store.state.config.registries || []).find(r => jskos.compareFast(r, registry))
  return registry
}

export function isCreatorOrContributor(entity, user) {
  if (!entity) return false
  const creatorUris = [].concat(
    entity.creator || [],
    entity.contributor || [],
  ).map(c => c.uri)
  return _.intersection(userUris(user), creatorUris).length > 0
}

export function canCreateMapping({ registry, mapping, user }) {
  if (!mapping || !registry) {
    return false
  }
  // Check multiple things regarding fromScheme/toScheme
  for (let side of ["fromScheme", "toScheme"]) {
    // Require both sides
    if (!mapping[side]) {
      return false
    }
    // Check registry whitelist
    const whitelist = _.get(registry, `config.mappings.${side}Whitelist`)
    if (whitelist) {
      if (!whitelist.find(s => jskos.compare(s, mapping[side]))) {
        return false
      }
    }
    // Check cardinality
    const cardinality = _.get(registry, "config.mappings.cardinality")
    if (cardinality == "1-to-1" && jskos.conceptsOfMapping(mapping, "to").length > 1) {
      return false
    }
  }
  if (mapping.partOf && mapping.partOf[0]) {
    // Check if user can add mapping to concordance as well
    if (!canAddMappingToConcordance({ registry, mapping: _.omit(mapping, "partOf"), concordance: concordances.find(c => jskos.compare(c, mapping.partOf[0])) })) {
      return false
    }
  }
  // Check if user is authorized in current registry
  if (!registry.isAuthorizedFor({
    type: "mappings",
    action: "create",
    user,
  })) {
    return false
  }
  return true
}

export function canUpdateMapping({ registry, mapping, user }) {
  if (!mapping) {
    return false
  }
  registry = registry || mapping._registry
  if (!registry) {
    return false
  }
  const concordance = concordances.find(c => jskos.compare(c, _.get(mapping, "partOf[0]")))
  const isContributor = isCreatorOrContributor(concordance, user)
  let crossUser = !jskos.userOwnsMapping(user, mapping)
  if (concordance && !isContributor) {
    return false
  } else if (isContributor) {
    crossUser = false
  }
  return registry.isAuthorizedFor({
    type: "mappings",
    action: "update",
    user,
    crossUser,
  })
}

export function canDeleteMapping({ registry, mapping, user }) {
  if (!mapping) {
    return false
  }
  registry = registry || mapping._registry
  if (!registry) {
    return false
  }
  let crossUser = !jskos.userOwnsMapping(user, mapping)
  return registry.isAuthorizedFor({
    type: "mappings",
    action: "delete",
    user,
    crossUser,
  })
}

export function canAddMappingToConcordance({ registry, concordance, mapping, user }) {
  registry = getRegistry(registry || mapping._registry)
  if (!registry) {
    throw new Error("canRemoveMappingFromConcordance: No registry for mapping.")
  }
  if (!concordance || !mapping || !registry || !registry.isAuthorizedFor({
    type: "mappings",
    action: "update",
    user,
  })) {
    return false
  }
  if (!mapping.partOf || mapping.partOf.length === 0) {
    // Mapping not part of any concordance; check if user can update this mapping
    if (!canUpdateMapping({ registry, mapping, user })) {
      return false
    }
  } else {
    // Mapping is part of concordance; check if user is creator/contributor of that concordance
    const concordance = concordances.find(c => jskos.compare(c, mapping.partOf[0]))
    if (!concordance || !isCreatorOrContributor(concordance, user)) {
      return false
    }
  }
  // Check if user is creator/contributor of target concordance
  if (!isCreatorOrContributor(concordance, user)) {
    return false
  }
  // Check if fromScheme/toScheme are equal
  if (!jskos.compare(concordance.fromScheme, mapping.fromScheme) || !jskos.compare(concordance.toScheme, mapping.toScheme)) {
    return false
  }
  return true
}

export function canRemoveMappingFromConcordance({ registry, mapping, user }) {
  registry = getRegistry(registry || mapping._registry)
  if (!registry) {
    throw new Error("canRemoveMappingFromConcordance: No registry for mapping.")
  }
  if (!mapping || !registry || !registry.isAuthorizedFor({
    type: "mappings",
    action: "update",
    user,
  })) {
    return false
  }
  // Mapping is part of concordance; check if user is creator/contributor of that concordance
  const concordance = mapping.partOf && mapping.partOf[0] && concordances.find(c => jskos.compare(c, mapping.partOf[0]))
  if (!concordance || !isCreatorOrContributor(concordance, user)) {
    return false
  }
  return true
}
