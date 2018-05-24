<template>
  <div class="browser">
    <b-form-select
      v-model="vocSelected"
      :options="vocOptions"
      class="schemaSelect" />
    <search-field
      :voc="vocSelected ? vocSelected.notation[0] : null"
      @chooseUri="$refs.conceptTree.chooseFromUri($event)" />
    <concept-detail
      :item="conceptSelected != null ? conceptSelected : vocSelected"
      :is-schema="conceptSelected == null" />
    <concept-tree
      ref="conceptTree"
      :voc-selected="vocSelected ? vocSelected : null"
      @selectedConcept="conceptSelected = $event" />
  </div>
</template>

<script>
import ConceptTree from "./ConceptTree"
import ConceptDetail from "./ConceptDetail"
import SearchField from "./SearchField"

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
 * The component for the concept browser (usually one on the left and one on the right).
 */
export default {
  name: "Browser",
  components: {
    ConceptTree, ConceptDetail, SearchField
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

<style scoped>
.browser {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.schemaSelect {
  flex: none;
  margin-bottom: 5px;
}
.browser > div {
  outline: 1px solid #ccc;
}
</style>
