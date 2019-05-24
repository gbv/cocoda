<template>
  <div id="mappingBrowser">
    <!-- Settings -->
    <div id="mappingBrowser-settingsButton">
      <font-awesome-icon
        id="mappingBrowser-settingsButton-icon"
        v-b-tooltip.hover="{ title: $t('mappingBrowser.settingsButton'), delay: $util.delay.medium }"
        icon="cog"
        class="button" />
      <b-popover
        :show.sync="settingsShow"
        target="mappingBrowser-settingsButton-icon"
        triggers="click"
        placement="bottomright">
        <div
          ref="settingsPopover">
          <p><b>{{ $t("navbar.settings") }}</b></p>
          <b-form
            inline
            @submit.stop.prevent>
            <b-form-checkbox
              v-model="showAllSchemes"
              v-b-tooltip.hover="{ title: $t('mappingBrowser.settingShowAllSchemesTooltip'), delay: $util.delay.medium }"
              style="user-select: none;">
              {{ $t("mappingBrowser.settingShowAllSchemes") }}
            </b-form-checkbox>
            <div>
              {{ $t("mappingBrowser.settingResultLimit") }}
              <b-input
                v-model="resultLimit"
                type="number"
                min="1"
                max="20"
                size="sm"
                @click="$event.target.select()" />
            </div>
          </b-form>
        </div>
      </b-popover>
    </div>
    <b-tabs
      v-model="tab"
      pills
      no-fade
      justified>
      <b-tab
        title="Concordances"
        @click="handleClickOutside">
        <template v-if="concordances && concordances.length">
          <div style="display: flex;">
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
                placeholder="from" />
              <b-input
                v-if="field.key == 'to'"
                v-model="concordanceFilter.to"
                type="text"
                style="width: 75%; display: inline-block;"
                size="sm"
                placeholder="to" />
              <b-input
                v-if="field.key == 'creator'"
                v-model="concordanceFilter.creator"
                type="text"
                style="width: 80%; display: inline-block;"
                size="sm"
                placeholder="creator" />
              <span
                v-if="concordanceFilter[field.key] != null"
                v-b-tooltip.hover="{ title: 'clear filter', delay: $util.delay.medium }"
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
                  v-b-tooltip.hover="{ title: 'Show Mappings', delay: $util.delay.medium }"
                  icon="external-link-square-alt"
                  class="button"
                  @click="showMappingsForConcordance(item.concordance)" />
              </span>
            </flexible-table>
          </div>
          <div style="display: flex;">
            <p style="font-weight: bold; flex: 1;">
              {{ concordanceTableItems.length }} concordances
            </p>
            <p style="text-align: right; font-weight: bold;">
              Total: {{ concordanceTableItems.reduce((total, current) => {
                return total + parseInt(current.mappings) || 0
              }, 0).toLocaleString() }}
            </p>
          </div>
        </template>
      </b-tab>
      <b-tab
        title="Mapping Search"
        @click="handleClickOutside">
        <div style="flex: none;">
          <div style="display: flex;">
            <b-input
              v-model="searchFilter.fromScheme"
              :state="searchFilter.fromScheme == '' ? true : searchFromScheme != null"
              style="flex: 1; margin: 3px;"
              size="sm"
              placeholder="source scheme"
              @keyup.enter.native="searchClicked"
              @drop="drop($event, 'scheme', 'searchFilter.fromScheme')" />
            <b-input
              v-model="searchFilter.fromNotation"
              style="flex: 2; margin: 3px;"
              size="sm"
              placeholder="source notation"
              @keyup.enter.native="searchClicked"
              @drop="drop($event, 'concept', 'searchFilter.fromNotation')" />
            <div
              class="button"
              style="flex: none; font-size: 16px; margin: auto 5px;"
              @click="swapClicked">
              <font-awesome-icon icon="exchange-alt" />
            </div>
            <b-input
              v-model="searchFilter.toScheme"
              :state="searchFilter.toScheme == '' ? true : searchToScheme != null"
              style="flex: 1; margin: 3px;"
              size="sm"
              placeholder="target scheme"
              @keyup.enter.native="searchClicked"
              @drop="drop($event, 'scheme', 'searchFilter.toScheme')" />
            <b-input
              v-model="searchFilter.toNotation"
              style="flex: 2; margin: 3px;"
              size="sm"
              placeholder="target notation"
              @keyup.enter.native="searchClicked"
              @drop="drop($event, 'concept', 'searchFilter.toNotation')" />
          </div>
          <div style="display: flex;">
            <div style="text-align: right; flex: none; margin: auto 5px;">
              Creator:
            </div>
            <b-input
              v-model="searchFilter.creator"
              style="flex: 2; margin: 3px;"
              size="sm"
              placeholder="creator"
              @keyup.enter.native="searchClicked" />
            <div style="text-align: right; flex: none; margin: auto 5px;">
              Type:
            </div>
            <b-select
              v-model="searchFilter.type"
              style="flex: 2; margin: 3px;"
              size="sm"
              :options="typeOptions"
              @keyup.enter.native="searchClicked" />
          </div>
          <div style="display: flex;">
            <div style="text-align: right; flex: none; margin: auto 5px;">
              Concordance:
            </div>
            <b-form-select
              v-model="searchFilter.partOf"
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
              @click.native="showRegistry[registry.uri] = !showRegistry[registry.uri]"
              @mouseover.native="hoveredRegistry = registry"
              @mouseout.native="hoveredRegistry = null" />
            <b-button
              style="flex: none; margin: 3px;"
              variant="danger"
              size="sm"
              @click="clearSearchFilter">
              <font-awesome-icon icon="ban" />
              Clear
            </b-button>
            <b-button
              style="flex: none; margin: 3px;"
              variant="primary"
              size="sm"
              @click="searchClicked">
              <font-awesome-icon icon="search" />Search
            </b-button>
          </div>
        </div>
        <mapping-browser-table
          v-if="searchSections.length"
          :sections="searchSections"
          @pageChange="search($event.registry.uri, $event.page)" />
      </b-tab>
      <b-tab
        title="Mapping Navigator"
        @click="handleClickOutside">
        <div
          v-show="!selected.concept[true] && !selected.concept[false]"
          class="noItems fontWeight-heavy">
          {{ $t("mappingBrowser.chooseConcept") }}
        </div>
        <div
          v-if="selected.concept[true] || selected.concept[false]"
          id="mappingBrowser-settings">
          <div
            v-for="group of registryGroups"
            :key="group.uri"
            class="mappingBrowser-settings-registryGroup">
            <span
              :id="`registryGroup-${group.uri}`"
              class="mappingBrowser-settings-registryGroup-title fontWeight-heavy button">
              {{ $util.prefLabel(group) }} <font-awesome-icon icon="caret-down" /><br>
            </span>
            <registry-notation
              v-for="registry in group.registries.filter(registry => $jskos.isContainedIn(registry, navigatorRegistries))"
              :key="registry.uri"
              :registry="registry"
              :disabled="!showRegistry[registry.uri]"
              class="mappingBrowser-settings-registryGroup-notation"
              @click.native="showRegistry[registry.uri] = !showRegistry[registry.uri]"
              @mouseover.native="hoveredRegistry = registry"
              @mouseout.native="hoveredRegistry = null" />
            <b-popover
              :target="`registryGroup-${group.uri}`"
              :show.sync="registryGroupShow[group.uri]"
              triggers="click"
              placement="bottom">
              <div
                :ref="`registryGroup-${group.uri}-popover`"
                class="mappingBrowser-settings-registryGroup-popover">
                <b-form-checkbox
                  v-for="(registry, index) in group.registries.filter(registry => $jskos.isContainedIn(registry, navigatorRegistries))"
                  :key="`registry_${index}`"
                  v-model="showRegistry[registry.uri]"
                  class="mappingBrowser-settings-registryGroup-popover-item"
                  @mouseover.native="hoveredRegistry = registry"
                  @mouseout.native="hoveredRegistry = null">
                  <registry-name :registry="registry" />
                </b-form-checkbox>
              </div>
            </b-popover>
          </div>
        </div>
        <mapping-browser-table
          v-if="navigatorSections.length"
          :sections="navigatorSections"
          @pageChange="$set(navigatorPages, $event.registry.uri, $event.page)" />
      </b-tab>
    </b-tabs>
  </div>
