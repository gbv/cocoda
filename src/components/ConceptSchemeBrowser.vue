<template>
  <div
    :style="{ flex: flex }"
    class="browser">
    <b-form-select
      v-model="vocSelected"
      :options="vocOptions"
      class="schemeSelect" />
    <concept-search
      :voc="vocSelected ? vocSelected.notation[0] : null"
      @chooseUri="$refs.mainElement1.chooseFromUri($event)" />
    <concept-detail
      ref="mainElement0"
      :item="conceptSelected != null ? conceptSelected : vocSelected"
      :is-scheme="conceptSelected == null"
      :flex="flexes[0]"
      :is-left="isLeft"
      :voc="vocSelected"
      class="main-component"
      data-direction="row"
      @chooseUri="$refs.mainElement1.chooseFromUri($event)" />
    <div
      v-if="conceptSelected != null || vocSelected != null"
      ref="resizeSlider0"
      class="resizeSliderRow"
      @mousedown="startResizing($event, 0, false)" />
    <concept-tree
      ref="mainElement1"
      :voc-selected="vocSelected ? vocSelected : null"
      :flex="flexes[1]"
      class="main-component"
      data-direction="row"
      @selectedConcept="conceptSelected = $event" />
  </div>
</template>

<script>
import ConceptTree from "./ConceptTree"
import ConceptDetail from "./ConceptDetail"
import ConceptSearch from "./ConceptSearch"
var _ = require("lodash")
import * as mixins from "../mixins"

/**
 * Sorts data by German prefLabel with fallback to uri.
 */
function sortData(data) {
  // TODO: - Rethink way of sorting
  return data.sort(
    (a, b) => (a.prefLabel.de && b.prefLabel.de ? a.prefLabel.de > b.prefLabel.de : a.uri > b.uri) ? 1 : -1
  )
}

/**
 * The component for the concept scheme browser. It incorporates selecting a scheme, searching concepts, displaying details for a concept, and browsing concepts in a tree view.
 */
export default {
  name: "ConceptSchemeBrowser",
  components: {
    ConceptTree, ConceptDetail, ConceptSearch
  },
  mixins: [mixins.resizingMixin],
  props: {
    /**
     * The width of the component as a flex value.
     */
    flex: {
      type: Number,
      default: 1
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
      vocSelected: null,
      vocs: [],
      conceptSelected: null,
      flexes: [1.0, 1.5]
    }
  },
  computed: {
    /**
     * Generates the options for the select element.
     */
    vocOptions: function() {
      let options = [
        { value: null, text: "Select a scheme", disabled: true }
      ]
      // Add from vocs
      for (var voc of this.vocs) {
        // TODO: - Check if notation always has a single value (and why is it an array then?).
        // TODO: - Support other languages.
        // TODO: - Fallback if no German label is available.
        options.push(
          { value: voc, text: voc.prefLabel.de }
        )
      }
      return options
    }
  },
  watch: {
    vocSelected(newValue, oldValue) {
      if (oldValue == null && newValue != null) {
        let vm = this
        this.flexes = [1.0, 1.5]
        // Introduce short delay to resetting flex values so that the ConceptDetail component has time to expand to its proper size.
        _.delay(function() {
          vm.resetFlex()
        }, 100)
      }
    },
    conceptSelected: function() {
      this.$emit("selectedConcept", this.conceptSelected)
    }
  },
  mounted: function () {
    // Load vocabularies/schemes
    var vm = this
    this.$api.voc()
      .then(function(data) {
        vm.vocs = sortData(data)
      })
      .catch(function(error) {
        console.log("Request failed", error)
      })
  },
  methods: {},
}

</script>

<style lang="less" scoped>
@import "../style/main.less";

.browser {
  width: 0;
  display: flex;
  flex-direction: column;
}
.schemeSelect {
  flex: none;
  margin: 3px 3px 3px 3px;
  width: 99%;
  border: 0;
  box-shadow: 0 1px 2px 0 hsla(0, 0%, 0%, 0.2);
  background-color: lighten(@color-primary-1, 15%);
  color: @color-primary-4;
  &:extend(.font-heavy);
}
</style>
