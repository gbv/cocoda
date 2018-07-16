<template>
  <div
    class="conceptTree" >
    <!-- Minimizer allows the component to get minimized -->
    <minimizer text="Concept Tree" />
    <!-- Show top concepts -->
    <div
      ref="conceptTreeItems"
      :class="{ scrollable: !loading }"
      class="conceptTreeItems" >
      <concept-tree-item
        v-for="(concept, index) in tree"
        :key="index"
        :concept="concept"
        :depth="0"
        :index="index"
        :is-left="isLeft" />
    </div>
    <div
      v-if="tree.length == 0 && !loading"
      class="fillAndCenter fontWeight-heavy" >
      No Concept Tree Available
    </div>
    <!-- Full screen loading indicator -->
    <loading-indicator-full v-if="loading" />
  </div>
</template>

<script>
import LoadingIndicatorFull from "./LoadingIndicatorFull"
import ConceptTreeItem from "./ConceptTreeItem"
import Minimizer from "./Minimizer"
import _ from "lodash"

/**
 * Component that represents a (navigatable) concept tree.
 */
export default {
  name: "ConceptTree",
  components: {
    LoadingIndicatorFull, ConceptTreeItem, Minimizer
  },
  props: {
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
      loading: false,
      chooseFromUriID: null,
    }
  },
  computed: {
    schemeSelected() {
      return this.selected.scheme[this.isLeft]
    },
    conceptSelected() {
      return this.selected.concept[this.isLeft]
    }
  },
  watch: {
    /**
     * Resets the tree when new vocabulary is chosen.
     */
    schemeSelected: function(newValue, oldValue) {
      if (oldValue != newValue) {
        this.reset()
      }
    },
    conceptSelected() {
      if (this.$util.isConcept(this.conceptSelected)) {
        this.$api.objects.narrower(this.conceptSelected)
      }
    }
  },
  created() {
    // Reset tree if scheme is already chosen
    if (this.schemeSelected) {
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
      this.$api.objects.get(uri, this.schemeSelected.uri).then(concept => {
        if (this.chooseFromUriID != id) return
        if (concept == null) {
          // Show error message for nonexisting concept
          this.$root.alert("Could not load concept. This is likely caused by conversion failure of a mapping.")
          return
        }
        this.setSelected("concept", this.isLeft, concept)
        // 2. Load ancestors
        return this.$api.objects.ancestors(concept)
      }).then(concept => {
        if (this.chooseFromUriID != id) return
        if (concept == null) return
        // 3. Load children for all ancestors
        let promises = [Promise.resolve(concept)]
        for (let ancestor of concept.ancestors) {
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
        for (let ancestor of concept.ancestors) {
          ancestor.ISOPEN = true
        }
        // 5. Scroll to object in tree
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
        this.loading = false
      }).catch(error => {
        console.error("chooseFromUri Error:", error)
        this.loading = false
      })
    },
    /**
     * Resets the concept tree and loads top concepts for new vocabulary.
     */
    reset: function() {
      console.log("ConceptTree: reset", this.isLeft, this.schemeSelected)
      this.tree = []
      this.setSelected("concept", this.isLeft, null)
      this.loading = true
      this.chooseFromUriID = null
      this.$api.objects.top(this.schemeSelected).then(() => {
        this.tree = this.schemeSelected.TOPCONCEPTS
        this.loading = false
      })
    }
  }
}

</script>

<style lang="less" scoped>
@import "../style/main.less";

.conceptTree {
  position: relative;
  overflow-y: hidden;
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
.conceptTreeItems {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
.conceptTreeItems {
  padding: 2px 0px;
}
</style>
