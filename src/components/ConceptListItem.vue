<template>
  <div
    v-if="concept != null"
    :style="`padding-left: ${depth * 10}px`"
    :data-uri="concept.uri"
    class="conceptListItem"
    :class="{
      hovered: isHovered && !isHovered,
      selected: isSelected,
      'concept-mappingsExist': showConceptMappedStatus && mappedStatus,
      'concept-mappingsDoNotExist': showConceptMappedStatus && !mappedStatus
    }"
    @mouseover="hovering(concept)"
    @mouseout="hovering(null)">
    <!-- Concept -->
    <div
      class="conceptBox"
      draggable="true"
      @dragstart="dragStart(concept, $event)"
      @dragend="dragEnd()">
      <div
        v-if="showChildren && hasChildren"
        class="arrowBox"
        @click="openByArrow(!isOpen)">
        <i
          :class="{
            right: !isOpen,
            down: isOpen
          }" />
      </div>
      <span
        v-for="(button, index2) in buttons.filter(b => b.position == 'before')"
        :key="`conceptListItem-buttons-${index2}`"
        v-b-tooltip.hover="{ title: button.tooltip, delay: defaults.delay.medium}"
        class="button fontSize-verySmall conceptListItem-buttonBefore"
        @click="button.onClick($event, concept)">
        <font-awesome-icon :icon="button.icon" />
      </span>
      <div
        :is="url ? 'router-link' : 'div'"
        :to="url"
        :class="{
          labelBoxFull: showChildren && !hasChildren,
          labelBoxSelected: isSelected,
          labelBoxSingle: !showChildren
        }"
        class="labelBox"
        @click.stop.prevent="onClick">
        <span v-if="scheme && showScheme">
          {{ $jskos.notation(scheme) }}
        </span>
        <item-name :item="concept" />
      </div>
      <div
        v-if="canAddToMapping"
        v-b-tooltip.hover="{ title: $t('general.addToMapping'), delay: defaults.delay.medium}"
        class="button addToMapping"
        @click="addConcept()">
        <font-awesome-icon icon="plus-circle" />
      </div>
    </div>
    <!-- Small loading indicator when loading narrower -->
    <loading-indicator
      v-if="showChildren && hasChildren && isOpen && concept.narrower && concept.narrower.includes(null)"
      size="sm"
      style="margin-left: 36px" />
  </div>
</template>

<script>
import LoadingIndicator from "./LoadingIndicator.vue"
import ItemName from "./ItemName.vue"
import _ from "lodash"

// Import mixins
import objects from "@/mixins/cdk.js"
import dragandrop from "@/mixins/dragandrop.js"

import { getItem, loadNarrower } from "@/items"

/**
 * Component that represents one concept item in a ConceptList and possibly its children.
 */
