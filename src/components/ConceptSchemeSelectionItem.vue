<template>
  <div>
    <!-- Icon if scheme doesn't have concepts -->
    <font-awesome-icon
      v-if="scheme.concepts && !scheme.concepts.length"
      v-b-tooltip.hover="{ title: $t('schemeSelection.noConcepts'), delay: defaults.delay.medium }"
      style="margin-right: 5px;"
      icon="seedling" />
    <!-- Only show favorite star if there are concepts -->
    <font-awesome-icon
      v-else
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
