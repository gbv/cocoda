<template>
  <span
    v-show="voc != null"
    class="searchfield">
    <div class="searchIcon">
      <div class="searchIcon__circle" />
      <div class="searchIcon__rectangle" />
    </div>
    <b-form-input
      v-model="searchQuery"
      size="sm"
      type="search"
      placeholder="Type to search..."
      @click.native="isOpen = searchQuery != ''"
      @keydown.down.native.prevent="onArrowDown"
      @keydown.up.native.prevent="onArrowUp"
      @keyup.enter.native="onEnter"/>
    <div
      v-show="isOpen"
      class="searchfield-results">
      <div
        v-if="loading"
        class="loading">
        <loading-indicator />
      </div>
      <ul
        v-else
        class="searchfield-results-list">
        <li
          v-for="(result, i) in searchResult"
          :key="i"
          :id="'searchResult' + i"
          :class="{ 'searchfield-selected': i === searchSelected }"
          class="searchfield-results-item"
          @click="chooseResult(result)"
          @mouseover="mouseover(i)">
          {{ result[0] }}
        </li>
      </ul>
    </div>
  </span>
</template>

<script>
import LoadingIndicator from "./LoadingIndicator"
var _ = require("lodash")

/**
 * Helper function that scrolls the search result when navigating with the keyboard.
 *
 * @param {element} target - DOM element to scroll to
 */
function scrollIntoViewIfNeeded(target) {
  var rect = target.getBoundingClientRect()
  var parentRect = target.parentElement.getBoundingClientRect()
  if (rect.bottom > parentRect.bottom) {
    target.scrollIntoView(false)
  }
  if (rect.top < parentRect.top) {
    target.scrollIntoView()
  }
}

/**
 * Component that represents a typeahead-enabled search field for concepts.
 */
export default {
  name: "ConceptSearch",
  components: {
    LoadingIndicator
  },
  props: {
    /**
     * The ID (notation) for the scheme that should be searched.
     */
    voc: {
      type: String,
      default: ""
    }
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
    searchQuery: function (newQuestion) {
      this.searchSelected = -1
      if (newQuestion == "") {
        this.loading = false
        this.isOpen = false
      } else {
        this.searchResult = ["Waiting for you to stop typing..."]
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
  mounted() {
    // Add click event listener
    document.addEventListener("click", this.handleClickOutside)
  },
  destroyed() {
    // Remove click event listener
    document.removeEventListener("click", this.handleClickOutside)
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
       * Event when the user has chosen a result.
       *
       * @event chooseUri
       * @type {string} - uri that is chosen
       */
      this.$emit("chooseUri", uri)
      this.searchQuery = ""
      this.isOpen = false
      this.searchSelected = -1
    },
    /**
     * Loads autosuggest results from API.
     */
    getAnswer:  function () {
      this.searchResult = ["Searching..."]
      var vm = this
      this.$api.suggest(this.searchQuery, this.voc, 20)
        .then(function(data) {
          vm.loading = false
          vm.searchResult = _.zip(data[1], data[2], data[3])
        })
        .catch(function(error) {
          vm.loading = false
          vm.searchResult = [["Error! Could not reach the API. " + error]]
        })
    },
    /**
     * Closes search results when clicked outside of search field.
     *
     * @param {object} evt - event object for the click
     */
    handleClickOutside(evt) {
      if (!this.$el.contains(evt.target)) {
        this.isOpen = false
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
     */
    scrollSelectedIntoView() {
      scrollIntoViewIfNeeded(document.getElementById("searchResult"+this.searchSelected))
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
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

// adapted from https://codepen.io/satrya/pen/JGRxNb
.searchIcon {
position: absolute;
width: 30px;
margin: 0 auto;
padding: 8px 0;
text-align: center;
left: -24px;

  &__circle {
    width: 12px;
    height: 12px;
    border: 2px solid @color-primary-6;
    border-radius: 12px;
  }

  &__rectangle {
    position: absolute;
    right: 13px;
    bottom: 7px;
    width: 8px;
    transform: rotate(45deg);
    border: 1px solid @color-primary-6;
    border-top-right-radius: 1px;
    border-bottom-right-radius: 1px;
  }
}

.searchfield {
  position: relative;
  margin: 3px 3px 0px 28px;
  height: 34px;
}
.searchfield > input {
  border: 0;
  box-shadow: 0 1px 2px 0 hsla(0, 0%, 0%, 0.2);
}

.searchfield-results {
  padding: 0;
  margin: 0;
  box-shadow: 0 2px 4px 0 hsla(0, 0%, 0%, 0.2);
  height: auto;
  max-height: 250px;
  overflow: auto;
  width: 100%;
  position: absolute;
  background-color: white;
  z-index: 10;
}

.searchfield-results-list {
  padding: 0;
  margin: 0;
}

.searchfield-results-item {
  list-style: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  padding: 3px 0px 3px 12px;
}

.searchfield-selected {
  &:extend(.color-primary-2-bg);
  &:extend(.color-primary-8);
}

.loading {
  width: 100%;
  height: 50px;
  padding: 0px 0px 0px 12px;
  z-index: 100;
  background-color: #ffffff55;
  display: flex;
  justify-content: left;
  align-items: center;
}
</style>