export default {
  name: "ConceptListItem",
  components: {
    LoadingIndicator, ItemName,
  },
  mixins: [objects, dragandrop],
  props: {
    /**
     * Source object containing properties:
     * - concept
     * - depth
     * - isSelected
     */
    source: {
      type: Object,
      default: null,
    },
    /**
     * The index of the current item.
     */
    index: {
      type: Number,
      default: null,
    },
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true,
    },
    /**
     * Whether to show children of concepts, i.e. a concept hierarchy.
     */
    showChildren: {
      type: Boolean,
      default: false,
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
  },
  data () {
    return {
      isHoveredFromHere: false,
      /** Determines whether to show loading indicator for narrower */
      loadingChildren: false,
      /** Prevent double clicks */
      preventClick: false,
      preventClickArrow: false,
      canAddToMapping: false,
      interval: null,
      /** URL of currently hovered concept */
      url: null,
    }
  },
  computed: {
    hasChildren() {
      return  _.get(this.concept, "narrower.length", 1) != 0
    },
    isHovered() {
      return this.isHoveredFromHere
    },
    childrenLoaded() {
      return !this.concept.narrower || !this.concept.narrower.includes(null)
    },
    isOpen() {
      return _.get(this.concept, `__ISOPEN__[${this.isLeft}]`, false)
    },
    scheme() {
      return _.get(this.concept, "inScheme[0]")
    },
    mappedStatus() {
      return this.$store.getters.mappedStatus(this.concept, this.isLeft)
    },
    showConceptMappedStatus() {
      return this.$store.state.settings.settings.components.ConceptListWrapper.loadConceptsMappedStatus
    },
    concept() {
      return getItem(this.source.concept, { relatedItems: true }) || this.source.concept
    },
    depth() {
      return this.source.depth
    },
    isSelected() {
      return this.source.isSelected
    },
    showNotation() {
      return _.get(this.concept, "inScheme[0].DISPLAY.hideNotation") === true && this.prefLabel ? false : true
    },
    notation() {
      return this.getNotation(this.concept, "concept", true)
    },
    prefLabel() {
      let label = this.getPrefLabel(this.concept)
      if (label === "" && this.notation === "") {
        return this.concept.uri
      }
      return label
    },
  },
  created() {
    this.hovering = _.debounce(this._hovering, 20)
  },
  methods: {
    /**
     * Triggers a hovered event.
     */
    _hovering(concept) {
      // Set hovered concept to current concept and element to labelBox
      const element = concept && this.$el.getElementsByClassName("labelBox")?.[0]
      this.$store.commit({
        type: "setHoveredConcept",
        concept,
        element,
      })
      this.isHoveredFromHere = concept != null
      // Set canAddToMapping
      this.canAddToMapping = this.$store.getters["mapping/canAdd"](this.concept, this.$store.state.selected.scheme[this.isLeft], this.isLeft)
      // Check whether mouse is still in element.
      window.clearInterval(this.interval)
      if (concept != null) {
        this.interval = setInterval(() => {
          if (!this.isMouseOver()) {
            this.isHoveredFromHere = false
            window.clearInterval(this.interval)
          }
        }, 500)
      }
      // Set URL to router URL for this concept
      if (concept) {
        this.url = this.getRouterUrl(concept, this.isLeft, true)
      } else {
        this.url = null
      }
    },
    /**
     * Calls open and prevents accidental double clicks.
     */
    openByArrow(isOpen) {
      if (this.preventClickArrow) {
        return
      }
      this.open(this.concept, this.isLeft, isOpen)
      this.loadChildren()
      this.preventClickArrow = true
      _.delay(() => {
        _.delay(() => {
          this.preventClickArrow = false
        }, 200)
      }, 50)
    },
    /**
     * Triggers a selected event.
     */
    select(concept) {
      this.setSelected({ isLeft: this.isLeft, concept })
    },
    /**
     * Deals with a click on a concept.
     *
     * If the concept is not selected, select the concept.
     * If the concept is selected, toggle the open status.
     */
    onClick() {
      if (this.preventClick) {
        return
      }
      if (!this.isSelected) {
        // this.select(this.concept)
      } else if(this.hasChildren) {
        // This section tries to prevent accidental clicks by preventing double clicks when opening/closing a concept's children.
        this.preventClick = true
        _.delay(() => {
          this.open(this.concept, this.isLeft, !this.isOpen)
          _.delay(() => {
            this.preventClick = false
          }, 200)
        }, 50)
      }
    },
    /**
     * Clicked the plus icon to add a concept.
     */
    addConcept() {
      if (!this.isSelected && this.$store.state.settings.settings.components.ConceptListWrapper.addToMappingSelectsConcept) {
        this.select(this.concept)
      }
      this.addToMapping({
        concept: this.concept,
        scheme: this.$store.state.selected.scheme[this.isLeft],
        isLeft: this.isLeft,
      })
    },
    /**
     * Loads the concept's children.
     *
     * Scroll on finish.
     */
    loadChildren() {
      this.loadingChildren = true
      loadNarrower(this.concept).then(() => {
        this.loadingChildren = false
        // Only scroll when concept is open
        if (this.showChildren && this.concept && this.concept.__ISOPEN__ && this.concept.__ISOPEN__[this.isLeft]) {
          this.scrollTo()
        }
      })
    },
    /**
     * Scrolls the concept further to the top.
     */
    scrollTo() {
      // Determine conceptList element because it is the scrolling container
      let parent = this.$el.parentElement
      while (!parent.classList.contains("scrollable")) {
        if (!parent.parentElement) {
          break
        }
        parent = parent.parentElement
      }
      // Scroll element
      const options = {
        container: parent,
        easing: "ease-in",
        offset: -20,
        cancelable: true,
        x: false,
        y: true,
      }
      this.$scrollTo(this.$el, 200, options)
    },
  },
}

</script>

<style lang="less" scoped>
@import "@/style/main.less";
@import "../style/colors.css";

.conceptBox {
  display: flex;
  position: relative;
  min-height: 20px;
  padding-top: 2px;
  padding-bottom: 2px;
  margin-left: 3px;
  cursor: pointer;
  user-select: none;
}
.arrowBox {
  flex: none;
  width: 18px;
  padding-left: 4px;
}
.labelBox {
  flex: 1;
  vertical-align: center;
  padding-right: 20px;
}
.labelBoxSelected {
  padding-right: 16px;
}
.labelBoxFull {
  padding-left: 18px;
}
.labelBoxSingle {
  padding-left: 5px;
}
.labelBox, .labelBox:link, .labelBox:hover, .labelBox:active, .labelBox:visited {
  .text-dark;
}
.addToMapping {
  .fontSize-large;
  position: absolute;
  color: var(--color-background-component);
  top: 50%;
  transform: translateY(-50%);
  right: 8px;
}

.hovered,
.selected.hovered,
.arrowBox:hover,
.conceptListItem:hover {
  background-color: hsl(var(--color-secondary-light));
}

.conceptListItem-buttonBefore {
  padding-top: 2px;
}

/* For arrows, from https://www.w3schools.com/howto/howto_css_arrows.asp */
// TODO: Use font awesome or move somewhere else
.arrowBox > i {
  border: solid var(--color-button);
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 3px;
  margin: 2px 0;
}
.right {
  transform: rotate(-45deg);
  -webkit-transform: rotate(-45deg);
}
.left {
  transform: rotate(135deg);
  -webkit-transform: rotate(135deg);
}
.up {
  transform: rotate(-135deg);
  -webkit-transform: rotate(-135deg);
}
.down {
  transform: rotate(45deg);
  -webkit-transform: rotate(45deg);
}
.conceptListItem-icon {
  margin-right: 2px;
}
</style>
