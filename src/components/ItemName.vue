<template>
  <div
    v-if="item != null"
    class="itemName"
    @mouseover="mouseOver"
    @mouseout="mouseOut">
    <div
      :is="isLink ? 'router-link' : 'div'"
      :to="getRouterUrl(item, isLeft)"
      :class="[
        {
          'itemName-hovered': isLink && isHovered,
          'itemName-highlighted': isHighlighted,
          'fontWeight-heavy': isHighlighted
        },
        'fontSize-'+(fontSize || 'normal')
    ]" >
      <!-- Text for notation -->
      <notation-text
        :item="item"
        :class="{ 'fontWeight-heavy': showText }"
        :id="tooltipDOMID" />
      <!-- Text for prefLabel -->
      <prefLabel-text
        v-if="showText"
        :item="item" />
    </div>
    <!-- Tooltip for prefLabel if only notation is shown -->
    <b-tooltip
      v-if="showTooltip && item.prefLabel && (item.prefLabel.de || item.prefLabel.en)"
      ref="tooltip"
      :target="tooltipDOMID" >
      {{ trimTooltip(item.prefLabel.de || item.prefLabel.en) }}
    </b-tooltip>
  </div>
</template>

<script>
import _ from "lodash"

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
     * Only for isLink: Side on which to open item.
     */
    isLeft: {
      type: Boolean,
      default: true
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
      return this.$jskos.compare(this.hoveredConcept, this.item)
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
      this.hoveredConcept = this.item
    },
    mouseOut() {
      this.isHoveredFromHere = false
      this.hoveredConcept = null
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
  computed: {
    notation() {
      if (this.item.notation && this.item.notation.length) {
        let notation = this.item.notation[0]
        if (this.$jskos.isScheme(this.item)) {
          return notation.toUpperCase()
        }
        return notation
      }
      return null
    }
  },
  template: "<span v-if='notation'>{{ notation }}</span>"
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
.itemName > * {
  color: @color-text-dark !important;
  display: inline;
}
.itemName-hovered {
  cursor: pointer;
  text-decoration: underline !important;
}
.itemName-highlighted {
  color: @color--itemName-highlighted !important;
  background: @color--itemName-highlighted-background;
  box-shadow: 0px 0px 5px @color--itemName-highlighted-background;
}
.itemName-highlighted:hover {
  background: @color--itemName-highlighted-background;
}
</style>
