<template>
  <div>
    <font-awesome-icon
      v-b-tooltip.hover="{ title: $jskos.isContainedIn(source, favoriteSchemes) ? $t('schemeSelection.starRemove') : $t('schemeSelection.starAdd'), delay: defaults.delay.medium }"
      :class="$jskos.isContainedIn(source, favoriteSchemes) ? 'starFavorite' : 'starNormal'"
      class="pointer"
      icon="star"
      @click="toggleFavoriteScheme(source)" />
    <item-name
      :item="source"
      :is-link="true"
      :is-left="isLeft"
      @click.native="hidePopover" />
  </div>
</template>

<script>
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
}
</script>
