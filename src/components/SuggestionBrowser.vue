<template>
  <div id="suggestionBrowser">
    <!-- Minimizer allows component to get minimized -->
    <minimizer text="Suggestion Browser" />
    <div
      v-show="selected.scheme[true] != null || selected.scheme[false] != null"
      id="suggestionBrowserWrapper" >
      <!-- Settings -->
      <div id="suggestionBrowser-settings">
        <b-form-checkbox
          v-model="showLocal"
          class="suggestionBrowser-setting" >
          local
        </b-form-checkbox>
        <b-form-checkbox
          v-model="showServer"
          class="suggestionBrowser-setting" >
          jskos-server
        </b-form-checkbox>
        <b-form-checkbox
          v-model="showCatalog"
          class="suggestionBrowser-setting" >
          catalog
        </b-form-checkbox>
      </div>
      <!-- Mapping table -->
      <flexible-table
        :items="items"
        :fields="fields"
        class="suggestionBrowser-table"
        @hover="hoveredMapping = $event && $event.mapping" >
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
          slot="type"
          slot-scope="{ value }" >
          <span
            v-b-tooltip.hover="{ title: value.prefLabel.en, delay: $util.delay.medium }"
            v-if="value != null" >
            {{ value.notation[0] }}
          </span>
        </span>
        <span
          slot="source"
          slot-scope="{ value }" >
          <span
            v-b-tooltip.hover="{ title: value != truncateText(value) ? value : '', delay: $util.delay.medium }"
            v-if="value != null" >
            {{ truncateText(value) }}
          </span>
        </span>
        <span
          slot="actions"
          slot-scope="data" >
          <font-awesome-icon
            v-b-tooltip.hover="{ title: 'save mapping', delay: $util.delay.medium }"
            v-if="canSave(data.item.mapping)"
            icon="save"
            class="button mappingBrowser-toolbar-button"
            @click="saveMapping(data.item.mapping)" />
          <font-awesome-icon
            v-b-tooltip.hover="{ title: 'edit mapping', delay: $util.delay.medium }"
            icon="edit"
            class="button mappingBrowser-toolbar-button"
            @click="edit(data)" />
          <font-awesome-icon
            v-b-tooltip.hover="{ title: 'delete mapping', delay: $util.delay.medium }"
            v-if="data.item.mapping.LOCAL"
            icon="trash-alt"
            class="button mappingBrowser-toolbar-button"
            @click="removeMapping(data.item.mapping)"
          />
        </span>
        <span
          slot="HEAD_actions"
          slot-scope="data" />
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
        No mappings available
      </div>
    </div>
    <!-- Full screen loading indicator -->
    <loading-indicator-full v-if="loading" />
  </div>
</template>

