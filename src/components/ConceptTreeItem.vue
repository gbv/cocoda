<template>
  <div
    v-if="concept != null"
    :style="depth == 0 ? 'margin-left: 0px' : ''"
    :data-uri="concept.uri"
    class="conceptTreeItem" >
    <!-- Concept -->
    <div
      :class="{
        conceptBoxHovered: isHovered,
        conceptBoxSelected: isSelected,
        'fontWeight-heavy': isSelected
      }"
      class="conceptBox" >
      <div
        v-if="hasChildren"
        class="arrowBox"
        @click="openByArrow(!concept.ISOPEN[isLeft])" >
        <i
          :class="{
            right: !concept.ISOPEN[isLeft],
            down: concept.ISOPEN[isLeft],
            selected: isSelected
        }" />
      </div>
      <div
        :class="{ labelBoxFull: !hasChildren, labelBoxSelected: isSelected }"
        class="labelBox"
        @mouseover="hovering(concept)"
        @mouseout="hovering(null)"
        @click="onClick" >
        <item-name
          :item="concept"
          :is-highlighted="isSelected" />
      </div>
      <div
        v-b-tooltip.hover="{ title: 'add to mapping', delay: $util.delay.medium}"
        v-show="$store.getters['mapping/canAdd'](concept, selected.scheme[isLeft], isLeft)"
        class="addToMapping fontSize-large"
        @click="$store.commit({
          type: 'mapping/add',
          concept,
          scheme: selected.scheme[isLeft],
          isLeft
        })"
        @mouseover="hovering(concept)"
        @mouseout="hovering(null)" >
        <font-awesome-icon icon="plus-circle" />
      </div>
    </div>
    <!-- Concept's narrower if opened -->
    <div
      v-if="concept.ISOPEN[isLeft]"
      class="conceptChildrenBox" >
      <concept-tree-item
        v-for="(child, index) in concept.narrower"
        :key="index"
        :concept="child"
        :depth="depth + 1"
        :index="index"
        :is-left="isLeft"
        @selected="select($event)" />
    </div>
    <!-- Small loading indicator when loading narrower -->
    <loading-indicator
      v-show="hasChildren && concept.ISOPEN[isLeft] && concept.narrower.includes(null)"
      size="sm"
      style="margin-left: 36px" />
  </div>
</template>

<script>
import LoadingIndicator from "./LoadingIndicator"
import ItemName from "./ItemName"
import _ from "lodash"

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
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      /** Determines whether to show loading indicator for narrower */
      loadingChildren: false,
      /** Prevent double clicks */
      preventClick: false,
      preventClickArrow: false,
    }
  },
  computed: {
    hasChildren() {
      return  _.get(this.concept, "narrower.length", 1) != 0
    },
    isHovered() {
      return this.$jskos.compare(this.hoveredConcept, this.concept)
    },
    isSelected() {
      return this.$jskos.compare(this.selected.concept[this.isLeft], this.concept)
    },
    childrenLoaded() {
      return !this.concept.narrower || !this.concept.narrower.includes(null)
    }
  },
  methods: {
    /**
     * Triggers a hovered event.
     */
    hovering(concept) {
      this.hoveredConcept = concept
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
      this.setSelected("concept", this.isLeft, concept)
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
        _.delay(() => {
          this.open(this.concept, this.isLeft, !this.concept.ISOPEN[this.isLeft])
          _.delay(() => {
            this.preventClick = false
          }, 200)
        }, 50)
      }
    },
    /**
     * Loads the concept's children.
     *
     * Scroll on finish.
     */
    loadChildren() {
      this.loadingChildren = true
      this.loadNarrower({ object: this.concept }).then(concept => {
        this.loadingChildren = false
        // Only scroll when concept is open
        if (concept.ISOPEN[this.isLeft]) {
          this.scrollTo()
        }
      })
    },
    /**
     * Scrolls the concept further to the top.
     */
    scrollTo() {
      // Determine conceptTree element because it is the scrolling container
      let parent = this.$el.parentElement
      while (!parent.classList.contains("scrollable")) {
        parent = parent.parentElement
      }
      // Scroll element
      var options = {
        container: parent,
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

.conceptTreeItem {
  margin-left: 10px;
}
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
  color: @color--conceptTreeItem-addToMapping;
  top: -1px;
  right: 5px;
  opacity: 0.7;
}
.addToMapping:hover {
  color: @color--conceptTreeItem-addToMapping-hover;
  opacity: 1.0;
}
.conceptBoxSelected {
  color: @color--conceptTreeItem-item-selected;
  background-color: @color--conceptTreeItem-item-selected-background;
}
.conceptBoxSelected .arrowBox:hover {
  background-color: @color--conceptTreeItem-item-hover-background;
}
.conceptBoxHovered, .arrowBox:hover {
  background-color: @color--conceptTreeItem-item-hover-background;
  color: @color--conceptTreeItem-item-hover;
}
.conceptBoxHovered.conceptBoxSelected {
  background-color: @color--conceptTreeItem-item-hover-background;
  color: @color--conceptTreeItem-item-selected;
}
/* For arrows, from https://www.w3schools.com/howto/howto_css_arrows.asp */
// TODO: Use font awesome or move somewhere else
i {
  border: solid black;
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 3px;
  margin: 2px 0;
}
i.selected {
  border: solid @color-primary-4;
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
