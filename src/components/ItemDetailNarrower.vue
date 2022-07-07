<template>
  <div
    v-if="narrower && narrower.length > 0"
    class="itemDetailNarrower">
    <div
      v-if="text != null"
      class="fontWeight-heavy">
      {{ text }}
    </div>
    <div
      v-for="concept in narrower.filter(concept => concept != null)"
      :key="concept.uri"
      class="itemDetailNarrower-item"
      :class="{
        'concept-mappingsExist': loadConceptsMappedStatus && $store.getters.mappedStatus(concept, isLeft),
        'concept-mappingsDoNotExist': loadConceptsMappedStatus && !$store.getters.mappedStatus(concept, isLeft)
      }">
      <font-awesome-icon
        class="u-flip-horizontal"
        icon="level-down-alt" />
      <item-name
        :item="concept"
        :is-link="true"
        :is-left="isLeft"
        font-size="small" />
    </div>
    <!-- Show LoadingIndicator when narrower exist, but are not loaded yet -->
    <loading-indicator
      v-if="narrower.length != 0 && narrower.includes(null)"
      size="sm" />
  </div>
</template>

<script>
import ItemName from "./ItemName.vue"
import LoadingIndicator from "./LoadingIndicator.vue"

import mappedStatus from "@/mixins/mapped-status.js"

/**
 * Component that displays narrower or top concepts for ItemDetail.
 */
export default {
  name: "ItemDetailNarrower",
  components: {
    ItemName, LoadingIndicator,
  },
  mixins: [mappedStatus],
  props: {
    /**
     * Array with concepts to display.
     */
    narrower: {
      type: Array,
      default: () => new Array(),
    },
    /**
     * The text to be displayed on the top.
     */
    text: {
      type: String,
      default: null,
    },
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    loadConceptsMappedStatusConceptsToLoad() {
      return this.narrower.filter(c => c)
    },
  },
}
</script>

<style lang="less" scoped>
.itemDetailNarrower {
  margin: 5px 0px;
}
</style>
