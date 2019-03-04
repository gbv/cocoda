/**
 * Vuex module for authentication using gbv-login-client.
 */

import LoginClient from "gbv-login-client"
let client

// initial state
const state = {
  available: false,
  authorized: false,
  user: null,
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
  set (state, { prop, value = null }) {
    state[prop] = value
  },

}

const actions = {
  init({ commit, state, rootState }, url) {

    // Determine whether to use ssl
    let ssl = url.startsWith("https")

    // Remove protocol from url
    url = url.replace("http://", "").replace("https://", "")

    // Create login-client instance
    client = new LoginClient(url, { ssl })

    let registries = rootState.config.registries.filter(registry => registry.auth)

    // Handle events
    client.addEventListener(null, event => {
      switch (event.type) {
        case LoginClient.events.connect:
          commit({
            type: "set",
            prop: "connected",
            value: true
          })
          break
        case LoginClient.events.disconnect:
          commit({
            type: "set",
            prop: "connected",
            value: false
          })
          break
        case LoginClient.events.login:
          commit({
            type: "set",
            prop: "user",
            value: event.user
          })
          break
        case LoginClient.events.logout:
          commit({
            type: "set",
            prop: "user",
            value: null
          })
          commit({
            type: "set",
            prop: "authorized",
            value: false
          })
          break
        case LoginClient.events.update:
          commit({
            type: "set",
            prop: "user",
            value: event.user
          })
          break
        case LoginClient.events.about:
          event.type = undefined
          commit({
            type: "set",
            prop: "about",
            value: event
          })
          break
        case LoginClient.events.providers:
          commit({
            type: "set",
            prop: "providers",
            value: event.providers
          })
          break
        case LoginClient.events.token:
          if (state.tokenTimeout) {
            clearTimeout(state.tokenTimeout)
          }
          // Set auth for all providers that need authentication
          for (let registry of registries) {
            registry.provider.setAuth(event.token)
          }
          // Set authorized
          commit({
            type: "set",
            prop: "authorized",
            value: true
          })
          // Create new timeout to unset authorized
          commit({
            type: "set",
            prop: "tokenTimeout",
            value: setTimeout(() => {
              commit({
                type: "set",
                prop: "authorized",
                value: false
              })
              // Set auth to null for all providers
              for (let registry of registries) {
                registry.provider.setAuth(null)
              }
            }, event.expiresIn * 1000)
          })
          break
        case LoginClient.events.error:
          console.error("LoginClient error:", event.error)
          break
      }
    })

    client.connect()

    commit({
      type: "set",
      prop: "available",
      value: true
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
