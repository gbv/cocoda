<template>
  <div id="mappingBrowser">
    <!-- Settings -->
    <component-settings :tooltip="$t('mappingBrowser.settingsButton')" />
    <tabs
      v-model="tab"
      style="position: absolute; top: 0; bottom: 0; left: 0; right: 0;"
      fill>
      <tab
        v-if="concordancesShown"
        :title="$t('mappingBrowser.concordances')"
        @click="handleClick">
        <template v-if="concordances && concordances.length">
          <div style="display: flex; padding: 0px 4px;">
            <div
              v-for="field in concordanceTableFields"
              :key="field.key"
              :style="'padding: 0px 10px 0px 0px; flex: 0 0 ' + field.width">
              <b-input
                v-if="field.key == 'from'"
                v-model="concordanceFilter.from"
                type="text"
                style="width: 55%; display: inline-block;"
                size="sm"
                :placeholder="$t('mappingBrowser.from')" />
              <b-input
                v-if="field.key == 'to'"
                v-model="concordanceFilter.to"
                type="text"
                style="width: 75%; display: inline-block;"
                size="sm"
                :placeholder="$t('mappingBrowser.to')" />
              <b-input
                v-if="field.key == 'creator'"
                v-model="concordanceFilter.creator"
                type="text"
                style="width: 80%; display: inline-block;"
                size="sm"
                :placeholder="$t('mappingBrowser.creator')" />
              <span
                v-if="concordanceFilter[field.key] != null"
                v-b-tooltip.hover="{ title: 'clear filter', delay: defaults.delay.medium }"
                icon="times"
                class="button mappingBrowser-from650"
                @click="concordanceFilter[field.key] = ''">
                x
              </span>
              <b-button
                v-if="field.key == 'from'"
                class="mappingBrowser-from750"
                variant="link"
                size="sm"
                style="padding-right: 0; margin-right: -5px;"
                tabindex="-1"
                @click="[concordanceFilter.from, concordanceFilter.to] = [concordanceFilter.to, concordanceFilter.from]">
                <font-awesome-icon icon="exchange-alt" />
              </b-button>
            </div>
          </div>
          <div style="flex: 1; height: 0; position: relative;">
            <flexible-table
              style="position: absolute; top: 0; bottom: 0; left: 0; right: 0;"
              :fields="concordanceTableFields"
              :items="concordanceTableItems">
              <span
                slot="download"
                slot-scope="{ value }">
                <span
                  v-for="(distribution, index) in value"
                  :key="index">
                  <a
                    v-if="nameOfDistribution(distribution)"
                    :href="distribution.download">
                    {{ nameOfDistribution(distribution) }}
                  </a></span>
              </span>
              <span
                slot="mappings"
                slot-scope="{ value }">
                {{ (parseInt(value) || "?").toLocaleString() }}
              </span>
              <span
                slot="actions"
                slot-scope="{ item }">
                <font-awesome-icon
                  v-b-tooltip.hover="{ title: $t('mappingBrowser.showMappings'), delay: defaults.delay.medium }"
                  icon="external-link-square-alt"
                  class="button"
                  @click="showMappingsForConcordance(item.concordance)" />
              </span>
              <span
                slot="from"
                slot-scope="{ value }">
                <item-name
                  :item="value"
                  :show-text="false"
                  :is-link="value.__SAVED__ === true"
                  :is-left="true"
                  font-size="sm" />
              </span>
              <span
                slot="to"
                slot-scope="{ value }">
                <item-name
                  :item="value"
                  :show-text="false"
                  :is-link="value.__SAVED__"
                  :is-left="false"
                  font-size="sm" />
              </span>
            </flexible-table>
          </div>
          <div style="display: flex;">
            <p style="font-weight: bold; flex: 1; padding-left: 5px;">
              {{ concordanceTableItems.length }} {{ $t("mappingBrowser.concordances") }}
            </p>
            <p style="text-align: right; font-weight: bold; padding-right: 45px;">
              {{ $t("mappingBrowser.total") }}: {{ concordanceTableItems.reduce((total, current) => {
                return total + parseInt(current.mappings) || 0
              }, 0).toLocaleString() }}
            </p>
            <data-modal-button
              v-if="concordances && concordances.length > 0"
              :data="concordances"
              :position-right="20"
              :url="concordanceUrls"
              type="concordance" />
          </div>
        </template>
      </tab>
      <tab
        :title="$t('mappingBrowser.mappingSearch')"
        @click="handleClick">
        <div style="flex: none; padding: 0px 4px;">
          <div style="display: flex; flex-wrap: wrap;">
            <b-input
              v-model="searchFilterInput.fromScheme"
              :state="searchFilterInput.fromScheme == '' ? null : searchFromScheme != null"
              style="flex: 1; margin: 3px; min-width: 40px;"
              size="sm"
              :placeholder="$t('mappingBrowser.searchSourceScheme')"
              @keyup.native="lockScheme[true] = false"
              @keyup.enter.native="searchClicked"
              @drop="!lockScheme[true] && drop($event, { scheme: 'searchFilterInput.fromScheme', concept: 'searchFilterInput.fromNotation' })" />
            <div
              v-b-tooltip="lockScheme[true] ? $t('mappingBrowser.unlockScheme') : $t('mappingBrowser.lockScheme')"
              class="button"
              style="flex: none; font-size: 12px; margin: auto 8px auto 2px;"
              @click="lockScheme[true] = !lockScheme[true]">
              <font-awesome-icon :icon="lockScheme[true] ? 'lock' : 'lock-open'" />
            </div>
            <b-input
              v-model="searchFilterInput.fromNotation"
              style="flex: 2; margin: 3px; min-width: 60px;"
              size="sm"
              :placeholder="$t('mappingBrowser.searchSourceNotation')"
              @keyup.enter.native="searchClicked"
              @drop="drop($event, { scheme: lockScheme[true] ? null : 'searchFilterInput.fromScheme', concept: 'searchFilterInput.fromNotation' })" />
            <div
              class="button"
              style="flex: none; font-size: 16px; margin: auto 5px;"
              @click="swapClicked">
              <font-awesome-icon icon="exchange-alt" />
            </div>
            <b-input
              v-model="searchFilterInput.toScheme"
              :state="searchFilterInput.toScheme == '' ? null : searchToScheme != null"
              style="flex: 1; margin: 3px; min-width: 40px;"
              size="sm"
              :placeholder="$t('mappingBrowser.searchTargetScheme')"
              @keyup.native="lockScheme[false] = false"
              @keyup.enter.native="searchClicked"
              @drop="!lockScheme[false] && drop($event, { scheme: 'searchFilterInput.toScheme', concept: 'searchFilterInput.toNotation' })" />
            <div
              v-b-tooltip="lockScheme[false] ? $t('mappingBrowser.unlockScheme') : $t('mappingBrowser.lockScheme')"
              class="button"
              style="flex: none; font-size: 12px; margin: auto 8px auto 2px;"
              @click="lockScheme[false] = !lockScheme[false]">
              <font-awesome-icon :icon="lockScheme[false] ? 'lock' : 'lock-open'" />
            </div>
            <b-input
              v-model="searchFilterInput.toNotation"
              style="flex: 2; margin: 3px; min-width: 60px;"
              size="sm"
              :placeholder="$t('mappingBrowser.searchTargetNotation')"
              @keyup.enter.native="searchClicked"
              @drop="drop($event, { scheme: lockScheme[false] ? null : 'searchFilterInput.toScheme', concept: 'searchFilterInput.toNotation' })" />
            <b-button
              style="flex: none; margin: 3px;"
              variant="primary"
              size="sm"
              @click="searchClicked">
              <font-awesome-icon icon="search" />{{ $t("mappingBrowser.searchSubmit") }}
            </b-button>
            <div
              v-b-tooltip="{
                title: $t(`mappingBrowser.${searchFilterExtended ? 'searchCollapse' : 'searchExtend'}`),
                placement: searchFilterExtended ? 'left' : 'bottom',
              }"
              class="button fontSize-large"
              style="flex: none; margin: 3px; position: relative; width: 20px;"
              @click="searchFilterExtended = !searchFilterExtended">
              <font-awesome-icon
                v-if="searchFilterExtended"
                style="vertical-align: -0.3em;"
                icon="chevron-up" />
              <font-awesome-icon
                v-else
                style="vertical-align: -0.3em;"
                icon="filter" />
              <!-- Small indicator whether a filter is currently applied. -->
              <span
                v-if="!searchFilterExtended && (searchFilterInput.creator || searchFilterInput.type || searchFilterInput.partOf)"
                style="position: absolute; top: -9px; right: -3px;"
                class="text-success">
                •
              </span>
            </div>
            <template v-if="searchFilterExtended">
              <div style="flex-basis: 100%; height: 0;" />
              <div style="text-align: right; flex: none; margin: auto 5px;">
                {{ $t("mappingBrowser.creator") }}:
              </div>
              <div style="flex: 2; margin: 3px; display: flex; align-items: center;">
                <b-input
                  v-model="searchFilterInput.creator"
                  size="sm"
                  :placeholder="$t('mappingBrowser.creator')"
                  @keyup.enter.native="searchClicked" />
                <div
                  v-if="authorized && searchFilterInput.creator != userUris.join('|')"
                  v-b-tooltip.hover="{ title: $t('mappingBrowser.searchInsertSelfIntoCreator'), delay: defaults.delay.medium }"
                  class="button"
                  style="margin-left: 2px;"
                  @click="searchFilterInput.creator = userUris.join('|')">
                  <font-awesome-icon icon="user" />
                </div>
              </div>
              <div style="text-align: right; flex: none; margin: auto 5px;">
                {{ $t("mappingBrowser.searchType") }}:
              </div>
              <b-select
                v-model="searchFilterInput.type"
                style="flex: 3; margin: 3px;"
                size="sm"
                :options="typeOptions"
                @keyup.enter.native="searchClicked" />
              <div
                v-b-tooltip.hover="{ title: $t('mappingBrowser.searchBidirectionalTooltip'), delay: defaults.delay.medium }"
                style="text-align: right; flex: none; margin: auto 5px;">
                {{ $t("mappingBrowser.searchBidirectional") }}:
                <b-form-checkbox
                  v-model="searchFilterInput.direction"
                  style="display: inline-block;"
                  size="sm"
                  value="both"
                  unchecked-value=""
                  @keyup.enter.native="searchClicked" />
              </div>
              <div style="flex-basis: 100%; height: 0;" />
              <div style="text-align: right; flex: none; margin: auto 5px;">
                {{ $t("mappingBrowser.concordance") }}:
              </div>
              <b-form-select
                v-model="searchFilterInput.partOf"
                style="flex: 2; margin: 3px;"
                size="sm"
                :options="concordanceOptions"
                @keyup.enter.native="searchClicked" />
              <!-- Registry selection -->
              <registry-notation
                v-for="registry in searchRegistries"
                :key="registry.uri"
                :registry="registry"
                :disabled="!showRegistry[registry.uri]"
                class="mappingBrowser-search-registryNotation"
                :class="{
                  pointer: !$jskos.compare(registry, currentRegistry)
                }"
                @click.native="showRegistry[registry.uri] = !showRegistry[registry.uri]"
                @mouseover.native="hoveredRegistry = registry"
                @mouseout.native="hoveredRegistry = null" />
              <b-button
                style="flex: none; margin: 3px;"
                variant="danger"
                size="sm"
                @click="clearSearchFilter">
                <font-awesome-icon icon="ban" />
                {{ $t("mappingBrowser.searchClear") }}
              </b-button>
            </template>
          </div>
        </div>
        <mapping-browser-table
          v-if="searchSections.length"
          class="mappingBrowser-search-table"
          :sections="searchSections"
          :search-limit="componentSettings.resultLimit"
          :show-editing-tools="showEditingTools"
          :show-cocoda-link="showCocodaLink"
          @pageChange="changePage('search', $event)">
          <!-- Share button -->
          <!-- TODO: Figure out new place for this. -->
          <!-- <div
            id="mappingBrowser-search-shareButton"
            class="button">
            <font-awesome-icon icon="share-alt-square" /> {{ $t("mappingBrowser.searchShareLabel") }}
          </div>
          <b-popover
            :show.sync="searchShareShow"
            target="mappingBrowser-search-shareButton"
            triggers="click"
            placement="bottomleft">
            <div
              ref="searchSharePopover">
              <p><b>{{ $t("mappingBrowser.searchShareTitle") }}</b></p>
              <p style="user-select: none;">
                <b-form-checkbox
                  v-model="searchShareIncludeSelected">
                  {{ $t("mappingBrowser.searchShareInclude") }}
                </b-form-checkbox>
              </p>
              <p id="mappingBrowser-search-shareLinkInput">
                <pre><code>{{ searchShareLink }}</code></pre>
              </p>
              <p style="text-align: right;">
                <b-button
                  size="sm"
                  variant="primary"
                  @click="copyToClipboard('mappingBrowser-search-shareLinkInput')">
                  {{ $t("mappingBrowser.searchShareCopy") }}
                </b-button>
              </p>
            </div>
          </b-popover> -->
        </mapping-browser-table>
        <div
          v-else
          class="fontWeight-heavy"
          style="text-align: center; margin-top: 20px;">
          {{ $t("search.noResults") }}
        </div>
      </tab>
      <tab
        v-if="showNavigator"
        :title="$t('mappingBrowser.mappingNavigator')"
        @click="handleClick">
        <div
          v-show="!selected.concept[true] && !selected.concept[false]"
          class="noItems fontWeight-heavy">
          {{ $t("mappingBrowser.chooseConcept") }}
        </div>
        <div
          v-if="selected.concept[true] || selected.concept[false]"
          class="mappingBrowser-navigator-results">
          <div
            v-for="group of registryGroups"
            :key="`mappingBrowser-registryGroup-${group.stored}`"
            class="mappingBrowser-registryGroup">
            <div class="mappingBrowser-registryGroup-header">
              <span
                :id="`registryGroup-${group.stored}`"
                class="mappingBrowser-registryGroup-title fontWeight-heavy">
                {{ group.label }}
              </span>
              <span
                style="white-space: nowrap; float: right">
                <registry-notation
                  v-for="registry in group.registries.filter(registry => $jskos.isContainedIn(registry, navigatorRegistries))"
                  :key="registry.uri"
                  :registry="registry"
                  :disabled="!showRegistry[registry.uri]"
                  class="mappingBrowser-registryGroup-notation"
                  :class="{
                    pointer: !$jskos.compare(registry, currentRegistry)
                  }"
                  @click.native="showRegistry[registry.uri] = !showRegistry[registry.uri]"
                  @mouseover.native="hoveredRegistry = registry"
                  @mouseout.native="hoveredRegistry = null" />
              </span>
            </div>
            <mapping-browser-table
              v-if="(group.stored ? navigatorSectionsDatabases : navigatorSectionsRecommendations).length"
              :sections="group.stored ? navigatorSectionsDatabases : navigatorSectionsRecommendations"
              :search-limit="componentSettings.resultLimit"
              @pageChange="changePage('navigator', $event)" />
            <div
              v-else-if="selected.concept[true] || selected.concept[false]"
              class="fontWeight-heavy"
              style="text-align: center; margin-top: 20px;">
              {{ $t("search.noResults") }}
            </div>
          </div>
        </div>
      </tab>
    </tabs>
  </div>
