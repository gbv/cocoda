<template>
  <div
    :id="`conceptSchemeSelection-${id}`"
    class="conceptSchemeSelection"
    style="overflow: visible;">
    <!-- ^^^ overflow: visible is necessary to properly shown concept search results which go over the edge of the component. -->
    <!-- Settings -->
    <component-settings />
    <!-- This is shown when a scheme is selected. -->
    <div
      v-if="scheme"
      class="conceptSchemeSelection-collapsed">
      <!-- Expand button -->
      <div
        :id="`${id}-expandButton`"
        v-b-tooltip.hover="{ title: popoverShown ? $t('schemeSelection.popoverHide') : $t('schemeSelection.popoverShow'), delay: defaults.delay.medium }"
        class="conceptSchemeSelection-expandButton button"
        @click="togglePopover">
        <font-awesome-icon
          :icon="popoverShown ? 'angle-left' : 'angle-down'" />
      </div>
      <!-- Name of scheme -->
      <div class="conceptSchemeSelection-schemeName">
        <!-- Favorite star -->
        <font-awesome-icon
          v-b-tooltip.hover="{ title: $jskos.isContainedIn(scheme, favoriteSchemes) ? $t('schemeSelection.starRemove') : $t('schemeSelection.starAdd'), delay: defaults.delay.medium }"
          :class="$jskos.isContainedIn(scheme, favoriteSchemes) ? 'starFavorite' : 'starNormal'"
          class="pointer"
          icon="star"
          @click="toggleFavoriteScheme(scheme)" />
        &nbsp;
        <!-- Name of scheme -->
        <item-name
          :item="scheme"
          :is-link="true"
          :is-left="isLeft"
          font-size="large" />
        <!-- License badge -->
        <span
          v-if="scheme.license && scheme.license.length"
          style="display: inline-block; margin: 0px 2px 0px 1px; height: 15px;">
          <img
            v-if="defaults.licenseBadges[scheme.license[0].uri]"
            :src="defaults.licenseBadges[scheme.license[0].uri]"
            style="vertical-align: text-top;">
        </span>
        <!-- Button to clear scheme -->
        <div
          v-b-tooltip.hover="{ title: $t('general.clearScheme'), delay: defaults.delay.medium }"
          class="button"
          style="display: inline-block; margin: -3px 2px 0px 2px;"
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
        class="conceptSchemeSelection-expanded"
        :class="{
          'conceptSchemeSelection-expanded-div': scheme == null,
          'conceptSchemeSelection-expanded-popover': scheme != null,
        }">
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
          <div
            :id="`conceptSchemeSelection-filterButton-${id}`"
            style="position: relative;"
            class="button">
            <font-awesome-icon icon="filter" />
            <!-- Small indicator whether a filter is currently applied. -->
            <span
              v-if="isFiltered"
              style="position: absolute; top: -10px; right: -5px;"
              class="text-success">
              •
            </span>
          </div>
          <b-popover
            :target="`conceptSchemeSelection-filterButton-${id}`"
            :show.sync="filterPopoverShow"
            triggers="click"
            placement="auto">
            <div
              ref="filterPopover"
              class="conceptSchemeSelection-filterPopover">
              <p class="fontWeight-heavy">
                {{ $t("schemeSelection.filter") }}
              </p>
              <p v-show="isFiltered">
                <a
                  ref="removeAllFiltersLink"
                  href=""
                  @click.prevent="onlyFavorites = false; schemeFilter = ''; registryFilter = availableRegistries.map(r => r.uri); languageFilter = availableLanguages.concat([null]); typeFilter = availableTypes.concat([null]);">
                  {{ $t("schemeSelection.filtersRemove") }}
                </a>
              </p>
              <b-form-checkbox
                v-if="allowFavoriteSchemesFilter"
                v-model="onlyFavorites"
                size="sm">
                {{ $t("schemeSelection.filterOnlyFavorites") }}
              </b-form-checkbox>
              <!-- Registry filter -->
              <div
                v-b-toggle="`conceptSchemeSelection-filterPopover-${id}-registryFilterCollapse`"
                class="button">
                <span class="when-opened"><font-awesome-icon icon="angle-down" /></span>
                <span class="when-closed"><font-awesome-icon icon="angle-right" /></span>
                {{ $t("schemeSelection.registryFilter") }}
                ({{ registryFilter.length == availableRegistries.length ? $t("general.all") : registryFilter.length }})
              </div>
              <!-- Registry filter selection -->
              <b-collapse :id="`conceptSchemeSelection-filterPopover-${id}-registryFilterCollapse`">
                <a
                  href=""
                  @click.prevent="registryFilter = availableRegistries.map(r => r.uri)">
                  {{ $t("schemeSelection.filterSelectAll") }}
                </a>•
                <a
                  href=""
                  @click.prevent="registryFilter = []">
                  {{ $t("schemeSelection.filterDeselectAll") }}
                </a>
                <b-form-checkbox
                  v-for="option in registryFilterOptions"
                  :key="`conceptSchemeSelection-filterPopover-${id}-languageFilter-${option.value}`"
                  v-model="registryFilter"
                  :value="option.value"
                  size="sm"
                  class="fontSize-normal"
                  stacked
                  @change="focusAndSelectInput">
                  {{ option.text }}
                </b-form-checkbox>
              </b-collapse>
              <!-- Language filter -->
              <div
                v-b-toggle="`conceptSchemeSelection-filterPopover-${id}-languageFilterCollapse`"
                class="button">
                <span class="when-opened"><font-awesome-icon icon="angle-down" /></span>
                <span class="when-closed"><font-awesome-icon icon="angle-right" /></span>
                {{ $t("schemeSelection.languageFilter") }}
                ({{ languageFilter.length - 1 == availableLanguages.length ? $t("general.all") : languageFilter.length }})
              </div>
              <!-- Language filter selection -->
              <b-collapse :id="`conceptSchemeSelection-filterPopover-${id}-languageFilterCollapse`">
                <a
                  href=""
                  @click.prevent="languageFilter = availableLanguages.concat([null])">
                  {{ $t("schemeSelection.filterSelectAll") }}
                </a>•
                <a
                  href=""
                  @click.prevent="languageFilter = []">
                  {{ $t("schemeSelection.filterDeselectAll") }}
                </a>
                <b-form-checkbox
                  v-for="option in languageFilterOptions"
                  :key="`conceptSchemeSelection-filterPopover-${id}-languageFilter-${option.value}`"
                  v-model="languageFilter"
                  :value="option.value"
                  size="sm"
                  class="fontSize-normal"
                  stacked
                  @change="focusAndSelectInput">
                  {{ option.text }}
                </b-form-checkbox>
              </b-collapse>
              <!-- Scheme type filter -->
              <div
                v-b-toggle="`conceptSchemeSelection-filterPopover-${id}-typeFilterCollapse`"
                class="button">
                <span class="when-opened"><font-awesome-icon icon="angle-down" /></span>
                <span class="when-closed"><font-awesome-icon icon="angle-right" /></span>
                {{ $t("schemeSelection.typeFilter") }}
                ({{ typeFilter.length - 1 == availableTypes.length ? $t("general.all") : typeFilter.length }})
              </div>
              <!-- Language filter selection -->
              <b-collapse :id="`conceptSchemeSelection-filterPopover-${id}-typeFilterCollapse`">
                <a
                  href=""
                  @click.prevent="typeFilter = availableTypes.concat([null])">
                  {{ $t("schemeSelection.filterSelectAll") }}
                </a>•
                <a
                  href=""
                  @click.prevent="typeFilter = []">
                  {{ $t("schemeSelection.filterDeselectAll") }}
                </a>
                <b-form-checkbox
                  v-for="option in typeFilterOptions"
                  :key="`conceptSchemeSelection-filterPopover-${id}-typeFilter-${option.value}`"
                  v-model="typeFilter"
                  :value="option.value"
                  size="sm"
                  class="fontSize-normal"
                  stacked
                  @change="focusAndSelectInput">
                  {{ option.text }}
                </b-form-checkbox>
              </b-collapse>
            </div>
          </b-popover>
        </b-form>
        <!-- List of all schemes, showing favorites first -->
        <ul class="conceptSchemeSelection-schemeList scrollable">
          <li
            v-for="(_scheme, index) in filteredSchemes"
            :key="_scheme.uri + '-scheme-list-' + id + index">
            <font-awesome-icon
              v-b-tooltip.hover="{ title: $jskos.isContainedIn(_scheme, favoriteSchemes) ? $t('schemeSelection.starRemove') : $t('schemeSelection.starAdd'), delay: defaults.delay.medium }"
              :class="$jskos.isContainedIn(_scheme, favoriteSchemes) ? 'starFavorite' : 'starNormal'"
              class="pointer"
              icon="star"
              @click="toggleFavoriteScheme(_scheme)" />
            <item-name
              :ref="index == 0 ? 'firstScheme' : null"
              :item="_scheme"
              :is-link="true"
              :is-left="isLeft"
              @click.native="hidePopover" />
          </li>
          <li v-show="isFiltered && filteredSchemes.length < schemes.length">
            <a
              ref="showAllSchemesLink"
              href=""
              @click.prevent="onlyFavorites = false; schemeFilter = ''; registryFilter = availableRegistries.map(r => r.uri); languageFilter = availableLanguages.concat([null]); typeFilter = availableTypes.concat([null]);">
              {{ $t("schemeSelection.showAllSchemes", { count: schemes.length }) }}
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import ItemName from "./ItemName.vue"
import ConceptSearch from "./ConceptSearch.vue"
import ComponentSettings from "./ComponentSettings.vue"

