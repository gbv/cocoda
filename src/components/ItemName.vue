<template>
  <span>
    <notation-badge :item="item" />
    <prefLabel-text :item="item" />
  </span>
</template>

<script>

/**
 * Displays an item's notation (if defined) and prefLabel.
 */
export default {
  name: 'item-name',
  props: ['item'],
}

import Vue from 'vue'

/**
 * Badge that displays an item's notation.
 */
Vue.component('notation-badge', {
  props: ['item'],
  template: '<b-badge v-if="item.notation && item.notation.length">{{ item.notation[0] }}</b-badge>'
})

/**
 * Displays an item's prefLabel (German over English).
 */
Vue.component('prefLabel-text', {
  introduction: 'display a prefLabel (German over English)',
  props: ['item'],
  template: '<span>{{ item.prefLabel.de ? item.prefLabel.de : item.prefLabel.en }}</span>'
})
</script>

<style scoped>
.badge {
  font-family: "Courier New", Courier, monospace;
}
</style>
