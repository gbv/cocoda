<template>
  <div>
    <span v-if="concept == null">
      <strong>Top Concepts</strong>
      <ul v-show="!loading">
        <li v-for="(d, i) in tops" :key="i">
          <b-button variant="link" @click="choose(d, 0)">{{ d.prefLabel.de }}</b-button>
        </li>
      </ul>
      <loading-indicator v-show="loading" />
    </span>
    <span v-else>
      <!-- 1. List of parent concepts including link to Top Concepts -->
      <ul>
        <li>
          <b-button variant="link" size="sm" @click="concept = null">Top Concepts</b-button>
        </li>
        <li v-for="(p, i) in parents" :key="i">
          <b-button variant="link" size="sm" @click="choose(p, i)">{{ p.prefLabel.de }}</b-button>
        </li>
      </ul>
      <!-- 2. Currently chosen concept and notation -->
      <b-badge>{{ concept.notation ? concept.notation[0] : '?' }}</b-badge> <strong>{{ concept.prefLabel.de }}</strong>
      <!-- 3. List of child concepts -->
      <loading-indicator v-show="loading" />
      <ul>
        <li v-for="(c, i) in children" :key="i">
          <b-button variant="link" size="sm" @click="choose(c, depth+1)">{{ c.prefLabel.de }}</b-button>
        </li>
      </ul>
    </span>
  </div>
</template>

<script>
import axios from 'axios'
import LoadingIndicator from './LoadingIndicator'
let properties = 'uri,prefLabel,broader,narrower,notation'

export default {
  name: 'conceptchooser',
  components: {
    LoadingIndicator
  },
  props: ['vocSelected'],
  data () {
    return {
      tops: [],
      selectedBefore: '',
      concept: null,
      depth: 0,
      parents: [],
      children: [],
      loading: false
    }
  },
  watch: {
    vocSelected: function(newValue, oldValue) {
      if (oldValue != newValue) {
        this.reloadData()
      }
    }
  },
  methods: {
    choose: function(chosen, depth) {
      if (depth == this.depth + 1) {
        // Add current concept to parents
        this.parents.push(this.concept)
      } else if (depth < this.depth) {
        // Remove parents from array
        this.parents.splice(depth)
      }
      this.concept = chosen
      this.depth = depth
      // Load children
      this.loadChildren()
    },
    reloadData: function() {
      this.tops = []
      this.concept = null
      let selectedBefore = this.vocSelected
      let vm = this
      this.loading = true
      // TODO: - Move API calls into its own class.
      axios.get('http://api.dante.gbv.de/voc/'+this.vocSelected+'/top', {
        params: {
          properties: properties
        }
        })
        .then(function(response) {
          if (selectedBefore != vm.vocSelected) {
            console.log('Another voc was chosen in the meanwhile.')
          } else {
            // Save data sorted by uri
            vm.tops = response.data.sort( (a,b) => a.uri > b.uri )
            vm.loading = false
          }
        }).catch(function(error) {
          console.log('Request failed', error)
          vm.loading = false
        })
    },
    loadChildren: function() {
      this.children = []
      let vm = this
      this.loading = true
      // TODO: - Move API calls into its own class.
      axios.get('http://api.dante.gbv.de/narrower', {
        params: {
          properties: properties,
          uri: this.concept.uri
        }
        })
        .then(function(response) {
          vm.children = response.data
          vm.loading = false
        }).catch(function(error) {
          console.log('Request failed', error)
          vm.loading = false
        })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
ul {
  list-style-type: none;
  padding: 0;
  margin-bottom: 10px;
  margin-top: 6px;
}
li {
  margin-left: 5px;
  margin-top: 0px;
  margin-bottom: -5px;
}
</style>
