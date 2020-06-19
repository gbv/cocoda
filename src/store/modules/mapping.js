import jskos from "jskos-tools"
import _ from "lodash"
import Vue from "vue"

import localforage from "localforage"
const localStorageKey = "cocoda-mappingTrash--" + window.location.pathname

// TODO: - Add support for memberChoice and maybe memberList.

const emptyMapping = {
  from: { "memberSet": [] },
  to: { "memberSet": [] },
  fromScheme: null,
  toScheme: null,
  type: [jskos.defaultMappingType.uri],
}

// initial state
const state = {
  mapping: jskos.copyDeep(emptyMapping),
  original: {
    uri: null,
    mapping: null,
    registry: null,
  },
  mappingsNeedRefresh: false,
  mappingsNeedRefreshRegistry: null,
  mappingTrash: [],
  mappingTrashLoaded: false,
}

// helper functions
const helpers = {

  /**
   * Returns "from" or "to" depending on `isLeft`.
   */
  fromTo(isLeft) {
    return isLeft ? "from" : "to"
  },

  /**
   * Returns "fromScheme" or "toScheme" depending on `isLeft`.
   */
  fromToScheme(isLeft) {
    return helpers.fromTo(isLeft) + "Scheme"
  },

}

// getters
const getters = {

  /**
   * Adds a concept to the mapping.
   *
   * @param {object} concept - concept to be added
   * @param {object} scheme - scheme for concept (can be omitted if concept has "inScheme")
   * @param {bool} isLeft - side of the mapping
   */
  canAdd: (state) => (concept, scheme, isLeft) => {
    if(concept == null) {
      return false
    }
    if(getters.added(state)(concept, isLeft)) {
      return false
    }
    return true
  },

  /**
   * Checks if a concept has already been added.
   *
   * @param {object} concept - concept object
   * @param {bool} isLeft - side of the mapping
   */
  added: (state) => (concept, isLeft) => {
    let fromTo = helpers.fromTo(isLeft)
    let indexConcept = _.findIndex(state.mapping[fromTo].memberSet, c => {
      return jskos.compare(c, concept)
    })
    return indexConcept != -1
  },

  /**
   * Checks if a scheme matches with on side of the mapping.
   * Note that a positive match is returned if the side has no scheme yet.
   *
   * @param {object} scheme - scheme object
   * @param {bool} isLeft - side of the mapping
   */
  checkScheme: (state) => (scheme, isLeft) => {
    let actualScheme = getters.getScheme(state)(isLeft)
    return actualScheme == null ? true : jskos.compare(actualScheme, scheme)
  },

  /**
   * Returns all concepts for one side of the mapping.
   *
   * @param {bool} isLeft - side of the mapping
   */
  getConcepts: (state) => (isLeft) => {
    if (_.isBoolean(isLeft)) {
      let side = helpers.fromTo(isLeft)
      return jskos.conceptsOfMapping(state.mapping, side)
    } else {
      return jskos.conceptsOfMapping(state.mapping)
    }
  },

  /**
   * Returns the scheme for one side of the mapping.
   *
   * @param {bool} isLeft - side of the mapping
   */
  getScheme: (state) => (isLeft) => {
    return state.mapping[helpers.fromToScheme(isLeft)]
  },

  hasChangedFromOriginal: (state, getters, rootState, rootGetters) => {
    if (!state.mapping) {
      return false
    }
    if (!state.original.uri) {
      return true
    }
    // If original registry is not the currently chosen registry, return true
    const registry = rootGetters.getCurrentRegistry
    if (!jskos.compare(state.original.registry, registry)) {
      return true
    }
    const original = state.original.mapping
    let isCreatorEqual = (a, b) => {
      if (!a && !b) {
        return true
      }
      if ((a || []).length != (b || []).length) {
        return false
      }
      let aCreator = a && a[0], bCreator = b && b[0]
      if (!aCreator && !bCreator) {
        return true
      }
      if (aCreator && !bCreator || !aCreator && bCreator) {
        return false
      }
      if (aCreator.uri != bCreator.uri) {
        return false
      }
      if (jskos.prefLabel(aCreator) != jskos.prefLabel(bCreator)) {
        return false
      }
      return true
    }
    // TODO: Take anonymous of registry into account
    if (!registry.isAuthorizedFor({
      type: "mappings",
      action: "anonymous",
      user: rootState.auth.user,
    }) && !isCreatorEqual(state.mapping.creator, original.creator)) {
      return true
    }
    return !jskos.compareMappings(original, state.mapping)
  },

  mappingTrash: (state, getters, rootState) => {
    let config = rootState.config
    let trash = []
    for (let item of state.mappingTrash) {
      let registry = config.registries.find(registry => jskos.compare(registry, item.registry))
      trash.push(Object.assign({}, item, { registry }))
    }
    return trash
  },

  canCreate: (state, getters, rootState, rootGetters) => {
    const registry = rootGetters.getCurrentRegistry
    if (!registry) {
      return false
    }
    return registry.isAuthorizedFor({
      type: "mappings",
      action: "create",
      user: rootState.auth.user,
    }) && !!state.mapping.fromScheme && !!state.mapping.toScheme
  },

  canUpdate: (state, getters, rootState, rootGetters) => {
    const registry = rootGetters.getCurrentRegistry
    if (!registry || !jskos.compare(registry, state.original.registry) || !state.mapping || !state.original.uri) {
      return false
    }
    const crossUser = !jskos.userOwnsMapping(rootState.auth.user, state.original.mapping)
    return registry.isAuthorizedFor({
      type: "mappings",
      action: "update",
      user: rootState.auth.user,
      crossUser,
    }) && !!state.mapping.fromScheme && !!state.mapping.toScheme
  },

  canDelete: (state, getters, rootState, rootGetters) => {
    const registry = rootGetters.getCurrentRegistry
    if (!registry || !jskos.compare(registry, state.original.registry) || !state.mapping || !state.original.uri) {
      return false
    }
    const crossUser = !jskos.userOwnsMapping(rootState.auth.user, state.original.mapping)
    return registry.isAuthorizedFor({
      type: "mappings",
      action: "delete",
      user: rootState.auth.user,
      crossUser,
    })
  },

}

