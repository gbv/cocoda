<template>
  <div class="browser">
    <b-form-select v-model="vocSelected" :options="vocOptions" class="schemaSelect" />
    <concept-chooser :vocSelected="vocSelected" @selectedConcept="conceptUri = $event" />
    <concept-detail :item="conceptUri != null ? conceptUri : vocSelected" :isSchema="conceptUri == null" />
  </div>
</template>

<script>
import axios from 'axios'
import ConceptChooser from './ConceptChooser'
import ConceptDetail from './ConceptDetail'

export default {
  name: 'Browser',
  components: {
    ConceptChooser, ConceptDetail
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
          { value: voc.notation[0], text: voc.prefLabel.de }
        )
      }
      return options
    }
  },
  mounted: function () {
    // Load vocabularies/schemas
    var vm = this
    // TODO: - Move API calls into its own class.
    axios.get('http://api.dante.gbv.de/voc')
      .then(function (response) {
        // Save data sorted by German prefLabel
        // TODO: - Support other langauges.
        // TODO: - Fallback if no German label is available.
        vm.vocs = response.data.sort( (a,b) => a.prefLabel.de > b.prefLabel.de )
      })
      .catch(function (error) {
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
  margin-bottom: 10px;
}
</style>
