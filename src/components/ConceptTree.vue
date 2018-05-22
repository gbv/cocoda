<template>
  <div class="conceptTree" :class="{ scrollable: !loading }">
    <div class="conceptTreeItems" ref="conceptTreeItems">
      <concept-tree-item
        v-for="(concept, index) in tree"
        :key="index"
        :concept="concept"
        :selected="selected"
        :hovered="hovered"
        :depth="0"
        :index="index"
        :treeHelper="treeHelper"
        @hovered="hovered = $event"
        @selected="selected = $event" />
    </div>
    <div v-show="loading" class="loadingFull" ref="loadingFull">
      <loading-indicator size="lg" />
    </div>
  </div>
</template>

<script>
import LoadingIndicator from './LoadingIndicator'
import ConceptTreeItem from './ConceptTreeItem'
var _ = require('lodash')

// Helper function to sort data. Sort by notation if possible, otherwise by uri.
// TODO: - Rethink way of sorting
function sortData(data) {
  return data.sort(
    (a, b) => (a.notation && b.notation ? a.notation[0] > b.notation[0] : a.uri > b.uri) ? 1 : -1
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
      hovered: null,
      treeHelper: {
        vm: null, // Has to be set to component's "this" before first use
        update: function(concept) {
          // Recursively search for concept by uri and update it
          let path = this.getPath(concept, true)
          if (path != null) {
            let lastIndex = path.pop()
            let element = this.vm.tree
            for (var index of path) {
              element = element[index].narrower
            }
            element[lastIndex] = concept
            return true
          } else {
            console.log("Could not determine path for uri", concept.uri)
            return false
          }
        },
        loadChildren: function(concept, callback = null, update = true) {
          if ( (concept.narrower.length > 0 && !concept.narrower.includes(null)) || concept.narrower.length == 0 ) {
            callback && callback(concept)
            return
          }
          let treeHelper = this
          this.vm.$api.narrower(concept.uri, this.vm.$api.defaultProperties)
            .then(function(data) {
              let newConcept = concept
              newConcept.narrower = sortData(data)
              // Add ancestors to all children
              for (var child of newConcept.narrower) {
                child.ancestors = concept.ancestors.concat([concept])
              }
              if (update) {
                treeHelper.update(newConcept)
              }
              callback && callback(newConcept)
            }).catch(function(error) {
              console.log('Request failed', error)
              callback && callback(null)
            })
        },
        getConcept: function(concept) {
          // Recursively search for concept
          let path = this.getPath(concept, true)
          if (path != null) {
            let lastIndex = path.pop()
            let element = this.vm.tree
            for (var index of path) {
              element = element[index].narrower
            }
            return element[lastIndex]
          } else {
            return null
          }
        },
        getPath: function(concept, recursive = false, path = [], root = this.vm.tree) {
          let useAncestors = false
          if (concept.ancestors.length > 0 && path.length < concept.ancestors.length && !concept.ancestors.includes(null)) {
            useAncestors = true
          }
          if (path.length > 10) {
            return null
          }
          let shouldReturn = false
          let newPath = path
          root.forEach(function(child, index) {
            if (!shouldReturn && child != null && child.uri == concept.uri) {
              newPath.push(index)
              shouldReturn = true
            }
          })
          if (recursive && !shouldReturn) {
            let treeHelper = this
            root.forEach(function(child, index) {
              if (shouldReturn || child == null || !child.narrower) {
                return
              }
              // Restrict recursion to ancestors
              if (useAncestors && concept.ancestors[path.length].uri != child.uri) {
                return
              }
              let result = treeHelper.getPath(concept, true, newPath.concat([index]), child.narrower)
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
        },
        loadAncestors: function(uri, callback = null) {
          let treeHelper = this
          this.vm.$api.ancestors(uri, this.vm.$api.defaultProperties)
            .then(function(data) {
              // Set ancestor property for loaded ancestors
              var ancestors = []
              for (var ancestor of data) {
                ancestor.ancestors = ancestors.slice()
                ancestors.push(ancestor)
              }
              callback && callback(data)
            }).catch(function(error) {
              console.log('Request failed', error)
              callback && callback(null)
            })
        }
      }
    }
  },
  created() {
    this.treeHelper.vm = this
  },
  watch: {
    vocSelected: function(newValue, oldValue) {
      if (oldValue != newValue) {
        this.reset()
      }
    },
    selected: function(newValue, oldValue) {
      this.$emit('selectedConcept', newValue)
    },
    loading: function(newValue, oldValue) {
      // Move loading indicator to right scrolling position in tree
      let loadingFull = this.$refs.loadingFull
      loadingFull.style.top = (this.$el.scrollTop - this.$el.clientTop) + 'px'
    }
  },
  methods: {
    chooseFromUri: function(uri) {
      let vm = this
      this.loading = true
      this.$api.data(uri, this.$api.defaultProperties, null)
        .then(function(data) {
          if (data.length == 0) {
            console.log("##### chooseFromUri ##### No results...")
            vm.selected = null
            vm.loading = false
          } else {
            let currentAncestors = []
            let finalCallback = function() {
              console.log("##### chooseFromUri ##### final callback")
              selected.ancestors = currentAncestors
              vm.loading = false
              for (var ancestor of currentAncestors) {
                ancestor.ISOPEN = true
              }
              // Scroll to selected
              _.delay(function() {
                let el = document.querySelectorAll(`[data-uri='${selected.uri}']`)[0]
                // Scroll element
                var options = {
                  container: vm.$el,
                  easing: 'ease-in',
                  offset: -50,
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
                vm.$scrollTo(el, 200, options)
              }, 100)
            }
            let selected = data[0]
            vm.selected = selected
            // Concept loaded
            console.log("##### chooseFromUri ##### concept loaded")
            // Check if it is already in tree
            let selectedInTree = vm.treeHelper.getConcept(selected)
            if (selectedInTree != null) {
              console.log("##### chooseFromUri ##### concept found in tree!")
              vm.selected = selectedInTree
              currentAncestors = selectedInTree.ancestors
              finalCallback()
              return
            }
            // Load Ancestors
            vm.treeHelper.loadAncestors(uri, function(data) {
              console.log("##### chooseFromUri ##### ancestors loaded")
              selected.ancestors = data.slice()
              let forEachAncestor = function(ancestors, callback = null) {
                if (ancestors.length == 0) {
                  callback && callback()
                  return
                }
                let ancestor = ancestors.shift()
                console.log("##### chooseFromUri ##### deal with ancestor", ancestor.uri)
                // Find in tree
                let ancestorInTree = vm.treeHelper.getConcept(ancestor)
                // Set ancestors
                ancestorInTree.ancestors = currentAncestors.slice()
                // Load children and update
                vm.treeHelper.loadChildren(ancestorInTree, function(ancestor) {
                  console.log("##### chooseFromUri ##### children loaded", ancestor.uri)
                  // Add to ancestors list
                  currentAncestors.push(ancestor)
                  // Continue execution
                  forEachAncestor(ancestors, callback)
                })
              }
              forEachAncestor(data, finalCallback)
            })
          }
        }).catch(function(error) {
          console.log('##### chooseFromUri ##### Load concept request failed', error)
          vm.loading = false
        })
    },
    reset: function() {
      this.tree = []
      this.selected = null
      this.hovered = null
      this.loading = true
      let selectedBefore = this.vocSelected
      let vm = this
      this.$api.topByNotation(this.vocSelected.notation[0])
        .then(function(data) {
          if (selectedBefore != vm.vocSelected) {
            console.log('Another voc was chosen in the meanwhile.')
          } else {
            // Save data sorted by uri
            vm.tree = sortData(data)
            // Top do not have ancestors
            for (var top of vm.tree) {
              top.ancestors = []
            }
            vm.loading = false
          }
        }).catch(function(error) {
          console.log('Request failed', error)
          vm.loading = false
        })
    }
  }
}

</script>

<style scoped>
.conceptTree {
  flex: 1.5;
  position: relative;
  overflow-y: hidden;
}
.scrollable {
  overflow-y: auto;
}
.conceptTreeNotLoading {
  padding: 2px 8px 2px 8px;
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
.conceptTreeItems, .loadingFull {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
.conceptTreeItems {
  padding: 2px 8px 2px 8px;
}
.loadingFull {
  z-index: 100;
  background-color: #ffffff55;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
