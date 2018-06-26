<template>
  <div
    v-if="item != null"
    :class="'font-size-'+(fontSize || 'normal')"
    class="itemName"
    @mouseover="mouseOver"
    @mouseout="mouseOut" >
    <notation-badge
      :item="item"
      :class="{ 'badge-hovered': isLink && isHovered, 'badge-highlighted': isHighlighted && !(isHovered && isLink) }"
      :id="tooltipDOMID"
      :style="{ bottom: '2px' }" />
    <b-tooltip
      v-if="showTooltip && item.prefLabel"
      ref="tooltip"
      :target="tooltipDOMID">
      {{ trimTooltip(item.prefLabel.de ? item.prefLabel.de : item.prefLabel.en) }}
    </b-tooltip>
    <prefLabel-text
      v-if="showText && item.prefLabel"
      :class="{ 'label-hovered': isLink && isHovered, 'label-highlighted': isHighlighted && !(isHovered && isLink) }"
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
     * Determines whether the badge is highlighted
     */
    isHighlighted: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      tooltipDOMID: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
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
      let vm = this
      _.delay(function() {
        if (vm.isHovered) {
          vm.$refs.tooltip && vm.$refs.tooltip.$emit("open")
        }
      }, 50)
    }
  },
  methods: {
    mouseOver() {
      // this.isHovered = true
      this.$root.$data.hoveredConcept = this.item
    },
    mouseOut() {
      // this.isHovered = false
      this.$root.$data.hoveredConcept = null
    },
    trimTooltip(text) {
      if (text.length > 80) {
        return text.substring(0,80) + "..."
      } else {
        return text
      }
    }
  }
}

// TODO: - Move badge and prefLabel text to its own components.
import Vue from "vue"

/**
 * Badge that displays an item's notation.
 */
Vue.component("notation-badge", {
  props: {
    item: {
      type: Object,
      default: null
    }
  },
  template: "<b-badge v-if=\"item.notation && item.notation.length\">{{ item.notation[0] }}</b-badge>"
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
  template: "<span>{{ item.prefLabel.de ? item.prefLabel.de : item.prefLabel.en }}</span>"
})
</script>

<style lang="less" scoped>
@import "../style/main.less";

.itemName {
  display: inline;
}
.badge {
  font-family: "Courier New", Courier, monospace;
  position: relative;
}
.badge-hovered {
  background-color: @color-secondary-2-4;
  cursor: pointer;
}
.badge-highlighted {
  background-color: @color-primary-4;
}
.label-hovered {
  cursor: pointer;
  color: @color-secondary-2-4;
}
.label-highlighted {
  color: @color-primary-4;
  &:extend(.font-heavy);
}
</style>
