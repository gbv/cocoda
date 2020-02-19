<template>
  <div
    class="conceptList"
    :style="`margin-bottom: ${noItems ? 0 : 30}px;`">
    <!-- Show concepts -->
    <DynamicScroller
      ref="conceptListItems"
      class="conceptListItems"
      :items="items"
      key-field="uri"
      :buffer="0"
      :min-item-size="20"
      style="height: 200px;"
      @scroll="alert('scroll')">
      <template v-slot="{ item, index, active }">
        <DynamicScrollerItem
          :item="item"
          :active="active"
          :size-dependencies="[
            $jskos.prefLabel(item.concept),
            $jskos.notation(item.concept),
            item.depth,
          ]"
          :data-index="index">
          <concept-list-item
            :concept="item.concept"
            :depth="item.depth"
            :is-selected="item.isSelected"
            :index="index"
            :is-left="isLeft"
            :show-children="showChildren"
            :show-scheme="showScheme"
            :buttons="buttons" />
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
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
import LoadingIndicatorFull from "./LoadingIndicatorFull"
import ConceptListItem from "./ConceptListItem"
import _ from "lodash"

// Import mixins
import objects from "../mixins/objects"
import computed from "../mixins/computed"
import mappedStatus from "../mixins/mapped-status"

/**
 * Component that represents a (navigatable) concept list.
 */
export default {
  name: "ConceptList",
  components: {
    LoadingIndicatorFull, ConceptListItem,
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
  data () {
    return {
      loading: false,
      currentSelectedConcept: null,
      shouldScroll: true,
      scrollLater: null,
      oldPreviousConcept: null,
      oldNextConcept: null,
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
      for (let concept of this.concepts.filter(c => c)) {
        let item = {
          concept,
          depth: 0,
          isSelected: this.$jskos.compare(this.conceptSelected, concept),
          uri: concept.uri,
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
    currentMappingRegistry() {
      return this.$store.getters.getCurrentRegistry
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
                if (concept && concept.uri) {
                  this.scrollToUri(concept.uri)
                }
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
    async scrollToUri(uri) {
      let scroll = async () => {
        // Find container element
        let container = this.$refs.conceptListItems.$el
        while (container != null && !container.classList.contains("cocoda-vue-tabs-content")) {
          container = container.parentElement
        }
        let top = -30
        let found = false
        for (let item of this.$refs.conceptListItems.itemsWithSize) {
          if (item.id == uri) {
            found = true
            break
          }
          top += item.size || this.$refs.conceptListItems.minItemSize
        }
        if (found) {
          container.scrollTop = top
        }
      }
      scroll()
      // Scroll again after timeout to compensate for element height changes
      setTimeout(scroll, 20)
    },
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
            uri: (child && child.uri) || `loading-for-${concept.uri}`,
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

.conceptListItems-noItems {
  margin-top: 5px;
  text-align: center;
}

</style>
