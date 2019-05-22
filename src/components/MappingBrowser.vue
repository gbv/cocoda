<template>
  <div id="mappingBrowser">
    <b-tabs
      v-model="tab"
      pills
      no-fade
      justified>
      <b-tab
        title="Concordances">
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
        title="Mapping Search">
        <div style="flex: none;">
          <div style="display: flex;">
            <b-input
              v-model="searchFilter.fromScheme"
              :state="searchFilter.fromScheme == '' ? true : searchFromScheme != null"
              style="flex: 1; margin: 3px;"
              size="sm"
              placeholder="source scheme" />
            <b-input
              v-model="searchFilter.fromNotation"
              style="flex: 2; margin: 3px;"
              size="sm"
              placeholder="source notation" />
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
              placeholder="target scheme" />
            <b-input
              v-model="searchFilter.toNotation"
              style="flex: 2; margin: 3px;"
              size="sm"
              placeholder="target notation" />
          </div>
          <div style="display: flex;">
            <div style="text-align: right; flex: none; margin: auto 5px;">
              Creator:
            </div>
            <b-input
              v-model="searchFilter.creator"
              style="flex: 2; margin: 3px;"
              size="sm"
              placeholder="creator" />
            <div style="text-align: right; flex: none; margin: auto 5px;">
              Type:
            </div>
            <b-select
              v-model="searchFilter.type"
              style="flex: 2; margin: 3px;"
              size="sm"
              :options="typeOptions" />
          </div>
          <div style="display: flex;">
            <div style="text-align: right; flex: none; margin: auto 5px;">
              Concordance:
            </div>
            <b-form-select
              v-model="searchFilter.partOf"
              style="flex: 2; margin: 3px;"
              size="sm"
              :options="concordanceOptions" />
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
        title="Mapping Navigator">
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
import _ from "lodash"
// Only use for cancel token generation!
import axios from "axios"

// Import mixins
import auth from "../mixins/auth"
import objects from "../mixins/objects"

export default {
  name: "MappingBrowser",
  components: { FlexibleTable, MappingBrowserTable },
  mixins: [auth, objects],
  data() {
    return {
      tab: 2,
      concordances: null,
      concordanceFilter: {
        from: "",
        to: "",
        creator: "",
      },
      searchFilter: null,
      searchPages: {},
      searchLimit: 5,
      searchResults: {},
      searchLoading: {},
      searchCancelToken: {},
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
    mappingRegistries() {
      let registries = this.config.registries.filter(registry =>
        registry.provider &&
        (registry.provider.has.mappings || registry.provider.has.occurrences) &&
        (
          (registry.provider.supportsScheme && registry.provider.supportsScheme(this.selected.scheme[true])) ||
          (registry.provider.supportsScheme && registry.provider.supportsScheme(this.selected.scheme[false]))
        )
      )
      let currentRegistryIndex = registries.findIndex(registry => this.$jskos.compare(registry, this.currentRegistry))
      if (currentRegistryIndex !== -1) {
        let current = registries[currentRegistryIndex]
        _.pullAt(registries, [currentRegistryIndex])
        registries = [current].concat(registries)
      }
      return registries
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
      return groups
    },
    searchSections () {
      return this.resultsToSections(this.searchResults, this.searchPages, this.searchLoading)
    },
    navigatorSections () {
      return this.resultsToSections(this.navigatorResults, this.navigatorPages, this.navigatorLoading)
    },
  },
  watch: {
    tab(tab) {
      if (tab == 2) {
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
      },
      deep: true
    },
    needsRefresh(refresh) {
      if (refresh) {
        let registry = this.$store.state.mapping.mappingsNeedRefreshRegistry
        if (registry) {
          this.navigatorRefresh(registry)
        } else {
          this.navigatorRefresh(true)
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
  },
  methods: {
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
    },
    searchClicked() {
      this.search(null, 1)
    },
    search(registryUri = null, page) {
      // TODO: Use only registries that support search/filter/sort
      let registries = this.mappingRegistries.filter(registry => registryUri == null || registry.uri == registryUri)
      for (let registry of registries) {
        // Cancel previous refreshs
        if (this.searchCancelToken[registry.uri]) {
          this.searchCancelToken[registry.uri].cancel("There was a newer refresh operation.")
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
          offset: ((this.searchPages[registry.uri] || 1) - 1) * this.searchLimit,
          limit: this.searchLimit,
          cancelToken: cancelToken.token,
        }).then(mappings => {
          if (cancelToken == this.searchCancelToken[registry.uri]) {
            this.$set(this.searchResults, registry.uri, mappings)
            this.$set(this.searchLoading, registry.uri, false)
            // // Concept information possibly needs to be loaded
            // this.mbLoadConcepts(_.flatten(mappings.map(mapping => this.$jskos.conceptsOfMapping(mapping))))
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

      for (let registry of this.mappingRegistries) {

        if (registryToReload && registry.uri != registryToReload) {
          // Skip
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
          this.$set(this.navigatorResults, registry.uri, mappings)
          // TODO: conceptsToLoad
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
      for (let registry of this.mappingRegistries) {
        let section = {}
        section.registry = registry
        section.items = []
        section.loading = loading[registry.uri]
        section.page = pages[registry.uri] || 1
        let mappings = results[registry.uri] || []
        section.totalCount = mappings.totalCount || mappings.length
        if (mappings.totalCount === undefined) {
          mappings = mappings.slice((section.page - 1) * this.searchLimit, section.page * this.searchLimit)
        }
        // Concept information possibly needs to be loaded
        this.mbLoadConcepts(_.flatten(mappings.map(mapping => this.$jskos.conceptsOfMapping(mapping))))
        // Add items
        for (let mapping of mappings) {
          let item = { mapping, registry }
          item.sourceScheme = _.get(mapping, "fromScheme") || undefined
          item.targetScheme = _.get(mapping, "toScheme") || undefined
          // // Skip mapping if showAllSchemes is off and schemes don't match
          // if (!this.showAllSchemes) {
          //   // If one side doesn't have a scheme selected, always show all
          //   if (this.selected.scheme[true] && this.selected.scheme[false]) {
          //     let schemesCorrect = true
          //     for (let scheme of [item.sourceScheme, item.targetScheme]) {
          //       let schemeCorrect = false
          //       for (let isLeft of [true, false]) {
          //         if (this.$jskos.compare(scheme, this.selected.scheme[isLeft])) {
          //           schemeCorrect = true
          //         }
          //       }
          //       schemesCorrect = schemesCorrect && schemeCorrect
          //     }
          //     if (!schemesCorrect) {
          //       continue
          //     }
          //   }
          // }
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
          section.items.push(item)
        }
        if (section.loading || section.items.length) {
          sections.push(section)
        }
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
  },
}
</script>

<style lang="less">
@import "../style/main.less";

#mappingBrowser {
  max-width: 100%;
}

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

</style>
