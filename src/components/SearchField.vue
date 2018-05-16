<template>
  <span class="searchfield" v-show="voc != null">
    <b-form-input
      size="sm"
      v-model="searchQuery"
      type="search"
      placeholder="Type to search..."
      @click.native="isOpen = searchQuery != ''"
      @change="isOpen = searchQuery != ''"></b-form-input>
    <ul id="searchfield-results" v-show="isOpen" class="searchfield-results">
      <li class="loading" v-if="loading">
        <loading-indicator />
      </li>
      <li v-else v-for="(result, i) in searchResult" :key="i" class="searchfield-result" @click="chooseResult(result)">
        {{ result[0] }}
      </li>
    </ul><br>
  </span>
</template>

<script>
import * as api from './api'
import LoadingIndicator from './LoadingIndicator'
var _ = require('lodash')

export default {
  name: 'SearchField',
  props: ["voc"],
  components: {
    LoadingIndicator
  },
  data () {
    return {
      searchQuery: "",
      searchResult: [],
      isOpen: false,
      loading: false
    }
  },
  watch: {
    // whenever question changes, this function will run
    searchQuery: function (newQuestion, oldQuestion) {
      if (newQuestion == "") {
        this.loading = false
        this.isOpen = false
      } else {
        this.searchResult = ['Waiting for you to stop typing...']
        this.loading = true
        this.isOpen = true
        this.debouncedGetAnswer()
      }
    },
    voc: function(newValue, oldValue) {
      if (newValue != oldValue) {
        this.searchQuery = ""
        this.searchResult = []
        this.isOpen = false
        this.loading = false
      }
    }
  },
  created: function () {
    // To limit API requests during typing, we defer the ac
    this.debouncedGetAnswer = _.debounce(this.getAnswer, 300)
  },
  methods: {
    chooseResult: function (result) {
      let uri = _.last(result)
      this.$emit('chooseUri', uri)
      this.searchQuery = ""
      this.isOpen = false
    },
    getAnswer:  function () {
      this.searchResult = ['Searching...']
      var vm = this
      api.suggest(this.searchQuery, this.voc, 20)
        .then(function(data) {
          vm.loading = false
          vm.isOpen = true
          vm.searchResult = _.zip(data[1], data[2], data[3])
        })
        .catch(function(error) {
          vm.loading = false
          vm.searchResult = ['Error! Could not reach the API. ' + error]
        })
    },
    handleClickOutside(evt) {
      if (!this.$el.contains(evt.target)) {
        this.isOpen = false;
      }
    }
  },
  mounted() {
    document.addEventListener("click", this.handleClickOutside);
  },
  destroyed() {
    document.removeEventListener("click", this.handleClickOutside);
  }
}
</script>

<style scoped>
.searchfield {
  position: relative;
  margin: 0px 15px -10px 15px;
  padding-top: 3px;
}

.searchfield-results {
  padding: 0;
  margin: 0;
  border: 1px solid #aaaaaa;
  height: auto;
  max-height: 200px;
  overflow: auto;
  width: 100%;
  position: absolute;
  background-color: white;
}

.searchfield-result {
  list-style: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  padding-left: 8px;
}

.searchfield-result:hover {
  background-color: #4AAE9B;
  color: white;
}
</style>
