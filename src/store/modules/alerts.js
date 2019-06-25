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
   * - countdown
   * - variant
   */
  add (state, alert) {
    // Default values
    alert.variant = alert.variant || "warning"
    alert.countdown = alert.countdown != null ? alert.countdown : 5
    let shouldCountdown = true
    if (!alert.countdown || alert.countdown == -1) {
      shouldCountdown = false
    }
    alert.shouldCountdown = shouldCountdown
    state.alerts.push(alert)
  },

  /**
   * Function to be used in the @dismiss-count-down and @@dismissed events on b-alert.
   */
  setCountdown (state, { alert, countdown }) {
    alert.countdown = countdown
  },
}

export default {
  namespaced: true,
  state,
  mutations,
}
