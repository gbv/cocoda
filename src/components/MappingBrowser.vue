<template>
  <div id="mappingBrowser">
    <!-- Minimizer allows component to get minimized -->
    <minimizer :text="$t('mappingBrowser.title')" />
    <div
      v-show="selected.scheme[true] != null || selected.scheme[false] != null"
      id="mappingBrowserWrapper" >
      <!-- Settings -->
      <div id="mappingBrowser-settings">
        <b-form-checkbox
          v-model="showLocal"
          class="mappingBrowser-setting" >
          <b>L</b>ocal ({{ localMappingsCurrent }} / {{ localMappingsTotal }})
        </b-form-checkbox>
        <b-form-checkbox
          v-for="provider in config.mappingProviders"
          :key="provider.url"
          v-model="showProvider[provider.url]"
          class="mappingBrowser-setting" >
          <provider-name :provider="provider" />
        </b-form-checkbox>
        <b-form-checkbox
          v-for="provider in config.occurrenceProviders"
          :key="provider.notation[0]"
          v-model="showCatalog"
          class="mappingBrowser-setting" >
          <provider-name :provider="provider" />
        </b-form-checkbox>
      </div>
      <!-- Mapping table -->
      <flexible-table
        :items="items"
        :fields="fields"
        class="mappingBrowser-table"
        @hover="hoveredMapping = $event && $event.mapping" >
        <span
          slot="sourceScheme"
          slot-scope="{ value }" >
          <item-name
            :item="value"
            :show-text="false"
            :show-tooltip="true"
            font-size="sm" />
        </span>
        <span
          slot="sourceConcepts"
          slot-scope="{ value }" >
          <item-name
            v-for="concept in value"
            :key="concept.uri"
            :item="concept"
            :show-text="false"
            :show-tooltip="true"
            :is-link="true"
            :is-left="true"
            :is-highlighted="$jskos.compare(concept, selected.concept[true]) || $jskos.compare(concept, selected.concept[false])"
            @mouseover.native="hover(concept)" />
        </span>
        <span
          slot="sourceConceptsLong"
          slot-scope="{ value }" >
          <item-name
            v-for="concept in value"
            :key="concept.uri"
            :item="concept"
            :show-text="true"
            :show-tooltip="false"
            :is-link="true"
            :is-left="true"
            :is-highlighted="$jskos.compare(concept, selected.concept[true]) || $jskos.compare(concept, selected.concept[false])"
            @mouseover.native="hover(concept)" />
        </span>
        <span
          slot="targetScheme"
          slot-scope="{ value }" >
          <item-name
            :item="value"
            :show-text="false"
            :show-tooltip="true"
            font-size="sm" />
        </span>
        <span
          slot="targetConcepts"
          slot-scope="{ value }" >
          <span
            v-for="concept in value"
            :key="concept.uri">
            <item-name
              :item="concept"
              :show-text="false"
              :show-tooltip="true"
              :is-link="true"
              :is-left="false"
              :is-highlighted="$jskos.compare(concept, selected.concept[false]) || $jskos.compare(concept, selected.concept[true])"
              @mouseover.native="hover(concept)" />
            <br>
          </span>
        </span>
        <span
          slot="targetConceptsLong"
          slot-scope="{ value }" >
          <span
            v-for="concept in value"
            :key="concept.uri">
            <item-name
              :item="concept"
              :show-text="true"
              :show-tooltip="false"
              :is-link="true"
              :is-left="false"
              :is-highlighted="$jskos.compare(concept, selected.concept[false]) || $jskos.compare(concept, selected.concept[true])"
              @mouseover.native="hover(concept)" />
            <br>
          </span>
        </span>
        <span
          slot="type"
          slot-scope="{ value }" >
          <span
            v-b-tooltip.hover="{ title: value.prefLabel.en, delay: $util.delay.medium }"
            v-if="value != null" >
            {{ $util.notation(value) }}
          </span>
        </span>
        <span
          slot="creator"
          slot-scope="{ item }" >
          <span
            v-b-tooltip.hover="{ title: item.creator != truncateText(item.creator) ? item.creator : '', delay: $util.delay.medium }"
            v-if="item.creator != null" >
            {{ truncateText(item.creator) }}
          </span>
        </span>
        <span
          slot="source"
          slot-scope="{ item }" >
          <b>{{ item.sourceShort }}</b>
        </span>
        <span
          slot="actions"
          slot-scope="data" >
          <font-awesome-icon
            v-b-tooltip.hover="{ title: canSave(data.item.mapping) ? $t('mappingBrowser.saveAndEdit') : $t('mappingBrowser.edit'), delay: $util.delay.medium }"
            icon="edit"
            class="button mappingBrowser-toolbar-button"
            @click="edit(data)" />
          <font-awesome-icon
            v-b-tooltip.hover="{ title: canSave(data.item.mapping) ? $t('mappingBrowser.saveAsMapping') : '', delay: $util.delay.medium }"
            v-if="!data.item.mapping.LOCAL"
            :class="{
              ['button']: canSave(data.item.mapping),
              ['button-disabled']: !canSave(data.item.mapping)
            }"
            icon="save"
            class="mappingBrowser-toolbar-button"
            @click="canSave(data.item.mapping) && saveMapping(data.item.mapping)" />
          <font-awesome-icon
            v-b-tooltip.hover="{ title: $t('mappingBrowser.delete'), delay: $util.delay.medium }"
            v-if="data.item.mapping.LOCAL"
            icon="trash-alt"
            class="button-delete mappingBrowser-toolbar-button"
            @click="removeMapping(data.item.mapping)"
          />
        </span>
        <span
          slot="HEAD_actions"
          slot-scope="data" />
        <span
          slot="ITEM_ROW"
          slot-scope="{ item, value }" >
          <font-awesome-icon
            v-b-tooltip.hover="{ title: `${$t('mappingBrowser.showMore')} (${value})`, delay: $util.delay.medium }"
            v-if="item.type == 'more'"
            icon="ellipsis-h"
            class="button"
            @click="showMore(value)" />
        </span>
        <span
          slot="count"
          slot-scope="data" >
          <span v-if="data.item.occurrence == null" />
          <span v-else-if="data.item.occurrence.count == -1">-</span>
          <span v-else>
            <auto-link
              :link="data.item.occurrence.url"
              :text="String(data.item.occurrence.count)" />
          </span>
        </span>
      </flexible-table>
      <div
        v-show="loading == 0 && items.length == 0"
        class="noItems fontWeight-heavy" >
        {{ $t("mappingBrowser.noMappings") }}
      </div>
    </div>
    <!-- Full screen loading indicator -->
    <loading-indicator-full v-if="loading" />
  </div>
