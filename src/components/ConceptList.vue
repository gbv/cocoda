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
      :keeps="70"
      :extra-props="{
        isLeft,
        showChildren,
        showScheme,
        buttons,
      }"
      :wrap-style="{
        'margin-top': '5px',
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
import objects from "@/mixins/cdk.js"
import computed from "@/mixins/computed.js"
import mappedStatus from "@/mixins/mapped-status.js"
import { getItem } from "@/items"

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
      itemComponent: ConceptListItem,
    }
  },
  computed: {
    conceptSelected() {
      return this.selected.concept[this.isLeft]
    },
    conceptSelectedFromStore() {
      return getItem(this.selected.concept[this.isLeft])
    },
    items() {
      if (!this.shown) {
        return []
      }
      let items = []
      for (let concept of this.concepts) {
        let item = {
          uri: concept ? concept.uri : "loading",
          concept,
          depth: 0,
          isSelected: this.$jskos.compareFast(this.conceptSelected, concept),
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
    otherScheme() {
      return getItem(this.selected.scheme[!this.isLeft])
    },
    ancestors() {
      const ancestors = this.conceptSelectedFromStore && this.conceptSelectedFromStore.ancestors
      if (!ancestors) {
        return null
      }
      return ancestors.map(ancestor => {
        if (!ancestor) {
          return ancestor
        }
        return getItem(ancestor)
      })
    },
  },
  watch: {
    conceptSelectedFromStore: {
      handler() {
        this.conceptSelectedUpdated()
      },
      deep: true,
    },
    // We need to watch ancestors as well because the previous watcher does not cover ancestors more than one step away.
    ancestors: {
      handler() {
        this.conceptSelectedUpdated()
      },
      deep: true,
    },
    shown() {
      this.conceptSelectedUpdated()
    },
    items: {
      handler() {
        this.updatePreviousAndNextConcepts()
      },
      deep: true,
    },
  },
  created() {
    this.updatePreviousAndNextConcepts = _.debounce(this._updatePreviousAndNextConcepts, 300)
  },
  methods: {
    _updatePreviousAndNextConcepts() {
      if (!this.shown) {
        return
      }
      // Index of current concept in the list of concepts
      const index = this.items.findIndex(item => this.$jskos.compareFast(item.concept, this.conceptSelected))
      // ===== Previous Concept =====
      const previousConcept = (() => {
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
      })()
      this.$store.commit({
        type: "selected/setPreviousConcept",
        isLeft: this.isLeft,
        concept: previousConcept,
      })
      // ===== Next Concept =====
      const nextConcept = (() => {
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
          concept = getItem(concept)
          if (!concept) {
            return null
          }
          // If this is the root call and there are narrower concepts, return first child
          if (root && concept.narrower && concept.narrower.length) {
            return concept.narrower[0]
          }
          const parent = getItem(_.first(concept.ancestors) || _.first(concept.broader))
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
          const nextChild = children[children.findIndex(c => this.$jskos.compareFast(c, concept)) + 1]
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
      })()
      this.$store.commit({
        type: "selected/setNextConcept",
        isLeft: this.isLeft,
        concept: nextConcept,
      })
    },
    children(item) {
      let items = []
      let concept = getItem(item.concept)
      let depth = item.depth + 1
      if (concept && concept.__ISOPEN__ && concept.__ISOPEN__[this.isLeft]) {
        for (let child of concept.narrower || []) {
          let item = {
            uri: child ? child.uri : "loading",
            concept: child,
            depth,
            isSelected: this.$jskos.compareFast(this.conceptSelected, child),
          }
          items.push(item)
          items = items.concat(this.children(item))
        }
      }
      return items
    },
    conceptSelectedUpdated() {
      if (!this.shown) {
        return
      }
      // TODO: Check
      let concept = this.conceptSelectedFromStore
      if (!this.$jskos.compareFast(concept, this.currentSelectedConcept)) {
        this.currentSelectedConcept = concept
        this.shouldScroll = true
      }
      if (this.$jskos.isConcept(concept)) {
        // Check if concept is fully loaded
        if (!this.showChildren || (this.ancestors && !this.ancestors.includes(null))) {
          let fullyLoaded = true
          for (let ancestor of this.ancestors || []) {
            if (this.showChildren && (!ancestor.narrower || ancestor.narrower.includes(null))) {
              fullyLoaded = false
            }
          }
          if (fullyLoaded && this.shouldScroll) {
            this.shouldScroll = false
            // Open ancestors
            if (this.showChildren) {
              for (let ancestor of this.ancestors || []) {
                this.open(ancestor, this.isLeft, true)
              }
            }
            this.scrollToInternal({ concept })
          } else if (!fullyLoaded) {
            this.loading = true
          }
        } else {
          this.loading = true
        }
      }
    },
    scrollToInternal({ concept } = {}) {
      if (!concept) {
        return
      }
      const conceptList = this.$refs.conceptListItems
      // Get cocoda-vue-tabs-content element
      let container = conceptList && conceptList.$el
      while (container && !container.classList.contains("cocoda-vue-tabs-content")) {
        container = container.parentElement
      }
      if (!conceptList || !container || container.style.display == "none") {
        this.$log.warn("ConceptList: Can't scroll because either conceptList or container are undefined.")
        return
      }
      const unwind = () => {
        this.scrollLater = null
        this.loading = false
      }
      // Find index
      let index = this.items.findIndex(i => this.$jskos.compareFast(i.concept, concept))
      if (index === -1) {
        unwind()
        return
      }
      // Check if concept is already in view
      const containerToCheck = container.getElementsByClassName("conceptListItems")[0]
      const elementToCheck = containerToCheck && containerToCheck.querySelectorAll(`.conceptListItem[data-uri="${concept.uri}"]`)[0]
      if (this.checkInView(containerToCheck, elementToCheck, false)) {
        unwind()
        return
      }
      // Adjust index slightly to leave some space above selected concept after scrolling
      index = Math.min(index, Math.abs(index - 1), Math.abs(index - 2))
      _.delay(() => {
        conceptList.scrollToIndex(index)
        unwind()
      }, 200)
    },
  },
}

</script>

<style lang="less" scoped>
@import "@/style/main.less";

.conceptList {
  height: 100%;
}
.conceptListItems {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow-y: auto;
}
.conceptListItems > *:first-child > *:last-child {
  margin-bottom: 30px;
}
.conceptListItems-noItems {
  margin-top: 5px;
  text-align: center;
}

</style>