<script>
import ItemName from "./ItemName"
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
  name: "SuggestionBrowser",
  components: { ItemName, AutoLink, Minimizer, LoadingIndicatorFull, FlexibleTable },
  data () {
    return {
      loading: 0,
      items: [],
      previousSelected: {
        [true]: null,
        [false]: null,
      },
      /** List of supported schemes by occurrences-api */
      occurrencesSupportedSchemes: null,
      /** List of identifiers of all local mappings (used in `canSave`) */
      localMappingIdentifiers: [],
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
          width: "8%",
          minWidth: "",
          sortable: true
        },
        {
          key: "sourceConcepts",
          label: "from",
          width: "20%",
          minWidth: "",
          sortable: true,
          compare: (a, b) => this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "from")
        },
        {
          key: "type",
          label: "",
          width: "8%",
          minWidth: "",
          sortable: true,
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
          width: "8%",
          minWidth: "",
          sortable: true
        },
        {
          key: "targetConcepts",
          label: "to",
          width: "20%",
          minWidth: "",
          sortable: true,
          compare: (a, b) => this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "to")
        },
        {
          key: "source",
          label: "source",
          width: "20%",
          minWidth: "",
          sortable: true
        },
        {
          key: "count",
          label: "",
          width: "8%",
          minWidth: "",
          sortable: true
        },
        {
          key: "actions",
          label: "",
          width: "8%",
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
        return this.$settings.suggestionBrowserLocal
      },
      set(value) {
        this.$store.commit({
          type: "settings/set",
          prop: "suggestionBrowserLocal",
          value
        })
        // Refresh list of mappings/suggestions.
        this.$store.commit("mapping/setRefresh", true)
      }
    },
    // show server mappings
    showServer: {
      get() {
        return this.$settings.suggestionBrowserServer
      },
      set(value) {
        this.$store.commit({
          type: "settings/set",
          prop: "suggestionBrowserServer",
          value
        })
        // Refresh list of mappings/suggestions.
        this.$store.commit("mapping/setRefresh", true)
      }
    },
    // show catalog suggestions/occurrences
    showCatalog: {
      get() {
        return this.$settings.suggestionBrowserCatalog
      },
      set(value) {
        this.$store.commit({
          type: "settings/set",
          prop: "suggestionBrowserCatalog",
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
      })

      let items = []
      let promises = []
      // TODO: Make sure old requests are canceled.

      if (!this.selected.concept[true] && !this.selected.concept[false]) {
        // No selected concepts, not reloading.
        return
      }
      if (this.$jskos.compare(this.selected.concept[true], this.previousSelected[true]) && this.$jskos.compare(this.selected.concept[false], this.previousSelected[false]) && !force) {
        // No change in concepts, not reloading.
        return
      }
      this.loading = 1

      this.previousSelected = {
        [true]: this.selected.concept[true] ? { uri: this.selected.concept[true].uri } : null,
        [false]: this.selected.concept[false] ? { uri: this.selected.concept[false].uri } : null,
      }

      // Prepare params
      let params = {
        direction: "both",
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
          let items = []
          for (let mapping of mappings) {
            let item = {}
            item.mapping = mapping
            item.source = "local"
            items.push(item)
          }
          return items
        }))
      }

      // 2. Server
      if (this.showServer) {
        promises.push(this.$api.getMappings(params, false).then(mappings => {
          let items = []
          for (let mapping of mappings) {
            let item = {}
            item.mapping = mapping
            item.source = "server"
            items.push(item)
          }
          return items
        }))
      }

      // 3. Catalog
      if (this.showCatalog) {
        promises.push(this.loadOccurrences().then(occurrences => {
          let items = []
          for (let occurrence of occurrences) {
            if (!occurrence) continue
            let item = {}
            item.occurrence = occurrence
            item.source = "catalog"
            let mapping = {}
            mapping.from = _.get(occurrence, "memberSet[0]")
            this.loadNotation(mapping.from)
            if (mapping.from) {
              mapping.from = { memberSet: [mapping.from] }
            } else {
              mapping.from = { memberSet: [] }
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
          return items
        }))
      }

      Promise.all(promises).then(results => {
        let lengths = results.map(result => result.length)
        let totalLength = lengths.reduce((total, value) => total + value)
        let truncateResults = totalLength > results.length * 5
        for (let result of results) {
          if (truncateResults) {
            result = result.slice(0, 5)
          }
          for (let item of result) {
            let mapping = item.mapping
            item.sourceScheme = _.get(mapping, "fromScheme.notation[0]", "?")
            item.targetScheme = _.get(mapping, "toScheme.notation[0]", "?")
            item.sourceConcepts = _.get(mapping, "from.memberSet") || _.get(mapping, "from.memberChoice") || []
            item.targetConcepts = _.get(mapping, "to.memberSet") || _.get(mapping, "to.memberChoice") || []
            // Set source/targetScheme to empty string if there are no concepts on that side.
            if (item.sourceConcepts.length == 0) {
              item.sourceScheme = ""
            }
            if (item.targetConcepts.length == 0) {
              item.targetScheme = ""
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
            if (leftInSource && rightInSource) {
              item._rowClass = "mappingBrowser-table-row-match"
            }
            item.creator = mapping.creator && mapping.creator[0] || "?"
            if (typeof item.creator === "object") {
              item.creator = item.creator.prefLabel.de || item.creator.prefLabel.en || "?"
            }
            // let creator = item.creator.length <= 8 ? item.creator : item.creator.substring(0, 6) + "..."
            item.source = `${item.source}: ${item.creator}`
            item.type = this.$jskos.mappingTypeByType(mapping.type)
            items.push(item)
          }
        }
        this.items = items
        this.loading = 0
      }).catch(error => {
        console.log(error)
        // this.loading = 0
      })
    },
    truncateText(text, characters = 15) {
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
      let original = mapping.LOCAL ? data.item.mapping : null
      this.$store.commit({
        type: "mapping/set",
        mapping,
        original
      })
    },
    hover(concept) {
      if(concept && !concept.prefLabel) {
        // Load prefLabel to be shown as tooltip
        if (!concept.inScheme || concept.inScheme.length == 0) {
          // TODO: - Error handling
          console.warn("No scheme for", concept)
          return
        }

        this.getObject({ object: concept, scheme: concept.inScheme[0] }).then(result => {
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
          this.alert("Mapping was deleted.", null, "success")
        } else {
          this.alert("Mapping could not be deleted.", null, "danger")
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
          promises.push(axios.get(this.config.occurrenceProviders[0].url, {
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
          promises.push(axios.get(this.config.occurrenceProviders[0].url, {
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
      this.$api.saveMapping(mapping).then(() => {
        // Refresh list of mappings/suggestions.
        this.$store.commit("mapping/setRefresh", true)
      })
    },
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

#suggestionBrowser {
  position: relative;
  display: flex;
}
#suggestionBrowserWrapper {
  flex: 1;
  width: 0;
  display: flex;
  flex-direction: column;
}
#suggestionBrowser-settings {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  margin: 5px auto;
}
.suggestionBrowser-setting {
  user-select: none;
  margin: 0 15px;
}
.suggestionBrowser-table {
  flex: 1;
}
.noItems {
  margin: 30px auto 5px auto;
  flex: 5 0 auto;
}

</style>

<style lang="less">
@import "../style/main.less";

.suggestionBrowser-table-row-match {
  background-color: @color-primary-1;
}

</style>
