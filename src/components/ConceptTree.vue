<template>
  <div
    class="conceptTree" >
    <!-- Minimizer allows the component to get minimized -->
    <minimizer text="Concept Tree" />
    <!-- Show top concepts -->
    <div
      ref="conceptTreeItems"
      class="conceptTreeItems scrollable" >
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
      currentSelectedConcept: null,
      shouldScroll: true,
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
    conceptSelected: {
      handler() {
        // TODO: Check
        let concept = this.conceptSelected
        if (concept != this.currentSelectedConcept) {
          this.currentSelectedConcept = concept
          this.shouldScroll = true
        }
        if (this.$util.isConcept(concept)) {
          // Load concept's narrower
          if (!concept.narrower || concept.narrower.includes(null)) {
            this.loadNarrower({ object: concept })
          }
          // Check if concept is fully loaded
          if (concept.ancestors && !concept.ancestors.includes(null)) {
            let fullyLoaded = true
            for (let ancestor of concept.ancestors) {
              if (!ancestor.narrower || ancestor.narrower.includes(null)) {
                fullyLoaded = false
              }
            }
            if (fullyLoaded && this.shouldScroll) {
              this.shouldScroll = false
              // Open ancestors
              for (let ancestor of this.conceptSelected.ancestors) {
                this.open(ancestor, this.isLeft, true)
              }
              _.delay(() => {
                // Don't scroll if concept changed in the meantime
                if (this.shouldScroll) return
                let el = document.querySelectorAll(`[data-uri='${concept.uri}']`)[0]
                // Scroll element
                var options = {
                  container: this.$refs.conceptTreeItems,
                  easing: "ease-in",
                  offset: -50,
                  cancelable: true,
                  x: false,
                  y: true
                }
                if (el) this.$scrollTo(el, 200, options)
                this.loading = false
              }, 100)
            } else if (!fullyLoaded) {
              this.loading = true
            }
          } else {
            this.loading = true
          }
        }
      },
      deep: true
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
     * Resets the concept tree and loads top concepts for new vocabulary.
     */
    reset: function() {
      this.tree = []
      this.loading = true
      this.loadTop({ scheme: this.schemeSelected }).then(() => {
        this.tree = _.get(this, "schemeSelected.TOPCONCEPTS", [])
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
