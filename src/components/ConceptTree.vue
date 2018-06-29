<template>
  <div
    class="conceptTree" >
    <minimizer text="Concept Tree" />
    <div
      ref="conceptTreeItems"
      :class="{ scrollable: !loading }"
      class="conceptTreeItems">
      <concept-tree-item
        v-for="(concept, index) in tree"
        :key="index"
        :concept="concept"
        :selected="selected"
        :depth="0"
        :index="index"
        :is-left="isLeft"
        :scheme="vocSelected"
        @selected="selected = $event" />
    </div>
    <div
      v-if="tree.length == 0 && !loading"
      class="loadingFull font-heavy">
      No Concept Tree Available
    </div>
    <div
      v-show="loading"
      ref="loadingFull"
      class="loadingFull">
      <loading-indicator size="lg" />
    </div>
  </div>
</template>

<script>
import LoadingIndicator from "./LoadingIndicator"
import ConceptTreeItem from "./ConceptTreeItem"
import Minimizer from "./Minimizer"
var _ = require("lodash")

/**
 * Component that represents a (navigatable) concept tree.
 */
export default {
  name: "ConceptTree",
  components: {
    LoadingIndicator, ConceptTreeItem, Minimizer
  },
  props: {
    /**
     * The currently selected scheme as an object.
     */
    vocSelected: {
      type: Object,
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
      tree: [],
      selected: null,
      loading: false,
      chooseFromUriID: null,
    }
  },
  watch: {
    /**
     * Resets the tree when new vocabulary is chosen.
     */
    vocSelected: function(newValue, oldValue) {
      if (oldValue != newValue) {
        this.reset()
      }
    },
    selected: function(newValue) {
      /**
       * Event when a concept is selected.
       *
       * @event selectedConcept
       * @type {object}
       */
      this.$emit("selectedConcept", newValue)
      // Load children for selected if it is a concept
      if (this.$util.isConcept(this.selected)) {
        this.$api.objects.narrower(this.selected)
      }
    }
  },
  created() {
    // Reset tree if scheme is already chosen
    if (this.vocSelected) {
      this.reset()
    }
  },
  methods: {
    /**
     * Select a concept from uri (e.g. for search).
     *
     * @param {string} uri - uri of concept to be loaded
     */
    chooseFromUri: function(uri) {
      // Assign a unique ID to this request to be checked later
      let id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      this.chooseFromUriID = id
      this.loading = true

      // 1. Get concept object
      console.log("chooseFromUri: 1. Get concept object")
      this.$api.objects.get(uri, this.vocSelected.uri).then(concept => {
        if (this.chooseFromUriID != id) return
        if (concept == null) {
          // Show error message for nonexisting concept
          this.$root.alert("Could not load concept. This is likely caused by conversion failure of a mapping.")
          return
        }
        this.selected = concept
        // 2. Load ancestors
        console.log("chooseFromUri: 2. Load ancestors", concept)
        return this.$api.objects.ancestors(concept)
      }).then(concept => {
        if (this.chooseFromUriID != id) return
        if (concept == null) return
        // 3. Load children for all ancestors
        console.log("chooseFromUri: 3. Load children for all ancestors")
        let promises = [Promise.resolve(concept)]
        for (let ancestor of concept.ancestors) {
          console.log("chooseFromUri: 3.1. Load children", ancestor)
          promises.push(this.$api.objects.narrower(ancestor))
        }
        // 3.2 If children were loaded before ancestors, then the children's ancestors property is set to [null]
        if (concept.narrower && !concept.narrower.includes(null)) {
          for (let child of concept.narrower) {
            child.ancestors = concept.ancestors.concat([concept])
          }
        }
        return Promise.all(promises)
      }).then(result => {
        if (this.chooseFromUriID != id) return
        if (result == null) return
        let concept = result[0]
        // 4. Set all ancestors to open
        console.log("chooseFromUri: 4. Set all ancestors to open")
        for (let ancestor of concept.ancestors) {
          ancestor.ISOPEN = true
        }
        // 5. Scroll to object in tree
        console.log("chooseFromUri: 5. Scroll to object in tree")
        let vm = this
        _.delay(function() {
          if (vm.chooseFromUriID != id) return
          let el = document.querySelectorAll(`[data-uri='${concept.uri}']`)[0]
          // Scroll element
          var options = {
            container: vm.$refs.conceptTreeItems,
            easing: "ease-in",
            offset: -50,
            cancelable: true,
            x: false,
            y: true
          }
          if (el) vm.$scrollTo(el, 200, options)
        }, 100)
      }).then(() => {
        console.log("chooseFromUri finished")
        this.loading = false
      }).catch(error => {
        console.log("chooseFromUri Error:", error)
        this.loading = false
      })
    },
    /**
     * Resets the concept tree and loads top concepts for new vocabulary.
     */
    reset: function() {
      this.tree = []
      this.selected = null
      this.loading = true
      this.chooseFromUriID = null
      this.$api.objects.top(this.vocSelected).then(() => {
        this.tree = this.vocSelected.TOPCONCEPTS
        this.loading = false
      })
    }
  }
}

</script>

<style scoped>
.conceptTree {
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
.conceptTreeItems, .loadingFull {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
.conceptTreeItems {
  padding: 2px 0px;
}
.loadingFull {
  z-index: 100;
  background-color: #ffffff55;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
