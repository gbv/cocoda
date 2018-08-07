<template>
  <div
    v-if="narrower && narrower.length > 0"
    class="itemDetailNarrower" >
    <div class="fontWeight-heavy">
      {{ text }}
    </div>
    <div
      v-for="concept in narrower"
      v-if="concept != null"
      :key="concept.uri"
      class="itemDetailNarrower-item" >
      <font-awesome-icon
        class="u-flip-horizontal"
        icon="level-down-alt" />
      <item-name
        :item="concept"
        :is-link="true"
        font-size="small"
        @click.native="setSelected('concept', isLeft, concept)" />
    </div>
    <!-- Show LoadingIndicator when narrower exist, but are not loaded yet -->
    <loading-indicator
      v-if="narrower.length != 0 && narrower.includes(null)"
      size="sm" />
  </div>
</template>

<script>
import ItemName from "./ItemName"
import LoadingIndicator from "./LoadingIndicator"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"

/**
 * Component that displays narrower or top concepts for ItemDetail.
 */
export default {
  name: "ItemDetailNarrower",
  components: {
    ItemName, LoadingIndicator, FontAwesomeIcon
  },
  props: {
    /**
     * Array with concepts to display.
     */
    narrower: {
      type: Array,
      default: new Array([])
    },
    /**
     * The text to be displayed on the top.
     */
    text: {
      type: String,
      default: "Narrower Concepts:"
    },
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true
    },
  }
}
</script>

<style lang="less" scoped>
.itemDetailNarrower {
  margin: 5px;
}
</style>
