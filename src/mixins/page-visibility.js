/**
 * Mixin that deals with page visibility.
 *
 * Use this to stop and start background tasks like polling from the server.
 *
 * See also: https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
 *
 * Usage:
 * - Add mixin to component
 * - A new boolean property `isPageVisible` will be available inside the component
 * - Use via watcher, for example:
 * ```js
 *  watch: {
      isPageVisible(visible) {
        if (visible) {
          // page became visible again
        } else {
          // page is not visible
        }
      },
 *  }
 * ```
 */

// Set the name of the hidden property and the change event for visibility
let hidden, visibilityChange
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
  hidden = "hidden"
  visibilityChange = "visibilitychange"
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden"
  visibilityChange = "msvisibilitychange"
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden"
  visibilityChange = "webkitvisibilitychange"
}

export default {
  data() {
    return {
      isPageVisible: true,
    }
  },
  created() {
    // Handle page visibility change
    hidden && document.addEventListener(visibilityChange, this.handleVisibilityChangeInternal, false)
    this.isPageVisible = !document[hidden]
  },
  beforeDestroy() {
    // Remove event listener before component is destroyed
    hidden && document.removeEventListener(visibilityChange, this.handleVisibilityChangeInternal, false)
  },
  methods: {
    handleVisibilityChangeInternal() {
      this.isPageVisible = !document[hidden]
    },
  },
}
