<template>
  <div class="conceptTreeItem" v-if="concept != null" :style="{ 'margin-left': depth * 5 + 'px' }">
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
        @hovered="hovering($event)"
        @selected="select($event)" />
    </div>
    <loading-indicator v-show="loadingChildren" />
  </div>
</template>

<script>
import * as api from './api'
import LoadingIndicator from './LoadingIndicator'
import ItemName from './ItemName'

// Helper function to sort data. Sort by notation if possible, otherwise by uri.
function sortData(data) {
  return data.sort(
    (a,b) => a.notation && b.notation ? a.notation[0] > b.notation[0] : a.uri > b.uri
  )
}

export default {
  name: 'concept-tree-item',
  components: {
    LoadingIndicator, ItemName
  },
  props: ['concept', 'selected', 'hovered', 'depth', 'index'],
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
      return this.concept.isOpen ? true : false
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
    hovering(el) {
      this.$emit('hovered', el)
    },
    update(concept) {
      this.$emit('update', concept)
    },
    open(isOpen) {
      let newConcept = this.concept
      newConcept.isOpen = isOpen
      this.update(newConcept)
      this.loadChildren()
      if (isOpen && this.childrenLoaded && this.hasChildren) {
        this.scrollTo()
      }
    },
    select(concept) {
      this.$emit('selected', concept)
    },
    onClick() {
      if (!this.isSelected) {
        this.select(this.concept)
      } else {
        this.open(!this.isOpen)
      }
    },
    loadChildren() {
      if (!this.hasChildren || this.childrenLoaded) {
        return
      }
      let children = []
      let vm = this
      if (this.loadingChildren) {
        // Possibly cancel token
      } else {
        this.loadingChildren = true
      }
      // Generate new cancel token
      // this.cancelTokenChildren = axios.CancelToken.source()
      api.narrower(this.concept.uri, api.defaultProperties)
        .then(function(data) {
          vm.loadingChildren = false
          let newConcept = vm.concept
          let children = sortData(data)
          for (var i = 0; i < children.length; i++) {
            children[i].isOpen = false
          }
          newConcept.narrower = children
          vm.update(newConcept)
          vm.scrollTo()
        }).catch(function(error) {
          console.log('Request failed', error)
          vm.loadingChildren = false
        })
    },
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
