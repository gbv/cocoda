import api from "../api"
import config from "../config"
import util from "../util"

export default {
  init ({ commit, getters }) {
    // Prepare config
    commit({
      type: "setConfig",
      config
    })

    let schemes = [], promises = []
    // Prepare all terminology providers
    for (let provider of config.terminologyProviders) {
      let url = provider.url || null, saveSchemePromise = Promise.resolve(null)
      if(!Array.isArray(provider.voc)) {
      // Load schemes
        let vocEndpoint = typeof(provider.voc) === "string" ? provider.voc : url + "/voc"
        if (vocEndpoint) {
          saveSchemePromise = api.get(vocEndpoint)
            .then(function(data) {
              if (Array.isArray(data)) {
                provider.voc = data
                return provider
              } else {
                console.warn("Couldn't load schemes for provider", provider)
                commit({
                  type: "alerts/add",
                  text: `Could not load concept schemes for provider ${provider.url}. Please open an issue on GitHub.`,
                  variant: "danger"
                })
              }
            })
        // TODO: - error handling
        }
      } else {
        saveSchemePromise = Promise.resolve(provider)
      }
      if (!provider.data) {
        provider.data = url ? url + "/data" : null
      }
      if (!provider.suggest) {
        provider.suggest = url ? url + "/suggest" : null
      }
      if (!provider.top) {
        provider.top = url ? url + "/voc/top" : null
      }
      if (!provider.ancestors) {
        provider.ancestors = url ? url + "/ancestors" : null
      }
      if (!provider.narrower) {
        provider.narrower = url ? url + "/narrower" : null
      }
      // Save scheme in store and in schemes array
      promises.push(saveSchemePromise.then(provider => {
        if (!provider || !provider.voc) return
        provider.voc.forEach(scheme => {
        // Set provider for scheme
          scheme.PROVIDER = provider
          // Add scheme specific custom properties
          scheme.DETAILSLOADED = false
          scheme.TOPCONCEPTS = [null]
          scheme.type = scheme.type || ["http://www.w3.org/2004/02/skos/core#ConceptScheme"]
          // Check if scheme is already in store
          let otherScheme = getters["objects/get"](scheme), prio, otherPrio, override = false
          // let otherScheme = null, prio, otherPrio
          if (otherScheme) {
            prio = provider.prio || 0
            otherPrio = otherScheme.provider ? (otherScheme.provider.priority || 0) : -1
            override = otherPrio < prio
          }
          if (!otherScheme || override){
            if (override) {
            // Find and remove scheme from schemes array
              let otherSchemeIndex = -1
              for (let index = 0; index < schemes.length; index += 1) {
                if (util.compareSchemes(scheme, schemes[index])) {
                  otherSchemeIndex = index
                  break
                }
              }
              schemes.splice(otherSchemeIndex, 1)
            }
            // Force save into store
            commit({
              type: "objects/save",
              object: scheme,
              force: true
            })
            // Save into schemes array
            schemes.push(scheme)
          }
        })
      }))
    }
    Promise.all(promises).then(() => {
      // Sort schemes
      util.sortSchemes(schemes)
      // Commit schemes to store
      commit({
        type: "setSchemes",
        schemes
      })
    })
  }
}
