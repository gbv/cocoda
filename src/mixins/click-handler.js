/**
 * Click handler mixin
 *
 * Handles clicks in the application, e.g. to hide popovers when clicked outside.
 *
 * A component implementing this mixin has to provide a `clickHandlers` array (in `data` or `computed`).
 * Each item in the array is an object with the following properties:
 * - elements: An array of elements that the click should be checked against.
 * - handler: A function that is called when a click outside the elements is registered.
 *
 * Usually for popovers in Cocoda, you should add both the popover element (or the inside div rather) and the button that opens the popover.
 *
 * Example:
 * popover: [
 *   {
 *      elements: [document.getElementById("someelement")],
 *      handler: () => {
 *        // do something here
 *      }
 *   }
 * ]
 *
 * Note: If popover is defined as a computed property, you might have to disable eslint rules for certain lines that are detected to have side effects:
 * // eslint-disable-next-line vue/no-side-effects-in-computed-properties
 *
 */

export default {
  mounted() {
    // Add click event listener
    document.addEventListener("click", this.handleClick)
  },
  destroyed() {
    // Remove click event listener
    document.removeEventListener("click", this.handleClick)
  },
  methods: {
    handleClick(event) {
      for (let popover of this.clickHandlers || []) {
        let isInside = (popover.elements || []).reduce((total, current) => total || (current && current.contains(event.target)), false)
        if (!isInside) {
          popover.handler(event)
        }
      }
    },
  },
}
