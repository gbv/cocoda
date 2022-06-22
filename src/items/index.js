/**
 * import { ... } from "@/items"
 *
 * TODO
 */

import { reactive, set, del } from "@/composition-api"
import _ from "lodash"
import * as jskos from "jskos-tools"
import { cdk } from "cocoda-sdk"
import log from "@/utils/log.js"
import store from "@/store"

const _items = reactive({})

const conceptProps = ["narrower", "broader", "related", "previous", "next", "ancestors", "topConcepts", "concepts", "memberList"]
const schemeProps = ["inScheme", "topConceptOf", "versionOf"]
const relatedProps = [].concat(conceptProps, schemeProps)
const mapMinimalProps = (object) => (object ? { uri: object.uri, notation: object.notation } : object)

function getRegistryForItem(item) {
  if (!item) {
    return null
  }
  if (item._registry) {
    return item._registry
  }
  const scheme = getItem(_.get(item, "inScheme[0]"))
  if (scheme && scheme._registry) {
    return scheme._registry
  }
  return null
}

export function getItem(item, { relatedItems = false } = {}) {
  let result = null
  for (const uri of jskos.getAllUris(item)) {
    if (_items[uri]) {
      result = _items[uri]
      break
    }
  }
  if (result && relatedItems) {
    // Create a copy of the object so we can safely modify the properties
    result = { ...result }
    for (const prop of relatedProps) {
      if (result[prop]) {
        result[prop] = result[prop].map(i => getItem(i) || i)
      }
    }
  }
  return result
}

export function getItemByUri(uri, options) {
  return getItem({ uri }, options)
}

export function getItems(items, options) {
  return items.map(item => getItem(item, options))
}

export function compareItems(item1, item2) {
  // Simply use items from store if available for comparison
  return jskos.compare(getItem(item1) || item1, getItem(item2) || item2)
}

export function saveItem(item, options = {}) {
  if (!item || !item.uri) {
    throw new Error("Can't save object that is null or undefined or that doesn't have a URI.")
  }
  const uri = item.uri
  const existing = getItemByUri(uri)
  // Return immediately if object reference is the same
  if (existing === item || existing && options.returnIfExists) {
    return existing
  }

  // Determine item type
  const type = options.type || (jskos.isScheme(item) ? "scheme" : (jskos.isConcept(item) ? "concept" : null))

  // Collect addition items (broader, narrower, ...) to save and replace them with URI-only objects
  const additionalItemsToSave = []
  for (const key of Object.keys(item)) {
    if (!Array.isArray(item[key])) {
      continue
    }
    if (![].concat(conceptProps, schemeProps).includes(key)) {
      continue
    }
    item[key] = item[key].map(relatedItem => {
      // Only replace if it has uri
      if (relatedItem && relatedItem.uri) {
        // Add a type to related item based on property name
        if (schemeProps.includes(key)) {
          relatedItem.__TYPE__ = "scheme"
        }
        if (conceptProps.includes(key)) {
          relatedItem.__TYPE__ = "concept"
        }
        additionalItemsToSave.push(relatedItem)
        return { uri: relatedItem.uri }
      }
      // Otherwise keep
      return relatedItem
    })
  }

  if (!existing) {
    // Set __DETAILSLOADED__ property
    item.__DETAILSLOADED__ = item.__DETAILSLOADED__ != null ? item.__DETAILSLOADED__ : 0
    // __SAVED__ means it was saved
    item.__SAVED__ = true

    // Type-specific adjustments
    if (type === "scheme") {
      // Adjustment for schemes
      const typeUri = "http://www.w3.org/2004/02/skos/core#ConceptScheme"
      item.type = item.type || []
      if (!item.type.includes(typeUri)) {
        item.type = [typeUri].concat(item.type)
      }
      // ? Anything else?
    }
    if (type === "concept") {
      // Adjustments for concepts
      const typeUri = "http://www.w3.org/2004/02/skos/core#Concept"
      item.type = item.type || []
      if (!item.type.includes(typeUri)) {
        item.type = [typeUri].concat(item.type)
      }
      item.__ISOPEN__ = { true: false, false: false }
      item.inScheme = item.inScheme || [options.scheme]
      if (!item.inScheme[0]) {
        log.warn("saveItem: Saving concept without scheme!!!", item, options)
      } else {
        // Make sure it's URI only
        item.inScheme = item.inScheme.map(mapMinimalProps)
      }
      // ? Anything else?
    }

    // Save item
    set(_items, uri, item)
    for (const id of item.identifier || []) {
      set(_items, id, _items[uri])
    }

  } else {
    // Integrate details into existing item
    // ? Could we use `jskos.merge` instead?
    for (let prop of Object.keys(item)) {
      if (
        (
          (
            _.isEmpty(existing[prop]) || Array.isArray(existing[prop]) && existing[prop].includes(null)
          ) && item[prop] != null && !_.isEqual(existing[prop], item[prop])
        ) ||
        (
          _.isArray(existing[prop]) && _.isArray(item[prop]) && item[prop].length > existing[prop].length)
      ) {
        modifyItem(existing, prop, item[prop])
      } else {
        // Special cases
        // Integrate object properties
        if (!_.isArray(existing[prop]) && !_.isArray(item[prop]) && _.isObject(existing[prop]) && _.isObject(item[prop])) {
          // Just overwrite null or not existing values
          for (let prop2 of Object.keys(item[prop])) {
            if (!existing[prop][prop2]) {
              modifyItem(existing, [prop, prop2], item[prop][prop2])
            }
          }
        }
      }
    }
  }

  // Save additional items
  // TODO: Do we need to do this for ALL items?
  const _item = _items[uri]
  additionalItemsToSave.forEach(({ __TYPE__, ...item }) => {
    const options = { type: __TYPE__ }
    if (__TYPE__ === "concept" && !(item.inScheme && item.inScheme[0])) {
      if (type === "concept") {
        options.scheme = _item.inScheme[0]
      } else if (type === "scheme") {
        options.scheme = _item
      }
    }
    saveItem(item, options)
  })

  return _items[uri]
}

