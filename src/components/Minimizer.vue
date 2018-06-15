<template>
  <div>
    <div
      v-b-tooltip.hover="minimized ? 'maximize component' : 'minimize component'"
      :class="minimized ? 'maximizeButton' : 'minimizeButton'"
      @click="toggleMinimize">
      <font-awesome-icon
        :icon="minimized ? 'window-maximize' : 'window-minimize'" />
    </div>
    <div
      v-show="minimized"
      class="minimizedOverlay">
      <div>{{ text }}</div>
    </div>
  </div>
</template>

<script>
import FontAwesomeIcon from "@fortawesome/vue-fontawesome"

/**
 * Adds minimizing functionality to another component.
 *
 * To add this to a component, it has to be of the CSS class "mainComponent" (or a child of it). Add this component to its component list and add the minimizer right under the root element of the component:
 * <minimizer text="Name of Component" />
 *
 * The root element of your component also has to have position: relative; in its CSS.
 */
export default {
  name: "Minimizer",
  components: { FontAwesomeIcon },
  props: {
    /**
     * The text that is shown when minimized.
     */
    text: {
      type: String,
      default: "Minimized Component."
    }
  },
  data() {
    return {
      minimized: false,
      previousFlex: "",
      previousMinHeights: []
    }
  },
  methods: {
    toggleMinimize() {
      this.minimized = !this.minimized
      if (this.minimized) {
        this.previousMinHeights = []
      }
      // Find mainComponent in DOM ancestors and set its height.
      // On the way, make sure that no "min-height" property prevents minimizing.
      let current = this.$el
      while (!current.classList.contains("mainComponent")) {
        current = current.parentElement
        if (this.minimized) {
          let computedStyle = window.getComputedStyle(current)
          let minHeight = computedStyle.getPropertyValue("min-height")
          this.previousMinHeights.push({
            element: current,
            minHeight: minHeight
          })
          current.style.minHeight = "24px"
          current.style.maxHeight = "24px"
        }
      }
      let computedStyle = window.getComputedStyle(current)
      if (this.minimized) {
        this.previousFlex = computedStyle.getPropertyValue("flex")
        current.style.flex = "0 1 24px"
      } else {
        // Reset styles to previous
        current.style.flex = this.previousFlex
        for (let previous of this.previousMinHeights) {
          previous.element.style.minHeight = previous.minHeight
          previous.element.style.maxHeight = ""
        }
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.minimizeButton, .maximizeButton {
  position: absolute;
  font-size: 12px;
  right: 0px;
  top: 0px;
  width: 24px;
  height: 24px;
  z-index: 250;
  user-select: none;
  cursor: pointer;
  color: fadeout(@buttonColor, 50%);
  background-color: fadeout(@buttonColorDisabled, 16%);
  &:hover {
    color: @buttonColor;
    background-color: @buttonColorDisabled;
  }
}
.minimizeButton {
  padding-left: 6px;
}
.maximizeButton {
  padding-left: 6px;
  padding-top: 3px;
}
.minimizedOverlay {
  position: absolute;
  z-index: 200;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: white;
  text-align: center;
  &:extend(.font-size-small);
  &:extend(.font-heavy);
}
.minimizedOverlay > div {
  position: absolute;
  margin: auto 0;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  height: 20px;
}
</style>
