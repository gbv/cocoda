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
              class="conceptSchemeSelection-filterPopover scrollable">
              <p class="fontWeight-heavy">
                {{ $t("schemeSelection.filter") }}
              </p>
              <p v-show="isFiltered">
                <a
                  ref="removeAllFiltersLink"
                  href=""
                  @click.prevent="onlyFavorites = false; onlyWithConcepts = false; schemeFilter = ''; registryFilter = availableRegistries.map(r => r.baseUrl); languageFilter = availableLanguages.concat([null]); typeFilter = availableTypes.concat([null]);">
                  {{ $t("schemeSelection.filtersRemove") }}
                </a>
              </p>
              <b-form-checkbox
                v-if="allowFavoriteSchemesFilter"
                v-model="onlyFavorites"
                size="sm">
                {{ $t("schemeSelection.filterOnlyFavorites") }}
              </b-form-checkbox>
              <b-form-checkbox
                v-model="onlyWithConcepts"
                size="sm">
                {{ $t("schemeSelection.filterOnlyWithConcepts") }}
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
                  @click.prevent="registryFilter = availableRegistries.map(r => r.baseUrl)">
                  {{ $t("schemeSelection.filterSelectAll") }}
                </a>•
                <a
                  href=""
                  @click.prevent="registryFilter = []">
                  {{ $t("schemeSelection.filterDeselectAll") }}
                </a>
                <b-form-checkbox
                  v-for="option in registryFilterOptions"
                  :key="`conceptSchemeSelection-filterPopover-${id}-registryFilter-${option.value}`"
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
        <virtual-list
          class="conceptSchemeSelection-schemeList scrollable"
          :data-key="'uri'"
          :data-sources="filteredSchemes"
          :data-component="itemComponent"
          :keeps="50"
          :item-class="'conceptSchemeSelection-schemeList-item'"
          :extra-props="{
            isLeft,
            hidePopover,
            favoriteSchemes,
            toggleFavoriteScheme,
          }">
          <template slot="footer">
            <div
              v-show="isFiltered && filteredSchemes.length < schemes.length"
              class="conceptSchemeSelection-schemeList-item">
              <a
                ref="showAllSchemesLink"
                href=""
                @click.prevent="onlyFavorites = false; schemeFilter = ''; registryFilter = availableRegistries.map(r => r.baseUrl); languageFilter = availableLanguages.concat([null]); typeFilter = availableTypes.concat([null]);">
                {{ $t("schemeSelection.showAllSchemes", { count: schemes.length }) }}
              </a>
            </div>
          </template>
        </virtual-list>
      </div>
    </div>
  </div>
</template>

<script>
import ItemName from "./ItemName.vue"
import ConceptSearch from "./ConceptSearch.vue"
import ComponentSettings from "./ComponentSettings.vue"
import VirtualList from "vue-virtual-scroll-list"
import ConceptSchemeSelectionItemVue from "./ConceptSchemeSelectionItem.vue"

import _ from "lodash"

// Import mixins
import objects from "@/mixins/cdk.js"
import clickHandler from "@/mixins/click-handler.js"
import hotkeys from "@/mixins/hotkeys.js"
import computed from "@/mixins/computed.js"

// KOS types
import kosTypes from "@/../config/kos-types.json"
import { getItem, getItems } from "@/items"

function getTitleAndBaseUrlForScheme(scheme) {
  return {
    baseUrl: scheme._registry?._config?.baseUrl || scheme._registry?._api?.api,
    title: scheme._registry?._config?.title,
  }
}

const schemeMatchesBaseUrl = (scheme, baseUrl) => {
  const { baseUrl: schemeBaseUrl, title } = getTitleAndBaseUrlForScheme(scheme)
  return baseUrl === schemeBaseUrl || !title && baseUrl === "other"
}

/**
 * Concept scheme selection component.
 *
 * If no scheme is selected, the full version of the component is shown, containing a list of schemes with a filter input, as well as a list of favorite concepts.
 * If a scheme is selected, a small version of the component is shown (containing only the scheme name and the concept search). By clicking the arrow on the top right of the component, the full version can be shown as a popover.
 */
