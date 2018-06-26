<template>
  <div
    :class="{
      resizeSliderCol: isColumn,
      resizeSliderRow: !isColumn,
      resizeSliderCocodaRed: cocodaRed,
      resizeSliderBlack: !cocodaRed
    }"
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
    },
    cocodaRed: {
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
    startResizing(event) {
      // Define all necessary values
      let slider = this.$el,
        previous = slider.previousElementSibling,
        next = slider.nextElementSibling
      // Skip minimized components and sliders
      while(previous && (previous.dataset.minimized == 1 || previous.classList.contains("resizeSliderRow") || previous.classList.contains("resizeSliderColumn"))) {
        previous = previous.previousElementSibling
      }
      while(next && (next.dataset.minimized == 1 || next.classList.contains("resizeSliderRow") || next.classList.contains("resizeSliderColumn"))) {
        next = next.nextElementSibling
      }
      // If either previous or next is null, abort (e.g. when all other components are minimized)
      if (previous == null || next == null) {
        return
      }
      let
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
        document.body.style.webkitUserSelect = "auto"
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
      document.body.style.webkitUserSelect = "none"
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
.resizeSliderCol, .resizeSliderRow {
  flex: 0 1 3px;
}
.resizeSliderBlack {
  color: hsla(0, 0%, 0%, 0.2);
}
.resizeSliderCocodaRed {
  color: #B44D28;
}
.resizeSliderCol {
  cursor: col-resize;
  margin: 0 5px;
  box-shadow: inset 1px 0 2px -1px;
}
.resizeSliderRow {
  cursor: row-resize;
  margin: 5px 0;
  box-shadow: inset 0 1px 2px -1px;
}
</style>
