<template>
  <div
    class="conceptList">
    <!-- Show concepts -->
    <virtual-list
      ref="conceptListItems"
      class="conceptListItems"
      :data-key="'uri'"
      :data-sources="items"
      :data-component="itemComponent"
      :keeps="50"
      :extra-props="{
        isLeft,
        showChildren,
        showScheme,
        buttons,
      }"
      :wrap-style="{
        'margin-bottom': '15px',
      }"
      @scroll.native="$emit('scroll')" />
    <div
      v-if="noItems"
      class="conceptListItems-noItems">
      {{ noItemsLabel || $t("conceptList.noItems") }}
    </div>
    <!-- Full screen loading indicator -->
    <loading-indicator-full v-if="loading || concepts.includes(null)" />
  </div>
</template>

<script>
import LoadingIndicatorFull from "./LoadingIndicatorFull.vue"
import ConceptListItem from "./ConceptListItem.vue"
import VirtualList from "vue-virtual-scroll-list"
import _ from "lodash"
import { scroller } from "vue-scrollto/src/scrollTo"

// Import mixins
import objects from "../mixins/cdk.js"
import computed from "../mixins/computed.js"
import mappedStatus from "../mixins/mapped-status.js"

/**
 * Component that represents a (navigatable) concept list.
 */
export default {
  name: "ConceptList",
  components: {
    LoadingIndicatorFull,
    VirtualList,
  },
  mixins: [objects, computed, mappedStatus],
  props: {
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true,
    },
    /**
     * List of concepts to be shown.
     */
    concepts: {
      type: Array,
      default: () => [null],
    },
    /**
     * Whether to show children of concepts, i.e. a concept hierarchy.
     */
    showChildren: {
      type: Boolean,
      default: false,
    },
    /**
     * Optional label to show when there are no items.
     */
    noItemsLabel: {
      type: String,
      default: null,
    },
    /**
     * Whether to show the scheme in front of concepts.
     */
    showScheme: {
      type: Boolean,
      default: false,
    },
    /**
     * List of buttons (array of objects with props `position`, `icon`, and `onClick`).
     */
    buttons: {
      type: Array,
      default: () => [],
    },
    /**
     * Whether the list is currently on screen.
     */
    shown: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["scroll"],
  data () {
    return {
      loading: false,
      currentSelectedConcept: null,
      shouldScroll: true,
      scrollTo: scroller(),
      oldPreviousConcept: null,
      oldNextConcept: null,
      itemComponent: ConceptListItem,
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
          uri: concept ? concept.uri : "loading",
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
    // Some properties needed to decide whether to load mappings
    itemsLength() {
      return this.items.length
    },
    otherScheme() {
      return this.selected.scheme[!this.isLeft]
    },
    loadConceptsMappedStatusConceptsToLoad() {
      return this.items.filter(i => i.concept).map(i => i.concept)
    },
    previousConcept() {
      // Index of current concept in the list of concepts
      const index = this.items.findIndex(item => this.$jskos.compare(item.concept, this.conceptSelected))
      if (index == -1) {
        return null
      }
      // If the list is not a hierarchy, return the next item in the list
      if (!this.showChildren) {
        const item = this.items[index - 1]
        return item && item.concept
      }
      // Otherwise return null (hierarchy not supported yet)
      return null
    },
    nextConcept() {
      // Index of current concept in the list of concepts
      const index = this.items.findIndex(item => this.$jskos.compare(item.concept, this.conceptSelected))
      if (index == -1) {
        return null
      }
      // If the list is not a hierarchy, return the next item in the list
      if (!this.showChildren) {
        const item = this.items[index + 1]
        return item && item.concept
      }
      // Otherwise go through hierarchy
      const next = (concept, root = true) => {
        if (!concept) {
          return null
        }
        // If this is the root call and there are narrower concepts, return first child
        if (root && concept.narrower && concept.narrower.length) {
          return concept.narrower[0]
        }
        const parent = _.last(concept.ancestors) || _.first(concept.broader)
        // Get children of parent
        let children = _.get(parent, "narrower")
        // If there is no parent, use top concepts as children (everything with depth 0 from items)
        if (!parent) {
          children = this.items.filter(item => item.depth == 0).map(item => item.concept)
        }
        if (!children) {
          return null
        }
        // Try to find next child in list of children
        const nextChild = children[children.findIndex(c => this.$jskos.compare(c, concept)) + 1]
        if (nextChild) {
          return nextChild
        }
        // If there is no next child, find next for parent
        if (parent) {
          return next(parent, false)
        }
        return null
      }
      return next(this.selected.concept[this.isLeft])
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
            for (let ancestor of concept.ancestors || []) {
              if (this.showChildren && (!ancestor.narrower || ancestor.narrower.includes(null))) {
                fullyLoaded = false
              }
            }
            if (fullyLoaded && this.shouldScroll) {
              this.shouldScroll = false
              // Open ancestors
              if (this.showChildren) {
                for (let ancestor of this.conceptSelected.ancestors || []) {
                  this.open(ancestor, this.isLeft, true)
                }
              }
              _.delay(() => {
                // Don't scroll if concept changed in the meantime
                if (this.shouldScroll) return
                const index = this.items.findIndex(i => this.$jskos.compare(i.concept, concept))
                if (index === -1) return
                this.scrollToInternal({ index })
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
      deep: true,
    },
    // If any of these change, mappings have to be loaded again (if necessary).
    itemsLength() {
      this.loadMappingsForItems()
    },
    shown() {
      this.commitPreviousConcept()
      this.commitNextConcept()
    },
    previousConcept() {
      if (!this.$jskos.compare(this.previousConcept, this.oldPreviousConcept)) {
        this.commitPreviousConcept()
        this.oldPreviousConcept = this.previousConcept
      }
    },
    nextConcept() {
      if (!this.$jskos.compare(this.nextConcept, this.oldNextConcept)) {
        this.commitNextConcept()
        this.oldNextConcept = this.nextConcept
      }
    },
  },
  methods: {
    commitPreviousConcept() {
      if (this.shown) {
        this.$store.commit({
          type: "selected/setPreviousConcept",
          isLeft: this.isLeft,
          concept: this.previousConcept,
        })
      }
    },
    commitNextConcept() {
      if (this.shown) {
        this.$store.commit({
          type: "selected/setNextConcept",
          isLeft: this.isLeft,
          concept: this.nextConcept,
        })
      }
    },
    scrollToInternal({ index }) {
      let container = this.$refs.conceptListItems
      if (!container) {
        // Wait for later to scroll
        this.scrollLater = { index }
      } else {
        container.scrollToIndex(index - 1)
        this.scrollLater = null
      }
    },
    scroll() {
      if (this.scrollLater) {
        this.$nextTick(() => {
          this.scrollToInternal(this.scrollLater)
        })
      }
    },
    children(item) {
      let items = []
      let concept = item.concept
      let depth = item.depth + 1
      if (concept && concept.__ISOPEN__ && concept.__ISOPEN__[this.isLeft]) {
        for (let child of concept.narrower || []) {
          let item = {
            uri: child ? child.uri : "loading",
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
    loadMappingsForItems() {
      this.loadMappingsForConcepts(this.loadConceptsMappedStatusConceptsToLoad, this.isLeft)
    },
  },
}

</script>

<style lang="less" scoped>
@import "../style/main.less";

.conceptList {
  height: 100%;
}
.conceptListItems {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow: scroll;
}
.conceptListItems > *:first-child > *:last-child {
  margin-bottom: 30px;
}
.conceptListItems-noItems {
  margin-top: 5px;
  text-align: center;
}

</style>
