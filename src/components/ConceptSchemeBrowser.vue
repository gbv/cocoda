<template>
  <div class="browser">
    <b-form-select
      v-model="vocSelected"
      :options="vocOptions"
      class="schemaSelect" />
    <concept-search
      :voc="vocSelected ? vocSelected.notation[0] : null"
      @chooseUri="$refs.conceptTree.chooseFromUri($event)" />
    <concept-detail
      :item="conceptSelected != null ? conceptSelected : vocSelected"
      :is-schema="conceptSelected == null"
      class="main-component" />
    <concept-tree
      ref="conceptTree"
      :voc-selected="vocSelected ? vocSelected : null"
      class="main-component"
      @selectedConcept="conceptSelected = $event" />
  </div>
</template>

<script>
import ConceptTree from "./ConceptTree"
import ConceptDetail from "./ConceptDetail"
import ConceptSearch from "./ConceptSearch"

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
  data () {
    return {
      vocSelected: null,
      vocs: [],
      conceptSelected: null
    }
  },
  computed: {
    /**
     * Generates the options for the select element.
     */
    vocOptions: function() {
      let options = [
        { value: null, text: "Select a schema", disabled: true }
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
  mounted: function () {
    // Load vocabularies/schemas
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
  flex: 1;
  display: flex;
  flex-direction: column;
}
.schemaSelect {
  flex: none;
  margin: 3px 3px 3px 3px;
  width: 99%;
  border: 0;
  box-shadow: 0 1px 2px 0 hsla(0, 0%, 0%, 0.2);
}
</style>
