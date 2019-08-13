/**
 * Hover handler mixin
 *
 * Handles hovers in the application, e.g. to hide popovers when hovered outside.
 *
 * A component implementing this mixin has to provide a `hoverHandlers` method that returns an array.
 * Each item in the array is an object with the following properties:
 * - elements: An array of elements that the mouse position should be checked against.
 * - delta: How far the mouse can be away from an element to still count.
 * - handler: A function that is called when the mouse cursor is outside of the elements.
 *
 * Usually for popovers in Cocoda, you should add both the popover element (or the inside div rather) and the button that opens the popover.
 *
 * Example:
 * hoverHandlers() {
 *   return [
 *     {
 *        elements: [document.getElementById("someelement")],
 *        delta: 20,
 *        handler: (isInside, handler) => {
 *          // do something here
 *        }
 *     }
 *   ]
 * }
 *
 * It is possible to provide additional properties in handlers, e.g. to identify them in the handler function.
 *
 */

const _ = require("lodash")

export default {
  computed: {
    mousePosition() {
      return this.$store.state.mousePosition
    },
  },
  watch: {
    mousePosition({ x, y }) {
      this.handleMousePositionChange(x, y)
    },
  },
  mounted() {
    // Restrict calling handler to once every 100 ms.
    this.handleMousePositionChange = _.debounce(this.handleMousePositionChange_, 100)
  },
  methods: {
    isMouseInsideElement(element, { delta, x, y } = {}) {
      delta = delta || 0
      x = x || this.mousePosition.x
      y = y || this.mousePosition.y
      if (element) {
        let { top, bottom, left, right } = element.getBoundingClientRect()
        if (y < bottom + delta && y > top - delta && x < right + delta && x > left - delta) {
          return true
        }
      }
      return false
    },
    handleMousePositionChange_(x, y) {
      for (let handler of this.hoverHandlers()) {
        let isInside = false
        let delta = handler.delta || 0
        for (let element of handler.elements) {
          if (this.isMouseInsideElement(element, { delta, x, y })) {
            isInside = true
          }
        }
        handler.handler(isInside, handler)
      }
    },
    hoverHandlers() {
      return []
    },
  },
}
