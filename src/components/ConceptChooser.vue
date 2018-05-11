<template>
  <div>
    <span v-if="concept == null">
      <strong>Top Concepts</strong>
      <ul class="concept" v-show="!loading">
        <li v-for="(d, i) in tops" :key="i">
          <b-link @click="choose(d, 0)">
            <item-name :item="d" />
          </b-link>
        </li>
      </ul>
      <loading-indicator v-show="loading" />
    </span>
    <span v-else>
      <!-- 1. List of parent concepts including link to Top Concepts -->
      <ul class="concept conceptSmall">
        <li>
          <b-link @click="concept = null">Top Concepts</b-link>
        </li>
        <li v-for="(p, i) in parents" :key="i">
          <b-link @click="choose(p, i)">
            <span v-for="j in i + 1" :key="j">•</span>
            <item-name :item="p" />
          </b-link>
        </li>
      </ul>
      <!-- 2. Currently chosen concept and notation -->
      <div>
        <strong><item-name :item="concept" /></strong>
      </div>
      <!-- 3. List of child concepts -->
      <loading-indicator v-show="loading" />
      <ul class="concept conceptSmall">
        <li v-for="(c, i) in children" :key="i">
          <b-link @click="choose(c, depth+1)">
            ↪ <item-name :item="c" />
          </b-link>
        </li>
      </ul>
    </span>
  </div>
</template>

<script>
import axios from 'axios'
import LoadingIndicator from './LoadingIndicator'
import ItemName from './ItemName'
let properties = 'uri,prefLabel,broader,narrower,notation'

// Helper function to sort data. Sort by notation if possible, otherwise by uri.
function sortData(data) {
  return data.sort(
    (a,b) => a.notation && b.notation ? a.notation[0] > b.notation[0] : a.uri > b.uri
  )
}

export default {
  name: 'conceptchooser',
  components: {
    LoadingIndicator,
    ItemName
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
      loading: false,
      cancelToken: axios.CancelToken.source()
    }
  },
  watch: {
    vocSelected: function(newValue, oldValue) {
      if (oldValue != newValue) {
        this.reloadData()
      }
    },
    concept: function(newValue, oldValue) {
      this.$emit('selectedConcept', newValue != null ? newValue.uri : null)
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
            vm.tops = sortData(response.data)
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
      if (this.loading) {
        this.cancelToken.cancel("Request canceled by user action.")
      } else {
        this.loading = true
      }
      if (this.concept.narrower && this.concept.narrower.length == 0) {
        // If the narrower property is explicitly an empty list, don't load child concepts
        this.loading = false
        return
      }
      // Generate new cancel token
      this.cancelToken = axios.CancelToken.source()
      // TODO: - Move API calls into its own class.
      axios.get('http://api.dante.gbv.de/narrower', {
        params: {
          properties: properties,
          uri: this.concept.uri
        },
        cancelToken: this.cancelToken.token
        })
        .then(function(response) {
          vm.children = sortData(response.data)
          vm.loading = false
        }).catch(function(error) {
          console.log('Request failed', error)
          vm.loading = false
        })
    }
  }
}

</script>

<style scoped>
.concept {
  font-size: 1em;
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
.conceptSmall {
  font-size: 0.9em;
}
</style>