// mutations
const mutations = {

  /**
   * Adds a concept to one side of the mapping if possible
   *
   * Payload object: { concept, scheme, isLeft }
   * - concept: the concept to be added
   * - scheme: the scheme to which the concept belongs (can be omitted if concept has "inScheme")
   * - isLeft: the side to which to add the concept
   */
  add(state, { concept, scheme, isLeft, cardinality = "1-to-n" }) {
    scheme = scheme || concept.inScheme && concept.inScheme[0]
    if (!scheme) return
    if (getters.added(state)(concept, isLeft)) {
      return
    }
    let fromTo = helpers.fromTo(isLeft)
    if ((fromTo == "from" && state.mapping.from.memberSet.length != 0) || !getters.checkScheme(state)(scheme, isLeft)) {
      state.mapping[fromTo].memberSet = [concept]
    } else if (fromTo == "to" && cardinality == "1-to-1") {
      state.mapping[fromTo].memberSet = [concept]
    } else {
      state.mapping[fromTo].memberSet.push(concept)
    }
    state.mapping[helpers.fromToScheme(isLeft)] = scheme
  },

  /**
   * Removes a concept from one side of the mapping if possible
   *
   * Payload object: { concept, isLeft }
   * - concept: the concept to be removed
   * - isLeft: the side from which to remove the concept
   */
  remove(state, { concept, isLeft }) {
    let fromTo = helpers.fromTo(isLeft)
    let indexConcept = _.findIndex(state.mapping[fromTo].memberSet, c => {
      return jskos.compare(c, concept)
    })
    if (indexConcept == -1) {
      return
    }
    state.mapping[fromTo].memberSet.splice(indexConcept, 1)
    if (state.mapping[fromTo].memberSet.length == 0 && fromTo == "from") {
      state.mapping[helpers.fromToScheme(isLeft)] = null
    }
  },

  /**
   * Removes all concepts from one side of the mapping
   *
   * Payload object: { isLeft }
   * - isLeft: the side from which to remove all concepts
   */
  removeAll(state, { isLeft }) {
    let fromTo = helpers.fromTo(isLeft)
    state.mapping[fromTo].memberSet = []
    state.mapping[helpers.fromToScheme(isLeft)] = null
  },

  /**
   * Sets the whole mapping to a new object. If mapping is null or no mapping object is given, only the original is written.
   * To clear out a mapping, use `empty`.
   *
   * Payload object: { mapping, original }
   * - mapping: the object to be saved as the new mapping (default: not set)
   * - original: reference to the original mapping (default: null)
   * - registry: reference to the registry of the original mapping (default: null)
   */
  set(state, { mapping = null, original = null, registry = null }) {
    // TODO: Run checks on new mapping object.
    if (mapping) {
      state.mapping = mapping
    }
    // Save the original with identifiers and the LOCAL property.
    registry = registry || _.get(original, "_registry")
    if (original && registry) {
      state.original.uri = original.uri
      state.original.mapping = original
      state.original.registry = registry
    } else if (!mapping) {
      state.original.uri = null
    }
  },

  /**
   * Empties the mapping object
   */
  empty(state) {
    state.mapping = jskos.copyDeep(emptyMapping)
    state.original.uri = null
  },

  /**
   * Sets the type for the mapping.
   *
   * Payload object: { uri }
   * - uri: the URI for the mapping type
   */
  setType(state, { uri }) {
    state.mapping.type = [uri]
  },

  /**
   * Sets the creator for the mapping.
   *
   * Payload object: { creator }
   * - creator: the creator array
   */
  setCreator(state, { creator }) {
    if (creator && !_.isArray(creator)) {
      creator = [creator]
    }
    if (!creator || creator.length == 0) {
      // Remove creator from mapping
      Vue.delete(state.mapping, "creator")
    } else {
      state.mapping.creator = creator
    }
  },

  /**
   * Sets the creator for the mapping.
   *
   * Payload object: { contributor }
   * - contributor: the contributor array
   */
  setContributor(state, { contributor }) {
    if (contributor && !_.isArray(contributor)) {
      contributor = [contributor]
    }
    if (!contributor || contributor.length == 0) {
      // Remove contributor from mapping
      Vue.delete(state.mapping, "contributor")
    } else {
      state.mapping.contributor = contributor
    }
  },

  /**
   * Sets the fromScheme or toScheme for the mapping if that side has no concepts.
   *
   * Payload object: { isLeft, scheme }
   * - isLeft: side on which to set scheme
   * - scheme: the scheme object
   */
  setScheme(state, { isLeft = true, scheme }) {
    if (getters.getConcepts(state)(isLeft).length == 0) {
      state.mapping[helpers.fromToScheme(isLeft)] = scheme
    }
  },

  switch(state) {
    Object.assign(state.mapping, {
      from: state.mapping.to,
      to: state.mapping.from,
      fromScheme: state.mapping.toScheme,
      toScheme: state.mapping.fromScheme,
    })
    // Switch narrower and broad match
    if (state.mapping.type[0] == "http://www.w3.org/2004/02/skos/core#narrowMatch") {
      state.mapping.type[0] = "http://www.w3.org/2004/02/skos/core#broadMatch"
    } else if (state.mapping.type[0] == "http://www.w3.org/2004/02/skos/core#broadMatch") {
      state.mapping.type[0] = "http://www.w3.org/2004/02/skos/core#narrowMatch"
    }
  },

  setIdentifier(state) {
    // Only set identifier if both fromScheme and toScheme are available
    if (state.mapping.fromScheme && state.mapping.toScheme) {
      state.mapping = jskos.addMappingIdentifiers(state.mapping)
    }
  },

  setRefresh(state, { refresh = true, registry } = {}) {
    // TODO: Refactoring!
    if (refresh && registry) {
      state.mappingsNeedRefreshRegistry = registry
    } else {
      state.mappingsNeedRefreshRegistry = null
    }
    state.mappingsNeedRefresh = refresh
  },

  setTrash(state, { trash } = {}) {
    state.mappingTrash = trash
    state.mappingTrashLoaded = true
  },

  addToTrash(state, { mapping, registry } = {}) {
    let item = {
      mapping: jskos.minifyMapping(mapping),
      registry: { uri: registry.uri },
    }
    state.mappingTrash = [item].concat(state.mappingTrash)
    // Max 10 items
    if (state.mappingTrash.length > 10) {
      state.mappingTrash = state.mappingTrash.slice(0, 10)
    }
  },

  removeFromTrash(state, { uri } = {}) {
    state.mappingTrash = state.mappingTrash.filter(item => item.mapping.uri != uri)
  },

  clearTrash(state) {
    state.mappingTrash = []
  },

}

// actions
const actions = {

  loadMappingTrash({ commit }) {
    return localforage.getItem(localStorageKey).then(trash => {
      if (trash) {
        commit({
          type: "setTrash",
          trash,
        })
      } else {
        commit({
          type: "setTrash",
          trash: [],
        })
      }
    })
  },

  restoreMappingFromTrash({ state, rootState, commit }, { uri }) {
    let config = rootState.config
    let item = state.mappingTrash.find(item => item.mapping.uri == uri)
    let registry = config.registries.find(registry => jskos.compare(registry, item && item.registry))
    if (!item || !registry) {
      console.warn("Tried to restore mapping from trash, but could not find item or determine provider.", item)
      return Promise.resolve(null)
    }
    return registry.postMapping({ mapping: item.mapping }).then(mapping => {
      if (mapping) {
        // Remove item from trash
        commit({
          type: "removeFromTrash",
          uri,
        })
        // Set refresh
        commit({
          type: "setRefresh",
          registry: registry.uri,
        })
      }
      return mapping
    })
  },

}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
