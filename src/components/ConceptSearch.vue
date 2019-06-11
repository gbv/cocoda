<template>
  <div
    class="conceptSearch"
    @mousemove="mousemove()">
    <!-- Search icon -->
    <div
      class="conceptSearch-icon button"
      @click="focusSearch">
      <font-awesome-icon icon="search" />
    </div>
    <div class="conceptSearch-inputWrapper">
      <div
        v-if="isOpen && !loading"
        :style="`right: ${scheme.types && scheme.types.length ? 27 : 10}px;`"
        class="conceptSearch-resultCount">
        {{ searchResult.length }} {{ $tc("search.results", searchResult.length) }}
      </div>
      <div
        v-show="scheme.types && scheme.types.length > 0"
        :id="`conceptSearch-filter-${isLeft ? 'left' : 'right'}`"
        class="conceptSearch-filter button">
        <font-awesome-icon icon="filter" />
      </div>
      <!-- Filter Popover -->
      <b-popover
        :target="`conceptSearch-filter-${isLeft ? 'left' : 'right'}`"
        :show.sync="filterPopoverShow"
        triggers="click"
        placement="auto">
        <div ref="filterPopover">
          <b-form-checkbox-group
            v-model="selectedTypes"
            class="conceptSearch-filterCheckboxes"
            stacked
            size="sm">
            <b-form-checkbox
              v-for="type in scheme.types"
              :key="type.uri"
              :value="type.uri"
              class="conceptSearch-filterCheckbox">
              {{ $util.prefLabel(type) }}
            </b-form-checkbox>
          </b-form-checkbox-group>
        </div>
      </b-popover>
      <!-- Input field -->
      <b-form-input
        ref="searchInput"
        v-model="searchQuery"
        :placeholder="$t('search.placeholder')"
        size="sm"
        autocomplete="off"
        @click.native="isOpen = searchQuery != ''"
        @keydown.down.native.prevent="onArrowDown"
        @keydown.up.native.prevent="onArrowUp"
        @keydown.tab.native="closeResults"
        @keyup.enter.native="onEnter"
        @keyup.esc.native="$refs.searchInput.$el.blur(); closeResults()"
        @focus.native="isOpen = searchQuery != ''" />
      <!-- Results -->
      <div
        v-show="isOpen"
        class="conceptSearch-results">
        <div
          v-if="loading"
          class="conceptSearch-loading">
          <loading-indicator />
        </div>
        <ul
          v-else
          class="conceptSearch-results-list">
          <li
            v-for="(result, i) in searchResult"
            :id="uniqueID + '-searchResult-' + i"
            :key="i"
            :class="{ 'conceptSearch-selected': i === searchSelected }"
            class="conceptSearch-results-item"
            draggable="true"
            @dragstart="dragStartResult(result, $event)"
            @dragend="dragEnd"
            @click="chooseResult(i)"
            @mouseover="mouseover(i)">
            <span v-html="highlightQueryInResult(result[0])" />
          </li>
          <li
            v-if="searchResult.length == 0"
            class="conceptSearch-results-item">
            <div>{{ $t("search.noResults") }}</div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import LoadingIndicator from "./LoadingIndicator"
import _ from "lodash"

// Import mixins
import objects from "../mixins/objects"
import clickHandler from "../mixins/click-handler"
import dragandrop from "../mixins/dragandrop"
import computed from "../mixins/computed"

/**
 * Component that represents a typeahead-enabled search field for concepts.
 */
