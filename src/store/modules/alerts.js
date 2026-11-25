// initial state
const state = {
  alerts: [],
}

// mutations
const mutations = {

  /**
   * Adds an alert to the list.
   *
   * @param {*} alert - an alert object with the following properties:
   * - text (required)
   * - countdown: seconds until the alert hides itself (default 5); 0 or -1
   *   keeps it until it is closed
   * - variant
   */
  add (state, alert) {
    // Default values
    alert.variant = alert.variant || "warning" // TODO: warning is not supported anymore?
    const countdown = alert.countdown != null ? alert.countdown : 5
    alert.shouldCountdown = countdown > 0
    // The v-model of b-alert: a number starts a countdown in milliseconds,
    // `true` shows the alert until it is closed.
    alert.show = alert.shouldCountdown ? countdown * 1000 : true
    state.alerts.push(alert)
  },

  /**
   * Hides an alert - when its countdown has run out, it was closed, or
   * whatever it offered has been done.
   */
  hide (state, { alert }) {
    alert.show = false
  },
}

export default {
  namespaced: true,
  state,
  mutations,
}
