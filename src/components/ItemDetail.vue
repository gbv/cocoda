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
      Please select a scheme or concept.
    </div>
    <!-- Full screen loading indicator -->
    <loading-indicator-full v-if="loading" />
    <!-- Previos and next buttons -->
    <div
      v-b-tooltip.hover="{ title: prevConcepts.length > 0 ? 'previous concept' : '', delay: $util.delay.medium }"
      class="utilityButton itemDetail-prevButton"
      @click="choosePrevious" >
      <font-awesome-icon
        v-if="prevConcepts.length > 0"
        icon="chevron-left" />
    </div>
    <div
      v-b-tooltip.hover="{ title: nextConcepts.length > 0 ? 'next concept' : '', delay: $util.delay.medium }"
      class="utilityButton itemDetail-nextButton"
      @click="chooseNext" >
      <font-awesome-icon
        v-if="nextConcepts.length > 0"
        icon="chevron-right" />
    </div>
  </div>
</template>

<script>
import LoadingIndicatorFull from "./LoadingIndicatorFull"
import Minimizer from "./Minimizer"
import ConceptDetail from "./ConceptDetail"
import SchemeDetail from "./SchemeDetail"
import _ from "lodash"

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
      /** History of selected items */
      prevConcepts: [],
      nextConcepts: []
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
    item: function(newItem, oldItem) {
      this.$el.scrollTop = 0
      this.loadDetails()
      if (!this.$jskos.compare(newItem, oldItem)) {
        if (this.prevConcepts.length > 0 && this.$jskos.compare(newItem, _.last(this.prevConcepts))) {
          // new item came from prevConcepts
          this.nextConcepts.unshift(oldItem)
          this.prevConcepts.pop()
        } else if (this.nextConcepts.length > 0 && this.$jskos.compare(newItem, _.first(this.nextConcepts))) {
          // new item came from nextConcepts
          if (oldItem) this.prevConcepts.push(oldItem)
          this.nextConcepts.shift()
        } else {
          // new item came from elsewhere
          if (oldItem) this.prevConcepts.push(oldItem)
          this.nextConcepts = []
        }
      }
    }
  },
  created() {
    this.loadDetails()
  },
  mounted() {
    this.$el.scrollTop = 0
  },
  methods: {
    loadDetails() {
      this.loading = true
      // Get details from API
      this.loadObjectDetails({ object: this.item }).then(() => {
        this.loading = false
        // If there are no ancestors, but broader, load concepts for broader
        if ((!this.item.ancestors || this.item.ancestors.length == 0) && !this.item.BROADERLOADED) {
          let item = this.item
          if (!item.broader || item.broader.length == 0) {
            this.$store.commit({
              type: "objects/set",
              object: item,
              prop: "BROADERLOADED",
              value: true
            })
            console.warn("broader: no broader concepts")
            return
          }
          if (item.broader.includes(null)) {
          // FIXME: Use broader endpoint to load broader instead
            console.warn("broader: null")
            this.$store.commit({
              type: "objects/set",
              object: item,
              prop: "BROADERLOADED",
              value: true
            })
            return
          } else {
            let promises = []
            for (let i = 0; i < item.broader.length; i += 1) {
              promises.push(this.getObject({ object: item.broader[i], scheme: item.inScheme[0] }).then( broader => {
                this.$set(item.broader, i, broader)
              }))
            }
            Promise.all(promises).then(() => {
              this.$store.commit({
                type: "objects/set",
                object: item,
                prop: "BROADERLOADED",
                value: true
              })
            })
          }
        }
      })
    },
    choosePrevious() {
      if (this.prevConcepts.length) {
        let object = _.last(this.prevConcepts)
        object = this.$jskos.isScheme(object) ? null : object
        this.setSelected("concept", this.isLeft, object)
      }
    },
    chooseNext() {
      if (this.nextConcepts.length) {
        let object = _.first(this.nextConcepts)
        object = this.$jskos.isScheme(object) ? null : object
        this.setSelected("concept", this.isLeft, object)
      }
    }
  }
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
.itemDetail-prevButton, .itemDetail-nextButton {
  top: 0px;
  font-size: 16px;
  padding-top: 1px;
  padding-left: 7px;
}
.itemDetail-prevButton {
  right: 50px;
}
.itemDetail-nextButton {
  right: 25px;
}

</style>
