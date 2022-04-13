<!--
Note: This is a 90% copy of jskos-vue's ItemSuggest component, only slightly adjusted for Cocoda and Vue 2. Unfortunately, we still can't use jskos-vue here, so this is a temporary workaround...
-->
<template>
  <div
    ref="itemSuggest"
    class="jskos-vue-itemSuggest"
    @mousemove="mousemove">
    <!-- Input field -->
    <b-form-input
      ref="searchInput"
      v-model="query"
      placeholder="Type to search..."
      size="sm"
      @click="openResults"
      @keydown.down.prevent="onArrowDown"
      @keydown.up.prevent="onArrowUp"
      @keyup.enter="onEnter"
      @keyup.esc="$refs && $refs.searchInput && $refs.searchInput.blur(); closeResults()"
      @keydown.tab="$refs && $refs.searchInput && $refs.searchInput.blur(); closeResults()"
      @focus="openResults" />
    <!-- Results -->
    <div
      v-show="isOpen"
      class="jskos-vue-itemSuggest-results jskos-vue-text-small">
      <!-- Loading indicator if necessary -->
      <div
        v-if="isLoading"
        class="jskos-vue-itemSuggest-loading">
        <loading-indicator size="md" />
      </div>
      <!-- If not loading, show results -->
      <ul
        v-else
        ref="resultList"
        class="jskos-vue-itemSuggest-results-list">
        <li
          v-for="(result, i) in results"
          :key="i"
          :class="{
            'jskos-vue-itemSuggest-selected': i === searchSelected,
          }"
          class="jskos-vue-itemSuggest-results-item"
          @click="chooseResult(i)"
          @mouseover="mouseover(i)">
          <span v-html="highlightQueryInResult(result[0])" />
        </li>
        <li
          v-if="results.length == 0"
          class="jskos-vue-itemSuggest-results-item"
          style="cursor: initial;">
          <!-- TODO: Add other languages -->
          <div>No results</div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
/**
	 * TODOs:
	 * - add types popover (or at least provide a way to add it after the fact)
	 * - add drag and drop for concepts
	 */

import { defineComponent, nextTick, ref, watch } from "@/composition-api"
import LoadingIndicator from "./LoadingIndicator.vue"
import VueScrollTo from "vue-scrollto"
import clickHandler from "../mixins/click-handler.js"
import _ from "lodash"

// import "../shared.css"

