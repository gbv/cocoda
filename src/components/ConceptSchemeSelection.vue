<template>
  <div
    :id="`conceptSchemeSelection-${id}`"
    class="conceptSchemeSelection"
    style="overflow: visible;">
    <!-- ^^^ overflow: visible is necessary to properly shown concept search results which go over the edge of the component. -->
    <!-- This is shown when a scheme is selected. -->
    <div
      v-if="scheme"
      class="conceptSchemeSelection-collapsed">
      <!-- Expand button -->
      <div
        :id="`${id}-expandButton`"
        v-b-tooltip.hover="{ title: popoverShown ? $t('schemeSelection.popoverHide') : $t('schemeSelection.popoverShow'), delay: $util.delay.medium }"
        class="conceptSchemeSelection-expandButton button"
        @click="togglePopover">
        <font-awesome-icon
          :icon="popoverShown ? 'angle-left' : 'angle-down'" />
      </div>
      <!-- Name of scheme -->
      <div class="conceptSchemeSelection-schemeName">
        <!-- Favorite star -->
        <font-awesome-icon
          v-b-tooltip.hover="{ title: $jskos.isContainedIn(scheme, favoriteSchemes) ? $t('schemeSelection.starRemove') : $t('schemeSelection.starAdd'), delay: $util.delay.medium }"
          :class="$jskos.isContainedIn(scheme, favoriteSchemes) ? 'starFavorite' : 'starNormal'"
          class="star"
          icon="star"
          @click="toggleFavoriteScheme(scheme)" />
        <!-- Name of scheme -->
        <item-name
          :item="scheme"
          :is-link="true"
          :is-left="isLeft"
          font-size="large" />
        <!-- License badge -->
        <span v-if="scheme.license && scheme.license.length">
          <img
            v-if="$util.licenseBadges[scheme.license[0].uri]"
            :src="$util.licenseBadges[scheme.license[0].uri]"
            class="schemeDetail-licenseBadge">
        </span>
        <!-- Button to clear scheme -->
        <div
          v-b-tooltip.hover="{ title: $t('general.clearScheme'), delay: $util.delay.medium }"
          class="button"
          style="display: inline-block; margin-right: 2px; margin-top: -3px;"
          @click="clearScheme">
          <font-awesome-icon icon="times-circle" />
        </div>
      </div>
      <!-- ConceptSearch -->
      <concept-search
        ref="conceptSearch"
        :is-left="isLeft"
        :scheme="scheme"
        class="conceptSchemeSelection-conceptSearch" />
    </div>
    <!-- This is shown when no scheme is selected, or as a popover. -->
    <!-- The popover reacts to the expand button above. It is attached to the main element of this component. -->
    <div
      :is="scheme == null ? 'div' : 'b-popover'"
      :target="`${id}-expandButton`"
      :container="`conceptSchemeSelection-${id}`"
      triggers="disabled"
      placement="leftbottom"
      class="conceptSchemeSelection-popover"
      @shown="popoverShown = true"
      @hidden="popoverShown = false">
      <!-- Inner div. Classes are attached because #app's classes don't apply for popovers. -->
      <div
        ref="popover"
        class="conceptSchemeSelection-expanded font-default text-dark color-primary-0-bg fontSize-normal">
        <!-- Title (source/target scheme) -->
        <div class="componentTitle">
          {{ isLeft ? $t("schemeSelection.source") : $t("schemeSelection.target") }}
        </div>
        <b-form
          inline
          @submit="chooseFirst">
          <!-- Scheme filter input field -->
          <b-form-input
            ref="input"
            v-model="schemeFilter"
            :placeholder="$t('schemeSelection.schemeFilterPlaceholder')"
            autocomplete="off"
            size="sm"
            style="flex: 1; margin-right: 5px;"
            @keyup.esc.native="hidePopover" />
          <!-- Language filter selection -->
          <b-form-select
            v-model="languageFilter"
            :options="languageFilterOptions"
            size="sm"
            class="fontSize-normal"
            @change="focusAndSelectInput" />
        </b-form>
        <!-- List of all schemes, showing favorites first -->
        <ul class="conceptSchemeSelection-schemeList scrollable">
          <li
            v-for="(_scheme, index) in favoriteSchemes || []"
            v-show="!isFiltered"
            :key="_scheme.uri + '-favorite-scheme-list-' + id + index">
            <font-awesome-icon
              v-b-tooltip.hover="{ title: $t('schemeSelection.starRemove'), delay: $util.delay.medium }"
              class="star starFavorite"
              icon="star"
              @click="toggleFavoriteScheme(_scheme)" />
            <item-name
              :ref="index == 0 && !isFiltered ? 'firstScheme' : null"
              :item="_scheme"
              :is-link="true"
              :is-left="isLeft" />
          </li>
          <li v-show="!isFiltered">
            <a
              href=""
              @click.prevent="showAllSchemes = !showAllSchemes">
              {{ showAllSchemes ? $t("schemeSelection.hideAllSchemes", { count: filteredSchemes.length }) : $t("schemeSelection.showAllSchemes", { count: filteredSchemes.length }) }}
            </a>
          </li>
          <li
            v-for="(_scheme, index) in filteredSchemes"
            v-show="showAllSchemes || isFiltered"
            :key="_scheme.uri + '-scheme-list-' + id + index">
            <font-awesome-icon
              v-b-tooltip.hover="{ title: $jskos.isContainedIn(_scheme, favoriteSchemes) ? $t('schemeSelection.starRemove') : $t('schemeSelection.starAdd'), delay: $util.delay.medium }"
              :class="$jskos.isContainedIn(_scheme, favoriteSchemes) ? 'starFavorite' : 'starNormal'"
              class="star"
              icon="star"
              @click="toggleFavoriteScheme(_scheme)" />
            <item-name
              :ref="(index == 0 && (isFiltered || !favoriteSchemes.length)) ? 'firstScheme' : null"
              :item="_scheme"
              :is-link="true"
              :is-left="isLeft" />
          </li>
        </ul>
        <!-- Concept quick selection title -->
        <div
          v-if="favoriteConcepts && favoriteConcepts.length"
          class="componentTitle"
          style="margin-top: 30px;">
          {{ $t("schemeSelection.conceptQuick") }}
        </div>
        <!-- Quick selection concepts -->
        <div class="conceptSchemeSelection-favoriteConcepts scrollable">
          <p
            v-for="concept in favoriteConcepts"
            :key="concept.uri + '-favorite-' + id">
            <item-name
              :item="concept"
              :is-left="isLeft"
              is-link
              force-side />
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ItemName from "./ItemName"
import ConceptSearch from "./ConceptSearch"

