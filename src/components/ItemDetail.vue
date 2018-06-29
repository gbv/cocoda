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
        showGndMappings: false,
        showGndTerms: true,
        showSchemeInAncestors: true,
        showTopConceptsInScheme: false,
        showAllAncestors: false,
        showAllNotes: false
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
      this.loading = true
      // Get details from API
      this.$api.objects.details(this.item).then(() => {
        this.loading = false
        // If there are no ancestors, but broader, load concepts for broader
        if ((!this.item.ancestors || this.item.ancestors.length == 0) && !this.item.BROADERLOADED) {
          let item = this.item
          if (!item.broader || item.broader.length == 0) {
            item.BROADERLOADED = true
            console.log("broader: no broader concepts")
            return
          }
          if (item.broader.includes(null)) {
          // FIXME: Use broader endpoint to load broader instead
            console.log("broader: null")
            item.BROADERLOADED = true
            return
          } else {
            let promises = []
            for (let i = 0; i < item.broader.length; i += 1) {
              promises.push(this.$api.objects.get(item.broader[i].uri, item.inScheme[0].uri).then( broader => {
                this.$set(item.broader, i, broader)
                console.log("broader", i, "loaded")
              }))
            }
            Promise.all(promises).then(() => {
              item.BROADERLOADED = true
            })
          }
        }
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
