<template>
  <div
    v-if="item != null"
    :class="[{ 'itemNameHovered': isLink && isHovered, 'itemNameHighlighted': isHighlighted }, 'fontSize-'+(fontSize || 'normal')]"
    class="itemName"
    @mouseover="mouseOver"
    @mouseout="mouseOut" >
    <!-- Text for notation -->
    <notation-text
      :item="item"
      :class="{ 'fontWeight-heavy': showText }"
      :id="tooltipDOMID" />
    <!-- Tooltip for prefLabel if only notation is shown -->
    <b-tooltip
      v-if="showTooltip && item.prefLabel && (item.prefLabel.de || item.prefLabel.en)"
      ref="tooltip"
      :target="tooltipDOMID">
      {{ trimTooltip(item.prefLabel.de || item.prefLabel.en) }}
    </b-tooltip>
    <!-- Text for prefLabel -->
    <prefLabel-text
      v-if="showText"
      :item="item" />
  </div>
</template>

<script>
var _ = require("lodash")

/**
 * Component that displays an item's notation (if defined) and prefLabel.
 */
export default {
  name: "ItemName",
  props: {
    /**
     * The item whose notation and name this component will display.
     */
    item: {
      type: Object,
      default: null
    },
    /**
     * The font size for the text (small, normal, large).
     */
    fontSize: {
      type: String,
      default: "normal"
    },
    /**
     * Determines whether to show or hide the label text.
     */
    showText: {
      type: Boolean,
      default: true
    },
    /**
     * Determines whether it is a link.
     */
    isLink: {
      type: Boolean,
      default: false
    },
    /**
     * Determines whether to show the concepts label as a tooltip.
     */
    showTooltip: {
      type: Boolean,
      default: false
    },
    /**
     * Determines whether the item is highlighted
     */
    isHighlighted: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      /** Unique DOM ID for tooltip */
      tooltipDOMID: this.$util.generateID(),
      /** Determines whether the item is hovered from inside (to show tooltip after prefLabel loaded) */
      isHoveredFromHere: false
    }
  },
  computed: {
    isHovered() {
      return this.$util.compareConcepts(this.$root.$data.hoveredConcept, this.item)
    }
  },
  watch: {
    item: function() {
      // Force show tooltip when item has changed
      _.delay(() => {
        if (this.isHoveredFromHere) {
          this.$refs.tooltip && this.$refs.tooltip.$emit("open")
        }
      }, 50)
    }
  },
  methods: {
    mouseOver() {
      this.isHoveredFromHere = true
      this.$root.$data.hoveredConcept = this.item
    },
    mouseOut() {
      this.isHoveredFromHere = false
      this.$root.$data.hoveredConcept = null
    },
    trimTooltip(text) {
      if (text.length > 80) {
        return text.substring(0,75) + "..."
      } else {
        return text
      }
    }
  }
}

// TODO: - Move badge and prefLabel text to its own components.
import Vue from "vue"

/**
 * Component that displays an item's notation.
 */
Vue.component("notation-text", {
  props: {
    item: {
      type: Object,
      default: null
    }
  },
  template: "<span v-if='item.notation && item.notation.length'>{{ item.notation[0] }}</span>"
})

/**
 * Displays an item's prefLabel (German over English).
 */
Vue.component("prefLabel-text", {
  introduction: "display a prefLabel (German over English)",
  props: {
    item: {
      type: Object,
      default: null
    }
  },
  computed: {
    prefLabel() {
      if (this.item.prefLabel && (this.item.prefLabel.de || this.item.prefLabel.en)) {
        return this.item.prefLabel.de || this.item.prefLabel.en
      } else {
        return this.item.uri
      }
    }
  },
  template: "<span>{{ prefLabel }}</span>"
})
</script>

<style lang="less" scoped>
@import "../style/main.less";

.itemName {
  display: inline;
  user-select: none;
}
.itemNameHovered {
  cursor: pointer;
  text-decoration: underline;
}
.itemNameHighlighted {
  color: @color--itemName-highlighted;
  &:extend(.fontWeight-heavy);
}
</style>
