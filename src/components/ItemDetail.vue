<template>
  <div
    class="itemDetail"
    @dragover="dragOver"
    @drop="drop">
    <!-- Minimizer allows component to get minimized -->
    <minimizer
      :name="`itemDetail_${isLeft}`"
      :text="type + ' Detail'" />
    <!-- Include component depending on item type -->
    <div
      v-if="item != null"
      class="itemDetail-content">
      <component
        :is="type == 'Concept' ? 'ConceptDetail' : 'SchemeDetail'"
        :item="item"
        :is-left="isLeft"
        :settings="internalSettings"
        @searchMappings="$emit('searchMappings', $event)"
        @searchConcept="$emit('searchConcept', $event)" />
    </div>
    <div
      v-else-if="!loading"
      class="fillAndCenter fontSize-normal fontWeight-heavy">
      {{ $t("itemDetail.pleaseSelect") }}
    </div>

    <!-- Settings -->
    <component-settings />

    <data-modal-button
      :data="item"
      :position-right="20"
      :url="apiUrl" />

    <!-- Full screen loading indicator -->
    <loading-indicator-full v-if="loading" />
  </div>
</template>

<script>
import LoadingIndicatorFull from "./LoadingIndicatorFull"
import Minimizer from "./Minimizer"
import ConceptDetail from "./ConceptDetail"
import SchemeDetail from "./SchemeDetail"
import DataModalButton from "./DataModalButton"
import ComponentSettings from "./ComponentSettings"
import _ from "lodash"

// Import mixins
import objects from "../mixins/cdk"
import dragandrop from "../mixins/dragandrop"
import computed from "../mixins/computed"

/**
 * Component that displays an item's (either scheme or concept) details (URI, notation, identifier, ...).
 */
export default {
  name: "ItemDetail",
  components: {
    LoadingIndicatorFull, Minimizer, ConceptDetail, SchemeDetail, DataModalButton, ComponentSettings,
  },
  mixins: [objects, dragandrop, computed],
  props: {
    /**
     * The concept object whose details should be displayed.
     */
    item: {
      type: Object,
      default: null,
    },
    /**
     * `true` means item is a scheme, `false` means item is a concept.
     */
    isScheme: {
      type: Boolean,
      default: false,
    },
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true,
    },
    /**
     * Settings - An object with a subset of the following properties:
     *
     * - showGndTerms: show GND terms in ConceptDetail (default true)
     * - showSchemeInAncestors: (default true)
     * - showTopConceptsInScheme: (default false)
     * - showAllAncestors: always show all ancestors (default false)
     */
    settings: {
      type: Object,
      default: () => { return {} },
    },
  },
  data () {
    return {
      loading: false,
      defaultSettings: {
        showGndTerms: true,
        showSchemeInAncestors: true,
        showTopConceptsInScheme: false,
        showAllAncestors: false,
        showAllNotes: false,
      },
    }
  },
  computed: {
    type() {
      if (this.$jskos.isConcept(this.item)) {
        return "Concept"
      } else {
        return "Scheme"
      }
    },
    internalSettings() {
      // Merge prop settings and default settings
      return Object.assign({}, this.defaultSettings, {
        showAllAncestors: this.componentSettings.showAllAncestors,
      },this.settings)
    },
    apiUrl() {
      // TODO CDK: cocoda-sdk returns URL with results.
      if (!this.item || !this.item.uri) {
        return null
      }
      let baseUrl
      if (this.$jskos.isScheme(this.item)) {
        let provider = _.get(this.item, "inScheme[0]._registry") || _.get(this.item, "_registry")
        baseUrl = _.get(provider, "_api.schemes") || _.get(provider, "_api.data") || _.get(provider, "_api.concepts")
      } else {
        let provider = _.get(this.item, "inScheme[0]._registry")
        // TODO CDK: Check getDataUrl
        baseUrl = _.get(provider, "_api.data") || (_.get(provider, "getDataUrl") && provider.getDataUrl(this.item)) || _.get(provider, "_api.concepts")
      }
      // TODO: What to do with hardcoded schemes? See https://github.com/gbv/cocoda/issues/165. -> Show export modal with JSKOS data.
      if (!baseUrl || !_.isString(baseUrl)) {
        return null
      }
      return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}uri=${encodeURIComponent(this.item.uri)}`
    },
  },
  watch: {
    /**
     * Refreshes data when item changes.
     */
    item: function() {
      this.$el.scrollTop = 0
    },
  },
  mounted() {
    this.$el.scrollTop = 0
  },
  methods: {
    droppedConcept(concept) {
      this.$router.push({ path: this.getRouterUrl(concept, this.isLeft, true) })
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.itemDetail {
  position: relative;
  .fontSize-small;
}
.itemDetail-content {
  position: absolute;
  overflow-y: auto;
  top: 6px;
  right: 4px;
  bottom: 5px;
  left: 4px;
}
.itemDetail-content {
  padding: 2px 8px 2px 8px;
}

.itemDetail .componentSettings {
  right: 4px;
}

</style>
