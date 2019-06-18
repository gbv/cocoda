<template>
  <div class="conceptList">
    <!-- Show concepts -->
    <div
      ref="conceptListItems"
      class="conceptListItems">
      <concept-list-item
        v-for="({ concept, depth, isSelected }, index) in items"
        :key="`conceptListItems-${isLeft}-${index}`"
        :concept="concept"
        :depth="depth"
        :is-selected="isSelected"
        :index="index"
        :is-left="isLeft"
        :show-children="showChildren"
        :show-scheme="showScheme" />
    </div>
    <div
      v-if="noItems"
      class="conceptListItems-noItems fontWeight-heavy">
      {{ noItemsLabel || $t("conceptList.noItems") }}
    </div>
    <!-- Full screen loading indicator -->
    <loading-indicator-full v-if="loading || concepts.includes(null)" />
  </div>
</template>

<script>
import LoadingIndicatorFull from "./LoadingIndicatorFull"
import ConceptListItem from "./ConceptListItem"
import _ from "lodash"
import { scroller } from "vue-scrollto/src/scrollTo"

// Import mixins
import objects from "../mixins/objects"
import computed from "../mixins/computed"

/**
 * Component that represents a (navigatable) concept list.
 */
export default {
  name: "ConceptList",
  components: {
    LoadingIndicatorFull, ConceptListItem
  },
  mixins: [objects, computed],
  props: {
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true
    },
    /**
     * List of concepts to be shown.
     */
    concepts: {
      type: Array,
      default: () => [null]
    },
    /**
     * Whether to show children of concepts, i.e. a concept hierarchy.
     */
    showChildren: {
      type: Boolean,
      default: false
    },
    /**
     * Optional label to show when there are no items.
     */
    noItemsLabel: {
      type: String,
      default: null
    },
    /**
     * Whether to show the scheme in front of concepts.
     */
    showScheme: {
      type: Boolean,
      default: false
    },
  },
  data () {
    return {
      loading: false,
      currentSelectedConcept: null,
      shouldScroll: true,
      scrollTo: scroller(),
    }
  },
  computed: {
    schemeSelected() {
      return this.selected.scheme[this.isLeft]
    },
    conceptSelected() {
      return this.selected.concept[this.isLeft]
    },
    items() {
      let items = []
      for (let concept of this.concepts) {
        let item = {
          concept,
          depth: 0,
          isSelected: this.$jskos.compare(this.conceptSelected, concept),
        }
        items.push(item)
        if (this.showChildren) {
          let childrenItems = this.children(item)
          items = items.concat(childrenItems)
        }
      }
      return items
    },
    noItems() {
      return this.items.length == 0 && !this.loading
    },
  },
  watch: {
    conceptSelected: {
      handler() {
        // TODO: Check
        let concept = this.conceptSelected
        if (concept != this.currentSelectedConcept) {
          this.currentSelectedConcept = concept
          this.shouldScroll = true
        }
        if (this.$jskos.isConcept(concept)) {
          // Check if concept is fully loaded
          if (!this.showChildren || (concept.ancestors && !concept.ancestors.includes(null))) {
            let fullyLoaded = true
            for (let ancestor of concept.ancestors) {
              if (this.showChildren && (!ancestor.narrower || ancestor.narrower.includes(null))) {
                fullyLoaded = false
              }
            }
            if (fullyLoaded && this.shouldScroll) {
              this.shouldScroll = false
              // Open ancestors
              if (this.showChildren) {
                for (let ancestor of this.conceptSelected.ancestors) {
                  this.open(ancestor, this.isLeft, true)
                }
              }
              _.delay(() => {
                // Don't scroll if concept changed in the meantime
                if (this.shouldScroll) return
                let el = this.$refs.conceptListItems.querySelectorAll(`[data-uri='${concept.uri}']`)[0]
                // Find container element
                let container = this.$refs.conceptListItems
                while (container != null && !container.classList.contains("cocoda-vue-tabs-content")) {
                  container = container.parentElement
                }
                // Scroll element
                var options = {
                  container,
                  easing: "ease-in",
                  offset: -50,
                  cancelable: true,
                  x: false,
                  y: true
                }
                if (el) this.scrollToInternal(el, options)
                this.loading = false
              }, 100)
            } else if (!fullyLoaded) {
              this.loading = true
            }
          } else {
            this.loading = true
          }
        }
      },
      deep: true
    },
  },
  methods: {
    scrollToInternal(el, options) {
      let container = options.container
      if (container.style.display == "none") {
        // Wait for later to scroll
        this.scrollLater = { el, options }
      } else {
        this.scrollTo(el, 200, options)
        this.scrollLater = null
      }
    },
    scroll() {
      if (this.scrollLater) {
        this.$nextTick(() => {
          this.scrollToInternal(this.scrollLater.el, this.scrollLater.options)
        })
      }
    },
    children(item) {
      let items = []
      let concept = item.concept
      let depth = item.depth + 1
      if (concept && concept.__ISOPEN__ && concept.__ISOPEN__[this.isLeft]) {
        for (let child of concept.narrower) {
          let item = {
            concept: child,
            depth,
            isSelected: this.$jskos.compare(this.conceptSelected, child),
          }
          items.push(item)
          items = items.concat(this.children(item))
        }
      }
      return items
    },
  }
}

</script>

<style lang="less" scoped>
@import "../style/main.less";

.conceptListItems-noItems {
  margin-top: 5px;
  text-align: center;
}

</style>