export default {
  name: "ConceptSchemeSelection",
  components: { ItemName, ConceptSearch, ComponentSettings, VirtualList },
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
      // Flag whether to show only schemes that potentially have concepts
      onlyWithConcepts: false,
      // Item component for VirtualList
      itemComponent: ConceptSchemeSelectionItemVue,
      // TODO: To mitigate performance issues, we're updating these properties in a debounced watcher.
      // However, in the long term this should be solved in a better way. Maybe using the composition-api will help.
      shownRegistries: [],
      shownLanguages: [],
      shownTypes: [],
      registryFilterOptions: [],
      languageFilterOptions: [],
      typeFilterOptions: [],
      filteredSchemes: [],
    }
  },
  computed: {
    // Current scheme for this side.
    scheme() {
      return getItem(this.selected.scheme[this.isLeft])
    },
    // All schemes from store
    _schemes() {
      return getItems(this.schemes)
    },
    // Indicates whether there is a filter active.
    isFiltered() {
      return this.schemeFilter != "" || this.registryFilter.length < this.availableRegistries.length || (this.languageFilter.length - 1) < this.availableLanguages.length || (this.typeFilter.length - 1) < this.availableTypes.length || this.onlyFavorites || this.onlyWithConcepts
    },
    // Returns an array of all available registries
    availableRegistries() {
      const registriesByBaseUrl = {}
      this._schemes.forEach(scheme => {
        const { baseUrl, title } = getTitleAndBaseUrlForScheme(scheme)
        if (!baseUrl || !title || !registriesByBaseUrl.other) {
          registriesByBaseUrl.other = this.$t("schemeSelection.filterOther")
        } else if (baseUrl && !registriesByBaseUrl[baseUrl]) {
          registriesByBaseUrl[baseUrl] = title
        }
      })
      return Object.keys(registriesByBaseUrl).map(baseUrl => ({
        baseUrl,
        title: registriesByBaseUrl[baseUrl],
      }))
    },
    // Returns an array of all available languages.
    availableLanguages() {
      return _.uniq([].concat(...this._schemes.map(scheme => scheme.languages || []))).sort()
    },
    // Returns an array of all available scheme types.
    availableTypes() {
      return _.uniq(_.flatten(this._schemes.map(scheme => scheme.type || []))).filter(type => type && type != "http://www.w3.org/2004/02/skos/core#ConceptScheme")
    },
    allowFavoriteSchemesFilter() {
      return !!this.favoriteSchemes.find(s => this.$jskos.isContainedIn(s, this._schemes))
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
    allowFavoriteSchemesFilter(value) {
      if (!value) {
        this.onlyFavorites = false
      }
    },
    // TODO: Can we remove all this code duplication?
    schemes: {
      handler() {
        this.updateProperties()
      },
      deep: true,
    },
    schemeFilter: {
      handler() {
        this.updateProperties()
      },
      deep: true,
    },
    registryFilter: {
      handler() {
        this.updateProperties()
      },
      deep: true,
    },
    languageFilter: [
      function() {
        this.schemeFilter = ""
      },
      {
        handler() {
          this.updateProperties()
        },
        deep: true,
      },
    ],
    typeFilter: [
      function() {
        this.schemeFilter = ""
      },
      {
        handler() {
          this.updateProperties()
        },
        deep: true,
      },
    ],
    availableRegistries(newValue, oldValue) {
      if (oldValue.length !== newValue.length && this.registryFilter.length === oldValue.length) {
        this.registryFilter = newValue.slice()
      }
      this.updateProperties()
    },
    onlyFavorites() {
      this.schemeFilter = ""
      this.updateProperties()
    },
    onlyWithConcepts(value) {
      if (value) {
        this.onlyFavorites = false
      }
      this.updateProperties()
    },
    favoriteSchemes() {
      this.updateProperties()
    },
  },
  mounted() {
    this.updateProperties = _.debounce(this._updateProperties, 100)
    // Enable shortcuts
    this.enableShortcuts()
    // Set filters to all
    this.registryFilter = this.availableRegistries.map(r => r.baseUrl)
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
     * Method that will be called (debounced) to update certain properties for filtering.
     *
     * This was introduced to replace computed properties which were too resource-intensive.
     * See https://github.com/gbv/cocoda/issues/633
     *
     * TODO: Optimize filtering.
     * TODO: Reduce delay while filtering.
     * TODO: Long term, this should be done in a better and more elegant way.
     * TODO: Apparently, the `isContainedIn` calls take most of the computing time.
     */
    _updateProperties() {
      let schemes
      let options

      // ===== shownRegistries =====
      schemes = this._schemes.filter(
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
          ) &&
          (
            !this.onlyWithConcepts || this.hasConcepts(scheme)
          ),
      )
      this.shownRegistries = this.availableRegistries.filter(registry => schemes.find(scheme => schemeMatchesBaseUrl(scheme, registry.baseUrl)))

      // ===== shownLanguages =====
      schemes = this._schemes.filter(
        scheme =>
          (
            this.registryFilter.length == this.availableRegistries.length ||
            this.registryFilter.find(baseUrl => schemeMatchesBaseUrl(scheme, baseUrl))
          ) &&
          (
            (this.typeFilter.includes(null) && (scheme.type || []).length <= 1) ||
            _.intersection(scheme.type || [], this.typeFilter).length
          ) &&
          (
            !this.onlyFavorites || this.$jskos.isContainedIn(scheme, this.favoriteSchemes)
          ) &&
          (
            !this.onlyWithConcepts || this.hasConcepts(scheme)
          ),
      )
      this.shownLanguages = _.uniq([].concat(...schemes.map(scheme => scheme.languages || []))).sort()

      // ===== shownTypes =====
      schemes = this._schemes.filter(
        scheme =>
          (
            this.registryFilter.length == this.availableRegistries.length ||
            this.registryFilter.find(baseUrl => schemeMatchesBaseUrl(scheme, baseUrl))
          ) &&
          (
            (this.languageFilter.includes(null) && !(scheme.languages || []).length) ||
            _.intersection(scheme.languages || [], this.languageFilter).length
          ) &&
          (
            !this.onlyFavorites || this.$jskos.isContainedIn(scheme, this.favoriteSchemes)
          ) &&
          (
            !this.onlyWithConcepts || this.hasConcepts(scheme)
          ),
      )
      this.shownTypes = _.uniq(_.flatten(schemes.map(scheme => scheme.type || []))).filter(type => type && type != "http://www.w3.org/2004/02/skos/core#ConceptScheme")

      // ===== registryFilterOptions =====
      this.registryFilterOptions = this.shownRegistries.map(registry => ({ value: registry.baseUrl, text: registry.title }))

      // ===== languageFilterOptions =====
      options = []
      if (this._schemes.find(scheme => !scheme.languages || !scheme.languages.length)) {
        options.push({
          value: null,
          text: this.$t("schemeSelection.filterOther"),
        })
      }
      options = this.shownLanguages.map(lang => ({ value: lang, text: lang })).concat(options)
      this.languageFilterOptions = options

      // ===== typeFilterOptions =====
      options = []
      if (this._schemes.find(scheme => !scheme.type || scheme.type.length <= 1)) {
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
      this.typeFilterOptions = options

      // ===== filteredSchemes =====
      let filter = this.schemeFilter.toLowerCase()
      // Filter schemes, use either text filter or other filters
      if (filter) {
        const keywordsForScheme = (scheme) => _.flattenDeep(_.concat([], Object.values(scheme.prefLabel || {}), Object.values(scheme.altLabel || {}), scheme.notation || [])).map(k => k.toLowerCase())
        this.filteredSchemes = this._schemes.filter(
          scheme => keywordsForScheme(scheme).find(keyword => keyword.includes(filter)),
        ).sort((a, b) => {
          if (this.$jskos.notation(a).toLowerCase().startsWith(filter)) {
            return -1
          }
          if (this.$jskos.notation(b).toLowerCase().startsWith(filter)) {
            return 1
          }
          if (this.$jskos.prefLabel(a).toLowerCase().startsWith(filter)) {
            return -1
          }
          if (this.$jskos.prefLabel(b).toLowerCase().startsWith(filter)) {
            return 1
          }
          return 0
        })
      } else {
        this.filteredSchemes = this._schemes.filter(
          scheme =>
            (
              this.registryFilter.length == this.availableRegistries.length ||
              this.registryFilter.find(baseUrl => schemeMatchesBaseUrl(scheme, baseUrl))
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
            ) &&
            (
              !this.onlyWithConcepts || this.hasConcepts(scheme)
            ),
        )
      }
    },
    /**
     * Clears the scheme.
     */
    clearScheme() {
      this.setSelected({ isLeft: this.isLeft })
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
      const scheme = this.filteredSchemes[0]
      if (!scheme) {
        return
      }
      this.setSelected({ scheme, isLeft: this.isLeft })
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
      let input = this.$refs.input && this.$refs.input.$el
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
    hasConcepts(scheme) {
      return !scheme.concepts || scheme.concepts.length
    },
  },
}
</script>

<style lang="less" scoped>
@import "@/style/main.less";

.conceptSchemeSelection {
  position: relative;
}

.conceptSchemeSelection-collapsed {
  position: relative;
  padding: 0 5px 0 5px;
}
.conceptSchemeSelection-schemeName {
  padding-right: 30px;
  word-wrap: break-word;
  word-break: break-word;
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
  padding-left: 3px;
  margin-bottom: 0px;
  word-wrap: break-word;
}

.conceptSchemeSelection-filterPopover {
  word-break: break-all;
  user-select: none;
  // Popovers have a hardcoded max width of 276px and 12px padding on each side -> maximum width of content is 252px.
  min-width: 252px;
  max-width: 252px;
  max-height: 75vh;
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
.conceptSchemeSelection-schemeList-item {
  padding-top: 8px;
}
</style>
