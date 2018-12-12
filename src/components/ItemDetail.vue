<template>
  <div
    class="itemDetail fontSize-small">
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
    <!-- Full screen loading indicator -->
    <loading-indicator-full v-if="loading" />
  </div>
</template>

<script>
import LoadingIndicatorFull from "./LoadingIndicatorFull"
import Minimizer from "./Minimizer"
import ConceptDetail from "./ConceptDetail"
import SchemeDetail from "./SchemeDetail"

/**
 * Component that displays an item's (either scheme or concept) details (URI, notation, identifier, ...).
 */
export default {
  name: "ItemDetail",
  components: {
    LoadingIndicatorFull, Minimizer, ConceptDetail, SchemeDetail
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
    }
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
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.itemDetail {
  position: relative;
}
.itemDetail-content {
  width: 100%;
  height: 100%;
  position: absolute;
  overflow-y: auto;
  top: 0;
  left: 0;
}
.itemDetail-content {
  padding: 2px 8px 2px 8px;
}

</style>
