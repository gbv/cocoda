<template>
  <div
    :class="isColumn ? 'resizeSliderCol' : 'resizeSliderRow'"
    @mousedown="startResizing" />
</template>

<script>

/**
 * Resizing slider.
 */
export default {
  name: "ResizingSlider",
  props: {
    isColumn: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      resizing: false
    }
  },
  methods: {
    startResizing() {
      // Define all necessary values
      let
        slider = this.$el,
        previous = slider.previousElementSibling,
        next = slider.nextElementSibling,
        previousWidth = previous.clientWidth,
        nextWidth = next.clientWidth,
        previousHeight = previous.clientHeight,
        nextHeight = next.clientHeight,
        totalWidth = previousWidth + nextWidth,
        totalHeight = previousHeight + nextHeight,
        previousStyle = window.getComputedStyle(previous),
        nextStyle = window.getComputedStyle(next),
        totalFlex = parseFloat(previousStyle.getPropertyValue("flex-grow")) + parseFloat(nextStyle.getPropertyValue("flex-grow")),
        previousMinWidth = parseInt(previousStyle.getPropertyValue("min-width")),
        nextMinWidth = parseInt(nextStyle.getPropertyValue("min-width")),
        previousMinHeight = parseInt(previousStyle.getPropertyValue("min-height")),
        nextMinHeight = parseInt(nextStyle.getPropertyValue("min-height"))

      let vm = this
      // Prepare end of resizing
      function endResizing() {
        document.removeEventListener("mousemove", onMouseMove)
        document.onmouseup = null
        document.body.style.cursor = "auto"
        document.body.style.userSelect = "auto"
        vm.resizing = false
      }
      if (this.resizing) {
        endResizing()
        return
      }
      this.resizing = true
      let start = vm.isColumn ? event.clientX : event.clientY
      document.body.style.cursor = vm.isColumn ? "col-resize" : "row-resize"
      document.body.style.userSelect = "none"
      function onMouseMove(event) {
        let moved = (vm.isColumn ? event.clientX : event.clientY) - start
        if (vm.isColumn) {
          let newPreviousWidth = previousWidth + moved
          let newNextWidth = nextWidth - moved
          if (newPreviousWidth < previousMinWidth || newNextWidth < nextMinWidth) {
            return
          }
          previous.style.flex = newPreviousWidth / totalWidth * totalFlex
          next.style.flex = newNextWidth / totalWidth * totalFlex
        } else {
          let newPreviousHeight = previousHeight + moved
          let newNextHeight = nextHeight - moved
          if (newPreviousHeight < previousMinHeight || newNextHeight < nextMinHeight) {
            return
          }
          previous.style.flex = newPreviousHeight / totalHeight * totalFlex
          next.style.flex = newNextHeight / totalHeight * totalFlex
        }
      }
      document.addEventListener("mousemove", onMouseMove)
      document.onmouseup = endResizing
    }
  }
}
</script>

<style scoped>
.resizeSliderCol {
  flex: 0 1 5px;
  cursor: col-resize;
}
.resizeSliderRow {
  flex: 0 1 5px;
  cursor: row-resize;
}
</style>
