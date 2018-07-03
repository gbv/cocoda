<template>
  <span
    class="searchfield"
    @mousemove="mousemove()">
    <div
      class="searchIcon"
      @click="focusSearch" >
      <font-awesome-icon icon="search" />
    </div>
    <div class="searchInputWrapper">
      <b-form-input
        ref="searchInput"
        v-model="searchQuery"
        size="sm"
        type="search"
        placeholder="Type to search..."
        @click.native="isOpen = searchQuery != ''"
        @keydown.down.native.prevent="onArrowDown"
        @keydown.up.native.prevent="onArrowUp"
        @keyup.enter.native="onEnter"
        @focus.native="isOpen = searchQuery != ''"
        @blur.native="onBlur" />
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
            :id="uniqueID + '-searchResult-' + i"
            :class="{ 'searchfield-selected': i === searchSelected }"
            class="searchfield-results-item font-size-small"
            @click="chooseResult(result)"
            @mouseover="mouseover(i)">
            <span v-html="highlightQueryInResult(result[0])"/>
          </li>
        </ul>
      </div>
    </div>
  </span>
</template>

<script>
import LoadingIndicator from "./LoadingIndicator"
import FontAwesomeIcon from "@fortawesome/vue-fontawesome"
var _ = require("lodash")

/**
 * Helper function that scrolls the search result when navigating with the keyboard.
 *
 * @param {element} target - DOM element to scroll to
 */
function scrollIntoViewIfNeeded(target) {
  var rect = target.getBoundingClientRect()
  var parentRect = target.parentElement.parentElement.getBoundingClientRect()
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
    LoadingIndicator, FontAwesomeIcon
  },
  props: {
    /**
     * The scheme that should be searched.
     */
    voc: {
      type: Object,
      default: null
    }
  },
  data () {
    return {
      searchQuery: "",
      searchResult: [],
      isOpen: false,
      isValid: false,
      loading: false,
      searchSelected: -1,
      preventHovering: false,
      cancelToken: null,
      uniqueID: null
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
        // Already cancel previous request
        if (this.cancelToken != null) {
          this.cancelToken.cancel("There was a newer search query.")
        }
        this.debouncedGetAnswer()
      }
      this.isValid = false
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
    // Create a unique ID for the DOM IDs
    this.uniqueID = this.$util.generateID()
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
      console.log("chose", result)
      let uri = _.last(result)
      /**
       * Event when the user has chosen a result.
       *
       * @event chooseUri
       * @type {string} - uri that is chosen
       */
      this.$emit("chooseUri", uri)
      this.isOpen = false
      this.searchSelected = -1
      // Remove focus
      if (document.activeElement != document.body) document.activeElement.blur()
    },
    onBlur() {
      // Delay onBlur because it can interfere with chooseResult
      _.delay(() => { this.isOpen = false }, 150)
    },
    /**
     * Loads autosuggest results from API.
     */
    getAnswer:  function () {
      this.searchResult = ["Searching..."]
      var vm = this
      if (this.cancelToken != null) {
        this.cancelToken.cancel("There was a newer search query.")
      }
      this.cancelToken = this.$api.token()
      let searchQuery = this.searchQuery
      this.$api.suggest(this.voc, searchQuery, this.voc.notation[0], 100, undefined, this.cancelToken.token)
        .then(function(data) {
          console.log(searchQuery, vm.searchQuery)
          if (searchQuery == vm.searchQuery) {
            vm.loading = false
            vm.searchResult = _.zip(data[1], data[2], data[3])
            vm.isValid = true
          }
        })
        .catch(function(error) {
          // Clean up if error was not related to cancellation
          if (error.toString().toLowerCase().indexOf("cancel") == -1 && searchQuery == vm.searchQuery) {
            vm.loading = false
            vm.isValid = false
            vm.searchResult = [["Error! Could not reach the API. " + error]]
          }
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
      this.preventHovering = true
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
      this.preventHovering = true
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
      scrollIntoViewIfNeeded(document.getElementById(this.uniqueID + "-searchResult-" + this.searchSelected))
    },
    /**
     * Handles an enter down event.
     */
    onEnter() {
      let chosenIndex
      if (this.loading || !this.isValid || this.searchResult.length == 0) {
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
      if (!this.preventHovering) {
        this.searchSelected = i
      }
    },
    mousemove() {
      this.preventHovering = false
    },
    focusSearch() {
      this.$refs.searchInput.focus()
      this.isOpen = this.searchQuery != ""
    },
    highlightQueryInResult(result) {
      let index = result.search(new RegExp(this.searchQuery, "i"))
      if (index == -1) {
        return result
      } else {
        return _.escape(result.slice(0, index))
          + "<span class='searchHighlight'>"
          + _.escape(result.slice(index, index + this.searchQuery.length))
          + "</span>"
          + _.escape(result.slice(index + this.searchQuery.length))
      }
    }
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.searchIcon {
  position: absolute;
  margin: 0 auto;
  padding: 4px 0;
  text-align: center;
  left: 5px;
  color: @buttonColor;
  &:hover {
    cursor: pointer;
    color: @buttonColorHover;
  }
}

.searchfield {
  position: relative;
  height: 34px;
}
.searchInputWrapper {
  margin-left: 28px;
  position: relative;
}
.searchInputWrapper > input {
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
  z-index: 1000;
}

.searchfield-results-list {
  padding: 0;
  margin: 0;
}

.searchfield-results-item {
  list-style: none;
  text-align: left;
  cursor: pointer;
  padding: 3px 0px 3px 12px;
}

.searchfield-selected {
  background-color: @color-primary-1;
  color: @color-primary-4;
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

<style lang="less">
@import "../style/main.less";

// Has to be global to work
.searchHighlight {
  &:extend(.font-heavy);
  color: @color-secondary-2-4;
  .searchfield-selected & {
    color: darken(@color-secondary-2-4, 10%);
  }
}
</style>
