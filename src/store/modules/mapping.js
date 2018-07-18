import util from "../../util"
import _ from "lodash"

// TODO: - Add support for memberChoice and maybe memberList.

// initial state
const state = {
  mapping: {
    from: { "memberSet": [] },
    to: { "memberSet": [] },
    fromScheme: null,
    toScheme: null,
    type: [util.defaultMappingType.uri]
  }
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
   * @param {object} scheme - scheme for concept (can be ommitted if concept has "inScheme")
   * @param {bool} isLeft - side of the mapping
   */
  canAdd: (state) => (concept, scheme, isLeft) => {
    if(!getters.checkScheme(state)(scheme, isLeft)) {
      return false
    }
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
      return util.compareConcepts(c, concept)
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
    return actualScheme == null ? true : util.compareSchemes(actualScheme, scheme)
  },

  /**
   * Returns all concepts for one side of the mapping.
   *
   * @param {bool} isLeft - side of the mapping
   */
  getConcepts: (state) => (isLeft) => {
    return state.mapping[helpers.fromTo(isLeft)].memberSet
  },

  /**
   * Returns the scheme for one side of the mapping.
   *
   * @param {bool} isLeft - side of the mapping
   */
  getScheme: (state) => (isLeft) => {
    return state.mapping[helpers.fromToScheme(isLeft)]
  },

}

// mutations
const mutations = {

  /**
   * Adds a concept to one side of the mapping if possible
   *
   * Payload object: { concept, scheme, isLeft }
   * - concept: the concept to be added
   * - scheme: the scheme to which the concept belongs (can be ommitted if concept has "inScheme")
   * - isLeft: the side to which to add the concept
   */
  add(state, { concept, scheme, isLeft }) {
    scheme = scheme || concept.inScheme && concept.inScheme[0]
    if (!scheme) return
    if (getters.checkScheme(state)(scheme, isLeft)) {
      state.mapping[helpers.fromToScheme(isLeft)] = scheme
    } else {
      return
    }
    if (getters.added(state)(concept, isLeft)) {
      return
    }
    let fromTo = helpers.fromTo(isLeft)
    if (fromTo == "from" && state.mapping.from.memberSet.length != 0) {
      state.mapping.from.memberSet = [concept]
    } else {
      state.mapping[fromTo].memberSet.push(concept)
    }
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
      return util.compareConcepts(c, concept)
    })
    if (indexConcept == -1) {
      return
    }
    state.mapping[fromTo].memberSet.splice(indexConcept, 1)
    if (state.mapping[fromTo].memberSet.length == 0) {
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
   * Sets the whole mapping to a new object
   *
   * Payload object: { mapping }
   * - mapping: the object to be saved as the new mapping
   */
  set(state, { mapping }) {
    // TODO: Run checks on new mapping object.
    state.mapping = mapping
  },

  /**
   * Sets the type for the mapping.
   *
   * Payload object: { uri }
   * - uri: the URI for the mapping type
   */
  setType(state, { uri }) {
    state.mapping.type = [uri]
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
}