import _ from "lodash"

// Import mixins
import objects from "../mixins/cdk.js"
import clickHandler from "../mixins/click-handler.js"
import hotkeys from "../mixins/hotkeys.js"
import computed from "../mixins/computed.js"

// KOS types
import kosTypes from "../../config/kos-types.json"

/**
 * Concept scheme selection component.
 *
 * If no scheme is selected, the full version of the component is shown, containing a list of schemes with a filter input, as well as a list of favorite concepts.
 * If a scheme is selected, a small version of the component is shown (containing only the scheme name and the concept search). By clicking the arrow on the top right of the component, the full version can be shown as a popover.
 */
export default {
  name: "ConceptSchemeSelection",
  components: { ItemName, ConceptSearch, ComponentSettings },
  mixins: [objects, clickHandler, hotkeys, computed],
  props: {
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      // Unique ID for this instance of the component.
      id: this.generateID(),
      // Boolean whether popover is shown.
      popoverShown: false,
      // Whether filter popover is shown.
      filterPopoverShow: false,
      // Filter text for scheme selection.
      schemeFilter: "",
      // Filter for registry
      registryFilter: [],
      // Filter for language (access only via computed prop languageFilter)
      languageFilter: [],
      // Filter for scheme types (access only via computed prop typeFilter)
      typeFilter: [],
      // Flag whether to show only favorite concepts
      onlyFavorites: true,
    }
  },
  computed: {
    // Current scheme for this side.
    scheme() {
      return this.selected.scheme[this.isLeft]
    },
    // Indicates whether there is a filter active.
    isFiltered() {
      return this.schemeFilter != "" || this.registryFilter.length < this.availableRegistries.length || (this.languageFilter.length - 1) < this.availableLanguages.length || (this.typeFilter.length - 1) < this.availableTypes.length || this.onlyFavorites
    },
    // Returns schemes with filters applied.
    filteredSchemes() {
      let filter = this.schemeFilter.toLowerCase()
      // Filter schemes, use either text filter or other filters
      if (filter) {
        const keywordsForScheme = (scheme) => _.flattenDeep(_.concat([], Object.values(scheme.prefLabel || {}), Object.values(scheme.altLabel || {}), scheme.notation || [])).map(k => k.toLowerCase())
        return this.schemes.filter(
          scheme => keywordsForScheme(scheme).find(keyword => keyword.startsWith(filter)),
        )
      }
      return this.schemes.filter(
        scheme =>
          (
            this.registryFilter.length == this.availableRegistries.length ||
            this.registryFilter.find(uri => this.$jskos.compare({ uri }, scheme._registry))
          ) &&
          (
            (this.languageFilter.includes(null) && !(scheme.languages || []).length) ||
            _.intersection(scheme.languages || [], this.languageFilter).length
          ) &&
          (
            (this.typeFilter.includes(null) && (scheme.type || []).length <= 1) ||
            _.intersection(scheme.type || [], this.typeFilter).length
          ) &&
          (
            !this.onlyFavorites || this.$jskos.isContainedIn(scheme, this.favoriteSchemes)
          ),
      )
    },
    // Returns an array of all available registries
    availableRegistries() {
      return this.config.registries.filter(registry => registry.has.concepts)
    },
    // Returns an array of all available languages.
    availableLanguages() {
      return _.uniq([].concat(...this.schemes.map(scheme => scheme.languages || []))).sort()
    },
    // Returns an array of all available registries with other filters applied (faceted browsing).
    shownRegistries() {
      let schemes = this.schemes.filter(
        scheme =>
          (
            (this.languageFilter.includes(null) && !(scheme.languages || []).length) ||
            _.intersection(scheme.languages || [], this.languageFilter).length
          ) &&
          (
            (this.typeFilter.includes(null) && (scheme.type || []).length <= 1) ||
            _.intersection(scheme.type || [], this.typeFilter).length
          ) &&
          (
            !this.onlyFavorites || this.$jskos.isContainedIn(scheme, this.favoriteSchemes)
          ),
      )
      return this.availableRegistries.filter(registry => schemes.find(scheme => this.$jskos.compare(registry, scheme._registry)))
    },
    // Returns an array of available registry filter options.
    registryFilterOptions() {
      return this.shownRegistries.map(registry => ({ value: registry.uri, text: this.$jskos.prefLabel(registry) }))
    },
    // Returns an array of all available languages with other filters applied (faceted browsing).
    shownLanguages() {
      let schemes = this.schemes.filter(
        scheme =>
          (
            this.registryFilter.length == this.availableRegistries.length ||
            this.registryFilter.find(uri => this.$jskos.compare({ uri }, scheme._registry))
          ) &&
          (
            (this.typeFilter.includes(null) && (scheme.type || []).length <= 1) ||
            _.intersection(scheme.type || [], this.typeFilter).length
          ) &&
          (
            !this.onlyFavorites || this.$jskos.isContainedIn(scheme, this.favoriteSchemes)
          ),
      )
      return _.uniq([].concat(...schemes.map(scheme => scheme.languages || []))).sort()
    },
    // Returns an array of available language filter options based on `shownLanguages`.
    languageFilterOptions() {
      let options = []
      if (this.schemes.find(scheme => !scheme.languages || !scheme.languages.length)) {
        options.push({
          value: null,
          text: this.$t("schemeSelection.filterOther"),
        })
      }
      options = this.shownLanguages.map(lang => ({ value: lang, text: lang })).concat(options)
      return options
    },
    // Returns an array of all available scheme types.
    availableTypes() {
      return _.uniq(_.flatten(this.schemes.map(scheme => scheme.type || []))).filter(type => type && type != "http://www.w3.org/2004/02/skos/core#ConceptScheme")
    },
    // Returns an array of all available scheme types with other filters applied (faceted browsing).
    shownTypes() {
      let schemes = this.schemes.filter(
        scheme =>
          (
            this.registryFilter.length == this.availableRegistries.length ||
            this.registryFilter.find(uri => this.$jskos.compare({ uri }, scheme._registry))
          ) &&
          (
            (this.languageFilter.includes(null) && !(scheme.languages || []).length) ||
            _.intersection(scheme.languages || [], this.languageFilter).length
          ) &&
          (
            !this.onlyFavorites || this.$jskos.isContainedIn(scheme, this.favoriteSchemes)
          ),
      )
      return _.uniq(_.flatten(schemes.map(scheme => scheme.type || []))).filter(type => type && type != "http://www.w3.org/2004/02/skos/core#ConceptScheme")
    },
    // Returns an array of available scheme type filter options based on `shownTypes`.
    typeFilterOptions() {
      let options = []
      if (this.schemes.find(scheme => !scheme.type || scheme.type.length <= 1)) {
        options.push({
          value: null,
          text: this.$t("schemeSelection.filterOther"),
        })
      }
      options = this.shownTypes.map(type => ({ value: type, text: type })).concat(options)
      // Look up names for types
      for (let option of options) {
        let type = kosTypes.find(t => t.uri == option.value)
        if (type) {
          option.text = this.$jskos.prefLabel(type, { language: this.locale })
        }
      }
      return options
    },
    allowFavoriteSchemesFilter() {
      return !!this.favoriteSchemes.find(s => this.$jskos.isContainedIn(s, this.schemes))
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
    onlyFavorites() {
      this.schemeFilter = ""
    },
    languageFilter() {
      this.schemeFilter = ""
    },
    typeFilter() {
      this.schemeFilter = ""
    },
    allowFavoriteSchemesFilter(value) {
      if (!value) {
        this.onlyFavorites = false
      }
    },
  },
  mounted() {
    // Enable shortcuts
    this.enableShortcuts()
    // Set filters to all
    this.registryFilter = this.availableRegistries.map(r => r.uri)
    this.languageFilter = this.availableLanguages.concat([null])
    this.typeFilter = this.availableTypes.concat([null])
    if (!this.allowFavoriteSchemesFilter) {
      this.onlyFavorites = false
    }
  },
  methods: {
    clickHandlers() {
      return [
        {
          elements: [
            this.$refs.popover,
            document.getElementById(`${this.id}-expandButton`),
            this.$refs.showAllSchemesLink,
            // Also include filter popover
            document.getElementById(`conceptSchemeSelection-filterButton-${this.id}`),
            this.$refs.filterPopover,
            this.$refs.removeAllFiltersLink,
          ],
          handler: () => {
            // this.popoverShown
            this.hidePopover()
          },
        },
        {
          elements: [
            document.getElementById(`conceptSchemeSelection-filterButton-${this.id}`),
            this.$refs.filterPopover,
            this.$refs.removeAllFiltersLink,
          ],
          handler: () => {
            this.filterPopoverShow = false
          },
        },
      ]
    },
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
    setConceptSearchQuery(query, open = false) {
      if (this.$refs.conceptSearch) {
        this.$refs.conceptSearch.setSearchQuery(query, open)
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
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.conceptSchemeSelection {
  position: relative;
}

.conceptSchemeSelection-collapsed {
  position: relative;
  padding: 0 5px 0 5px;
}
.conceptSchemeSelection-schemeName {
  padding-right: 30px;
}
.conceptSchemeSelection-conceptSearch {
  margin-top: 5px;
  margin-right: 10px;
}

.conceptSchemeSelection-expandButton {
  position: absolute;
  top: 0px;
  right: 12px;
  font-size: 24px;
  height: 30px;
  width: 20px;
  text-align: center;
}

.conceptSchemeSelection-popover {
  height: 100%;
  position: relative;
}

.conceptSchemeSelection-expanded {
  display: flex;
  flex-direction: column;
  padding: 5px 10px;
}

.conceptSchemeSelection-expanded-div {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
.conceptSchemeSelection-expanded-popover {
  // Make the component take up almost all of the visible height.
  min-height: 90vh;
  max-height: 90vh;
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
.conceptSchemeSelection-schemeList > li {
  padding-top: 8px;
}

.conceptSchemeSelection-filterPopover {
  word-break: break-all;
  user-select: none;
  // Popovers have a hardcoded max width of 276px and 12px padding on each side -> maximum width of content is 252px.
  min-width: 252px;
  max-width: 252px;
}
.conceptSchemeSelection-filterPopover .custom-control {
  height: unset !important;
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
.conceptSchemeSelection .componentSettings {
  right: 3px;
  bottom: 2px;
}
</style>
