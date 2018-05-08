<template>
  <b-col cols="3">
    <b-form-select v-model="vocSelected" :options="vocOptions" class="mb-3" />
    Top Concepts:
    <ul>
      <li v-for="(d, i) in data" :key="i">{{ d.prefLabel.de }}</li>
    </ul>
  </b-col>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Browser',
  data () {
    return {
      vocSelected: null,
      vocs: [],
      data: []
    }
  },
  watch: {
    vocSelected: function(oldValue, newValue) {
      this.reloadBrowser()
    }
  },
  methods: {
    reloadBrowser: function() {
      this.data = []
      let selectedBefore = this.vocSelected
      let vm = this
      // TODO: - Move API calls into its own class.
      axios.get('http://api.dante.gbv.de/voc/'+this.vocSelected+'/top')
        .then(function(response) {
          if (selectedBefore != vm.vocSelected) {
            console.log('Another voc was chosen in the meanwhile.')
          } else {
            // Save data sorted by uri
            vm.data = response.data.sort( (a,b) => a.uri > b.uri )
          }
        }).catch(function(error) {
          console.log('Request failed', error)
        })
    }
  },
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

</style>
