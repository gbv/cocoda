<template>
  <div class="conceptTree">
    <div class="conceptTreeItems">
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
    <div v-if="loading" class="loadingFull">
      <loading-indicator size="lg" />
    </div>
  </div>
</template>

<script>
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
      hovered: null,
      treeHelper: {
        vm: null, // Has to be set to component's "this" before first use
        update: function(concept) {
          // Recursively search for concept by uri and update it
          let path = this.getPath(concept.uri, true)
          if (path != null) {
            let lastIndex = path.pop()
            let element = this.vm.tree
            for (var index of path) {
              element = element[index].narrower
            }
            element[lastIndex] = concept
          } else {
            console.log("Could not determine path for uri", concept.uri)
          }
        },
        loadChildren: function(concept, callback = null) {
          if ( (concept.narrower.length > 0 && !concept.narrower.includes(null)) || concept.narrower.length == 0 ) {
            return
          }
          let treeHelper = this
          this.vm.$api.narrower(concept.uri, this.vm.$api.defaultProperties)
            .then(function(data) {
              let newConcept = concept
              newConcept.narrower = sortData(data)
              treeHelper.update(newConcept)
              callback && callback(true)
            }).catch(function(error) {
              console.log('Request failed', error)
              callback && callback(false)
            })
        },
        getConcept: function(uri) {
          // Recursively search for concept by uri and update it
          let path = this.getPath(uri, true)
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
        getPath: function(uri, recursive = false, path = [], root = this.vm.tree) {
          let shouldReturn = false
          let newPath = path
          root.forEach(function(concept, index) {
            if (!shouldReturn && concept != null && concept.uri == uri) {
              newPath.push(index)
              shouldReturn = true
            }
          })
          if (recursive) {
            let treeHelper = this
            root.forEach(function(concept, index) {
              if (shouldReturn || concept == null || !concept.narrower) {
                return
              }
              let result = treeHelper.getPath(uri, true, newPath.concat([index]), concept.narrower)
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
    }
  },
  methods: {
    chooseFromUri: function(uri) {
      // Load data for uri including all parent concepts
      console.log("Chose via search: ", uri)
      let vm = this
      if (this.loading) {
        // TODO: Cancel request via token
      } else {
        this.loading = true
      }
      // Generate new cancel token
      // TODO
      this.$api.data(uri, this.$api.defaultProperties, null)
        .then(function(data) {
          vm.loading = false
          if (data.length == 0) {
            console.log("Only received one result...")
            vm.selected = null
          } else {
            vm.selected = data[0]
          }
          vm.loading = false
        }).catch(function(error) {
          console.log('Request failed', error)
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
  overflow-y: auto;
  position: relative;
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