// HTML escape method
// TODO: Move to utils?
function escape(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export default defineComponent({
  name: "ItemSuggest",
  components: {
    LoadingIndicator,
  },
  mixins: [clickHandler],
  props: {
    // async function that returns results in OpenSearch Suggest Format
    search: {
      type: Function,
      default: null,
    },
  },
  emits: ["select"],
  setup(props, { emit }) {
    const isLoading = ref(false)
    const isOpen = ref(false)
    const cancel = ref(null)
    const query = ref("")
    const searchSelected = ref(-1)
    const results = ref([])
    const uniqueID = "abc"
    const preventHovering = ref(false)
    // Template refs (will be set at mount)
    const itemSuggest = ref(null)
    const searchInput = ref(null)
    const resultList = ref(null)

    const search = _.debounce(async (searchQuery) => {
      searchQuery = searchQuery.trim()
      results.value = []

      isLoading.value = true

      const promise = props.search(searchQuery)
      cancel.value = promise.cancel

      // convert into different array
      let suggestResults
      try {
        suggestResults = (await promise).slice(1).reduce((current, next) => { current = next.map((element, index) => (current[index] || []).concat(element)); return current }, [])
      } catch (error) {
        if (error.message === "canceled") {
          return
        }
        // seems to be a network error, logging to console
        console.error(error)
        suggestResults = []
      }

      // check if value has changed since starting the request
      if (searchQuery === query.value.trim()) {
        results.value = suggestResults
        cancel.value = null
        isLoading.value = false
      }
    }, 200)

    watch(query, (newQuery) => {
      searchSelected.value = -1
      // Already cancel previous request
      if (cancel.value != null) {
        cancel.value("There was a newer search query.")
        cancel.value = null
      }
      if (newQuery === "") {
        isLoading.value = false
        isOpen.value = false
      } else {
        results.value = ["Waiting for you to stop typing..."]
        isLoading.value = true
        isOpen.value = true
        // Actually perform the search
        search(newQuery)
      }
    })

    const openResults = () => {
      isOpen.value = query.value !== ""
    }
    const closeResults = () => {
      isOpen.value = false
    }
    const chooseResult = (chosenIndex) => {
      closeResults()
      searchSelected.value = -1
      emit("select", {
        uri: results.value[chosenIndex][2],
      })
      // Remove focus
      if (document.activeElement !== document.body) document.activeElement.blur()
      // Clear search field
      query.value = ""
    }

    const highlightQueryInResult = (result) => {
      if (!query.value.length) {
        return result
      }
      // Find all occurrences of the search query and highlight them
      const searchQuery = query.value
      const regex = new RegExp(searchQuery, "ig")
      let match = regex.exec(result), currentIndex = 0, newResult = ""
      while (match) {
        let index = match.index
        newResult += escape(result.slice(currentIndex, index))
                  + "<span class='jskos-vue-text-bold'>"
                  + escape(result.slice(index, index + searchQuery.length))
                  + "</span>"
        currentIndex = index + searchQuery.length
        match = regex.exec(result)
      }
      newResult += escape(result.slice(currentIndex))
      return newResult
    }
    // scroll when using up/down arrows to go through the results
    const scrollSelectedIntoView = () => {
      const target = resultList.value.childNodes[searchSelected.value]
      if (target) {
        const parent = target.parentElement.parentElement
        const rect = target.getBoundingClientRect()
        const parentRect = parent.getBoundingClientRect()
        VueScrollTo.scrollTo(target, 100, {
          container: parent,
          easing: "ease-in",
          offset: rect.bottom > parentRect.bottom ? -parentRect.height + rect.height : 0,
          cancelable: true,
          x: false,
          y: true,
          force: false,
        })
      }
    }

    return {
      isLoading,
      isOpen,
      query,
      searchSelected,
      results,
      uniqueID,
      openResults,
      closeResults,
      chooseResult,
      itemSuggest,
      searchInput,
      resultList,
      mouseover(index) {
        if (!preventHovering.value) {
          searchSelected.value = index
        }
      },
      mousemove() {
        preventHovering.value = false
      },
      onArrowDown() {
        preventHovering.value = true
        if (searchSelected.value >= results.value.length - 1) {
          searchSelected.value = 0
        } else {
          searchSelected.value += 1
        }
        scrollSelectedIntoView()
      },
      onArrowUp() {
        preventHovering.value = true
        if (searchSelected.value <= 0) {
          searchSelected.value = results.value.length - 1
        } else {
          searchSelected.value -= 1
        }
        scrollSelectedIntoView()
      },
      onEnter() {
        let chosenIndex
        if (isLoading.value || results.value.length === 0) {
          return
        } else if (searchSelected.value < 0 || searchSelected.value >= results.value.length) {
          chosenIndex = 0
        } else {
          chosenIndex = searchSelected.value
        }
        chooseResult(chosenIndex)
      },
      highlightQueryInResult,
      focus() {
        searchInput.value.focus()
      },
      setQuery(newQuery, focus = false) {
        query.value = newQuery
        if (focus) {
          searchInput.value.focus()
        } else {
          // Workaround because results will open automatically when query changes to a non-empty string
          nextTick(() => {
            closeResults()
          })
        }
      },
    }
  },
  methods: {
    clickHandlers() {
      return [
        {
          elements: [this.itemSuggest],
          handler: () => {
            this.isOpen = false
            this.searchSelected = -1
          },
        },
      ]
    },
  },
})
</script>

<style lang="less" scoped>
@import "../style/main.less";

.jskos-vue-itemSuggest {
  position: relative;
  height: 34px;
}
.jskos-vue-itemSuggest > input {
  width: 100%;
  padding: 4px 8px;
}

.jskos-vue-itemSuggest-results {
  position: absolute;
  overflow: auto;
  height: auto;
  max-height: 250px;
  width: 100%;
  padding: 0;
  margin: 1px 0;
  background-color: @color-background;
  box-shadow: 0 2px 4px 0 @color-shadow;
  z-index: @zIndex-10;
}

.jskos-vue-itemSuggest-results-list {
  padding: 0;
  margin: 0;
}

.jskos-vue-itemSuggest-results-item {
  list-style: none;
  text-align: left;
  cursor: pointer;
  padding: 3px 0px 3px 12px;
}

.jskos-vue-itemSuggest-selected {
  color: @color--conceptSearch-result-selected;
  background-color: @color--conceptSearch-result-selected-background;
}

.jskos-vue-itemSuggest-loading {
  width: 100%;
  height: 30px;
  padding: 4px 0 0 10px;
  z-index: @zIndex-10;
}
</style>
