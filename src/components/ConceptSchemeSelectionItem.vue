<template>
  <div>
    <font-awesome-icon
      v-b-tooltip.hover="{ title: $jskos.isContainedIn(scheme, favoriteSchemes) ? $t('schemeSelection.starRemove') : $t('schemeSelection.starAdd'), delay: defaults.delay.medium }"
      :class="$jskos.isContainedIn(scheme, favoriteSchemes) ? 'starFavorite' : 'starNormal'"
      class="pointer"
      icon="star"
      @click="toggleFavoriteScheme(scheme)" />
    <item-name
      :item="scheme"
      :is-link="true"
      :is-left="isLeft"
      @click.native="hidePopover" />
  </div>
</template>

<script>
import { getItem } from "@/items"
import ItemName from "./ItemName.vue"

export default {
  name: "ConceptSchemeSelectionItem",
  components: {
    ItemName,
  },
  props: {
    source: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
    favoriteSchemes: {
      type: Array,
      required: true,
    },
    toggleFavoriteScheme: {
      type: Function,
      required: true,
    },
    hidePopover: {
      type: Function,
      required: true,
    },
    isLeft: {
      type: Boolean,
      required: true,
    },
  },
  computed: {
    scheme() {
      return getItem(this.source)
    },
  },
}
</script>
