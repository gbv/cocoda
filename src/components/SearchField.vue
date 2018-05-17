<template>
  <span class="searchfield" v-show="voc != null">
    <b-form-input
      size="sm"
      v-model="searchQuery"
      type="search"
      placeholder="Type to search..."
      @click.native="isOpen = searchQuery != ''"
      @keydown.down.native.prevent="onArrowDown"
      @keydown.up.native.prevent="onArrowUp"
      @keyup.enter.native="onEnter"></b-form-input>
    <ul v-show="isOpen" class="searchfield-results">
      <li class="loading" v-if="loading">
        <loading-indicator />
      </li>
      <li v-else v-for="(result, i) in searchResult"
        :key="i"
        class="searchfield-result"
        :id="'searchResult' + i"
        @click="chooseResult(result)"
        @mouseover="mouseover(i)"
        :class="{ 'searchfield-selected': i === searchSelected }">
        {{ result[0] }}
      </li>
    </ul><br>
  </span>
</template>

<script>
import * as api from './api'
import LoadingIndicator from './LoadingIndicator'
var _ = require('lodash')

/**
 * Helper function  that scrolls the search result when navigating with the keyboard
 */
function scrollIntoViewIfNeeded(target) {
  var rect = target.getBoundingClientRect();
  var parentRect = target.parentElement.getBoundingClientRect()
  if (rect.bottom > parentRect.bottom) {
    target.scrollIntoView(false);
  }
  if (rect.top < parentRect.top) {
    target.scrollIntoView();
  }
}

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
      loading: false,
      searchSelected: -1
    }
  },
  watch: {
    // whenever question changes, this function will run
    searchQuery: function (newQuestion, oldQuestion) {
      this.searchSelected = -1
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
      this.searchSelected = -1
    },
    getAnswer:  function () {
      this.searchResult = ['Searching...']
      var vm = this
      api.suggest(this.searchQuery, this.voc, 20)
        .then(function(data) {
          vm.loading = false
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
        this.searchSelected = -1
      }
    },
    onArrowDown() {
      if (this.searchSelected >= this.searchResult.length - 1) {
        this.searchSelected = 0
      } else {
        this.searchSelected += 1
      }
      this.scrollSelectedIntoView()
    },
    onArrowUp() {
      if (this.searchSelected <= 0) {
        this.searchSelected = this.searchResult.length - 1
      } else {
        this.searchSelected -= 1
      }
      this.scrollSelectedIntoView()
    },
    scrollSelectedIntoView(alignTo=null) {
      scrollIntoViewIfNeeded(document.getElementById('searchResult'+this.searchSelected))
    },
    onEnter() {
      let chosenIndex
      if (this.searchResult.length == 0) {
        return
      } else if (this.searchSelected < 0 || this.searchSelected >= this.searchResult.length) {
        chosenIndex = 0
      } else {
        chosenIndex = this.searchSelected
      }
      this.chooseResult(this.searchResult[chosenIndex])
    },
    mouseover(i) {
      this.searchSelected = i
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
  z-index: 10;
}

.searchfield-result {
  list-style: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  padding-left: 8px;
}

.searchfield-selected {
  background-color: #4AAE9B;
  color: white;
}
</style>
