<template>
  <div
    class="itemDetail font-size-small">
    <minimizer :text="type + ' Detail'" />
    <div
      v-if="item != null"
      class="itemDetailContent">
      <component
        :is="type == 'Concept' ? 'ConceptDetail' : 'SchemeDetail'"
        :item="item"
        :scheme="scheme"
        :is-left="isLeft"
        :settings="internalSettings"
        @chooseUri="chooseUri" />
    </div>
    <div
      v-else-if="!loading"
      class="loadingFull font-size-normal font-heavy">Please select a scheme or concept.</div>
    <div
      v-if="loading"
      class="loadingFull">
      <loading-indicator size="lg" />
    </div>
  </div>
</template>

<script>
import LoadingIndicator from "./LoadingIndicator"
import Minimizer from "./Minimizer"
import ConceptDetail from "./ConceptDetail"
import SchemeDetail from "./SchemeDetail"

/**
 * Component that displays an item's (either scheme or concept) details (URI, notation, identifier, ...).
 */
export default {
  name: "ItemDetail",
  components: {
    LoadingIndicator, Minimizer, ConceptDetail, SchemeDetail
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
     * Reference to the scheme
     */
    scheme: {
      type: Object,
      default: null
    },
    /**
     * Settings - An object with a subset of the following properties:
     * - showGndMappings: show all GND mappings in ConceptDetail (default false)
     * - showGndTerms: show GND terms in ConceptDetail (default true)
     * - enableFullNavigation: show the scheme in the ancestors list in ConceptDetail and show the top concepts in SchemeDetail (default false)
     * - showAllAncestors: always show all ancestors (default false)
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
        showGndMappings: false,
        showGndTerms: true,
        enableFullNavigation: false,
        showAllAncestors: false,
      }
    }
  },
  computed: {
    type() {
      if (this.$util.isConcept(this.item)) {
        return "Concept"
      } else {
        return "Scheme"
      }
    },
    internalSettings() {
      // Merge prop settings and default settings
      let settings = {}
      for (let setting of Object.keys(this.defaultSettings)) {
        settings[setting] = this.settings[setting] || this.defaultSettings[setting]
      }
      return settings
    }
  },
  watch: {
    /**
     * Refreshes data when item changes.
     */
    item: function() {
      this.loadDetails()
    }
  },
  created() {
    this.loadDetails()
  },
  methods: {
    loadDetails() {
      if (this.item == null || this.item.DETAILSLOADED) {
        this.loading = false
        return
      }
      let vm = this
      let itemBefore = this.item
      this.loading = true
      // Get details from API
      this.$api.data(this.scheme, this.item.uri, this.$api.detailProperties)
        .then(function(data) {
          if (itemBefore != vm.item) {
            console.log("Item changed during the request, discarding data...")
          } else {
            if (Array.isArray(data) && data.length > 0) {
              // Integrate details into item
              let detail = data[0]
              for (let prop of Object.keys(detail)) {
                if (vm.item[prop] == null) {
                  vm.$set(vm.item, prop, detail[prop])
                }
              }
            }
            if (data.length > 1) {
              console.log("For some reason, more than one set of properties was received for ", vm.item)
            }
            vm.item.DETAILSLOADED = true
            vm.loading = false
          }
        }).catch(function(error) {
          console.log("Request failed", error)
          vm.loading = false
        })
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.itemDetail {
  position: relative;
}
.itemDetailContent, .loadingFull {
  width: 100%;
  height: 100%;
  position: absolute;
  overflow-y: auto;
  top: 0;
  left: 0;
}
.itemDetailContent {
  padding: 2px 8px 2px 8px;
}
.loadingFull {
  z-index: 100;
  background-color: #ffffff55;
  display: flex;
  justify-content: center;
  align-items: center;
}

</style>
