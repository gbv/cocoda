<template>
  <div
    v-b-tooltip.hover="{ title: $t('general.resizingSlider'), delay: $util.delay.medium, placement: isColumn ? 'right' : 'top' }"
    :class="{
      resizingSliderCol: isColumn,
      resizingSliderRow: !isColumn
    }"
    @mousedown="startResizing">
    <div><font-awesome-icon :icon="isColumn ? 'ellipsis-v' : 'ellipsis-h'" /></div>
  </div>
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
      while(previous && (previous.classList.contains("resizingSliderRow") || previous.classList.contains("resizingSliderColumn"))) {
        previous = previous.previousElementSibling
      }
      while(next && (next.classList.contains("resizingSliderRow") || next.classList.contains("resizingSliderColumn"))) {
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
        nextMinHeight = parseInt(nextStyle.getPropertyValue("min-height")),
        previousMinimized = parseInt(_.get(previous, "dataset.minimized")) || 0,
        nextMinimized = parseInt(_.get(next, "dataset.minimized")) || 0

      // Do not allow resizing between two minimized components.
      if (previousMinimized + nextMinimized == 2) {
        return
      }

      // Only save values if both components are not minimized.
      if (previousMinimized + nextMinimized == 0) {
        this.savedValues.previousWidth = previousWidth
        this.savedValues.nextWidth = nextWidth
        this.savedValues.previousHeight = previousHeight
        this.savedValues.nextHeight = nextHeight
      }

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
          if (newPreviousWidth < previousMinWidth || newNextWidth < nextMinWidth  || previousMinimized + nextMinimized == 1) {
            // Minimize/maximize previous/next component when resize is committed all the way.
            if (newPreviousWidth <= 10 || newNextWidth <= 10 || newPreviousWidth >= previousMinWidth * 3 && previousMinimized == 1 || newNextWidth >= nextMinWidth * 3 && nextMinimized == 1) {
              // Get minimizer component
              let element = newPreviousWidth <= 10 || previousMinimized == 1 ? previous : next
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
                // Minimize/maximize
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
          if (newPreviousHeight < previousMinHeight || newNextHeight < nextMinHeight || previousMinimized + nextMinimized == 1) {
            // Minimize/maximize previous/next component when resize is committed all the way.
            if (newPreviousHeight <= 10 || newNextHeight <= 10 || newPreviousHeight >= previousMinHeight * 3 && previousMinimized == 1 || newNextHeight >= nextMinHeight * 3 && nextMinimized == 1) {
              // Get minimizer component
              let element = newPreviousHeight <= 10 || previousMinimized == 1 ? previous : next
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
                // Minimize/maximize
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

.resizingSliderCol, .resizingSliderRow {
  flex: 0 1 6px;
  color: @color-text-lightGrey;
}
.resizingSliderCol {
  cursor: col-resize;
  border-left: 2px solid @color-transparent;
  border-right: 2px solid @color-transparent;
  width: 6px;
  max-width: 6px;
  display:flex;justify-content:center;align-items:center;
}
.resizingSliderRow {
  cursor: row-resize;
  border-bottom: 2px solid @color-transparent;
  border-top: 2px solid @color-transparent;
  height: 6px;
  max-height: 6px;
  display:flex;justify-content:center;align-items:center;
}
.resizingSliderRow > div {
  margin-top: 3px;
}
.resizingSliderCol > div {
  margin-left: 0px;
}
</style>