</template>

<script>
import MappingBrowserTable from "./MappingBrowserTable"
import FlexibleTable from "vue-flexible-table"
import RegistryNotation from "./RegistryNotation"
import RegistryName from "./RegistryName"
import _ from "lodash"
// Only use for cancel token generation!
import axios from "axios"

// Import mixins
import auth from "../mixins/auth"
import objects from "../mixins/objects"
import dragandrop from "../mixins/dragandrop"

export default {
  name: "MappingBrowser",
  components: { FlexibleTable, MappingBrowserTable, RegistryNotation, RegistryName },
  mixins: [auth, objects, dragandrop],
  data() {
    return {
      tab: 1,
      /** Whether tab was automatically switched to Mapping Navigator once.
       *  Will not switch automatically again afterwards.
       */
      hasSwitchedToNavigator: false,
      settingsShow: false,
      registryGroupShow: {},
      concordances: null,
      concordanceFilter: {
        from: "",
        to: "",
        creator: "",
      },
      searchFilter: null,
      searchPages: {},
      searchResults: {},
      searchLoading: {},
      searchCancelToken: {},
      // Array of objects with registryUri and page (as parameters for search)
      searchNeedsRefresh: [],
      previousSelected: {
        concept: {
          [true]: null,
          [false]: null,
        },
        scheme: {
          [true]: null,
          [false]: null,
        }
      },
      navigatorPages: {},
      navigatorResults: {},
      navigatorLoading: {},
      // Array of booleans and/or registry URIs (as parameters for navigatorRefresh)
      navigatorNeedsRefresh: [],
      navigatorCancelToken: {},
      /** Currently hovered registry */
      hoveredRegistry: null,
    }
  },
  computed: {
    concordanceTableFields() {
      return [
        {
          key: "from",
          label: "from",
          width: "13%",
          minWidth: "",
          sortable: true,
          align: "left",
          titleClass: "test",
        },
        {
          key: "to",
          label: "to",
          width: "9%",
          minWidth: "",
          sortable: true,
          align: "left",
        },
        {
          key: "description",
          label: "description",
          width: "24%",
          minWidth: "",
          sortable: true,
          align: "left",
          class: "mappingBrowser-from750"
        },
        {
          key: "creator",
          label: "creator",
          width: "16%",
          minWidth: "",
          sortable: true,
          align: "left",
        },
        {
          key: "date",
          label: "date",
          width: "10%",
          minWidth: "",
          sortable: true,
          align: "left",
          class: "mappingBrowser-from550"
        },
        {
          key: "download",
          label: "download",
          width: "11%",
          minWidth: "",
          sortable: false,
          align: "left",
          class: "mappingBrowser-from650"
        },
        {
          key: "mappings",
          label: "mappings",
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
        item.from = this.$util.notation(_.get(concordance, "fromScheme")) || "-"
        item.to = this.$util.notation(_.get(concordance, "toScheme")) || "-"
        item.description = _.get(concordance, "scopeNote.de[0]") || _.get(concordance, "scopeNote.en[0]") || "-"
        item.creator = _.get(concordance, "creator[0].prefLabel.de") || _.get(concordance, "creator[0].prefLabel.en") || "-"
        item.date = _.get(concordance, "modified") || _.get(concordance, "created") || ""
        item.download = _.get(concordance, "distributions", [])
        item.mappings = _.get(concordance, "extent")
        if (item.from.toLowerCase().startsWith(this.concordanceFilter.from.toLowerCase()) && item.to.toLowerCase().startsWith(this.concordanceFilter.to.toLowerCase()) && item.creator.toLowerCase().startsWith(this.concordanceFilter.creator.toLowerCase())) {
          items.push(item)
        }
      }
      return items
    },
    typeOptions() {
      let options = [{
        text: "all types",
        value: null
      }]
      for (let type of this.$jskos.mappingTypes) {
        options.push({
          text: `${this.$util.notation(type)} ${this.$util.prefLabel(type)}`,
          value: type.uri
        })
      }
      return options
    },
    concordanceOptions() {
      let options = [
        { value: null, text: "all concordances" }
      ]

      for (let item of this.concordanceTableItems) {
        let text = `${item.from} to ${item.to} (${item.description})`
        options.push({
          value: item.concordance.uri,
          text
        })
      }

      return options
    },
    searchFromScheme() {
      return this.schemes.find(scheme => {
        return this.$jskos.compare(scheme, { uri: this.searchFilter.fromScheme }) || this.$util.notation(scheme).toLowerCase() == this.searchFilter.fromScheme.toLowerCase()
      })
    },
    searchToScheme() {
      return this.schemes.find(scheme => {
        return this.$jskos.compare(scheme, { uri: this.searchFilter.toScheme }) || this.$util.notation(scheme).toLowerCase() == this.searchFilter.toScheme.toLowerCase()
      })
    },
    needsRefresh() {
      return this.$store.state.mapping.mappingsNeedRefresh
    },
    searchRegistries() {
      return _.get(this.registryGroups.find(group => group.uri == "http://coli-conc.gbv.de/registry-group/existing-mappings"), "registries", [])
    },
    mappingRegistries() {
      let registries = this.config.registries.filter(registry =>
        registry.provider &&
        (registry.provider.has.mappings || registry.provider.has.occurrences)
      )
      return registries
    },
    mappingRegistriesSorted() {
      return _.flatten(this.registryGroups.map(group => group.registries))
    },
    navigatorRegistries() {
      return this.mappingRegistriesSorted.filter(registry =>
        (registry.provider.supportsScheme && registry.provider.supportsScheme(this.selected.scheme[true])) ||
        (registry.provider.supportsScheme && registry.provider.supportsScheme(this.selected.scheme[false]))
      )
    },
    currentRegistry() {
      return this.$store.getters.getCurrentRegistry
    },
    registryGroups() {
      let groups = _.cloneDeep(this.config.registryGroups)
      for (let group of groups) {
        group.registries = []
      }
      let otherGroup = {
        uri: "http://coli-conc.gbv.de/registry-group/other-mappings",
        prefLabel: {
          de: "Andere Mappings",
          en: "Other Mappings"
        },
        registries: []
      }
      for (let registry of this.mappingRegistries) {
        let group = groups.find(group => group.uri == _.get(registry, "subject[0].uri")) || otherGroup
        group.registries.push(registry)
      }
      groups.push(otherGroup)
      groups = groups.filter(group => group.registries.length > 0)
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
      return groups
    },
    // show registries
    showRegistry() {
      let object = {}
      // Define setter and getter for each registry separately.
      for (let registry of this.mappingRegistries) {
        Object.defineProperty(object, registry.uri, {
          get: () => {
            let result = this.$settings.mappingBrowserShowRegistry[registry.uri]
            if (result == null) {
              return true
            }
            return result
          },
          set: (value) => {
            this.$store.commit({
              type: "settings/set",
              prop: "mappingBrowserShowRegistry",
              value: Object.assign({}, this.$settings.mappingBrowserShowRegistry, { [registry.uri]: value })
            })
            this.$store.commit("mapping/setRefresh", { registry: registry.uri })
          }
        })
      }
      return object
    },
    searchSections () {
      return this.resultsToSections(this.searchResults, this.searchPages, this.searchLoading)
    },
    navigatorSections () {
      return this.resultsToSections(this.navigatorResults, this.navigatorPages, this.navigatorLoading)
    },
    // Setting whether to show mappings from all schemes or only chosen schemes
    showAllSchemes: {
      get() {
        return this.$settings.mappingBrowserAllSchemes
      },
      set(value) {
        this.$store.commit({
          type: "settings/set",
          prop: "mappingBrowserAllSchemes",
          value
        })
        // Refresh
        this.$store.commit("mapping/setRefresh")
      }
    },
    resultLimit: {
      get() {
        return this.$settings.mappingBrowserResultLimit
      },
      set(value) {
        value = parseInt(value) || 5
        value = Math.max(1, value)
        value = Math.min(20, value)
        this.$store.commit({
          type: "settings/set",
          prop: "mappingBrowserResultLimit",
          value
        })
        // Refresh
        this.$store.commit("mapping/setRefresh")
      }
    }
  },
  watch: {
    tab(tab) {
      if (tab == 1) {
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
      } else if (tab == 2) {
        // Changed tab to Mapping Navigator, refresh if necessary
        if (this.navigatorNeedsRefresh.length) {
          // If there's only one item, just run it
          if (this.navigatorNeedsRefresh.length == 1) {
            this.navigatorRefresh(this.navigatorNeedsRefresh[0])
            return
          }
          if (this.navigatorNeedsRefresh.find(option => _.isBoolean(option)) != null) {
            // Refresh all registries
            let force = false
            if (this.navigatorNeedsRefresh.find(option => option !== false)) {
              force = true
            }
            this.navigatorRefresh(force)
          } else {
            // Refresh some registries
            let registries = _.uniq(this.navigatorNeedsRefresh)
            for (let registry of registries) {
              this.navigatorRefresh(registry)
            }
          }
        }
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
          this.navigatorRefresh()
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
          this.tab = 2
          this.hasSwitchedToNavigator = true
        }
      },
      deep: true
    },
    needsRefresh(refresh) {
      if (refresh) {
        let registry = this.$store.state.mapping.mappingsNeedRefreshRegistry
        if (registry) {
          this.navigatorRefresh(registry)
          this.search(registry, this.searchPages[registry])
        } else {
          this.navigatorRefresh(true)
          this.search()
        }
        this.$store.commit("mapping/setRefresh", { refresh: false })
      }
    },
  },
  created() {
    // Debounce navigator refresh
    this.navigatorRefresh = _.debounce(this._navigatorRefresh, 100)
    // Clear search
    this.clearSearchFilter()
  },
  mounted() {
    if (!this.concordances) {
      let promises = []
      for (let registry of this.config.registries.filter(r => r.provider.has.concordances)) {
        promises.push(registry.provider.getConcordances())
      }
      Promise.all(promises).then(results => {
        let concordances = _.flatten(results)
        this.concordances = concordances
      })
    }
    this.navigatorRefresh(true)
    // Add click event listener
    document.addEventListener("click", this.handleClickOutside)
  },
  destroyed() {
    // Remove click event listener
    document.removeEventListener("click", this.handleClickOutside)
  },
  methods: {
    handleClickOutside(event) {
      // Handle registry group popovers
      for (let group of this.registryGroups) {
        let popover = _.get(this.$refs[`registryGroup-${group.uri}-popover`], "[0]")
        let button = document.getElementById(`registryGroup-${group.uri}`)
        if (popover && !popover.contains(event.target) && !button.contains(event.target)) {
          this.$set(this.registryGroupShow, group.uri, false)
        }
      }
      // Handle settings popover
      let popover = this.$refs.settingsPopover
      let button = document.getElementById("mappingBrowser-settingsButton-icon")
      if (popover && !popover.contains(event.target) && !button.contains(event.target)) {
        this.settingsShow = false
      }
    },
    generateCancelToken() {
      return axios.CancelToken.source()
    },
    showMappingsForConcordance(concordance) {
      // Change tab to mapping search.
      this.tab = 1
      concordance
      // Clear all other search parameters.
      this.clearSearchFilter()
      // Change concordance.
      this.searchFilter.partOf = concordance.uri
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
    clearSearchFilter() {
      this.searchFilter = {
        fromScheme: "",
        fromNotation: "",
        toScheme: "",
        toNotation: "",
        creator: "",
        type: null,
        partOf: null,
      }
      this.searchResults = {}
      this.search()
    },
    searchClicked() {
      this.search(null, 1)
    },
    search(registryUri = null, page) {
      // If it's not currently the search tab, save search refresh for later
      if (this.tab != 1) {
        this.searchNeedsRefresh.push({ registryUri, page })
        return
      }
      this.searchNeedsRefresh = []
      // TODO: Use only registries that support search/filter/sort
      let registries = this.searchRegistries.filter(registry => registryUri == null || registry.uri == registryUri)
      for (let registry of registries) {
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
        this.getMappings({
          from: this.searchFilter.fromNotation,
          to: this.searchFilter.toNotation,
          fromScheme: this.searchFromScheme,
          toScheme: this.searchToScheme,
          creator: this.searchFilter.creator,
          typeFilter: this.searchFilter.type,
          partOf: this.searchFilter.partOf,
          registry: registry.uri,
          offset: ((this.searchPages[registry.uri] || 1) - 1) * this.resultLimit,
          limit: this.resultLimit,
          cancelToken: cancelToken.token,
        }).then(mappings => {
          if (cancelToken == this.searchCancelToken[registry.uri]) {
            this.$set(this.searchResults, registry.uri, mappings)
            this.$set(this.searchLoading, registry.uri, false)
          }
        }).catch(error => {
          console.warn("Mapping Browser: Error during search:", error)
        })
      }
    },
    _navigatorRefresh(option) {
      let force, registryToReload
      if (_.isBoolean(option)) {
        force = option
        registryToReload = null
      } else if (option !== undefined) {
        force = true
        registryToReload = option
      } else {
        force = false
        registryToReload = null
      }
      if (this.tab != 2) {
        this.navigatorNeedsRefresh.push(registryToReload || force)
        return
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
      let from = _.get(this, "selected.concept[true]")
      let to = _.get(this, "selected.concept[false]")
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

      for (let registry of this.navigatorRegistries) {

        if (registryToReload && registry.uri != registryToReload) {
          // Skip
          continue
        }

        // Check if enabled
        if (!this.showRegistry[registry.uri]) {
          this.$delete(this.navigatorResults, registry.uri)
          continue
        }

        // Cancel previous refreshs
        if (this.navigatorCancelToken[registry.uri]) {
          this.navigatorCancelToken[registry.uri].cancel("There was a newer refresh operation.")
        }
        let cancelToken = this.generateCancelToken()
        this.navigatorCancelToken[registry.uri] = cancelToken
        // From here on, check if token is invalid:
        // if (cancelToken != this.navigatorCancelToken[registry.uri]) { ... }

        if (!registryToReload) {
          this.$set(this.navigatorResults, registry.uri, [null])
        }

        let promise = this.getMappings({ ...params, registry: registry.uri, all: true, cancelToken: cancelToken.token }).then(mappings => {
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
            // TODO: - Put into utils/jskos-tools.
            const includes = (list, concept) => {
              for (let item of list) {
                if (this.$jskos.compare(item, concept)) {
                  return true
                }
              }
              return false
            }
            // TODO: - Put into utils/jskos-tools.
            const concepts = (mapping, isLeft) => {
              let fromTo = isLeft ? "from" : "to"
              return _.get(mapping, `${fromTo}.memberSet`) || _.get(mapping, `${fromTo}.memberChoice`) || _.get(mapping, `${fromTo}.memberList`) || []
            }
            let points = {
              a: 10, b: 10
            }
            _.forOwn({ a, b }, (mapping, key) => {
              let conceptsLeft = concepts(mapping, true)
              let conceptsRight = concepts(mapping, false)
              // Left concept is on left side of mapping.
              if (includes(conceptsLeft, this.selected.concept[true])) {
                points[key] -= 6
              }
              // Right concept is on right side of mapping.
              if (includes(conceptsRight, this.selected.concept[false])) {
                points[key] -= 4
              }
              // Right concept is on left side of mapping.
              if (includes(conceptsLeft, this.selected.concept[false])) {
                points[key] -= 3
              }
              // Left concept is on right side of mapping.
              if (includes(conceptsRight, this.selected.concept[true])) {
                points[key] -= 2
              }
              // Left scheme matches left side of mapping.
              if (this.$jskos.compare(mapping.fromScheme, this.selected.scheme[true])) {
                points[key] -= 1
              }
              // Right scheme matches right side of mapping.
              if (this.$jskos.compare(mapping.toScheme, this.selected.scheme[false])) {
                points[key] -= 1
              }
            })
            if (points.a - points.b != 0) {
              return points.a - points.b
            }
            // If the points are equal, sort by concepts (first from, then to).
            let value = this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "from")
            if (value != 0) {
              return value
            }
            return this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "to")
          })
          // Filter mappings if showAllSchemes is off and schemes don't match
          // Note: This has to be adjusted or removed when proper pagination for navigator results is implemented!
          mappings.totalCount = undefined
          if (!this.showAllSchemes) {
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
          // Reset cancel token
          this.navigatorCancelToken[registry.uri] = null
        }).catch(error => {
          console.warn("Mapping Browser: Error during refresh:", error)
        })

        promises.push(promise)

      }

      Promise.all(promises).then(() => {
        // Load concepts
        // this.mbLoadConcepts(conceptsToLoad)
        // If settings are shown, refresh download
        // if (this.settingsShow) {
        //   this.refreshSettingsDownload()
        // }
      })
    },
    swapClicked() {
      [this.searchFilter.fromScheme, this.searchFilter.fromNotation, this.searchFilter.toScheme, this.searchFilter.toNotation] = [this.searchFilter.toScheme, this.searchFilter.toNotation, this.searchFilter.fromScheme, this.searchFilter.fromNotation]
      this.searchClicked()
    },
    resultsToSections(results, pages, loading) {
      let sections = []
      for (let registry of this.mappingRegistriesSorted.filter(registry => results[registry.uri])) {
        let section = {}
        section.registry = registry
        section.items = []
        section.loading = loading[registry.uri]
        section.page = pages[registry.uri] || 1
        let mappings = results[registry.uri] || []
        section.totalCount = mappings.totalCount || mappings.length
        if (mappings.totalCount === undefined) {
          mappings = mappings.slice((section.page - 1) * this.resultLimit, section.page * this.resultLimit)
        }
        // Concept information possibly needs to be loaded
        this.mbLoadConcepts(_.flatten(mappings.map(mapping => this.$jskos.conceptsOfMapping(mapping))))
        // Add items
        for (let mapping of mappings) {
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
            continue
          }
          // Highlight if selected concepts are in mapping and add inScheme to each concept
          let leftInSource = false
          for (let concept of item.sourceConcepts) {
            if (this.selected.concept[true] && concept.uri == this.selected.concept[true].uri) {
              leftInSource = true
            }
            concept.inScheme = _.get(concept, "inScheme") || [mapping.fromScheme]
          }
          let rightInSource = false
          for (let concept of item.targetConcepts) {
            if (this.selected.concept[false] && concept.uri == this.selected.concept[false].uri) {
              rightInSource = true
            }
            concept.inScheme = _.get(concept, "inScheme") || [mapping.toScheme]
          }
          item._rowClass = ""
          if (leftInSource && rightInSource) {
            item._rowClass = "mappingBrowser-table-row-match"
          }
          item.creator = mapping.creator && mapping.creator[0] || ""
          if (typeof item.creator === "object") {
            item.creator = this.$util.prefLabel(item.creator)
          }
          item.source = this.$util.prefLabel(registry)
          item.sourceShort = this.$util.notation(registry)
          item.type = this.$jskos.mappingTypeByType(mapping.type)
          item.occurrence = mapping._occurrence
          // Generate unique ID as helper
          item.uniqueId = this.$util.generateID()
          // Add class to all items of hoveredRegistry
          if (this.$jskos.compare(item.registry, this.hoveredRegistry)) {
            item._rowClass += " mappingBrowser-hoveredRegistry"
          }
          section.items.push(item)
        }
        sections.push(section)
      }
      return sections
    },
    mbLoadConcepts(concepts) {
      let toLoad = []
      for (let concept of concepts) {
        if(concept && (_.isEmpty(concept.prefLabel) || _.isEmpty(concept.notation)) && !this.$jskos.isContainedIn(concept, this.loadingConcepts) && this.getProvider(concept)) {
          toLoad.push(concept)
        }
      }
      this.loadConcepts(toLoad)
    },
    droppedConcept(object, type, path) {
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
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

#mappingBrowser-settingsButton {
  position: absolute;
  left: 0px;
  top: -6px;
}

