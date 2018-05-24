<template>
  <span v-if="item != null">
    <notation-badge :item="item" />
    <prefLabel-text :item="item" />
  </span>
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
.badge {
  font-family: "Courier New", Courier, monospace;
}
</style>
