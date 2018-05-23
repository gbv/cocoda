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
import LoadingIndicator from './LoadingIndicator'
var _ = require('lodash')

/**
 * Helper function that scrolls the search result when navigating with the keyboard.
 *
 * @param {element} target - DOM element to scroll to
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

/**
 * Component that represents a SearchField.
 */
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
    /**
     * Deals with query changes.
     */
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
    /**
     * Clears the search field when vocabulary is changed.
     */
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
    // To limit API requests during typing, we defer the function call.
    this.debouncedGetAnswer = _.debounce(this.getAnswer, 300)
  },
  methods: {
    /**
     * Chooses a search result and resets search field.
     *
     * @param {string[]} result - result array with label, description, and uri (in this order)
     */
    chooseResult: function (result) {
      let uri = _.last(result)
      /**
       * chooseUri event.
       *
       * @event chooseUri
       * @type {string} - uri that is chosen
       */
      this.$emit('chooseUri', uri)
      this.searchQuery = ""
      this.isOpen = false
      this.searchSelected = -1
    },
    /**
     * Loads autosuggest results from API.
     */
    getAnswer:  function () {
      this.searchResult = ['Searching...']
      var vm = this
      this.$api.suggest(this.searchQuery, this.voc, 20)
        .then(function(data) {
          vm.loading = false
          vm.searchResult = _.zip(data[1], data[2], data[3])
        })
        .catch(function(error) {
          vm.loading = false
          vm.searchResult = [['Error! Could not reach the API. ' + error]]
        })
    },
    /**
     * Closes search results when clicked outside of search field.
     *
     * @param {object} evt - event object for the click
     */
    handleClickOutside(evt) {
      if (!this.$el.contains(evt.target)) {
        this.isOpen = false;
        this.searchSelected = -1
      }
    },
    /**
     * Handles an arrow down event.
     */
    onArrowDown() {
      if (this.searchSelected >= this.searchResult.length - 1) {
        this.searchSelected = 0
      } else {
        this.searchSelected += 1
      }
      this.scrollSelectedIntoView()
    },
    /**
     * Handles an arrow up event.
     */
    onArrowUp() {
      if (this.searchSelected <= 0) {
        this.searchSelected = this.searchResult.length - 1
      } else {
        this.searchSelected -= 1
      }
      this.scrollSelectedIntoView()
    },
    /**
     * Scrolls the currently selected search result into view.
     *
     * TODO: - Remove alignTo parameter.
     */
    scrollSelectedIntoView(alignTo=null) {
      scrollIntoViewIfNeeded(document.getElementById('searchResult'+this.searchSelected))
    },
    /**
     * Handles an enter down event.
     */
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
    /**
     * Handles a mouseover down event.
     *
     * @param {number} i - index of search result
     */
    mouseover(i) {
      this.searchSelected = i
    }
  },
  mounted() {
    // Add click event listener
    document.addEventListener("click", this.handleClickOutside);
  },
  destroyed() {
    // Remove click event listener
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
