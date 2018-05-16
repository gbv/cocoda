<template>
  <div class="browser">
    <b-form-select v-model="vocSelected" :options="vocOptions" class="schemaSelect" />
    <search-field :voc="vocSelected ? vocSelected.notation[0] : null" @chooseUri="$refs.conceptChooser.chooseFromUri($event)" />
    <concept-chooser ref="conceptChooser" :vocSelected="vocSelected ? vocSelected : null" @selectedConcept="conceptUri = $event" />
    <concept-detail :item="conceptUri != null ? conceptUri : (vocSelected ? vocSelected.uri : null)" :isSchema="conceptUri == null" />
  </div>
</template>

<script>
import * as api from './api'
import ConceptChooser from './ConceptChooser'
import ConceptDetail from './ConceptDetail'
import SearchField from './SearchField'

export default {
  name: 'Browser',
  components: {
    ConceptChooser, ConceptDetail, SearchField
  },
  data () {
    return {
      vocSelected: null,
      vocs: [],
      conceptUri: null
    }
  },
  methods: {},
  computed: {
    vocOptions: function() {
      let options = [
        { value: null, text: 'Select a schema', disabled: true }
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
    api.voc()
      .then(function(data) {
        // Save data sorted by German prefLabel
        // TODO: - Support other langauges.
        // TODO: - Fallback if no German label is available.
        vm.vocs = data.sort( (a,b) => a.prefLabel.de > b.prefLabel.de )
      })
      .catch(function(error) {
        console.log('Request failed', error)
      })
  }
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
  padding: 2px 8px 2px 8px;
  outline: 1px solid #ccc;
}
</style>