export default {
  name: "ConceptSearch",
  components: {
    LoadingIndicator
  },
  mixins: [objects, clickHandler, dragandrop, computed],
  props: {
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true
    },
    /**
     * Currently selected scheme, needed to detect changes.
     */
    scheme: {
      type: Object,
      default: null
    }
  },
  data () {
    return {
      // The current search query
      searchQuery: "",
      // The current search result
      searchResult: [],
      // Whether the results are shown
      isOpen: false,
      // Whether the current results are valid
      isValid: false,
      // Whether results are currently loading
      loading: false,
      // Selected (hover or keyboard) search result
      searchSelected: -1,
      // Whether to prevent hovering with the mouse (during keyboard navigation)
      preventHovering: false,
      // Last axios cancel token
      cancelToken: null,
      // A unique ID for the DOM (to prevent conflict with other instances of this component)
      uniqueID: null,
      // Show/hide types popover
      filterPopoverShow: false,
    }
  },
  computed: {
    // Only for watcher
    typesForSchemes() {
      return this.$settings.typesForSchemes
    },
    selectedTypes: {
      get() {
        let key = Object.keys(this.$settings.typesForSchemes).find(key => this.$jskos.compare(this.scheme, { uri: key }))
        return this.$settings.typesForSchemes[key]
      },
      set(newValue) {
        if (!Array.isArray(newValue)) {
          return
        }
        // Save types to settings
        let key = Object.keys(this.$settings.typesForSchemes).find(key => this.$jskos.compare(this.scheme, { uri: key })) || this.scheme.uri
        let typesForSchemes = _.cloneDeep(this.$settings.typesForSchemes)
        // Prevent infinite loop when stored value is equal to new value
        if (_.isEqual(newValue, typesForSchemes[key])) {
          return
        }
        typesForSchemes[key] = newValue
        this.$store.commit({
          type: "settings/set",
          prop: "typesForSchemes",
          value: typesForSchemes
        })
      }
    },
    provider() {
      return _.get(this.scheme, "_provider")
    },
    clickHandlers() {
      return [
        // Result list
        {
          elements: [
            this.$el
          ],
          handler: () => {
            if (!this.filterPopoverShow) {
              // eslint-disable-next-line vue/no-side-effects-in-computed-properties
              this.isOpen = false
              // eslint-disable-next-line vue/no-side-effects-in-computed-properties
              this.searchSelected = -1
            }
          }
        },
        // Types popover
        {
          elements: [
            document.getElementById(`conceptSearch-filter-${this.isLeft ? "left" : "right"}`),
            this.$refs.filterPopover
          ],
          handler: () => {
            // eslint-disable-next-line vue/no-side-effects-in-computed-properties
            this.filterPopoverShow = false
          }
        }
      ]
    },
  },
  watch: {
    /**
     * Deals with query changes.
     */
    searchQuery: function (newQuestion) {
      this.searchSelected = -1
      // Already cancel previous request
      if (this.cancelToken != null) {
        this.cancelToken.cancel("There was a newer search query.")
        this.cancelToken = null
      }
      if (newQuestion == "") {
        this.loading = false
        this.isOpen = false
      } else {
        this.searchResult = ["Waiting for you to stop typing..."]
        this.loading = true
        this.isOpen = true
        // Get the result debounced to prevent too many API requests
        this.debouncedGetAnswer()
      }
      this.isValid = false
    },
    /**
     * Clears the search field when scheme is changed.
     */
    scheme: function(newValue, oldValue) {
      if (!this.$jskos.compare(oldValue, newValue)) {
        this.searchQuery = ""
        this.searchResult = []
        this.isOpen = false
        this.isValid = false
        this.loading = false
        this.searchSelected = -1
      }
      if (newValue != null) {
        this._loadTypes(newValue)
      }
    },
    typesForSchemes() {
      // Request answer again after types changed.
      this.loading = true
      this.getAnswer()
    },
  },
  created: function () {
    // To limit API requests during typing, we defer the function call.
    this.debouncedGetAnswer = _.debounce(this.getAnswer, 300)
    // Create a unique ID for the DOM IDs
    this.uniqueID = this.$util.generateID()
  },
  methods: {
    /**
     * Chooses a search result and resets search field.
     *
     * @param {string[]} result - result array with label, description, and uri (in this order)
     */
    chooseResult(chosenIndex) {
      this.closeResults()
      this.searchSelected = -1
      this.$router.push({ path: this._getRouterUrl(this.searchResult[chosenIndex]) })
      // Remove focus
      if (document.activeElement != document.body) document.activeElement.blur()
    },
    _getRouterUrl(result) {
      let uri = _.last(result)
      let concept = {
        uri: uri,
        inScheme: [this.scheme]
      }
      // Get concept from store
      concept = this.saveObject(concept, { type: "concept", scheme: this.scheme, provider: this.provider })
      return this.getRouterUrl(concept, this.isLeft)
    },
    closeResults() {
      this.isOpen = false
    },
    /**
     * Loads autosuggest results from API.
     */
    getAnswer:  function () {
      this.searchResult = []
      // Generate new axios cancel token
      this.cancelToken = this.provider.getCancelToken()
      let searchQuery = this.searchQuery
      this.provider.suggest(searchQuery, { scheme: this.scheme, types: this.selectedTypes, cancelToken: this.cancelToken.token })
        .then((data) => {
          if (searchQuery == this.searchQuery) {
            this.loading = false
            this.searchResult = _.zip(data[1], data[2], data[3])
            this.isValid = true
          }
        })
        .catch((error) => {
          // Clean up if error was not related to cancellation
          if (error.toString().toLowerCase().indexOf("cancel") == -1 && searchQuery == this.searchQuery) {
            this.loading = false
            this.isValid = false
            this.searchResult = [["Error! Could not reach the API. " + error]]
          }
        })
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
      let target = document.getElementById(this.uniqueID + "-searchResult-" + this.searchSelected)
      var rect = target.getBoundingClientRect()
      var parentRect = target.parentElement.parentElement.getBoundingClientRect()
      if (rect.bottom > parentRect.bottom) {
        target.scrollIntoView(false)
      }
      if (rect.top < parentRect.top) {
        target.scrollIntoView()
      }
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
      this.chooseResult(chosenIndex)
    },
    /**
     * Handles a mouseover down event.
     *
     * @param {number} index - index of search result
     */
    mouseover(index) {
      if (!this.preventHovering) {
        this.searchSelected = index
      }
    },
    /**
     * Allows hovering when the mouse moves again
     */
    mousemove() {
      this.preventHovering = false
    },
    focusSearch() {
      this.$refs.searchInput.focus()
      this.isOpen = this.searchQuery != ""
    },
    highlightQueryInResult(result) {
      if (!this.searchQuery.length) {
        return result
      }
      // Find all occurrences of the search query and highlight them
      let searchQuery = this.searchQuery
      let regex = new RegExp(searchQuery, "ig")
      let match = regex.exec(result), currentIndex = 0, newResult = ""
      while (match) {
        let index = match.index
        newResult += _.escape(result.slice(currentIndex, index))
                  + "<span class='conceptSearch-searchHighlight fontWeight-heavy'>"
                  + _.escape(result.slice(index, index + searchQuery.length))
                  + "</span>"
        currentIndex = index + searchQuery.length
        match = regex.exec(result)
      }
      newResult += _.escape(result.slice(currentIndex))
      return newResult
    },
    setSearchQuery(query, isOpen = false) {
      this.searchQuery = query
      // Wait for nextTick before setting isOpen to override the searchQuery watcher
      this.$nextTick(() => {
        this.isOpen = isOpen
      })
    },
    _loadTypes(item) {
      // Load types for scheme
      this.loadTypes(item).then(scheme => {
        if (!this.selectedTypes) {
          this.selectedTypes = scheme.types.map(type => type.uri)
        }
      })
    },
    dragStartResult(result, event) {
      let uri = _.last(result)
      let concept = this.getObject({ uri }, { scheme: this.scheme, type: "concept" })
      this.dragStart(concept, event)
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.conceptSearch {
  position: relative;
  height: 34px;
}

.conceptSearch-icon {
  position: absolute;
  top: 6px;
  text-align: center;
  left: 0;
}

.conceptSearch-resultCount {
  .fontSize-small;
  position: absolute;
  top: 7px;
  user-select: none;
}
.conceptSearch-filter {
  position: absolute;
  top: 8px;
  right: 2px;
  width: 20px;
  font-size: 0.8em;
  user-select: none;
}

.conceptSearch-inputWrapper {
  position: relative;
  margin-left: 18px;
}

.conceptSearch-results {
  position: absolute;
  overflow: auto;
  height: auto;
  max-height: 250px;
  width: 100%;
  padding: 0;
  margin: 3px 0;
  background-color: @color-background;
  box-shadow: 0 2px 4px 0 @color-shadow;
  z-index: @zIndex-10;
}

.conceptSearch-results-list {
  padding: 0;
  margin: 0;
}

.conceptSearch-results-item {
  .fontSize-small;
  list-style: none;
  text-align: left;
  cursor: pointer;
  padding: 3px 0px 3px 12px;
}

.conceptSearch-selected {
  background-color: @color--conceptSearch-result-selected-background;
  color: @color--conceptSearch-result-selected;
}

.conceptSearch-loading {
  width: 100%;
  height: 50px;
  padding: 0px 0px 0px 12px;
  z-index: @zIndex-3;
  background-color: @color-loading-overlay-background;
  display: flex;
  justify-content: left;
  align-items: center;
}
.conceptSearch-filterCheckboxes {
  height: auto !important;
}
</style>

<style lang="less">
@import "../style/colors.less";

// Has to be global to work
.conceptSearch-searchHighlight {
  color: @color--conceptSearch-searchHighlight;
}
.conceptSearch-selected .conceptSearch-searchHighlight {
  color: @color--conceptSearch-searchHighlight-selected;
}
</style>