import _ from "lodash"

// Import mixins
import objects from "../mixins/objects"
import clickHandler from "../mixins/click-handler"

/**
 * Concept scheme selection component.
 *
 * If no scheme is selected, the full version of the component is shown, containing a list of schemes with a filter input, as well as a list of favorite concepts.
 * If a scheme is selected, a small version of the component is shown (containing only the scheme name and the concept search). By clicking the arrow on the top right of the component, the full version can be shown as a popover.
 */
export default {
  name: "ConceptSchemeSelection",
  components: { ItemName, ConceptSearch },
  mixins: [objects, clickHandler],
  props: {
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true
    },
  },
  data() {
    return {
      // Unique ID for this instance of the component.
      id: this.$util.generateID(),
      // Boolean whether popover is shown.
      popoverShown: false,
      // Filter text for scheme selection.
      schemeFilter: "",
      // Filter for language
      languageFilter: null,
      // Flag whether to show all schemes
      showAllSchemes: false,
    }
  },
  computed: {
    // Current scheme for this side.
    scheme() {
      return this.selected.scheme[this.isLeft]
    },
    isFiltered() {
      return this.schemeFilter != "" || this.languageFilter != null || this.filteredSchemes.length <= 10
    },
    filteredSchemes() {
      let filter = this.schemeFilter.toLowerCase()
      // Filter schemes, prepend favorites if filter is empty.
      return this.schemes.filter(
        scheme =>
          (
            Object.values(scheme.prefLabel || {}).find(label => label.toLowerCase().startsWith(filter)) ||
            (scheme.notation || []).find(notation => notation.toLowerCase().startsWith(filter))
          ) &&
          (
            this.languageFilter == null ||
            (scheme.languages || []).includes(this.languageFilter)
          )
      )
    },
    languageFilterOptions() {
      let options = [
        {
          value: null,
          text: this.$t("schemeSelection.allLanguages")
        }
      ]
      let languages = _.uniq([].concat(...this.schemes.map(scheme => scheme.languages || [])))
      options = options.concat(languages.map(lang => ({ value: lang, text: lang })))
      return options
    },
    clickHandlers() {
      return [{
        elements: [
          this.$refs.popover,
          document.getElementById(`${this.id}-expandButton`)
        ],
        handler: () => {
          // this.popoverShown
          this.hidePopover()
        }
      }]
    },
  },
  watch: {
    popoverShown(show) {
      // Focus input field when popover is shown
      if (show) {
        _.delay(() => {
          this.focusAndSelectInput()
        }, 100)
      }
    },
  },
  mounted() {
    // Enable shortcuts
    this.enableShortcuts()
  },
  methods: {
    shortcutHandler({ action, isLeft }) {
      if (this.isLeft === isLeft) {
        switch(action) {
          case "openSchemeSelection":
            if (this.scheme) {
              // Toggle popover when scheme is selected
              this.togglePopover()
            } else {
              // Focus input when no scheme is selected
              this.focusAndSelectInput()
            }
            break
          case "openConceptSearch":
            if (this.$refs.conceptSearch) {
              this.$refs.conceptSearch.focusSearch()
            }
            break
        }
      }
    },
    /**
     * Clears the scheme.
     */
    clearScheme() {
      this.$router.push({ path: this.getRouterUrl(null, this.isLeft) })
      // Focus and select input field with delay.
      _.delay(() => {
        this.focusAndSelectInput()
      }, 100)
    },
    /**
     * Selects first result from filtered scheme list and hide popover if necessary.
     */
    chooseFirst(event) {
      event.preventDefault()
      let scheme = _.get(this, "$refs.firstScheme[0].item")
      if (!scheme) {
        return
      }
      this.$router.push({ path: this.getRouterUrl(scheme, this.isLeft) })
      this.hidePopover()
    },
    /**
     * Sets concept search query to a certain string.
     */
    setConceptSearchQuery(query) {
      if (this.$refs.conceptSearch) {
        this.$refs.conceptSearch.setSearchQuery(query)
      }
    },
    toggleFavoriteScheme(scheme) {
      if (this.$jskos.isContainedIn(scheme, this.favoriteSchemes)) {
        // Remove from favorites
        this.$store.dispatch("removeSchemeFromFavorites", scheme)
      } else {
        // Add to favorites
        this.$store.dispatch("addSchemeToFavorites", scheme)
      }
      this.focusAndSelectInput()
    },
    focusAndSelectInput() {
      let input = this.$refs.input.$el
      if (input) {
        input.focus()
        input.select()
      }
    },
    showPopover() {
      this.$root.$emit("bv::show::popover", `${this.id}-expandButton`)
    },
    hidePopover() {
      this.$root.$emit("bv::hide::popover", `${this.id}-expandButton`)
    },
    togglePopover() {
      if (this.popoverShown) {
        this.hidePopover()
      } else {
        this.showPopover()
      }
    },
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.conceptSchemeSelection {
  position: relative;
}

.conceptSchemeSelection-collapsed {
  padding: 5px 5px 0 5px;
}
.conceptSchemeSelection-schemeName {
  padding-right: 30px;
}
.conceptSchemeSelection-conceptSearch {
  margin-top: 5px;
}

.conceptSchemeSelection-expandButton {
  position: absolute;
  top: 0px;
  right: 20px;
  font-size: 24px;
  height: 30px;
  width: 20px;
  text-align: center;
}

.conceptSchemeSelection-expanded {
  display: flex;
  flex-direction: column;
  padding: 5px 10px;
  // Make the component take up almost all of the visible height.
  min-height: 88vh;
  max-height: 88vh;
}

.conceptSchemeSelection-expanded > * {
  flex: none;
}

.conceptSchemeSelection-schemeList {
  flex: 1 1 auto;
  // Make sure scheme list doesn't get too small.
  min-height: 40vh;
  list-style: none;
  padding-left: 3px;
  margin-bottom: 0px;
}
.conceptSchemeSelection-schemeList > li, .conceptSchemeSelection-favoriteConcepts > p {
  padding-top: 8px;
}

.conceptSchemeSelection-favoriteConcepts {
  max-height: 300px;
  padding-top: 5px;
}

</style>

<style>
/* Global styles overriding bootstrap classes */
.conceptSchemeSelection .popover {
  min-width: 350px;
  max-width: 350px;
}
.conceptSchemeSelection .popover > .popover-body {
  padding: 4px 6px;
}
</style>
