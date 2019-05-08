import jskos from "jskos-tools"
import _ from "lodash"
import Vue from "vue"

// TODO: - Add support for memberChoice and maybe memberList.

const emptyMapping = {
  from: { "memberSet": [] },
  to: { "memberSet": [] },
  fromScheme: null,
  toScheme: null,
  type: [jskos.defaultMappingType.uri]
}

// initial state
const state = {
  mapping: jskos.copyDeep(emptyMapping),
  original: null,
  mappingsNeedRefresh: false,
  mappingsNeedRefreshRegistry: null,
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
    return state.mapping[helpers.fromTo(isLeft)].memberSet || state.mapping[helpers.fromTo(isLeft)].memberList || state.mapping[helpers.fromTo(isLeft)].memberChoice || []
  },

  /**
   * Returns the scheme for one side of the mapping.
   *
   * @param {bool} isLeft - side of the mapping
   */
  getScheme: (state) => (isLeft) => {
    return state.mapping[helpers.fromToScheme(isLeft)]
  },

  hasChangedFromOriginal: (state) => {
    if (!state.mapping) {
      return false
    }
    if (!state.original) {
      return true
    }
    // Check if notes have changed
    // Add more fields like this if needed.
    if (!_.isEqual(state.mapping.note, state.original.note)) {
      return true
    }
    if (!_.isEqual(state.mapping.creator, state.original.creator)) {
      return true
    }
    return !jskos.compareMappings(state.original, state.mapping)
  }

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
      // Remove conncetion to original mapping because a whole side changed.
      state.original = null
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
   */
  set(state, { mapping = null, original = null }) {
    // TODO: Run checks on new mapping object.
    if (mapping) {
      state.mapping = mapping
    }
    // Save the original with identifiers and the LOCAL property.
    if (original) {
      state.original = jskos.addMappingIdentifiers(original)
    } else if (!mapping) {
      state.original = null
    }
  },

  /**
   * Empties the mapping object
   */
  empty(state) {
    state.mapping = jskos.copyDeep(emptyMapping)
    state.original = null
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
   * Sets the note for the mapping.
   *
   * Payload object: { note }
   * - note: a language map of list of notes
   */
  setNote(state, { note }) {
    if (_.isObject(note)) {
      let noteCount = 0
      _.forOwn(note, value => {
        noteCount += value.length
      })
      if (!noteCount) {
        note = null
      }
    }
    if (!note) {
      delete state.mapping.note
    } else {
      state.mapping.note = note
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
      toScheme: state.mapping.fromScheme
    })
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
}

// actions
// TODO: Refactoring!
const actions = {

  getMappings({ rootGetters, rootState }, { from, to, direction, mode, identifier, registry, onlyFromMain = false, all = false, selected } = {}) {
    let config = rootState.config
    let registries = []
    if (onlyFromMain) {
      // Try to find registry that fits state.mappingRegistry
      let registry = rootGetters.getCurrentRegistry
      if (registry) {
        registries = [registry]
      }
    } else {
      if (registry) {
        let uri = registry
        registry = config.registries.find(registry => jskos.compare(registry, { uri }))
        if (registry) {
          registries = [registry]
        }
      } else {
        registries = config.registries.filter(registry => registry.provider.has.mappings || (all && registry.provider.has.occurrences))
      }
    }
    let promises = []
    for (let registry of registries) {
      if (all) {
        promises.push(registry.provider.getAllMappings({ from, to, direction, mode, identifier, selected }))
      } else {
        promises.push(registry.provider.getMappings({ from, to, direction, mode, identifier }))
      }
    }
    return Promise.all(promises).then(results => {
      let mappings = _.union(...results)
      // TODO: Adjustments, like replacing schemes and concepts with references in store, etc.
      return mappings
    })
  },

  saveMappings({ rootGetters, rootState }, { mappings, registry }) {
    let config = rootState.config
    let uri = registry
    if (uri) {
      registry = config.registries.find(registry => jskos.compare(registry, { uri }))
    } else {
      registry = rootGetters.getCurrentRegistry
    }
    if (!registry || !registry.provider || !registry.provider.has.canSaveMappings) {
      console.warn("Tried to save mappings, but could not determine provider.")
      return Promise.resolve([])
    }
    // Minify mappings before saving
    mappings = mappings.map(({ mapping, original }) => ({ mapping: jskos.minifyMapping(mapping), original }))
    return registry.provider.saveMappings(mappings)
  },

  removeMappings({ state, rootGetters, commit, rootState }, { mappings, registry }) {
    let config = rootState.config
    let uri = registry
    if (uri) {
      registry = config.registries.find(registry => jskos.compare(registry, { uri }))
    } else {
      registry = rootGetters.getCurrentRegistry
    }
    if (!registry || !registry.provider || !registry.provider.has.canRemoveMappings) {
      console.warn("Tried to remove mappings, but could not determine provider.")
      return Promise.resolve([])
    }
    return registry.provider.removeMappings(mappings).then(removedMappings => {
      // Check if current original was amongst the removed mappings
      removedMappings.forEach((deleted, index) => {
        if (deleted) {
          let mapping = mappings[index]
          if (_.isEqual(jskos.minifyMapping(mapping), jskos.minifyMapping(state.original)) && jskos.compare(_.get(mapping, "_provider.registry"), _.get(state.original, "_provider.registry"))) {
            // Set original to null
            commit({ type: "set" })
          }
        }
      })
      return removedMappings
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
