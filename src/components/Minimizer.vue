<template>
  <div>
    <div
      v-b-tooltip.hover="{ title: 'minimize component', delay: $util.delay.medium }"
      v-show="!minimized"
      class="utilityButton minimizeButton"
      @click="toggleMinimize" >
      <font-awesome-icon icon="window-minimize" />
    </div>
    <div
      v-show="minimized"
      class="minimizedOverlay text-lightGrey fontSize-normal"
      @click="toggleMinimize" >
      <div>
        {{ text }}
        <div
          v-b-tooltip.hover="{ title: 'maximize component', delay: $util.delay.medium }"
          class="utilityButton maximizeButton" >
          <font-awesome-icon icon="window-maximize" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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
      let minimizerHeight = "40px"

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
          current.style.minHeight = minimizerHeight
          current.style.maxHeight = minimizerHeight
        }
      }
      let computedStyle = window.getComputedStyle(current)
      if (this.minimized) {
        this.previousFlex = computedStyle.getPropertyValue("flex")
        current.style.flex = "0 1 " + minimizerHeight
        // Set data-minimized property to 1 so that it can be identified as minimized
        current.dataset.minimized = 1
        this.refresh("minimize")
      } else {
        // Reset styles to previous
        current.style.flex = this.previousFlex
        for (let previous of this.previousMinHeights) {
          previous.element.style.minHeight = previous.minHeight
          previous.element.style.maxHeight = ""
        }
        // Reset data-minimized
        current.dataset.minimized = 0
        this.refresh("minimize")
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.minimizeButton {
  right: 0px;
  top: 0px;
}
.minimizeButton {
  padding-left: 6px;
}
.maximizeButton {
  padding-top: 3px;
  margin-left: 10px;
  z-index: @zIndex-6;
  display: inline-block;
  position: static;
}
.minimizedOverlay {
  cursor: pointer;
  position: absolute;
  z-index: @zIndex-5;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: @color--minimizer-overlay-background;
  text-align: center;
  user-select: none;
}
.minimizedOverlay:hover {
  background-color: @color--minimizer-overlay-background-hover;
}
.minimizedOverlay > div {
  position: absolute;
  margin: auto 0;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  height: 24px;
}
</style>
