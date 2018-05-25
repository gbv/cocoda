<template>
  <div
    v-if="item != null"
    :style="{'font-size': fontSize + 'em'}"
    class="itemName">
    <notation-badge
      :item="item"
      :style="{ bottom: (fontSize * 2) + 'px' }" />
    <prefLabel-text
      v-if="showText"
      :item="item" />
  </div>
</template>

<script>

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
     * The font size for the text in em.
     */
    fontSize: {
      type: Number,
      default: 1.0
    },
    /**
     * Determines whether to show or hide the label text.
     */
    showText: {
      type: Boolean,
      default: true
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

<style scoped>
.itemName {
  display: inline;
}
.badge {
  font-family: "Courier New", Courier, monospace;
  position: relative;
}
</style>
