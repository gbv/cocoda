<template>
  <div class="conceptTreeItem" v-if="concept != null" :style="{ 'margin-left': depth * 5 + 'px' }" :data-uri="concept.uri">
    <div
      class="conceptBox"
      :class="{
        conceptBoxHovered: isHovered,
        conceptBoxSelected: isSelected
      }">
      <div class="arrowBox" @click="open(!isOpen)" v-if="hasChildren"><i :class="{ right: !isOpen, down: isOpen }"></i></div>
      <div
        class="labelBox"
        @mouseover="hovering(concept)"
        @mouseout="hovering(null)"
        @click="onClick"
        :class="{ labelBoxFull: !hasChildren }">
        <item-name :item="concept" />
      </div>
    </div>
    <div class="conceptChildrenBox" v-if="isOpen">
      <concept-tree-item
        v-for="(child, index) in concept.narrower"
        :key="index"
        :concept="child"
        :selected="selected"
        :hovered="hovered"
        :depth="depth + 1"
        :index="index"
        :treeHelper="treeHelper"
        @hovered="hovering($event)"
        @selected="select($event)" />
    </div>
    <loading-indicator v-show="loadingChildren" size="sm" style="margin-left: 36px" />
  </div>
</template>

<script>
import LoadingIndicator from './LoadingIndicator'
import ItemName from './ItemName'

/**
 * Component that represents one concept item in a ConceptTree and possibly its children.
 */
export default {
  name: 'concept-tree-item',
  components: {
    LoadingIndicator, ItemName
  },
  props: ['concept', 'selected', 'hovered', 'depth', 'index', 'treeHelper'],
  data () {
    return {
      loadingChildren: false
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
      this.$emit('hovered', el)
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
     * Triggers a selected event.
     */
    select(concept) {
      /**
       * Event that is triggered when concept is selected.
       *
       * @event selected
       * @type {object} - concept object that is selected
       */
      this.$emit('selected', concept)
    },
    /**
     * Deals with a click on a concept.
     *
     * If the concept is not selected, select the concept.
     * If the concept is selected, toggle the open status.
     */
    onClick() {
      if (!this.isSelected) {
        this.select(this.concept)
      } else {
        this.open(!this.isOpen)
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
        if (vm.concept.ISOPEN) {
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
      while (!parent.$el.classList.contains('conceptTree')) {
        parent = parent.$parent
      }
      // Scroll element
      var options = {
        container: parent.$el,
        easing: 'ease-in',
        offset: -20,
        cancelable: true,
        onStart: function(element) {
          // scrolling started
        },
        onDone: function(element) {
          // scrolling is done
        },
        onCancel: function() {
          // scrolling has been interrupted
        },
        x: false,
        y: true
      }
      this.$scrollTo(this.$el, 200, options)
    }
  }
}

</script>

<style scoped>
.conceptBox {
  display: flex;
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
}
.labelBoxFull {
  padding-left: 18px;
}
.conceptBoxHovered, .arrowBox:hover {
  background-color: bisque;
}
.conceptBoxSelected {
  font-weight: bold;
}
/* For arrows, from https://www.w3schools.com/howto/howto_css_arrows.asp */
i {
  border: solid black;
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