#mappingBrowser-settings {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  margin: 5px 5px 15px 5px;
  padding: 5px;
  box-shadow: 0 1px 2px 0 @color-shadow;
}
.mappingBrowser-setting {
  user-select: none;
  margin: 0 15px;
}
.mappingBrowser-settings-registryGroup {
  flex: 1;
  text-align: center;
}
.mappingBrowser-settings-registryGroup-title {
  margin-right: 10px;
}
.mappingBrowser-settings-registryGroup-notation {
  margin: 0 4px;
  cursor: pointer;
}
.mappingBrowser-search-registryNotation {
  margin: auto 4px;
  cursor: pointer;
}
.mappingBrowser-settings-registryGroup-popover {
  display: flex;
  flex-direction: column;
  margin: 10px 10px;
}
.mappingBrowser-settings-registryGroup-popover-item {
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

#mappingBrowser > .tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}
#mappingBrowser > .tabs > div:first-child {
  flex: none;
}
#mappingBrowser > .tabs > div:first-child > ul > li > a {
  padding: 2px 0;
}
#mappingBrowser > .tabs > .tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
#mappingBrowser > .tabs > .tab-content > .tab-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 5px;
}
#mappingBrowser > .tabs > .tab-content > .tab-pane:focus {
  outline: 0;
}

#mappingBrowser .tabs .nav {
  padding: 0 20px;
}

</style>
