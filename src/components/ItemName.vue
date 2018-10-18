<template>
  <div
    v-if="item != null"
    class="itemName"
    @mouseover="mouseOver"
    @mouseout="mouseOut">
    <div
      :is="isValidLink ? 'router-link' : 'div'"
      :to="getRouterUrl(item, isLeft)"
      :class="[
        {
          'itemName-hovered': isValidLink && isHovered,
          'itemName-highlighted': isHighlighted,
          'fontWeight-heavy': isHighlighted
        },
        'fontSize-'+(fontSize || 'normal')
      ]"
      :id="tooltipDOMID" >
      <!-- Text for notation -->
      <notation-text
        :item="item"
        :class="{ 'fontWeight-heavy': showText }" />
      <!-- Text for prefLabel -->
      <span v-if="showText || !notation">
        {{ $util.prefLabel(item) }}
      </span>
    </div>
    <!-- Tooltip for prefLabel if only notation is shown -->
    <b-tooltip
      v-if="showTooltip && $util.prefLabel(item)"
      ref="tooltip"
      :target="tooltipDOMID" >
      {{ trimTooltip($util.prefLabel(item)) }}
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
    },
    notation() {
      return this.$util.notation(this.item)
    },
    isValidLink() {
      if (!this.isLink) {
        return false
      }
      // Only mention schemes so that computed property refreshes after schemes are loaded.
      this.$store.state.schemes
      // Check if scheme (or item itself) is available.
      let scheme = this.$store.getters["objects/get"](_.get(this.item, "inScheme[0]")) || this.$store.getters["objects/get"](this.item)
      return scheme != null
    },
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
  data() {
    return {
      ddc: {
        uri : "http://dewey.info/scheme/edition/e23/",
        identifier : [
          "http://bartoc.org/en/node/241"
        ]
      }
    }
  },
  computed: {
    notation() {
      return this.$util.notation(this.item)
    },
    fill() {
      let fill = ""
      // For DDC only: fill notation with trailing zeros
      if (this.$jskos.compare(this.ddc, _.get(this, "item.inScheme[0]"))) {
        while (this.notation.length + fill.length < 3) {
          fill += "0"
        }
      }
      return fill
    },
  },
  template: "<span v-if='notation'>{{ notation }}<span class='notation-fill text-veryLightGrey'>{{ fill }}</span></span>"
})

</script>

<style lang="less" scoped>
@import "../style/main.less";

.itemName {
  display: inline;
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
}
.itemName-highlighted:hover {
  background: @color--itemName-highlighted-background;
}
</style>
