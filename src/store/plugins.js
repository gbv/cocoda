import router from "@/router.js"
import { isNavigationFailure } from "vue-router"
import jskos from "@/utils/jskos.js"
import { compareItems } from "@/items"

/**
 * Plugin that recalculates the mapping identifier for the current mapping on each change.
 */
const mappingIdentifierPlugin = store => {
  store.subscribe((mutation) => {
    // Check for selecting a concept
    if (mutation.type.startsWith("mapping") && !mutation.type.endsWith("setIdentifier")) {
      store.commit("mapping/setIdentifier")
    }
  })
}

import { toRaw } from "vue"
import localforage from "localforage"
const localStorageKey = "cocoda-mappingTrash--" + window.location.pathname
/**
 * Plugin that synchronizes the mapping trash to local storage.
 */
const mappingTrashPlugin = store => {
  store.subscribe((mutation) => {
    if (["mapping/addToTrash", "mapping/removeFromTrash", "mapping/clearTrash"].includes(mutation.type) && store.state.mapping.mappingTrashLoaded) {
      localforage.setItem(localStorageKey, toRaw(store.state.mapping.mappingTrash))
    }
  })
}

/**
 * Helper function that refreshes the router with the current mapping and selected concepts/schemes.
 */
const refreshRouter = (store) => {
  // Add selected schemes and concepts
  let kinds = ["scheme", "concept"]
  let sides = { true: "from", false: "to" }
  let query = {}
  for (let kind of kinds) {
    for (let isLeft of [true, false]) {
      let key = sides[isLeft] + (kind == "scheme" ? "Scheme" : "")
      let object = store.state.selected[kind][isLeft]
      if (object && object.uri) {
        query[key] = object.uri
      }
    }
  }
  // Add mapping if there is at least one concept
  if (jskos.conceptsOfMapping(store.state.mapping.mapping).length) {
    if (store.getters["mapping/hasChangedFromOriginal"]) {
      query.mapping = JSON.stringify(jskos.minifyMapping(store.state.mapping.mapping))
    }
    // If an original mapping exists for the current mapping, save its identifier as well
    if (store.state.mapping.original) {
      if (store.state.mapping.original.uri) {
        query.mappingUri = store.state.mapping.original.uri
      } else if (store.state.mapping.original.identifier) {
        query.mappingIdentifier = store.state.mapping.original.identifier.find(id => id && id.startsWith("urn:jskos:mapping:content:"))
      }
    }
  }
  // Keep certain properties from original route.
  // `currentRoute` is a Ref in vue-router 4, hence `.value`.
  const currentQuery = router.currentRoute.value.query
  if (currentQuery.config) {
    query.config = currentQuery.config
  }
  // Decide whether to push or replace depending on change in schemes/concepts
  let replace = true
  for (let kind of kinds) {
    for (let isLeft of [true, false]) {
      let key = sides[isLeft] + (kind == "scheme" ? "Scheme" : "")
      if (query[key] != currentQuery[key]) {
        replace = false
      }
    }
  }
  // Push or replace route
  let promise
  if (replace) {
    promise = router.replace({ query })
  } else {
    promise = router.push({ query })
  }
  // vue-router 4 no longer rejects on duplicate navigation; it resolves with a
  // NavigationFailure instead. Only swallow those, so real errors still surface
  // (the old blanket `.catch(() => null)` hid them).
  return promise.then(failure => {
    if (failure && !isNavigationFailure(failure)) {
      throw failure
    }
    return null
  })
}

/**
 * Plugin that sets URL parameters after selected scheme/concept/mapping changed.
 */
const routerParamPlugin = store => {
  store.subscribe(mutation => {
    const mutationTypes = [
      "selected/clear",
      "selected/set",
      "mapping/add",
      "mapping/remove",
      "mapping/removeAll",
      "mapping/set",
      "mapping/setType",
      "mapping/setConcordance",
      "mapping/switch",
      "mapping/empty",
    ]
    if (mutationTypes.includes(mutation.type)) {
      if (mutation.payload && mutation.payload.noQueryRefresh) {
        return
      }
      refreshRouter(store)
    }
  })
}

/**
 * Plugin that remembers last used concordance for mapping in MappingEditor
 */
const lastUsedConcordanceStore = {
  concordance: undefined,
}
const lastUsedConcordancePlugin = store => {
  store.subscribe(mutation => {
    if (mutation.payload && mutation.payload.skipPlugin) {
      return
    }
    if (mutation.type === "mapping/setConcordance") {
      lastUsedConcordanceStore.concordance = mutation.payload && mutation.payload.concordance
    } else if (lastUsedConcordanceStore.concordance && ["mapping/add", "mapping/set", "mapping/switch"].includes(mutation.type)) {
      const concordance = lastUsedConcordanceStore.concordance
      // Compare against last used concordance and set concordance if necessary
      if (compareItems(concordance.fromScheme, store.state.mapping.mapping.fromScheme) && compareItems(concordance.toScheme, store.state.mapping.mapping.toScheme)) {
        store.commit({
          type: "mapping/setConcordance",
          concordance,
        })
      } else {
        store.commit({
          type: "mapping/setConcordance",
          concordance: null,
          skipPlugin: true,
        })
      }
    }
  })
}

let plugins = [mappingIdentifierPlugin, mappingTrashPlugin, routerParamPlugin, lastUsedConcordancePlugin]
export { plugins, refreshRouter }