</template>

<script>
import MappingBrowserTable from "./MappingBrowserTable"
import FlexibleTable from "vue-flexible-table"
import RegistryNotation from "./RegistryNotation"
import ItemName from "./ItemName"
import ComponentSettings from "./ComponentSettings"
import DataModalButton from "./DataModalButton"
import _ from "lodash"
// Only use for cancel token generation!
import axios from "axios"

// Import mixins
import auth from "../mixins/auth"
import objects from "../mixins/objects"
import dragandrop from "../mixins/dragandrop"
import clickHandler from "../mixins/click-handler"
import computed from "../mixins/computed"

export default {
  name: "MappingBrowser",
  components: { FlexibleTable, MappingBrowserTable, RegistryNotation, ItemName, ComponentSettings, DataModalButton },
  mixins: [auth, objects, dragandrop, clickHandler, computed],
  props: {
    /**
     * If false, the Mapping Navigator will be hidden.
     */
    showNavigator: {
      type: Boolean,
      default: true,
    },
    /**
     * If false, no editing tools will be shown (gets relayed to MappingBrowserTable).
     */
    showEditingTools: {
      type: Boolean,
      default: true,
    },
    /**
     * If true, a link to Cocoda for mappings will be shown (gets relayed to MappingBrowserTable).
     */
    showCocodaLink: {
      type: Boolean,
      default: false,
    },
    /**
     * Override showRegistry from settings
     */
    showRegistryOverride: {
      type: Array,
      default: null,
    },
  },
  data() {
    return {
      tab: 0,
      concordancesLoaded: false,
      /** Whether tab was automatically switched to Mapping Navigator once.
       *  Will not switch automatically again afterwards.
       */
      hasSwitchedToNavigator: false,
      searchShareShow: false,
      searchShareLinkPart: "",
      searchShareIncludeSelected: false,
      registryGroupShow: {},
      concordanceFilter: {
        from: "",
        to: "",
        creator: "",
      },
      // Search filter directly from input
      searchFilterInput: null,
      // Search filter to be set when "Search" is clicked
      searchFilter: null,
      searchFilterExtended: false,
      searchPages: {},
      searchResults: {},
      searchLoading: {},
      searchCancelToken: {},
      // Array of objects with registryUri and page (as parameters for search)
      searchNeedsRefresh: [],
      // Whether fromScheme/toScheme are locked to the selected scheme
      lockScheme: {
        [true]: true,
        [false]: true,
      },
      previousSelected: {
        concept: {
          [true]: null,
          [false]: null,
        },
        scheme: {
          [true]: null,
          [false]: null,
        },
      },
      navigatorPages: {},
      navigatorResults: {},
      navigatorLoading: {},
      // Array of booleans and/or registry URIs (as parameters for navigatorRefresh)
      navigatorNeedsRefresh: [],
      navigatorCancelToken: {},
      /** Currently hovered registry */
      hoveredRegistry: null,
      /** An object for refresh timers for registries */
      refreshTimers: {},
    }
  },
  computed: {
    concordanceTableFields() {
      return [
        {
          key: "from",
          label: this.$t("mappingBrowser.from"),
          width: "13%",
          minWidth: "",
          sortable: true,
          align: "left",
          titleClass: "test",
        },
        {
          key: "to",
          label: this.$t("mappingBrowser.to"),
          width: "9%",
          minWidth: "",
          sortable: true,
          align: "left",
        },
        {
          key: "description",
          label: this.$t("mappingBrowser.description"),
          width: "24%",
          minWidth: "",
          sortable: true,
          align: "left",
          class: "mappingBrowser-from750",
        },
        {
          key: "creator",
          label: this.$t("mappingBrowser.creator"),
          width: "16%",
          minWidth: "",
          sortable: true,
          align: "left",
        },
        {
          key: "date",
          label: this.$t("mappingBrowser.date"),
          width: "10%",
          minWidth: "",
          sortable: true,
          align: "left",
          class: "mappingBrowser-from550",
        },
        {
          key: "download",
          label: this.$t("mappingBrowser.download"),
          width: "11%",
          minWidth: "",
          sortable: false,
          align: "left",
          class: "mappingBrowser-from650",
        },
        {
          key: "mappings",
          label: this.$t("registryInfo.mappings"),
          width: "13%",
          minWidth: "",
          sortable: true,
          align: "right",
          compare: (a, b) => (parseInt(a.mappings) || 0) - (parseInt(b.mappings) || 0),
        },
        {
          key: "actions",
          label: "",
          width: "4%",
          sortable: false,
          align: "right",
        },
      ]
    },
    concordanceTableItems() {
      let items = []
      for (let concordance of this.concordances || []) {
        let item = { concordance }
        item.from = _.get(concordance, "fromScheme")
        item.from = this._getObject(item.from) || item.from
        item.fromNotation = this.$jskos.notation(item.from) || "-"
        item.to = _.get(concordance, "toScheme")
        item.to = this._getObject(item.to) || item.to
        item.toNotation = this.$jskos.notation(item.to) || "-"
        item.description = (this.$jskos.languageMapContent(concordance, "scopeNote") || [])[0] || "-"
        item.creator = this.$jskos.prefLabel(_.get(concordance, "creator[0]"), { fallbackToUri: false }) || "-"
        item.date = _.get(concordance, "modified") || _.get(concordance, "created") || ""
        item.download = _.get(concordance, "distributions", [])
        item.mappings = _.get(concordance, "extent")
        if (item.fromNotation.toLowerCase().startsWith(this.concordanceFilter.from.toLowerCase()) && item.toNotation.toLowerCase().startsWith(this.concordanceFilter.to.toLowerCase()) && item.creator.toLowerCase().startsWith(this.concordanceFilter.creator.toLowerCase())) {
          items.push(item)
        }
      }
      return items
    },
    concordancesShown() {
      return !this.concordances || (this.concordances && this.concordances.length)
    },
    tabIndexes() {
      let indexes = {
        concordances: this.concordancesShown ? 0 : null,
        search: this.concordancesShown ? 1 : 0,
        navigator: this.concordancesShown ? 2 : 1,
      }
      if (!this.showNavigator) {
        delete indexes.navigator
      }
      return indexes
    },
    typeOptions() {
      let options = [{
        text: this.$t("mappingBrowser.searchAllTypes"),
        value: null,
      }]
      for (let type of this.$jskos.mappingTypes) {
        options.push({
          text: `${this.$jskos.notation(type)} ${this.$jskos.prefLabel(type)}`,
          value: type.uri,
        })
      }
      return options
    },
    concordanceOptions() {
      let options = [
        { value: null, text: this.$t("mappingBrowser.searchAllConcordances") },
      ]

      for (let item of this.concordanceTableItems) {
        let text = `${item.fromNotation} to ${item.toNotation} (${item.description})`
        options.push({
          value: item.concordance.uri,
          text,
        })
      }

      return options
    },
    searchFromScheme() {
      return this.getSchemeForFilter(this.searchFilterInput.fromScheme)
    },
    searchToScheme() {
      return this.getSchemeForFilter(this.searchFilterInput.toScheme)
    },
    needsRefresh() {
      return this.$store.state.mapping.mappingsNeedRefresh
    },
    searchRegistries() {
      return _.get(this.registryGroups.find(group => group.stored), "registries", [])
    },
    mappingRegistries() {
      let registries = this.config.registries.filter(registry =>
        registry.provider &&
        (registry.provider.has.mappings || registry.provider.has.occurrences),
      )
      return registries
    },
    mappingRegistriesSorted() {
      return _.flatten(this.registryGroups.map(group => group.registries))
    },
    navigatorRegistries() {
      return this.mappingRegistriesSorted.filter(registry =>
        (registry.provider.supportsScheme && registry.provider.supportsScheme(this.selected.scheme[true])) ||
        (registry.provider.supportsScheme && registry.provider.supportsScheme(this.selected.scheme[false])),
      )
    },
    currentRegistry() {
      return this.$store.getters.getCurrentRegistry
    },
    registryGroups() {
      let groups = [
        {
          stored: true,
          label: this.$t("general.storedMappings"),
          registries: [],
        },
        {
          stored: false,
          label: this.$t("general.recommendedMappings"),
          registries: [],
        },
      ]
      for (let registry of this.mappingRegistries) {
        let group = groups.find(group => group.stored === this.$jskos.mappingRegistryIsStored(registry))
        group.registries.push(registry)
      }
      groups = groups.filter(group => group.registries.length > 0)
      if (this.componentSettings.moveCurrentRegistryToTop) {
        for (let group of groups) {
          group.registries = group.registries.sort((a, b) => {
            if (this.$jskos.compare(a, this.currentRegistry)) {
              return -1
            }
            if (this.$jskos.compare(b, this.currentRegistry)) {
              return 1
            }
            return 0
          })
        }
      }
      return groups
    },
    // show registries
    showRegistry() {
      let object = {}
      // Define setter and getter for each registry separately.
      for (let registry of this.mappingRegistries) {
        Object.defineProperty(object, registry.uri, {
          get: () => {
            if (this.showRegistryOverride) {
              return this.showRegistryOverride.includes(registry.uri)
            }
            let result = this.$settings.mappingBrowserShowRegistry[registry.uri]
            if (result == null) {
              return true
            }
            return result
          },
          set: (value) => {
            // Only allow if it's not the current registry
            if (value || !this.$jskos.compare(registry, this.currentRegistry)) {
              this.$store.commit({
                type: "settings/set",
                prop: "mappingBrowserShowRegistry",
                value: Object.assign({}, this.$settings.mappingBrowserShowRegistry, { [registry.uri]: value }),
              })
              this.$store.commit("mapping/setRefresh", { registry: registry.uri })
            }
          },
        })
      }
      return object
    },
    searchSections () {
      return this.resultsToSections(this.searchResults, this.searchPages, this.searchLoading, "mappingSearch-")
    },
    navigatorSectionsDatabases () {
      return this.resultsToSections(this.navigatorResults, this.navigatorPages, this.navigatorLoading, "mappingNavigator-").filter(section => this.$jskos.mappingRegistryIsStored(section.registry))
    },
    navigatorSectionsRecommendations () {
      return this.resultsToSections(this.navigatorResults, this.navigatorPages, this.navigatorLoading, "mappingNavigator-").filter(section => !this.$jskos.mappingRegistryIsStored(section.registry))
    },
    searchShareLink () {
      let url = this.searchShareIncludeSelected ? window.location.href : window.location.href.split("?")[0]
      url += `${url.includes("?") ? "&" : "?"}${this.searchShareLinkPart}`
      return url
    },
    concordanceRegistries() {
      return this.config.registries.filter(r =>
        r.provider.has.concordances // only use registries that offer concordances
        && (!this.showRegistryOverride || this.showRegistryOverride.includes(r.uri)), // if showRegistryOverride is given, only use those registries
      )
    },
    concordanceUrls() {
      let urls = {}
      for (let registry of this.concordanceRegistries) {
        if (registry.provider.has.concordances && registry.concordances) {
          urls[this.$jskos.prefLabel(registry)] = registry.concordances
        }
      }
      return urls
    },
  },
  watch: {
    tab(tab) {
      if (tab == this.tabIndexes.search) {
        // Changed tab to Mapping Search, refresh if necessary
        if (this.searchNeedsRefresh.length) {
          // If there's only one item, just run it
          if (this.searchNeedsRefresh.length == 1) {
            this.search(this.searchNeedsRefresh[0].registryUri, this.searchNeedsRefresh[0].page)
            return
          }
          if (this.searchNeedsRefresh.find(option => !option.registryUri)) {
            // Refresh all registries
            this.search()
          } else {
            // Refresh some registries
            let registryUris = _.uniq(this.searchNeedsRefresh.map(option => option.registryUri))
            for (let registryUri of registryUris) {
              // Use current page for that registry
              this.search(registryUri, this.searchPages[registryUri])
            }
          }
        }
      } else if (tab == this.tabIndexes.navigator) {
        // Changed tab to Mapping Navigator, refresh if necessary
        this.navigatorRefresh()
      }
    },
    navigatorNeedsRefresh(value) {
      if (value.length > 0 && this.tab == this.tabIndexes.navigator) {
        this.navigatorRefresh()
      }
    },
    selected: {
      handler() {
        // Refresh navigator if anything has actually changed
        if (!(
          this.$jskos.compare(this.selected.concept[true], this.previousSelected.concept[true]) &&
          this.$jskos.compare(this.selected.concept[false], this.previousSelected.concept[false]) &&
          this.$jskos.compare(this.selected.scheme[true], this.previousSelected.scheme[true]) &&
          this.$jskos.compare(this.selected.scheme[false], this.previousSelected.scheme[false])
        )) {
          this.navigatorPages = {}
          this.navigatorResults = {}
          this.navigatorNeedsRefresh.push(null)
          // Also adjust fromScheme/toScheme if locked
          let changed = false
          for (let [fromTo, isLeft] of [["from", true], ["to", false]]) {
            if (this.lockScheme[isLeft] && !this.$jskos.compare(this.selected.scheme[isLeft], this.previousSelected.scheme[isLeft])) {
              const scheme = this.selected.scheme[isLeft]
              this.searchFilterInput[`${fromTo}Scheme`] = scheme ? this.$jskos.notation(scheme) : ""
              changed = true
            }
          }
          if (changed) {
            this.searchClicked()
          }
        }
        this.previousSelected = {}
        this.previousSelected.concept = {
          [true]: this.selected.concept[true] ? { uri: this.selected.concept[true].uri } : null,
          [false]: this.selected.concept[false] ? { uri: this.selected.concept[false].uri } : null,
        }
        this.previousSelected.scheme = {
          [true]: this.selected.scheme[true] ? { uri: this.selected.scheme[true].uri } : null,
          [false]: this.selected.scheme[false] ? { uri: this.selected.scheme[false].uri } : null,
        }
        // Automatically switch tab if a concept was selected for the first time
        if (!this.hasSwitchedToNavigator && (this.selected.concept[true] || this.selected.concept[false])) {
          this.tab = this.tabIndexes.navigator
          this.hasSwitchedToNavigator = true
        }
      },
      deep: true,
    },
    needsRefresh(refresh) {
      if (refresh) {
        let registry = this.$store.state.mapping.mappingsNeedRefreshRegistry
        if (registry) {
          this.navigatorNeedsRefresh.push(registry)
          this.search(registry, this.searchPages[registry])
        } else {
          this.navigatorNeedsRefresh.push(null)
          this.search()
        }
        this.$store.commit("mapping/setRefresh", { refresh: false })
      }
    },
    currentRegistry(registry) {
      // Enable registry
      this.showRegistry[registry.uri] = true
    },
    locale(newValue, oldValue) {
      if (newValue != oldValue) {
        // Refresh all mapping recommendations (as they might include labels in a certain language)
        for (let registry of this.navigatorRegistries.filter(registry =>
          !this.$jskos.mappingRegistryIsStored(registry)
          && this.showRegistry[registry.uri],
        )) {
          this.navigatorNeedsRefresh.push(registry.uri)
        }
      }
    },
    lockScheme: {
      handler() {
        let changed = false
        for (let [fromTo, isLeft] of [["from", true], ["to", false]]) {
          if (this.lockScheme[isLeft]) {
            const scheme = this.selected.scheme[isLeft]
            this.searchFilterInput[`${fromTo}Scheme`] = scheme ? this.$jskos.notation(scheme) : ""
            changed = true
          }
        }
        if (changed) {
          this.searchClicked()
        }
      },
      deep: true,
    },
    "componentSettings.resultLimit"() {
      // Refresh when resultLimit changes
      this.$store.commit("mapping/setRefresh")
    },
    "componentSettings.showAllSchemes"() {
      // Refresh when showAllSchemes changes
      this.$store.commit("mapping/setRefresh")
    },
    "componentSettings.navigatorShowResultsForLeft"() {
      // Refresh when navigatorShowResultsForLeft changes
      this.$store.commit("mapping/setRefresh")
    },
    "componentSettings.navigatorShowResultsForRight"() {
      // Refresh when navigatorShowResultsForRight changes
      this.$store.commit("mapping/setRefresh")
    },
  },
  created() {
    // Debounce navigator refresh
    this.navigatorRefresh = _.debounce(this._navigatorRefresh, 100)
    // Clear search
    this.clearSearchFilter()
    // Set tab to search on start
    this.tab = this.tabIndexes.search
  },
  mounted() {
    if (!this.concordances || !this.concordances.length) {
      let promises = []
      for (let registry of this.concordanceRegistries) {
        promises.push(registry.provider.getConcordances())
      }
      Promise.all(promises).then(results => {
        let concordances = _.flatten(results)
        // Set values of concordance array that is managed by objects mixin
        _.forEach(concordances, (concordance, index) => {
          this.$set(this.concordances, index, concordance)
        })
        this.concordances.length = concordances.length
      }).catch(error => {
        console.error("MappingBrowser - Error loading concordances", error)
      }).then(() => {
        this.concordancesLoaded = true
      })
    }
    this.navigatorNeedsRefresh.push(null)
  },
  methods: {
    clickHandlers() {
      let popovers = []
      // Registry group popovers
      for (let group of this.registryGroups) {
        popovers.push({
          elements: [
            _.get(this.$refs[`registryGroup-${group.stored}-popover`], "[0]"),
            document.getElementById(`registryGroup-${group.stored}`),
          ],
          handler: () => {
            this.$set(this.registryGroupShow, group.stored, false)
          },
        })
      }
      // Search Link popover
      popovers.push({
        elements: [
          this.$refs.searchSharePopover,
          document.getElementById("mappingBrowser-search-shareButton"),
        ],
        handler: () => {
          // eslint-disable-next-line vue/no-side-effects-in-computed-properties
          this.searchShareShow = false
        },
      })
      return popovers
    },
    generateCancelToken() {
      return axios.CancelToken.source()
    },
    clearAutoRefresh(registry) {
      if (this.refreshTimers[registry.uri]) {
        window.clearInterval(this.refreshTimers[registry.uri])
      }
    },
    scheduleAutoRefresh(registry) {
      if (registry.autoRefresh) {
        this.clearAutoRefresh(registry)
        this.refreshTimers[registry.uri] = setInterval(() => {
          this.$store.commit("mapping/setRefresh", { registry: registry.uri })
        }, Math.max(_.isInteger(registry.autoRefresh) ? registry.autoRefresh : 5000, 3000))
      }
    },
    showMappingsForConcordance(concordance) {
      // Change tab to mapping search.
      this.tab = this.tabIndexes.search
      concordance
      // Clear all other search parameters.
      this.clearSearchFilter()
      // Change concordance.
      this.searchFilterInput.partOf = concordance.uri
      // Search.
      this.searchClicked()
    },
    nameOfDistribution(distribution) {
      let mimetype = distribution.mimetype
      if (mimetype.includes("json")) {
        return "JSKOS"
      }
      if (mimetype.includes("csv")) {
        return "CSV"
      }
      return null
    },
    getSchemeForFilter(filter) {
      return this.schemes.find(scheme => {
        return filter && (this.$jskos.compare(scheme, { uri: filter }) || this.$jskos.notation(scheme).toLowerCase() == filter.toLowerCase())
      })
    },
    clearSearchFilter() {
      this.searchFilterInput = {
        fromScheme: (this.searchFilterInput && this.searchFilterInput.fromScheme) || "",
        fromNotation: "",
        toScheme: (this.searchFilterInput && this.searchFilterInput.toScheme) || "",
        toNotation: "",
        creator: "",
        direction: "",
        type: null,
        partOf: null,
      }
      if (!this.lockScheme[true]) {
        this.searchFilterInput.fromScheme = ""
      }
      if (!this.lockScheme[false]) {
        this.searchFilterInput.toScheme = ""
      }
      this.searchFilterExtended = false
      this.searchResults = {}
      this.searchClicked()
    },
    searchWithParams(filter) {
      this.tab = this.tabIndexes.search
      _.forOwn(filter, (value, key) => {
        if (value != null) {
          this.searchFilterInput[key] = value
        }
      })
      this.searchClicked()
    },
    searchClicked() {
      // Copy over input search filters to search filters
      this.searchFilter = _.cloneDeep(this.searchFilterInput)
      this.search(null, 1)
    },
    search(registryUri = null, page) {
      // If it's not currently the search tab, save search refresh for later
      if (this.tab != this.tabIndexes.search) {
        this.searchNeedsRefresh.push({ registryUri, page })
        return
      }
      this.searchNeedsRefresh = []
      // If there is a concordance filter, enable relevant registries
      if (this.searchFilter.partOf) {
        let toEnable = []
        for (let concordance of this.concordances.filter(c => this.$jskos.compare(c, { uri: this.searchFilter.partOf }))) {
          let registryUri = _.get(concordance, "_provider.registry.uri")
          if (registryUri && !toEnable.includes(registryUri)) {
            toEnable.push(registryUri)
          }
        }
        if (toEnable.length > 0) {
          for (let uri of toEnable) {
            this.showRegistry[uri] = true
          }
        }
      }
      let promises = []
      // TODO: Use only registries that support search/filter/sort
      let registries = this.searchRegistries.filter(registry => registryUri == null || registry.uri == registryUri)
      for (let registry of registries) {
        this.clearAutoRefresh(registry)
        // Cancel previous refreshs
        if (this.searchCancelToken[registry.uri]) {
          this.searchCancelToken[registry.uri].cancel("There was a newer refresh operation.")
        }
        // Check if enabled
        if (!this.showRegistry[registry.uri]) {
          this.$delete(this.searchResults, registry.uri)
          continue
        }
        let cancelToken = this.generateCancelToken()
        this.searchCancelToken[registry.uri] = cancelToken
        // From here on, check if token is invalid:
        // if (cancelToken != this.searchCancelToken[registry.uri]) { ... }
        this.$set(this.searchPages, registry.uri, page)
        this.$set(this.searchLoading, registry.uri, true)
        let promise = this.getMappings({
          from: this.searchFilter.fromNotation,
          to: this.searchFilter.toNotation,
          fromScheme: this.getSchemeForFilter(this.searchFilter.fromScheme),
          toScheme: this.getSchemeForFilter(this.searchFilter.toScheme),
          creator: this.searchFilter.creator,
          typeFilter: this.searchFilter.type,
          direction: this.searchFilter.direction,
          partOf: this.searchFilter.partOf,
          registry: registry.uri,
          offset: ((this.searchPages[registry.uri] || 1) - 1) * this.componentSettings.resultLimit,
          limit: this.componentSettings.resultLimit,
          cancelToken: cancelToken.token,
        }).catch(error => {
          console.warn("Mapping Browser: Error during search:", error)
          return []
        }).then(mappings => {
          if (cancelToken == this.searchCancelToken[registry.uri]) {
            let page = (this.searchPages[registry.uri] || 1)
            if (mappings.length == 0 && page > 1) {
              // When on a later page and there were zero mappings, go back one page
              // This can happen if there was a single mapping on a page and it go deleted, or mappings got deleted from the server while browsing
              this.search(registry.uri, page - 1)
            } else {
              this.$set(this.searchResults, registry.uri, mappings)
              this.$set(this.searchLoading, registry.uri, false)
            }
            // Schedule auto refresh
            this.scheduleAutoRefresh(registry)
          }
        })
        promises.push(promise)
      }
      Promise.all(promises).then(() => {
        // Set part for share link
        let shareFilter = {}
        _.forOwn(this.searchFilter, (value, key) => {
          if (value) {
            shareFilter[key] = value
          }
        })
        let searchParam = encodeURIComponent(JSON.stringify(shareFilter))
        this.searchShareLinkPart = `search=${searchParam}`
      })
    },
    _navigatorRefresh() {
      if (!this.navigatorNeedsRefresh.length) {
        return
      }
      let registriesToReload
      if (this.navigatorNeedsRefresh.includes(null)) {
        // Refresh all registries
        registriesToReload = null
      } else {
        // Refresh some registries
        registriesToReload = _.uniq(this.navigatorNeedsRefresh)
      }
      this.navigatorNeedsRefresh = []

      let promises = []
      // let conceptsToLoad = []

      // Prepare params
      let params = {
        direction: "both",
        mode: "or",
        selected: this.selected,
      }
      let from = this.componentSettings.navigatorShowResultsForLeft ? _.get(this, "selected.concept[true]") : null
      let to = this.componentSettings.navigatorShowResultsForRight ? _.get(this, "selected.concept[false]") : null
      if (from) {
        params["from"] = from
      }
      if (to) {
        params["to"] = to
      }
      // If no concept is selected, clear navigator
      if (!from && !to) {
        this.navigatorResults = {}
        return
      }

      // If no specific registry is reloaded, reset page numbers
      if (!registriesToReload) {
        this.navigatorPages = {}
      }

      for (let registry of this.navigatorRegistries) {

        if (registriesToReload && !registriesToReload.includes(registry.uri)) {
          // Skip
          continue
        }

        // Check if enabled
        if (!this.showRegistry[registry.uri]) {
          this.$delete(this.navigatorResults, registry.uri)
          continue
        }

        this.clearAutoRefresh(registry)

        // Cancel previous refreshs
        if (this.navigatorCancelToken[registry.uri]) {
          this.navigatorCancelToken[registry.uri].cancel("There was a newer refresh operation.")
        }
        let cancelToken = this.generateCancelToken()
        this.navigatorCancelToken[registry.uri] = cancelToken
        // From here on, check if token is invalid:
        // if (cancelToken != this.navigatorCancelToken[registry.uri]) { ... }

        if (!registriesToReload) {
          this.$set(this.navigatorResults, registry.uri, [null])
        }

        let promise = this.getMappings({ ...params, registry: registry.uri, all: true, cancelToken: cancelToken.token }).catch(error => {
          console.warn("Mapping Browser: Error during refresh (1)", error)
          return []
        }).then(mappings => {
          if (cancelToken != this.navigatorCancelToken[registry.uri]) {
            return
          }
          // Traditional way of sorting navigator results
          // TODO: Should be improved by getting results from sorted the server
          mappings = mappings.sort((a, b) => {
            // Sort mappings
            if (a._occurrence || b._occurrence) {
              // Sort by occurrence count descending
              return _.get(b, "_occurrence.count", 0) - _.get(a, "_occurrence.count", 0)
            }
            let points = {
              a: 10, b: 10,
            }
            _.forOwn({ a, b }, (mapping, key) => {
              let conceptsLeft = this.$jskos.conceptsOfMapping(mapping, "from")
              let conceptsRight = this.$jskos.conceptsOfMapping(mapping, "to")

              let leftIsLeft = this.$jskos.isContainedIn(this.selected.concept[true], conceptsLeft)
              let rightIsRight = this.$jskos.isContainedIn(this.selected.concept[false], conceptsRight)

              if (leftIsLeft && rightIsRight) {
                // Mapping gets full score
                return
              }
              points[key] -= 1

              let leftIsRight = this.$jskos.isContainedIn(this.selected.concept[true], conceptsRight)
              let rightIsLeft = this.$jskos.isContainedIn(this.selected.concept[false], conceptsLeft)

              if (leftIsRight && rightIsLeft) {
                // Reverse mapping gets second highest score
                return
              }
              points[key] -= 1

              if (!leftIsLeft) {
                points[key] -= 4
              }
              if (!rightIsRight) {
                points[key] -= 3
              }
              if (!rightIsLeft) {
                points[key] -= 2
              }
              if (!leftIsRight) {
                points[key] -= 1
              }
            })
            if (points.b - points.a != 0) {
              return points.b - points.a
            }
            // If the points are equal, sort by concepts (first from, then to).
            let value = this.$jskos.compareFunctions.mappingsByConcepts(a.mapping, b.mapping, "from")
            if (value != 0) {
              return value
            }
            return this.$jskos.compareFunctions.mappingsByConcepts(a.mapping, b.mapping, "to")
          })
          // Filter mappings if showAllSchemes is off and schemes don't match
          // Note: This has to be adjusted or removed when proper pagination for navigator results is implemented!
          mappings.totalCount = undefined
          if (!this.componentSettings.showAllSchemes) {
            mappings = mappings.filter(mapping => {
              if (this.selected.scheme[true] && this.selected.scheme[false]) {
                let schemesCorrect = true
                for (let scheme of [mapping.fromScheme, mapping.toScheme]) {
                  let schemeCorrect = false
                  for (let isLeft of [true, false]) {
                    if (this.$jskos.compare(scheme, this.selected.scheme[isLeft])) {
                      schemeCorrect = true
                    }
                  }
                  schemesCorrect = schemesCorrect && schemeCorrect
                }
                return schemesCorrect
              }
              // If one side doesn't have a scheme selected, always show all
              return true
            })
          }
          this.$set(this.navigatorResults, registry.uri, mappings)
          // Check if refresh leads to an empty page and decrement page if necessary
          if (this.navigatorPages[registry.uri] > 1 && mappings.length < (this.navigatorPages[registry.uri] - 1) * this.componentSettings.resultLimit + 1) {
            this.$set(this.navigatorPages, registry.uri, this.navigatorPages[registry.uri] - 1)
          }
          // Reset cancel token
          this.navigatorCancelToken[registry.uri] = null
        }).catch(error => {
          console.warn("Mapping Browser: Error during refresh (2)", error)
        }).then(() => {
          // Schedule auto refresh
          this.scheduleAutoRefresh(registry)
        })

        promises.push(promise)
      }
    },
    swapClicked() {
      this.lockScheme[true] = false
      this.lockScheme[false] = false
      ;[this.searchFilterInput.fromScheme, this.searchFilterInput.fromNotation, this.searchFilterInput.toScheme, this.searchFilterInput.toNotation] = [this.searchFilterInput.toScheme, this.searchFilterInput.toNotation, this.searchFilterInput.fromScheme, this.searchFilterInput.fromNotation]
      this.searchClicked()
    },
    resultsToSections(results, pages, loading, keyPrefix) {
      let sections = []
      for (let registry of this.mappingRegistriesSorted.filter(registry => results[registry.uri])) {
        let section = {}
        section.registry = registry
        // Add custom class for current registry
        if (this.$jskos.compare(registry, this.currentRegistry)) {
          section._class = "mappingBrowser-table-currentRegistrySection"
        }
        section.items = []
        section.loading = loading[registry.uri]
        section.page = pages[registry.uri] || 1
        let mappings = results[registry.uri] || []
        section.totalCount = mappings.totalCount || mappings.length
        // Set section.loading if there is null in the results
        if (mappings.length == 1 && mappings[0] == null) {
          section.loading = true
        }
        // Hide empty section if necessary
        if (section.totalCount == 0 && !this.componentSettings.showEmpty) {
          continue
        }
        if (mappings.url) {
          section.url = mappings.url
        }
        // Concept information possibly needs to be loaded
        this.mbLoadConcepts(_.flatten(mappings.map(mapping => this.$jskos.conceptsOfMapping(mapping))))
        // Add items
        let skipped = 0 // Keep track of number of skipped items
        for (let mapping of mappings) {
          // For mappings recommendations: If mapping with the same member identifier could be found in the results for the current registry, skip item.
          if (!this.$jskos.mappingRegistryIsStored(registry)) {
            const currentRegistryResults = results[this.currentRegistry.uri] || []
            const memberIdentifier = (mapping) => {
              return mapping && mapping.identifier.find(id => id.startsWith("urn:jskos:mapping:members:"))
            }
            if (currentRegistryResults.find(m => memberIdentifier(m) == memberIdentifier(mapping))) {
              skipped += 1
              continue
            }
          }

          let item = { mapping, registry }
          item.sourceScheme = _.get(mapping, "fromScheme") || undefined
          item.targetScheme = _.get(mapping, "toScheme") || undefined
          item.sourceConcepts = this.$jskos.conceptsOfMapping(mapping, "from").filter(concept => concept != null)
          item.targetConcepts = this.$jskos.conceptsOfMapping(mapping, "to").filter(concept => concept != null)
          // // Load prefLabels for all concepts
          // conceptsToLoad = conceptsToLoad.concat(item.sourceConcepts).concat(item.targetConcepts)
          // Save concepts as xLabels attribute as well
          item.sourceConceptsLong = item.sourceConcepts
          item.targetConceptsLong = item.targetConcepts
          // Set source/targetScheme to empty string if from/to is null.
          if (!_.get(mapping, "from") && item.sourceConcepts.length == 0) {
            item.sourceScheme = undefined
          }
          if (!_.get(mapping, "to") && item.targetConcepts.length == 0) {
            item.targetScheme = undefined
          }
          // Skip if there are no concepts.
          if (item.sourceConcepts.length + item.targetConcepts.length == 0) {
            skipped += 1
            continue
          }
          // Highlight if selected concepts or current mapping have same members
          let selectedConceptsIdentifier = this.$jskos.mappingMembersIdentifier({ from: { memberSet: [this.selected.concept[true]] }, to: { memberSet: [this.selected.concept[false]] }})
          let currentMappingIdentifier = this.$jskos.mappingMembersIdentifier(this.$store.state.mapping.mapping)
          let highlight = mapping.identifier.includes(selectedConceptsIdentifier) || mapping.identifier.includes(currentMappingIdentifier)
          item._rowClass = ""
          if (highlight) {
            item._rowClass = "mappingBrowser-table-row-match"
          }
          // Highlight if this exact mapping is being edited right now
          let originalUri = _.get(this.$store.state.mapping.original, "uri")
          if (originalUri && mapping.uri == originalUri) {
            item._rowClass = "mappingBrowser-table-row-edited"
          }

          item.creator = mapping.creator && mapping.creator[0] || ""
          if (typeof item.creator === "object") {
            item.creator = this.$jskos.prefLabel(item.creator)
          }
          // Add modified or created date in extra
          item.extra = { date: mapping.modified || mapping.created }
          if (item.extra.date && item.extra.date.length > 10) {
            item.extra.tooltip = item.extra.date
            item.extra.date = item.extra.date.slice(0, 10)
          }
          item.source = this.$jskos.prefLabel(registry)
          item.sourceShort = this.$jskos.notation(registry)
          item.type = this.$jskos.mappingTypeByType(mapping.type)
          item.occurrence = mapping._occurrence
          // Generate unique ID from mapping JSON and registry URI as helper
          item.uniqueId = this.hash(keyPrefix + registry.uri + JSON.stringify(_.omit(this.$jskos.copyDeep(mapping))))
          // Add class to all items of hoveredRegistry
          if (this.$jskos.compare(item.registry, this.hoveredRegistry)) {
            item._rowClass += " mappingBrowser-hoveredRegistry"
          }
          section.items.push(item)
        }
        if (mappings.totalCount === undefined) {
          section.items = section.items.slice((section.page - 1) * this.componentSettings.resultLimit, section.page * this.componentSettings.resultLimit)
        }
        section.totalCount -= skipped
        sections.push(section)
      }
      return sections
    },
    mbLoadConcepts(concepts) {
      let toLoad = []
      for (let concept of concepts) {
        if(concept && !this.$jskos.isContainedIn(concept, this.loadingConcepts) && this.getProvider(concept)) {
          toLoad.push(concept)
        }
      }
      this.loadConcepts(toLoad)
    },
    droppedConcept(object, targets) {
      _.forOwn(targets, (path, type) => {
        let text = ""
        if (type == "scheme") {
          // For scheme targtet, insert notation of inScheme of concept or notation of scheme
          if (this.$jskos.isScheme(object)) {
            text = _.get(object, "notation[0]")
          } else {
            text = _.get(object, "inScheme[0].notation[0]")
          }
        } else if (type == "concept") {
          // For concept, insert notation of concept
          if (this.$jskos.isConcept(object)) {
            text = _.get(object, "notation[0]")
          }
        }
        if (text) {
          _.set(this, path, text)
        }
      })
    },
    changePage(type, { registry, page, userInitiated }) {
      let currentPage = this[`${type}Pages`][registry.uri]
      if (userInitiated) {
        this.$set(this[`${type}Pages`], registry.uri, page)
        if (type == "search") {
          this.search(registry.uri, page)
        }
      } else if (page != currentPage) {
        // This is a workaround for bootstrap-vue's b-pagination to prevent an unwanted jump back to page 1
        // See: https://github.com/bootstrap-vue/bootstrap-vue/issues/3372
        this.$set(this[`${type}Pages`], registry.uri, page)
        this.$nextTick(() => {
          this.$set(this[`${type}Pages`], registry.uri, currentPage)
        })
      }
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.mappingBrowser-navigator-results {
  flex: 1;
}
.mappingBrowser-registryGroup {
  margin-bottom: 10px;
}
.mappingBrowser-registryGroup-header {
  text-align: left;
  padding: 0.5em 3px 3px 2em;
  border-bottom: 2px solid @color-primary-1;
}
.mappingBrowser-registryGroup-title {
  display:inline-block;
  letter-spacing: 0.1em;
}
.mappingBrowser-registryGroup-notation {
  margin: 0 4px;
}
.mappingBrowser-search-registryNotation {
  margin: auto 4px;
}
.mappingBrowser-registryGroup-popover {
  display: flex;
  flex-direction: column;
  margin: 10px 10px;
}
.mappingBrowser-registryGroup-popover-item {
  flex: 1;
  margin: 5px 0;
}

#mappingBrowser {
  max-width: 100%;
}

.noItems {
  margin: 50px auto 5px auto;
  flex: 5 0 auto;
}

#mappingBrowser-search-shareButton {
  position: absolute;
  right: 2px;
  top: 5px;
  z-index: @zIndex-2;
}

</style>

<style lang="less">
@import "../style/main.less";

#mappingBrowser[max-width~="750px"] .mappingBrowser-from750 {
  display: none;
}
#mappingBrowser[max-width~="650px"] .mappingBrowser-from650 {
  display: none;
}
#mappingBrowser[max-width~="550px"] .mappingBrowser-from550 {
  display: none;
}

#mappingBrowser > .cocoda-vue-tabs > .cocoda-vue-tabs-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 5px 0px 0px 0px;
}

// Correctly position search table
.mappingBrowser-search-table.mappingBrowser-table-container {
  height: 0;
  flex: 1;
  position: relative;
}
.mappingBrowser-search-table > .mappingBrowser-table {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

#mappingBrowser .componentSettings {
  right: 3px;
}

</style>
