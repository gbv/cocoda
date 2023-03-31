<template>
  <div
    :style="{
      margin: 0,
      paddingLeft: (allowShowAncestors && ancestors.length > 3 && !settings.showAllAncestors) ? '8px' : 0,
    }">
    <div
      v-if="allowShowAncestors && ancestors.length > 3 && !settings.showAllAncestors"
      v-b-tooltip.hover="{ title: showAncestors ? $t('conceptDetail.showLessAncestors') : $t('conceptDetail.showAllAncestors'), delay: defaults.delay.medium }"
      class="button conceptDetail-ancestors-expand"
      @click="showAncestors = !showAncestors">
      <font-awesome-icon
        :icon="showAncestors ? 'angle-down' : 'angle-right'"
        style="font-size: 12px;" />
    </div>
    <div
      v-for="(concept, index) in ancestors.filter(concept => concept != null).reverse()"
      :key="`conceptDetail-${isLeft}-ancesters-${concept.uri}-${index}`"
      :class="{
        'concept-mappingsExist': (showAncestors || settings.showAllAncestors || index == 0 || index == ancestors.length - 1 || ancestors.length <= 3) && loadConceptsMappedStatus && $store.getters.mappedStatus(concept, isLeft),
        'concept-mappingsDoNotExist': loadConceptsMappedStatus && !$store.getters.mappedStatus(concept, isLeft)
      }">
      <span v-if="showAncestors || settings.showAllAncestors || index == 0 || index == ancestors.length - 1 || ancestors.length <= 3">
        <font-awesome-icon
          class="u-flip-horizontal"
          icon="level-up-alt"
          style="margin-right: 3px; font-size: 12px;" />
        <item-name
          :item="concept"
          :is-link="!disallowSelectItem"
          :is-left="isLeft"
          font-size="small" />
      </span>
      <span
        v-else-if="index == 1"
        v-b-tooltip.hover="allowShowAncestors ? { title: $t('conceptDetail.showAllAncestors'), delay: defaults.delay.medium } : null"
        :class="{
          'conceptDetail-ancestors-more': true,
          button: allowShowAncestors,
        }"
        @click="showAncestors = allowShowAncestors">
        <font-awesome-icon
          class="u-flip-horizontal"
          icon="ellipsis-v" />
      </span>
    </div>
    <!-- Broader -->
    <div
      v-for="(concept, index) in ((ancestors.length == 0 && _item.__BROADERLOADED__) ? broader : []).filter(concept => concept != null)"
      :key="`conceptDetail-broader-${concept.uri}-${index}`"
      :class="{
        'concept-mappingsExist': loadConceptsMappedStatus && $store.getters.mappedStatus(concept, isLeft),
        'concept-mappingsDoNotExist': loadConceptsMappedStatus && !$store.getters.mappedStatus(concept, isLeft)
      }">
      <font-awesome-icon
        icon="sort-up" />
      <item-name
        :item="concept"
        :is-link="!disallowSelectItem"
        :is-left="isLeft"
        font-size="small" />
    </div>
    <!-- Show LoadingIndicator when ancestors exist, but are not loaded yet -->
    <loading-indicator
      v-if="loading"
      size="sm" />
  </div>
</template>

<script>
import LoadingIndicator from "./LoadingIndicator.vue"

import mappedStatus from "@/mixins/mapped-status.js"

import { getItem, getItems, loadAncestors, loadConcepts, modifyItem } from "@/items"

export default {
  name: "ConceptDetailAncestors",
  components: { ItemName: () => import("./ItemName.vue"), LoadingIndicator },
  mixins: [mappedStatus],
  props: {
    /**
     * The concept object whose details should be displayed.
     */
    item: {
      type: Object,
      default: null,
    },
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      required: false,
    },
    allowShowAncestors: {
      type: Boolean,
      default: true,
    },
    disallowSelectItem: {
      type: Boolean,
      default: false,
    },
    /**
     * Settings - see [`ItemDetail`](#itemdetail).
     */
    settings: {
      type: Object,
      default: () => { return {} },
    },
  },
  data() {
    return {
      /** Temporarily show all ancestors if user clicked the ellipsis */
      showAncestors: false,
    }
  },
  computed: {
    _item() {
      return getItem(this.item)
    },
    ancestors() {
      return getItems(this._item?.ancestors || [])
    },
    broader() {
      return getItems(this._item?.broader || [])
    },
    loading() {
      return this.ancestors.length != 0 && this.ancestors.includes(null) || this.ancestors.length == 0 && this.broader.length != 0 && !this._item.__BROADERLOADED__
    },
  },
  mounted() {
    if (this.loading) {
      loadAncestors(this.item)
      // Load information about its broader concepts
      if (this._item.broader && !this._item.__BROADERLOADED__) {
        loadConcepts(this._item.broader.filter(Boolean), { scheme: this._item.inScheme[0] }).then(() => {
          modifyItem(this._item, "__BROADERLOADED__", true)
        })
      }
    }
  },
}
</script>

<style lang="less" scoped>
@import "@/style/main.less";

.conceptDetail-ancestors {
  margin: 0;
  padding-left: 8px;
}
.conceptDetail-ancestors-expand {
  position: absolute;
  left: 5px;
}
.conceptDetail-ancestors-more {
  width: 20px;
}

</style>
