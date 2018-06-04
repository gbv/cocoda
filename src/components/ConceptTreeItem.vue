<template>
  <div
    v-if="concept != null"
    :style="{ 'margin-left': depth * 5 + 'px' }"
    :data-uri="concept.uri"
    class="conceptTreeItem">
    <div
      :class="{
        conceptBoxHovered: isHovered,
        conceptBoxSelected: isSelected
      }"
      class="conceptBox">
      <div
        v-if="hasChildren"
        class="arrowBox"
        @click="openByArrow(!isOpen)">
        <i
          :class="{
            right: !isOpen,
            down: isOpen,
            selected: isSelected
        }"/>
      </div>
      <div
        :class="{ labelBoxFull: !hasChildren, labelBoxSelected: isSelected }"
        class="labelBox"
        @mouseover="hovering(concept)"
        @mouseout="hovering(null)"
        @click="onClick">
        <item-name :item="concept" />
      </div>
      <div
        v-b-tooltip.hover="'add to mapping'"
        v-show="mapping.canAdd(concept, scheme, isLeft)"
        class="addToMapping"
        @click="mapping.add(concept, scheme, isLeft)"
        @mouseover="hovering(concept)"
        @mouseout="hovering(null)">+</div>
    </div>
    <div
      v-if="isOpen"
      class="conceptChildrenBox">
      <concept-tree-item
        v-for="(child, index) in concept.narrower"
        :key="index"
        :concept="child"
        :selected="selected"
        :hovered="hovered"
        :depth="depth + 1"
        :index="index"
        :tree-helper="treeHelper"
        :is-left="isLeft"
        :scheme="scheme"
        @hovered="hovering($event)"
        @selected="select($event)" />
    </div>
    <loading-indicator
      v-show="loadingChildren"
      size="sm"
      style="margin-left: 36px" />
  </div>
</template>

<script>
import LoadingIndicator from "./LoadingIndicator"
import ItemName from "./ItemName"
var _ = require("lodash")

/**
 * Component that represents one concept item in a ConceptTree and possibly its children.
 */
export default {
  name: "ConceptTreeItem",
  components: {
    LoadingIndicator, ItemName
  },
  props: {
    /**
     * The concept object that this tree item represents.
     */
    concept: {
      type: Object,
      default: null
    },
    /**
     * The currently selected concept.
     */
    selected: {
      type: Object,
      default: null
    },
    /**
     * The currently hovered concept.
     */
    hovered: {
      type: Object,
      default: null
    },
    /**
     * The depth of the current item.
     */
    depth: {
      type: Number,
      default: null
    },
    /**
     * The index of the current item.
     */
    index: {
      type: Number,
      default: null
    },
    /**
     * A reference to ConceptTree's treeHelper object.
     */
    treeHelper: {
      type: Object,
      default: null
    },
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true
    },
    /**
     * The currently selected scheme as an object.
     */
    scheme: {
      type: Object,
      default: null
    }
  },
  data () {
    return {
      loadingChildren: false,
      preventClick: false,
      preventClickArrow: false,
      mapping: this.$root.$data.mapping
    }
  },
  computed: {
    hasChildren() {
      return !this.concept.narrower || this.concept.narrower.length != 0
    },
    isOpen() {
      return this.concept.ISOPEN ? true : false
    },
    isHovered() {
      return this.hovered != null ? this.hovered.uri == this.concept.uri : false
    },
    isSelected() {
      return this.selected != null ? this.selected.uri == this.concept.uri : false
    },
    childrenLoaded() {
      return !this.concept.narrower || !this.concept.narrower.includes(null)
    }
  },
  watch: {},
  methods: {
    /**
     * Triggers a hovered event.
     */
    hovering(el) {
      /**
       * Event that is triggered when concept is hovered over.
       *
       * @event hovered
       * @type {object} - concept object that is hovered over
       */
      this.$emit("hovered", el)
    },
    /**
     * Sets the ISOPEN property of the concept, loads it's children and scrolls the concept further to the top.
     *
     * @param {boolean} isOpen - open status to be set to
     */
    open(isOpen) {
      let newConcept = this.concept
      newConcept.ISOPEN = isOpen
      this.treeHelper.update(newConcept)
      if (isOpen && this.childrenLoaded && this.hasChildren) {
        this.scrollTo()
      } else {
        this.loadChildren()
      }
    },
    /**
     * Calls open and prevents accidental double clicks.
     */
    openByArrow(isOpen) {
      if (this.preventClickArrow) {
        return
      }
      this.preventClickArrow = true
      let vm = this
      _.delay(function() {
        vm.open(isOpen)
        _.delay(function() {
          vm.preventClickArrow = false
        }, 200)
      }, 50)
    },
    /**
     * Triggers a selected event.
     */
    select(concept) {
      /**
       * Event that is triggered when concept is selected.
       *
       * @event selected
       * @type {object} - concept object that is selected
       */
      this.$emit("selected", concept)
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
        this.select(this.concept)
      } else if(this.hasChildren) {
        // This section tries to prevent accidental clicks by preventing double clicks when opening/closing a concept's children.
        this.preventClick = true
        let vm = this
        _.delay(function() {
          vm.open(!vm.isOpen)
          _.delay(function() {
            vm.preventClick = false
          }, 200)
        }, 50)
      }
    },
    /**
     * Loads the concept's children (via treeHelper).
     *
     * Scroll on finish.
     */
    loadChildren() {
      this.loadingChildren = true
      let vm = this
      this.treeHelper.loadChildren(this.concept, function(success) {
        vm.loadingChildren = false
        // Only scroll when concept is open
        if (vm.concept.ISOPEN && success) {
          vm.scrollTo()
        }
      })
    },
    /**
     * Scrolls the concept further to the top.
     */
    scrollTo() {
      // Determine conceptTree element because it is the scrolling container
      let parent = this.$parent
      while (!parent.$el.classList.contains("conceptTree")) {
        parent = parent.$parent
      }
      // Scroll element
      var options = {
        container: parent.$el,
        easing: "ease-in",
        offset: -20,
        cancelable: true,
        x: false,
        y: true
      }
      this.$scrollTo(this.$el, 200, options)
    }
  }
}

</script>

<style lang="less" scoped>
@import "../style/main.less";

.conceptBox {
  display: flex;
  position: relative;
  min-height: 24px;
  margin: 3px;
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
  padding-right: 12px;
}
.labelBoxSelected {
  padding-right: 4px;
}
.labelBoxFull {
  padding-left: 18px;
}
.addToMapping {
  position: absolute;
  color: white;
  top: -2px;
  right: 5px;
  font-size: 1.2em;
  font-weight: 700;
  opacity: 0.7;
  &:hover {
    color: @color-secondary-2-0;
    opacity: 1.0;
  }
}
.conceptBoxSelected {
  &:extend(.font-heavy);
  background-color: @color-primary-4;
  color: lighten(@color-primary-1, 10%);
  & .arrowBox:hover {
    background-color: @color-primary-3;
  }
}
.conceptBoxHovered, .arrowBox:hover {
  background-color: @color-primary-1;
  color: @color-primary-4;
}
.conceptBoxHovered.conceptBoxSelected {
  background-color: @color-primary-3;
  color: lighten(@color-primary-1, 10%);
}
/* For arrows, from https://www.w3schools.com/howto/howto_css_arrows.asp */
i {
  border: solid black;
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 3px;
  margin: 2px 0;
}
i.selected {
  border: solid @color-primary-1;
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 3px;
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
</style>
