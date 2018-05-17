<template>
  <div class="conceptTree">
    <concept-tree-item
      v-for="(concept, index) in tree"
      :key="index"
      :concept="concept"
      :selected="selected"
      :hovered="hovered"
      :depth="0"
      :index="index"
      @hovered="hovered = $event"
      @selected="selected = $event"
      @update="update($event)" />
  </div>
</template>

<script>
import * as api from './api'
import LoadingIndicator from './LoadingIndicator'
import ConceptTreeItem from './ConceptTreeItem'

// Helper function to sort data. Sort by notation if possible, otherwise by uri.
function sortData(data) {
  return data.sort(
    (a,b) => a.notation && b.notation ? a.notation[0] > b.notation[0] : a.uri > b.uri
  )
}

export default {
  name: 'concepttree',
  components: {
    LoadingIndicator, ConceptTreeItem
  },
  props: ['vocSelected'],
  data () {
    return {
      tree: [],
      selected: null,
      loading: false,
      hovered: null
    }
  },
  watch: {
    vocSelected: function(newValue, oldValue) {
      if (oldValue != newValue) {
        this.reset()
      }
    },
    selected: function(newValue, oldValue) {
      this.$emit('selectedConcept', newValue)
    }
  },
  methods: {
    chooseFromUri: function(uri) {
      // ...
    },
    reset: function() {
      this.tree = []
      this.selected = null
      this.hovered = null
      this.loading = true
      let selectedBefore = this.vocSelected
      let vm = this
      api.topByNotation(this.vocSelected.notation[0])
        .then(function(data) {
          if (selectedBefore != vm.vocSelected) {
            console.log('Another voc was chosen in the meanwhile.')
          } else {
            // Save data sorted by uri
            let tree = sortData(data)
            for (var i = 0; i < tree.length; i++) {
              tree[i].isOpen = false
            }
            vm.tree = tree
            vm.loading = false
          }
        }).catch(function(error) {
          console.log('Request failed', error)
          vm.loading = false
        })
    },
    update(concept) {
      // Recursively search for concept by uri and update it
      let path = this.tree.pathForUri(concept.uri, true)
      if (path != null) {
        let lastIndex = path.pop()
        let element = this.tree
        for (var index of path) {
          element = element[index].narrower
        }
        element[index] = concept
      } else {
        console.log("Could not determine path for uri", concept.uri)
      }
    }
  }
}

// Add a prototype method to Array to find path for uri
Array.prototype.pathForUri = function(uri, recursive = false, path = []) {
  let shouldReturn = false
  let newPath = path
  this.forEach(function(concept, index) {
    if (!shouldReturn && concept != null && concept.uri == uri) {
      newPath.push(index)
      shouldReturn = true
    }
  })
  if (recursive) {
    this.forEach(function(concept, index) {
      if (shouldReturn || concept == null || !concept.narrower) {
        return
      }
      let result = concept.narrower.pathForUri(uri, true, newPath.concat([index]))
      if (result != null) {
        newPath = result
        shouldReturn = true
      }
    })
  }
  if (shouldReturn) {
    return newPath
  } else {
    return null
  }
}

</script>

<style scoped>
.conceptTree {
  flex: 1.5;
  overflow-y: auto;
}
.concept {
  font-size: 1em;
  list-style-type: none;
  padding: 0;
  margin-bottom: 10px;
  margin-top: 10px;
  line-height: 1.2;
}
.concept > li {
  margin-left: 20px;
  margin-top: 10px;
  margin-bottom: 5px;
}
.conceptSmall {
  font-size: 0.9em;
}
</style>