</template>

<script>
import ItemName from "./ItemName"
import ProviderName from "./ProviderName"
import AutoLink from "./AutoLink"
import Minimizer from "./Minimizer"
import LoadingIndicatorFull from "./LoadingIndicatorFull"
import FlexibleTable from "vue-flexible-table"
import _ from "lodash"
import axios from "axios"

/**
 * The mapping suggestion browser component.
 */
export default {
  name: "MappingBrowser",
  components: { ItemName, ProviderName, AutoLink, Minimizer, LoadingIndicatorFull, FlexibleTable },
  data () {
    return {
      loading: 0,
      items: [],
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
      /** List of supported schemes by occurrences-api */
      occurrencesSupportedSchemes: null,
      /** List of identifiers of all local mappings (used in `canSave`) */
      localMappingIdentifiers: [],
      occurrencesCache: [],
      localMappingsTotal: 0,
      localMappingsCurrent: 0,
      showMoreValues: {},
      /** Unique ID for each reload */
      loadingId: null,
    }
  },
  computed: {
    /**
     * List of fields (columns) to be used in bootstrap table
     */
    fields() {
      return [
        {
          key: "sourceScheme",
          label: "",
          width: "4%",
          minWidth: "",
          align: "left",
          sortable: false,
          class: "fontSize-small"
        },
        {
          key: "sourceConcepts",
          label: this.$t("mappingBrowser.from"),
          width: "10%",
          minWidth: "",
          align: "left",
          sortable: false,
          compare: (a, b) => this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "from"),
          class: "mappingBrowser-table-concepts"
        },
        {
          key: "sourceConceptsLong",
          label: this.$t("mappingBrowser.from"),
          width: "25%",
          minWidth: "",
          align: "left",
          sortable: false,
          compare: (a, b) => this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "from"),
          class: "mappingBrowser-table-conceptsLong"
        },
        {
          key: "type",
          label: "",
          width: "4%",
          minWidth: "",
          sortable: false,
          compare: (a ,b) => {
            let labelA = _.get(a, "type.prefLabel.en", "")
            let labelB = _.get(b, "type.prefLabel.en", "")
            if (labelA < labelB) {
              return -1
            }
            if (labelA > labelB) {
              return 1
            }
            return 0
          }
        },
        {
          key: "targetScheme",
          label: "",
          width: "4%",
          minWidth: "",
          align: "left",
          sortable: false,
          class: "fontSize-small"
        },
        {
          key: "targetConcepts",
          label: this.$t("mappingBrowser.to"),
          width: "10%",
          minWidth: "",
          align: "left",
          sortable: false,
          compare: (a, b) => this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "to"),
          class: "mappingBrowser-table-concepts"
        },
        {
          key: "targetConceptsLong",
          label: this.$t("mappingBrowser.to"),
          width: "25%",
          minWidth: "",
          align: "left",
          sortable: false,
          compare: (a, b) => this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "to"),
          class: "mappingBrowser-table-conceptsLong"
        },
        {
          key: "creator",
          label: this.$t("mappingBrowser.creator"),
          width: "8%",
          minWidth: "",
          align: "left",
          sortable: false,
          class: "mappingBrowser-table-creator"
        },
        {
          key: "count",
          label: "",
          width: "4%",
          minWidth: "",
          align: "right",
          sortable: false,
          compare: (a, b) => {
            let first = _.get(a, "occurrence.count", -1)
            let second = _.get(b, "occurrence.count", -1)
            if (first < second) {
              return -1
            }
            if (first > second) {
              return 1
            }
            return 0
          }
        },
        {
          key: "source",
          label: "",
          width: "2%",
          minWidth: "",
          sortable: false
        },
        {
          key: "actions",
          label: "",
          width: "4%",
          minWidth: "",
          sortable: false
        }
      ]
    },
    needsRefresh() {
      return this.$store.state.mapping.mappingsNeedRefresh
    },
    selectedConcepts() {
      return this.selected.concept
    },
    // show local mappings
    showLocal: {
      get() {
        return this.$settings.mappingBrowserLocal
      },
      set(value) {
        this.$store.commit({
          type: "settings/set",
          prop: "mappingBrowserLocal",
          value
        })
        // Refresh list of mappings/suggestions.
        this.$store.commit("mapping/setRefresh", true)
      }
    },
    // show provider mappings
    showProvider() {
      let object = {}
      // Define setter and getter for each mapping provider separately.
      for (let provider of this.config.mappingProviders) {
        Object.defineProperty(object, provider.url, {
          get: () => {
            let result = this.$settings.mappingBrowserProvider[provider.url]
            if (result == null) {
              return true
            }
            return result
          },
          set: (value) => {
            this.$store.commit({
              type: "settings/set",
              prop: "mappingBrowserProvider",
              value: Object.assign({}, this.$settings.mappingBrowserProvider, { [provider.url]: value })
            })
            this.$store.commit("mapping/setRefresh", true)
          }
        })
      }
      return object
    },
    // show catalog suggestions/occurrences
    showCatalog: {
      get() {
        return this.$settings.mappingBrowserCatalog
      },
      set(value) {
        this.$store.commit({
          type: "settings/set",
          prop: "mappingBrowserCatalog",
          value
        })
        // Refresh list of mappings/suggestions.
        this.$store.commit("mapping/setRefresh", true)
      }
    },
  },
  watch: {
    needsRefresh(refresh) {
      if (refresh) {
        this.reload(true)
        this.$store.commit("mapping/setRefresh", false)
      }
    },
    selectedConcepts: {
      handler() {
        this.reload()
      },
      deep: true
    },
  },
  created() {
    this.reload = _.debounce(this.internalReload, 100)
  },
  mounted() {
    this.$util.setupTableScrollSync()
    this.reload()
  },
  methods: {
    internalReload(force = false) {

      // Reload local mapping identifiers
      // TODO: Do this differently!
      this.$api.getLocalMappings(params).then(mappings => {
        this.localMappingIdentifiers = mappings.reduce((all, current) => all.concat(current.identifier || []), [])
        this.localMappingsTotal = mappings.length
      })

      let items = []
      let promises = []

      if (!this.selected.concept[true] && !this.selected.concept[false]) {
        // No selected concepts, not reloading and clearing items+previosSelected.
        this.items = items
        this.previousSelected = {
          scheme: {
            [true]: null,
            [false]: null
          },
          concept: {
            [true]: null,
            [false]: null
          }
        }
        return
      }
      if (this.$jskos.compare(this.selected.concept[true], this.previousSelected.concept[true]) && this.$jskos.compare(this.selected.concept[false], this.previousSelected.concept[false]) && this.$jskos.compare(this.selected.scheme[true], this.previousSelected.scheme[true]) && this.$jskos.compare(this.selected.scheme[false], this.previousSelected.scheme[false]) && !force) {
        // No change in concepts, not reloading.
        return
      }
      if (!force) {
        // Either concept or scheme changed => reset showMoreValues.
        this.showMoreValues = {}
      }

      this.loading = 1

      // Set unique ID for this request
      let loadingId = this.$util.generateID()
      this.loadingId = loadingId
      // Question/TODO: - Use axios cancel tokens to remove old requests?

      this.previousSelected = {}
      this.previousSelected.concept = {
        [true]: this.selected.concept[true] ? { uri: this.selected.concept[true].uri } : null,
        [false]: this.selected.concept[false] ? { uri: this.selected.concept[false].uri } : null,
      }
      this.previousSelected.scheme = {
        [true]: this.selected.scheme[true] ? { uri: this.selected.scheme[true].uri } : null,
        [false]: this.selected.scheme[false] ? { uri: this.selected.scheme[false].uri } : null,
      }

      // Prepare params
      let params = {
        direction: "both",
        mode: "or",
      }
      let from = _.get(this, "selected.concept[true]")
      let to = _.get(this, "selected.concept[false]")
      if (from) {
        params["from"] = from.uri
      }
      if (to) {
        params["to"] = to.uri
      }

      // 1. Local
      if (this.showLocal) {
        promises.push(this.$api.getLocalMappings(params).then(mappings => {
          if (this.loadingId == loadingId) {
            this.localMappingsCurrent = mappings.length
          }
          let items = []
          for (let mapping of mappings) {
            let item = {}
            item.mapping = mapping
            item.sourceShort = "L"
            items.push(item)
          }
          return {
            source: "local",
            items
          }
        }))
      }

      // 2. Server
      for (let provider of this.config.mappingProviders) {
        if (this.showProvider[provider.url]) {
          promises.push(this.$api.getMappings(params, false, [provider]).then(mappings => {
            let items = []
            for (let mapping of mappings) {
              let item = {}
              item.mapping = mapping
              item.sourceShort = this.$util.notation(provider)
              items.push(item)
            }
            return {
              source: this.$util.prefLabel(provider),
              items
            }
          }))
        }
      }

      // 3. Catalog
      if (this.showCatalog) {
        let provider = this.config.occurrenceProviders[0]
        promises.push(this.loadOccurrences().then(occurrences => {
          let items = []
          for (let occurrence of occurrences) {
            if (!occurrence) continue
            let item = {}
            item.occurrence = occurrence
            item.sourceShort = this.$util.notation(provider)
            let mapping = {}
            mapping.from = _.get(occurrence, "memberSet[0]")
            this.loadNotation(mapping.from)
            if (mapping.from) {
              mapping.from = { memberSet: [mapping.from] }
            } else {
              mapping.from = null
            }
            mapping.fromScheme = this.$store.getters["objects/get"](_.get(occurrence, "memberSet[0].inScheme[0]"))
            mapping.to = _.get(occurrence, "memberSet[1]")
            this.loadNotation(mapping.to)
            if (mapping.to) {
              mapping.to = { memberSet: [mapping.to] }
            } else {
              mapping.to = { memberSet: [] }
            }
            mapping.toScheme = this.$store.getters["objects/get"](_.get(occurrence, "memberSet[1].inScheme[0]"))
            // Swap sides if necessary
            if (!this.$jskos.compare(mapping.fromScheme, this.selected.scheme[true]) && !this.$jskos.compare(mapping.toScheme, this.selected.scheme[false])) {
              [mapping.from, mapping.fromScheme, mapping.to, mapping.toScheme] = [mapping.to, mapping.toScheme, mapping.from, mapping.fromScheme]
            }
            mapping.toScheme = mapping.toScheme || this.selected.scheme[false]
            mapping.type = [this.$jskos.defaultMappingType.uri]
            mapping = this.$jskos.addMappingIdentifiers(mapping)
            if (occurrence.database) {
              mapping.creator = [occurrence.database]
            }
            item.mapping = mapping
            // Only add if either side could be found.
            if (mapping.fromScheme || mapping.toScheme) {
              items.push(item)
            }
          }
          return {
            source: "catalog",
            items
          }
        }))
      }

      Promise.all(promises).then(results => {
        if (this.loadingId != loadingId) return
        let lengthPerSet = 5
        let lengths = results.map(result => result.items.length)
        // let totalLength = lengths.reduce((total, value) => total + value, 0)
        let zeroCount = _.get(_.countBy(lengths), "[0]", 0)
        let truncateResults = zeroCount < (results.length - 1) && !this.$settings.mappingBrowserShowAll
        for (let result of results) {
          let source = result.source || "unknown"
          // Sort the results
          result.items = result.items.sort((a, b) => {
            if (source == "catalog") {
              // Sort catalog items by occurrences decending
              return _.get(b, "occurrence.count", 0) - _.get(a, "occurrence.count", 0)
            } else {
              // Sort mappings
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
              _.forOwn({ a, b }, ({ mapping }, key) => {
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
            }
          })
          // Truncate if necessary (and don't truncate local mappings)
          let wasTruncated = false
          let maxLengthForThis = _.get(this.showMoreValues, `[${source}]`, 1) * lengthPerSet
          if (truncateResults && source != "local" && result.items.length > maxLengthForThis) {
            result.items = result.items.slice(0, maxLengthForThis)
            wasTruncated = true
          }
          let addSeparator = items.length > 0
          // Add items
          for (let item of result.items) {
            let mapping = item.mapping
            item.sourceScheme = _.get(mapping, "fromScheme")
            item.sourceScheme = this.$store.getters["objects/get"](item.sourceScheme) || item.sourceScheme
            item.targetScheme = _.get(mapping, "toScheme")
            item.targetScheme = this.$store.getters["objects/get"](item.targetScheme) || item.targetScheme
            // TODO: Use Vuex getters.
            item.sourceConcepts = _.get(mapping, "from.memberSet") || _.get(mapping, "from.memberChoice") || []
            item.targetConcepts = _.get(mapping, "to.memberSet") || _.get(mapping, "to.memberChoice") || []
            // Load prefLabels for all concepts
            // TODO: Optimize by loading multiple concepts simultaneously (#107)
            for (let concept of item.sourceConcepts) {
              this.hover(concept, _.get(mapping, "fromScheme"))
            }
            for (let concept of item.targetConcepts) {
              this.hover(concept, _.get(mapping, "toScheme"))
            }
            // Save concepts as xLabels attribute as well
            item.sourceConceptsLong = item.sourceConcepts
            item.targetConceptsLong = item.targetConcepts
            // Set source/targetScheme to empty string if from/to is null.
            if (!_.get(mapping, "from") && item.sourceConcepts.length == 0) {
              item.sourceScheme = null
            }
            if (!_.get(mapping, "to") && item.targetConcepts.length == 0) {
              item.targetScheme = null
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
            // Load the prefLabels for all concepts that don't have a notation
            for (let concept of [].concat(item.sourceConcepts, item.targetConcepts)) {
              if (!this.$util.notation(concept)) {
                this.hover(concept)
              }
            }
            item._rowClass = ""
            if (leftInSource && rightInSource) {
              item._rowClass = "mappingBrowser-table-row-match"
            }
            if (addSeparator) {
              item._rowClass += " mappingBrowser-separatorRow"
              addSeparator = false
              // Add class to previous item
              _.last(items)._rowClass += " mappingBrowser-beforeSeparatorRow"
            }
            item.creator = mapping.creator && mapping.creator[0] || ""
            if (typeof item.creator === "object") {
              item.creator = this.$util.prefLabel(item.creator)
            }
            item.source = `${item.sourceShort} ${item.creator}`
            item.type = this.$jskos.mappingTypeByType(mapping.type)
            items.push(item)
          }
          // Add extra row if truncated
          if (wasTruncated) {
            items.push({
              "_wholeRow": true,
              "_rowClass": "mappingBrowser-table-row-showMore fontSize-small",
              value: source,
              type: "more",
            })
          }
        }
      }).catch(() => null).finally(() => {
        if (this.loadingId == loadingId) {
          this.items = items
          this.loadingId = null
          this.loading = 0
        }
      })
    },
    showMore(value) {
      this.showMoreValues[value] = _.get(this.showMoreValues, `[${value}]`, 1) + 1
      this.$store.commit("mapping/setRefresh", true)
    },
    truncateText(text, characters = 10) {
      if (text.length > characters) {
        return text.substring(0, characters - 3) + "..."
      } else {
        return text
      }
    },
    edit(data) {
      let mapping = this.$jskos.copyDeep(data.item.mapping)
      // Make sure concept object references are in sync
      mapping.from.memberSet = data.item.mapping.from.memberSet.slice()
      if (mapping.to.memberSet) {
        mapping.to.memberSet = data.item.mapping.to.memberSet.slice()
      } else if (mapping.to.memberList) {
        mapping.to.memberList = data.item.mapping.to.memberList.slice()
      } else if (mapping.to.memberChoice) {
        mapping.to.memberChoice = data.item.mapping.to.memberChoice.slice()
      }
      // Load concept prefLabel for each concept in mapping if necessary
      for (let concept of [].concat(mapping.from.memberSet, mapping.to.memberSet, mapping.to.memberList, mapping.to.memberChoice)) {
        this.hover(concept)
      }
      // Save mapping
      // let original = mapping.LOCAL ? data.item.mapping : null
      if (this.canSave(mapping)) {
        this.saveMapping(mapping).then(() => {
          this.$store.commit({
            type: "mapping/set",
            mapping,
            original: mapping
          })
        })
      } else {
        this.$store.commit({
          type: "mapping/set",
          mapping,
          original: mapping.LOCAL ? mapping : null
        })
      }
    },
    hover(concept, scheme) {
      if(concept && !concept.prefLabel) {
        // Load prefLabel to be shown as tooltip
        if ((!concept.inScheme || concept.inScheme.length == 0) && !scheme) {
          // TODO: - Error handling
          console.warn("No scheme for", concept)
          return
        }

        this.getObject({ object: concept, scheme: _.get(concept, "inScheme[0]", scheme) }).then(result => {
          if (result && result.prefLabel) {
            this.$store.commit({
              type: "objects/set",
              object: concept,
              prop: "prefLabel",
              value: result.prefLabel
            })
          } else {
            // TODO: - Error handling
            this.$store.commit({
              type: "objects/set",
              object: concept,
              prop: "prefLabel",
              value: { de: " " }
            })
          }
        })
      }
    },
    loadNotation(concept) {
      if(concept && !concept.notation) {
        // Load notation

        if (!concept.inScheme || concept.inScheme.length == 0) {
          // TODO: - Error handling
          console.warn("No scheme for", concept)
          return
        }

        this.getObject({ object: concept, scheme: concept.inScheme[0] }).then(result => {
          if (result && result.notation) {
            this.$store.commit({
              type: "objects/set",
              object: concept,
              prop: "notation",
              value: result.notation
            })
          }
        })
      }
    },
    removeMapping(mapping) {
      this.$api.removeMapping(mapping).then(success => {
        if (success) {
          this.alert(this.$t("alerts.mappingDeleted"), null, "success")
        } else {
          this.alert(this.$t("alerts.mappingNotDeleted"), null, "danger")
        }
        // Refresh list of mappings/suggestions.
        this.$store.commit("mapping/setRefresh", true)
      })
    },
    /** Reloads occurrences from api */
    loadOccurrences() {
      let promise
      if (!this.occurrencesSupportedSchemes) {
        // Load supported schemes
        // TODO: - Put this into API
        promise = axios.get("//coli-conc.gbv.de/occurrences/api/voc")
          .then(response => {
            this.occurrencesSupportedSchemes = _.get(response, "data", [])
          })
          .catch(error => {
            console.error(error)
            // TODO: - Better error handling
            this.occurrencesSupportedSchemes = []
          })
      } else {
        promise = Promise.resolve()
      }
      return promise.then(() => {
        let uris = []
        let promises = []
        for (let [scheme, concept] of [[this.selected.scheme[true], this.selected.concept[true]], [this.selected.scheme[false], this.selected.concept[false]]]) {
          if (concept && this.occurrencesIsSupported(scheme)) {
            uris.push(concept.uri)
          }
        }
        if (uris.length == 0) {
          return []
        }
        for (let uri of uris) {
          promises.push(this.getOccurrences({
            params: {
              member: uri,
              scheme: "*",
              threshold: 5
            },
          }).catch(error => {
            console.error("Occurrences API Error:", error)
            return { data: [] }
          }))
        }
        // Another request for co-occurrences between two specific concepts
        if (uris.length == 2 && uris[0] != uris[1]) {
          let urisString = uris.join(" ")
          promises.push(this.getOccurrences({
            params: {
              member: urisString,
              threshold: 5
            },
          }).catch(error => {
            console.error("Occurrences API Error:", error)
            return null
          }))
        }
        return Promise.all(promises)
      }).then(responses => {
        let occurrences = []
        for (let response of responses) {
          let result = _.get(response, "data", [])
          occurrences = occurrences.concat(result)
        }
        // Filter duplicates
        let existingUris = []
        let indexesToDelete = []
        for (let i = 0; i < occurrences.length; i += 1) {
          let occurrence = occurrences[i]
          let uris = occurrence.memberSet.reduce((total, current) => total.concat(current.uri), []).sort().join(" ")
          if (existingUris.includes(uris)) {
            indexesToDelete.push(i)
          } else {
            existingUris.push(uris)
          }
        }
        indexesToDelete.forEach(value => {
          delete occurrences[value]
        })
        // Sort occurrences and only save top 10
        return occurrences.sort((a, b) => parseInt(b.count || 0) - parseInt(a.count || 0)).slice(0, 10)
      }).catch(error => {
        console.error("Occurrences Error:", error)
        return []
      })
    },
    /** Wrapper around axios.get for loading occurrences */
    getOccurrences(options) {
      if (this.config.occurrenceProviders && this.config.occurrenceProviders.length) {
        // Use local cache.
        let resultsFromCache = this.occurrencesCache.find(item => {
          return _.isEqual(item.options.params, options.params)
        })
        if (resultsFromCache) {
          return Promise.resolve(resultsFromCache.results)
        }
        return axios.get(this.config.occurrenceProviders[0].url, options).then(results => {
          this.occurrencesCache.push({
            options,
            results
          })
          return results
        })
      } else {
        return Promise.resolve([])
      }
    },
    /** Returns whether a scheme is supported by the occurrences-api */
    occurrencesIsSupported(scheme) {
      let supported = false
      for (let supportedScheme of this.occurrencesSupportedSchemes) {
        if (this.$jskos.compare(scheme, supportedScheme)) {
          supported = true
        }
      }
      return supported
    },
    /** Saving of mappigns */
    canSave(mapping) {
      if (!mapping || mapping.LOCAL || !mapping.fromScheme || !mapping.toScheme) {
        return false
      }
      // TODO: Do this differently to prevent going through all local mappings on each reload.
      if (!mapping.identifier) {
        mapping = this.$jskos.addMappingIdentifiers(mapping)
      }
      let id = (mapping.identifier || []).find(id => id.startsWith("urn:jskos:mapping:content"))
      if (!id) {
        return false
      }
      if (this.localMappingIdentifiers.includes(id)) {
        return false
      }
      return true
    },
    saveMapping(mapping) {
      this.loading = 1
      return this.$api.saveMapping(mapping).then(mapping => {
        return mapping
      }).catch(() => {
        return null
      }).finally(() => {
        // Refresh list of mappings/suggestions.
        this.$store.commit("mapping/setRefresh", true)
      })
    },
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

#mappingBrowser {
  position: relative;
  display: flex;
}
#mappingBrowserWrapper {
  flex: 1;
  width: 0;
  display: flex;
  flex-direction: column;
}
#mappingBrowser-settings {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  margin: 5px auto;
}
.mappingBrowser-setting {
  user-select: none;
  margin: 0 15px;
}
.mappingBrowser-table {
  flex: 1;
}
.noItems {
  margin: 30px auto 5px auto;
  flex: 5 0 auto;
}

</style>

<style lang="less">
@import "../style/main.less";

.mappingBrowser-table-row-match {
  background-color: @color-table-highlight-background-1;
}
.mappingBrowser-table-row-showMore {
  height: 24px;
}
.mappingBrowser-beforeSeparatorRow {
  padding-bottom: 10px !important;
}
.mappingBrowser-separatorRow {
  border-top: 1px solid black;
  padding-top: 10px !important;
}

.mappingBrowser-table[max-width~="800px"] .mappingBrowser-table-creator {
  display: none;
}
.mappingBrowser-table[max-width~="700px"] .mappingBrowser-table-conceptsLong {
  display: none;
}
.mappingBrowser-table[min-width~="700px"] .mappingBrowser-table-concepts {
  display: none;
}

</style>