export function saveItemsWithOptions(options) {
  return items => items.map(item => saveItem(item, options))
}

export function removeItem(item) {
  item = getItem(item) || item
  for (const uri of jskos.getAllUris(item)) {
    if (_items[uri]) {
      _items[uri] = null
    }
  }
}

export function removeItemByUri(uri) {
  removeItem({ uri })
}

export function modifyItem(item, path, value) {
  path = _.isArray(path) ? path : path.split(".")
  if (path.length === 1 && relatedProps.includes(path[0]) && Array.isArray(value)) {
    value = value.map(mapMinimalProps)
  }
  const lastProp = path.pop()
  let object = getItem(item)
  for (const prop of path) {
    if (!object[prop]) {
      set(object, prop, {})
    }
    object = object[prop]
  }
  set(object, lastProp, value)
}

export function modifyItemByUri(uri, path, value) {
  modifyItem({ uri }, path, value)
}

export const schemes = reactive([])
// TODO: Adjust to load one registry after another without blocking
export async function loadSchemes() {
  for (const scheme of await cdk.getSchemes({ timeout: 10000 })) {
    saveItem(scheme, { type: "scheme" })
    if (!schemes.find(s => jskos.compare(s, scheme))) {
      schemes.push({ uri: scheme.uri, identifier: scheme.identifier })
    }
  }
  return schemes
}

export async function loadTypes(scheme, { registry, force = false } = {}) {
  scheme = getItem(scheme) || scheme
  if (!force && scheme.types && !scheme.types.includes(null)) {
    return scheme.types
  }
  registry = getRegistryForItem(scheme) || registry
  if (!registry) {
    throw new Error(`loadTop: Could not find registry for item ${scheme.uri}`)
  }
  if (registry.has.types === false) {
    // Set to empty array
    modifyItem(scheme, "types", [])
    return []
  }
  try {
    const types = await registry.getTypes({ scheme })
    modifyItem(scheme, "types", types)
  } catch (error) {
    // Ignore error, show warning only.
    log.warn(`Error loading types for scheme ${scheme.uri}; assuming empty types list.`)
    modifyItem(scheme, "types", [])
  }
  return scheme.types
}

export async function loadTop(scheme, { registry, force = false } = {}) {
  scheme = getItem(scheme) || scheme
  if (!force && scheme.topConcepts && !scheme.topConcepts.includes(null)) {
    return scheme.topConcepts
  }
  registry = getRegistryForItem(scheme) || registry
  if (!registry) {
    throw new Error(`loadTop: Could not find registry for item ${scheme.uri}`)
  }
  if (registry.has.top === false) {
    // Set to empty array
    modifyItem(scheme, "topConcepts", [])
    return []
  }
  try {
    const topConcepts = (await registry.getTop({ scheme })).map(concept => {
      // Add empty array for ancestor
      concept.ancestors = []
      // Save concept
      return saveItem(concept, { type: "concept", scheme })
    })
    modifyItem(scheme, "topConcepts", jskos.sortConcepts(topConcepts, !!_.get(scheme, "DISPLAY.numericalNotation")).map(mapMinimalProps))
  } catch (error) {
    // Ignore error, show warning only.
    log.warn(`Error loading top concepts for scheme ${scheme.uri}; assuming empty list.`)
    modifyItem(scheme, "topConcepts", [])
  }
  return scheme.topConcepts
}

