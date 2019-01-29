import jskos from "jskos-tools"
import _ from "lodash"
import util from "../util"
import axios from "axios"

export default {

  addSchemeToFavorites({ commit, getters }, scheme) {
    if (!scheme || !scheme.uri) {
      return
    }
    if (!jskos.isContainedIn(scheme, getters.favoriteSchemes.map(uri => { uri }))) {
      commit({
        type: "settings/set",
        prop: "favoriteSchemes",
        value: getters.favoriteSchemes.concat([scheme.uri])
      })
    }
  },
  removeSchemeFromFavorites({ commit, getters }, scheme) {
    commit({
      type: "settings/set",
      prop: "favoriteSchemes",
      value: getters.favoriteSchemes.filter(uri => !jskos.compare({ uri }, scheme))
    })
  },
  addConceptToFavorites({ commit, getters }, concept) {
    if (!concept || !concept.uri) {
      return
    }
    if (!jskos.isContainedIn(concept, getters.favoriteConcepts)) {
      // Filter properties of concepts
      let newConcept = _.pick(jskos.copyDeep(concept), ["uri", "notation", "inScheme", "prefLabel"])
      // Prepare inScheme
      newConcept.inScheme = newConcept.inScheme.map(scheme => ({ uri: scheme.uri }))
      commit({
        type: "settings/set",
        prop: "favoriteConcepts",
        value: getters.favoriteConcepts.concat([newConcept])
      })
    }
  },
  removeConceptFromFavorites({ commit, getters }, concept) {
    commit({
      type: "settings/set",
      prop: "favoriteConcepts",
      value: getters.favoriteConcepts.filter(other => !jskos.compare(concept, other))
    })
  },

  checkAuth({ state, commit }) {
    // Currently only use the first registry that provides authentication.
    // TODO: Update this as soon as proper authorization is implemented.
    let registries = state.config.registries.filter(registry => registry.auth)
    if (!registries.length) {
      commit({
        type: "setAuthorized",
        value: null
      })
      return
    }
    let loadingId = util.generateID()
    commit({
      type: "setAuthorizedLoadingId",
      value: loadingId
    })
    let username = Buffer.from(state.settings.settings.creatorUri).toString("base64")
    let password = Buffer.from(state.settings.settings.creatorCredentials).toString("base64")
    let auth = { username, password }
    let promises = []
    for (let registry of registries) {
      promises.push(axios.get(registry.auth, {
        auth
      }).then(() => {
        // If there is no error, authorization was successful
        return true
      }).catch(() => {
        // If there is an error, authorization was not successful
        return false
      }))
    }
    return Promise.all(promises).then(results => {
      let authorized = {}, index = 0
      while (index < registries.length) {
        let registry = registries[index]
        let result = results[index]
        authorized[registry.uri] = result
        if (result) {
          registry.provider.setAuth(auth)
        } else {
          registry.provider.setAuth(null)
        }
        index += 1
      }
      if (state.authorizedLoadingId == loadingId) {
        commit({
          type: "setAuthorized",
          value: authorized
        })
      }
    })
  },

}
