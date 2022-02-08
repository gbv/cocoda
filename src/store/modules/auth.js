/**
 * Vuex module for authentication using gbv-login-client.
 */

import LoginClient from "gbv-login-client"
import log from "../../utils/log.js"
import { closeWindow } from "@/utils/window-manager.js"
let client

// initial state
const state = {
  available: false,
  authorized: false,
  user: undefined,
  connected: false,
  providers: [],
  about: {},
  tokenTimeout: null,
}

const mutations = {

  /**
   * Sets a state property.
   *
   * @param {*} payload - a payload object with the following properties:
   * - prop (required): the name of the property to be set (e.g. "authorized")
   * - value: the value to which to set the property (e.g. true)
   */
  set(state, { prop, value = null }) {
    state[prop] = value
  },

}

const actions = {
  init({ commit, state, rootState }, url) {

    // Return a Promise that resolves either when application is connected, or when an error occured.
    return new Promise(resolve => {

      // Determine whether to use ssl
      let ssl = url.startsWith("https")

      // Remove protocol from url
      url = url.replace("http://", "").replace("https://", "")

      // Create login-client instance
      client = new LoginClient(url, { ssl })

      let registries = rootState.config.registries.filter(registry => registry.has.auth)

      // Handle events
      client.addEventListener(null, event => {
        // Close window if one exists and matches event type
        closeWindow({ eventType: event.type })
        // Handle event
        switch (event.type) {
          case LoginClient.events.connect:
            resolve()
            commit({
              type: "set",
              prop: "connected",
              value: true,
            })
            break
          case LoginClient.events.disconnect:
            resolve()
            commit({
              type: "set",
              prop: "connected",
              value: false,
            })
            break
          case LoginClient.events.login:
            commit({
              type: "set",
              prop: "user",
              value: event.user,
            })
            break
          case LoginClient.events.logout:
            commit({
              type: "set",
              prop: "user",
              value: null,
            })
            commit({
              type: "set",
              prop: "authorized",
              value: false,
            })
            break
          case LoginClient.events.update:
            commit({
              type: "set",
              prop: "user",
              value: event.user,
            })
            break
          case LoginClient.events.about:
            event.type = undefined
            commit({
              type: "set",
              prop: "about",
              value: event,
            })
            // Set auth public key for all providers that need authentication
            for (let registry of registries) {
              registry.setAuth({ key: event.publicKey })
            }
            break
          case LoginClient.events.providers:
            commit({
              type: "set",
              prop: "providers",
              value: event.providers,
            })
            break
          case LoginClient.events.token:
            if (state.tokenTimeout) {
              clearTimeout(state.tokenTimeout)
            }
            // Set auth for all providers that need authentication
            for (let registry of registries) {
              registry.setAuth({ bearerToken: event.token })
            }
            // Set authorized
            commit({
              type: "set",
              prop: "authorized",
              value: true,
            })
            // Create new timeout to unset authorized
            commit({
              type: "set",
              prop: "tokenTimeout",
              value: setTimeout(() => {
                commit({
                  type: "set",
                  prop: "authorized",
                  value: false,
                })
                // Set token to null for all providers
                for (let registry of registries) {
                  registry.setAuth({ bearerToken: null })
                }
              }, event.expiresIn * 1000),
            })
            break
          case LoginClient.events.error:
            resolve()
            log.error("LoginClient error:", event.error)
            break
        }
      })

      client.connect()

      commit({
        type: "set",
        prop: "available",
        value: true,
      })

    })

  },

  setName(context, name) {
    return client.setName(name).then(() => true).catch(() => false)
  },
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
}