export const loadingConcepts = reactive([])
export const erroredConcepts = reactive([])
export async function loadConcepts(concepts, { registry: fallbackRegistry, scheme, force = false, ...options } = {}) {
  // Filter out concepts that are not saved, already have details loaded, or don't have a provider.
  // Then, sort the remaining concepts by registry.
  const list = []
  let uris = []
  concepts = concepts.map(concept => getItem(concept, { relatedItems: true }))
  for (let concept of concepts.filter(c => c && c.uri && (c.__DETAILSLOADED__ < 1 || force))) {
    const registry = getRegistryForItem(concept) || getRegistryForItem(scheme) || fallbackRegistry
    if (!registry) {
      continue
    }
    if (!force && [].concat(loadingConcepts, erroredConcepts).find(c => jskos.compare(c, concept))) {
      // Concept is already loading or errored
      continue
    }
    uris = uris.concat(jskos.getAllUris(concept))
    loadingConcepts.push(concept)
    // TODO: Remove magic number.
    const entry = list.find(e => e.registry == registry && e.concepts.length < 15)
    if (entry) {
      entry.concepts.push(concept)
    } else {
      list.push({
        registry,
        concepts: [concept],
      })
    }
  }
  // Load concepts by registry
  const promises = list.map(
    ({ registry, concepts }) =>
      registry.getConcepts({ ...options, concepts })
        .then(concepts => {
          // Save and adjust results
          let uris = []
          for (let concept of concepts) {
            concept = saveItem(concept, { scheme, type: "concept" })
            modifyItem(concept, "__DETAILSLOADED__", 1)
            uris = uris.concat(jskos.getAllUris(concept))
          }
          // Remove all loaded URIs from loadingConcepts
          for (let uri of uris) {
            let index = loadingConcepts.findIndex(concept => jskos.compareFast(concept, { uri }))
            if (index >= 0) {
              del(loadingConcepts, index)
            }
          }
        })
        .catch(() => {
          // Ignore errors (will mark concepts that weren't loaded as errored)
        }))
  await Promise.all(promises)
  // Move all URIs that were not loaded to errored concepts
  for (let uri of uris) {
    let index = loadingConcepts.findIndex(concept => jskos.compareFast(concept, { uri }))
    if (index >= 0) {
      let concept = loadingConcepts[index]
      modifyItem(concept, "__DETAILSLOADED__", -1)
      del(loadingConcepts, index)
      erroredConcepts.push(concept)
    }
  }
  // Return objects
  return concepts.map(c => getItem(c))
}

export async function loadNarrower(concept, { registry, force = false } = {}) {
  concept = getItem(concept, { relatedItems: true }) || concept
  if (!force && concept.narrower && !concept.narrower.includes(null)) {
    return concept.narrower
  }
  registry = getRegistryForItem(concept) || registry
  if (!registry) {
    throw new Error(`loadNarrower: Could not find registry for item ${concept.uri}`)
  }
  if (registry.has.narrower === false) {
    // Set to empty array
    modifyItem(concept, "narrower", [])
    return []
  }
  try {
    const scheme = getItem(_.get(concept, "inScheme[0]"))
    const narrower = (await registry.getNarrower({ concept })).map(child => {
      // Set ancestors
      // TODO: Include registry.has.ancestors?
      if (!concept.ancestors || concept.ancestors.includes(null)) {
        child.ancestors = [null]
      } else {
        child.ancestors = [concept].concat(concept.ancestors)
      }
      // Set broader
      if (!child.broader || child.broader.includes(null)) {
        child.broader = [concept]
      }
      // Save concept
      return saveItem(child, { type: "concept", scheme })
    })
    const narrowerSorted = jskos.sortConcepts(narrower, !!_.get(scheme, "DISPLAY.numericalNotation")).map(mapMinimalProps)
    modifyItem(concept, "narrower", narrowerSorted)
    return narrowerSorted
  } catch (error) {
    log.error(`Error loading narrower concepts for ${concept.uri}`, error)
    modifyItem(concept, "narrower", [])
    return []
  }
}

export async function loadAncestors(concept, { registry, force = false } = {}) {
  concept = getItem(concept, { relatedItems: true }) || concept
  if (!force && concept.ancestors && !concept.ancestors.includes(null)) {
    return concept.ancestors
  }
  registry = getRegistryForItem(concept) || registry
  if (!registry) {
    throw new Error(`loadAncestors: Could not find registry for item ${concept.uri}`)
  }
  if (registry.has.ancestors === false) {
    // Set to empty array
    modifyItem(concept, "ancestors", [])
    return []
  }
  try {
    let currentAncestors = []
    const ancestors = (await registry.getAncestors({ concept })).reverse().map(ancestor => {
      // Set ancestors
      ancestor.ancestors = currentAncestors.slice()
      currentAncestors = [{ uri: ancestor.uri }].concat(currentAncestors)
      // Save concept
      return saveItem(ancestor, { type: "concept", scheme: _.get(concept, "inScheme[0]") })
    }).map(mapMinimalProps).reverse()
    modifyItem(concept, "ancestors", ancestors)
    // Set ancestors for narrower of concept if necessary
    currentAncestors = [{ uri: concept.uri }].concat(currentAncestors);
    (concept.narrower || []).forEach(child => {
      child && modifyItem(child, "ancestors", currentAncestors.slice())
    })
    return ancestors
  } catch (error) {
    log.error(`Error loading ancestor concepts for ${concept.uri}`, error)
    modifyItem(concept, "ancestors", [])
    return []
  }
}

// Concordances
export const concordances = reactive([])
export async function loadConcordances() {
  try {
    const result = _.flatten(await Promise.all(store.getters.concordanceRegistries.map(r => r.getConcordances())))
    _.forEach(result, (concordance, index) => {
      // Set values of concordance array
      set(concordances, index, concordance)
    })
    set(concordances, "length", result.length)
  } catch (error) {
    log.error("MappingBrowser - Error loading concordances", error)
  }
}
