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
import _ from "lodash"

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
      resizing: false,
      savedValues: {}
    }
  },
  computed: {
    flex() {
      return this.$settings.flex || {}
    }
  },
  watch: {
    flex() {
      this.refreshFlex()
    }
  },
  mounted() {
    // Set flex values on first mount
    this.refreshFlex()
  },
  methods: {
    getSiblings() {
      // Define all necessary values
      let slider = this.$el,
        parent = slider.parentElement,
        sliderStyle = window.getComputedStyle(slider),
        sliderOrder = sliderStyle.getPropertyValue("order"),
        previous, next
      try {
        sliderOrder = parseInt(sliderOrder)
      } catch(error) {
        sliderOrder = 0
      }
      // Siblings are different when CSS order is defined
      if (sliderOrder > 0) {
        previous = parent.querySelector(".order" + (sliderOrder - 1))
        next = parent.querySelector(".order" + (sliderOrder + 1))
      } else {
        previous = slider.previousElementSibling,
        next = slider.nextElementSibling
      }
      // Skip minimized components and sliders
      while(previous && (previous.dataset.minimized == 1 || previous.classList.contains("resizeSliderRow") || previous.classList.contains("resizeSliderColumn"))) {
        previous = previous.previousElementSibling
      }
      while(next && (next.dataset.minimized == 1 || next.classList.contains("resizeSliderRow") || next.classList.contains("resizeSliderColumn"))) {
        next = next.nextElementSibling
      }
      return [previous, next]
    },
    startResizing(event) {
      let [previous, next] = this.getSiblings()
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

      this.savedValues.previousWidth = previousWidth
      this.savedValues.nextWidth = nextWidth
      this.savedValues.previousHeight = previousHeight
      this.savedValues.nextHeight = nextHeight

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
            // Minimize previous/next component when resize is committed all the way.
            if (newPreviousWidth <= 10 || newNextWidth <= 10) {
              // Get minimizer component
              let element = newPreviousWidth <= 10 ? previous : next
              let minimizerElement = element.getElementsByClassName("minimizer")[0]
              // Only continue if minimizerElement is one or two elements deep.
              if (minimizerElement.parentElement != element && minimizerElement.parentElement.parentElement != element) {
                return
              }
              let minimizerComponent = minimizerElement.__vue__
              if (minimizerComponent) {
                // Restore saved values
                previous.style.flex = vm.savedValues.previousWidth / totalWidth * totalFlex
                vm.saveFlex(previous)
                next.style.flex = vm.savedValues.nextWidth / totalWidth * totalFlex
                vm.saveFlex(next)
                // Minimize
                minimizerComponent.toggleMinimize()
                // End resizing
                endResizing()
              }
            }
            return
          }
          previous.style.flex = newPreviousWidth / totalWidth * totalFlex
          vm.saveFlex(previous)
          next.style.flex = newNextWidth / totalWidth * totalFlex
          vm.saveFlex(next)
        } else {
          let newPreviousHeight = previousHeight + moved
          let newNextHeight = nextHeight - moved
          if (newPreviousHeight < previousMinHeight || newNextHeight < nextMinHeight) {
            // Minimize previous/next component when resize is committed all the way.
            if (newPreviousHeight <= 10 || newNextHeight <= 10) {
              // Get minimizer component
              let element = newPreviousHeight <= 10 ? previous : next
              let minimizerElement = element.getElementsByClassName("minimizer")[0]
              // Only continue if minimizerElement is one or two elements deep.
              if (minimizerElement.parentElement != element && minimizerElement.parentElement.parentElement != element) {
                return
              }
              let minimizerComponent = minimizerElement.__vue__
              if (minimizerComponent) {
                // Restore saved values
                previous.style.flex = vm.savedValues.previousHeight / totalHeight * totalFlex
                vm.saveFlex(previous)
                next.style.flex = vm.savedValues.nextHeight / totalHeight * totalFlex
                vm.saveFlex(next)
                // Minimize
                minimizerComponent.toggleMinimize()
                // End resizing
                endResizing()
              }
            }
            return
          }
          previous.style.flex = newPreviousHeight / totalHeight * totalFlex
          vm.saveFlex(previous)
          next.style.flex = newNextHeight / totalHeight * totalFlex
          vm.saveFlex(next)
        }
      }
      document.addEventListener("mousemove", onMouseMove)
      document.onmouseup = endResizing
    },
    saveFlex(element) {
      if (element && element.id && element.style) {
        let flex = _.cloneDeep(this.$settings.flex)
        flex[element.id] = element.style.flex
        this.$store.commit({
          type: "settings/set",
          prop: "flex",
          value: flex
        })
      }
    },
    refreshFlex() {
      let siblings = this.getSiblings()
      for (let sibling of siblings) {
        if (!sibling || !sibling.id) {
          continue
        }
        if (this.flex[sibling.id] != null) {
          sibling.style.flex = this.flex[sibling.id]
        }
      }
    },
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.resizeSliderCol, .resizeSliderRow {
  flex: 0 1 3px;
}
.resizeSliderBlack {
  color: @color--resizingSlider-black;
}
.resizeSliderCocodaRed {
  color: @color--resizingSlider-red;
}
.resizeSliderCol {
  cursor: col-resize;
  margin: 0 5px;
  box-shadow: inset 1px 0 1px -1px;
}
.resizeSliderRow {
  cursor: row-resize;
  margin: 5px 0;
  box-shadow: inset 0 1px 1px -1px;
}
</style>
