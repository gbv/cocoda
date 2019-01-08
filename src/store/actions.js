import config from "../config"
import jskos from "jskos-tools"
import util from "../util"
import _ from "lodash"

export default {
  init ({ commit, getters }) {
    // Prepare config
    // Work with a local copy of the config so that we don't use schemes that have already been added to store (causes observers not to work properly).
    let localConfig = _.cloneDeep(config)
    commit({
      type: "setConfig",
      config
    })

    let schemes = [], promises = []

    for (let registry of localConfig.registries) {
      let provider = registry.provider
      if (provider.has.concepts) {
        let promise = provider.getSchemes().then(results => {
          for (let scheme of results) {
            // Set provider for scheme
            scheme.__PROVIDER__ = registry
            // Add scheme specific custom properties
            scheme.__DETAILSLOADED__ = true
            scheme.__TOPCONCEPTS__ = [null]
            scheme.type = scheme.type || ["http://www.w3.org/2004/02/skos/core#ConceptScheme"]
            // Check if scheme is already in store
            let otherScheme = getters["objects/get"](scheme), prio, otherPrio, override = false
            // let otherScheme = null, prio, otherPrio
            if (otherScheme) {
              prio = registry.prio || 0
              otherPrio = otherScheme.__PROVIDER__ ? (otherScheme.__PROVIDER__.priority || 0) : -1
              override = otherPrio < prio
            }
            if (!otherScheme || override){
              if (override) {
              // Find and remove scheme from schemes array
                let otherSchemeIndex = -1
                for (let index = 0; index < schemes.length; index += 1) {
                  if (jskos.compare(scheme, schemes[index])) {
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
          }
        }).catch(() => {
          console.warn("Couldn't load schemes for registry", registry.uri)
          commit({
            type: "alerts/add",
            text: `Could not load concept schemes for provider ${util.prefLabel(registry)}. Please open an issue on GitHub.`,
            variant: "danger"
          })
        })
        promises.push(promise)
      }
    }

    Promise.all(promises).then(() => {
      // Sort schemes
      jskos.sortSchemes(schemes)
      // Commit schemes to store
      commit({
        type: "setSchemes",
        schemes
      })
      // Set local config in store (after committing schemes to store)
      commit({
        type: "setConfig",
        config: localConfig
      })
    })
  }
}
