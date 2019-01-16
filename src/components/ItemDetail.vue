<template>
  <div
    class="itemDetail"
    @dragover="dragOver"
    @drop="drop(isLeft, $event)" >
    <!-- Minimizer allows component to get minimized -->
    <minimizer :text="type + ' Detail'" />
    <!-- Include component depending on item type -->
    <div
      v-if="item != null"
      class="itemDetail-content">
      <component
        :is="type == 'Concept' ? 'ConceptDetail' : 'SchemeDetail'"
        :item="item"
        :is-left="isLeft"
        :settings="internalSettings"
      />
    </div>
    <div
      v-else-if="!loading"
      class="fillAndCenter fontSize-normal fontWeight-heavy" >
      {{ $t("itemDetail.pleaseSelect") }}
    </div>

    <data-modal-button
      :data="item"
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
import _ from "lodash"

/**
 * Component that displays an item's (either scheme or concept) details (URI, notation, identifier, ...).
 */
export default {
  name: "ItemDetail",
  components: {
    LoadingIndicatorFull, Minimizer, ConceptDetail, SchemeDetail, DataModalButton
  },
  props: {
    /**
     * The concept object whose details should be displayed.
     */
    item: {
      type: Object,
      default: null
    },
    /**
     * `true` means item is a scheme, `false` means item is a concept.
     */
    isScheme: {
      type: Boolean,
      default: false
    },
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true
    },
    /**
     * Settings - An object with a subset of the following properties:
     *
     * - showGndTerms: show GND terms in ConceptDetail (default true)
     * - showSchemeInAncestors: (default true)
     * - showTopConceptsInScheme: (default false)
     * - showAllAncestors: always show all ancestors (default false)
     * - showAllNotes: do not truncate notes (default false)
     */
    settings: {
      type: Object,
      default: () => { return {} }
    }
  },
  data () {
    return {
      loading: false,
      defaultSettings: {
        showGndTerms: true,
        showSchemeInAncestors: true,
        showTopConceptsInScheme: false,
        showAllAncestors: false,
        showAllNotes: false
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
        showAllAncestors: this.$settings.conceptDetailShowAllAncestors,
        showAllNotes: this.$settings.conceptDetailDoNotTruncateNotes,
      },this.settings)
    },
    apiUrl() {
      if (!this.item || !this.item.uri) {
        return null
      }
      let baseUrl
      if (this.$jskos.isScheme(this.item)) {
        let provider = _.get(this.item, "inScheme[0]._provider") || _.get(this.item, "_provider")
        baseUrl = _.get(provider, "registry.schemes") || _.get(provider, "registry.concepts") || _.get(provider, "registry.data")
      } else {
        let provider = _.get(this.item, "inScheme[0]._provider")
        baseUrl = _.get(provider, "registry.concepts") || _.get(provider, "registry.data")
      }
      // TODO: What to do with hardcoded schemes? See https://github.com/gbv/cocoda/issues/165. -> Show export modal with JSKOS data.
      if (!baseUrl || !_.isString(baseUrl)) {
        return null
      }
      return `${baseUrl}?uri=${encodeURIComponent(this.item.uri)}`
    },
  },
  watch: {
    /**
     * Refreshes data when item changes.
     */
    item: function() {
      this.$el.scrollTop = 0
    }
  },
  mounted() {
    this.$el.scrollTop = 0
  },
  methods: {
    dragOver(event) {
      event.preventDefault()
    },
    drop(isLeft, event) {
      event.preventDefault()
      let uri = event.dataTransfer.getData("text")
      let object = this.draggedConcept || this._getObject({ uri })
      if (object) {
        // Select object
        this.$router.push({ path: this.getRouterUrl(object, this.isLeft, true) })
      }
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

</style>
