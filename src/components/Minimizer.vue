<template>
  <div class="minimizer">
    <div
      v-show="!minimized"
      v-b-tooltip.hover="{ title: $t('minimizer.minimize'), delay: defaults.delay.medium }"
      class="minimizeButton"
      @click="toggleMinimize()"
      @mouseover="minimizeHovered = true"
      @mouseout="minimizeHovered = false">
      <font-awesome-icon icon="window-minimize" />
    </div>
    <div
      v-show="minimized"
      class="minimizedOverlay"
      @click="toggleMinimize()">
      <div>
        {{ text }}
        <div
          v-b-tooltip.hover="{ title: $t('minimizer.maximize'), delay: defaults.delay.medium }"
          class="maximizeButton">
          <font-awesome-icon icon="plus-square" />
        </div>
      </div>
    </div>
    <!-- Overlay for minimize hover -->
    <div
      v-if="minimizeHovered"
      class="minimizedHoverOverlay" />
  </div>
</template>

<script>
import _ from "lodash"
import computed from "@/mixins/computed.js"

/**
 * Adds minimizing functionality to another component.
 *
 * To add this to a component, it has to be of the CSS class "mainComponent" (or a child of it). Add this component to its component list and add the minimizer right under the root element of the component:
 * <minimizer text="Name of Component" />
 *
 * If it's a vertical component:
 * <minimizer :is-column="true" text="Name of Component" />
 *
 * If you want the minimized status to be written into local storage, provide a name:
 * <minimizer name="myComponent" text="Name of Component" />
 *
 */
export default {
  name: "Minimizer",
  mixins: [computed],
  props: {
    /**
     *
     */
    name: {
      type: String,
      default: null,
    },
    /**
     * The text that is shown when minimized.
     */
    text: {
      type: String,
      default: "",
    },
    /**
     * Determines whether the component is a vertical component.
     */
    isColumn: {
      type: Boolean,
      default: false,
    },
    /**
     * Allows parent component to force minimized state.
     * `true`: Force to be opened.
     * `false`: Force to be minimized.
     * `null` or empty: Use user value.
     */
    forceMinimized: {
      type: Boolean,
      default: null,
    },
  },
  data() {
    return {
      previousFlex: "",
      previousMinSizes: [],
      minimizedLocal: false,
      minimizerSize: "40px",
      minimizeHovered: false,
    }
  },
  computed: {
    minimized: {
      get() {
        return this.forceMinimized != null ?
          this.forceMinimized :
          (
            this.name != null ?
              this.$settings.minimized[this.name] || false :
              this.minimizedLocal
          )
      },
      set(newValue) {
        if (this.name != null) {
          let minimized = _.cloneDeep(this.$settings.minimized)
          minimized[this.name] = newValue
          this.$store.commit({
            type: "settings/set",
            prop: "minimized",
            value: minimized,
          })
        } else {
          this.minimizedLocal = newValue
        }
      },
    },
  },
  watch: {
    minimized() {
      this.refreshMinimize()
    },
  },
  mounted() {
    this.refreshMinimize()
  },
  methods: {
    toggleMinimize(minimized = null) {
      if (minimized != null) {
        this.minimized = minimized
      } else {
        this.minimized = !this.minimized
      }
    },
    refreshMinimize() {
      if (this.minimized) {
        this.previousMinSizes = []
      }
      // Find mainComponent in DOM ancestors and set its size.
      // On the way, make sure that no "min-height" or "min-width" property prevents minimizing.
      let current = this.$el
      while (!current.classList.contains("mainComponent")) {
        current = current.parentElement
        if (this.minimized) {
          let computedStyle = window.getComputedStyle(current)
          let minSize
          if (this.isColumn) {
            minSize = computedStyle.getPropertyValue("min-width")
          } else {
            minSize = computedStyle.getPropertyValue("min-height")
          }
          this.previousMinSizes.push({
            element: current,
            minSize,
          })
          if (this.isColumn) {
            current.style.minWidth = this.minimizerSize
            current.style.maxWidth = this.minimizerSize
          } else {
            current.style.minHeight = this.minimizerSize
            current.style.maxHeight = this.minimizerSize
          }
        }
      }
      let computedStyle = window.getComputedStyle(current)
      if (this.minimized) {
        // Add class mainComponent-minimized
        current.classList.add("mainComponent-minimized")
        this.previousFlex = computedStyle.getPropertyValue("flex")
        current.style.flex = "0 1 " + this.minimizerSize
        // Set data-minimized property to 1 so that it can be identified as minimized
        current.dataset.minimized = 1
        this.refresh("minimize")
        // Adjust z-index values of minimizers that might overlay the current minimizer
        let zIndex = window.getComputedStyle(this.$el.getElementsByClassName("minimizedOverlay")[0]).getPropertyValue("z-index")
        for (let element of current.getElementsByClassName("minimizer")) {
          if (element != this.$el) {
            let component = element.__vue__
            if (component.minimized && window.getComputedStyle(element.getElementsByClassName("minimizedOverlay")[0]).getPropertyValue("z-index") >= zIndex) {
              element.getElementsByClassName("minimizedOverlay")[0].style.zIndex = zIndex - 1
            }
          }
        }
      } else {
        // Remove class mainComponent-minimized
        current.classList.remove("mainComponent-minimized")
        // Reset styles to previous
        current.style.flex = this.previousFlex
        for (let previous of this.previousMinSizes) {
          if (this.isColumn) {
            previous.element.style.minWidth = previous.minSize
            previous.element.style.maxWidth = ""
          } else {
            previous.element.style.minHeight = previous.minSize
            previous.element.style.maxHeight = ""
          }
        }
        // Reset data-minimized
        current.dataset.minimized = 0
        this.refresh("minimize")
      }
    },
  },
}
</script>

<style lang="less" scoped>
@import "@/style/main.less";
@import "../style/colors.css";

.minimizeButton {
  background: var(--color-button-light);
  border-radius: 0 0 0 3px;
  color: #fff;
  cursor: pointer;
  font-size: 11px;
  font-weight: var(--font-weight-heavy);
  height: 20px;
  position: absolute;
  padding-left: 5px;
  right: 0px;
  top: 0px;
  user-select: none;
  width: 20px;
  z-index: @zIndex-4;
}
.minimizeButton:hover {
  background-color: var(--color-button-hover);
}
.maximizeButton {
  z-index: @zIndex-9;
  display: inline-block;
  position: static;
  color: var(--color-button-light);
  font-size: 1rem;
}
// Overlay when minimize button is hovered
.minimizedHoverOverlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: var(--color-loading-overlay-background);
  z-index: @zIndex-3;
}
// Overlay when component is minimized
.minimizedOverlay {
  .componentTitle;
  .text-lightGrey;
  cursor: pointer;
  position: absolute;
  z-index: @zIndex-9;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: var(--color-background-component);
  user-select: none;
}
.minimizedOverlay:hover {
  background-color: var(--color-secondary);
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
