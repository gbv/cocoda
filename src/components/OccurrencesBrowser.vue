<template>
  <div id="occurrencesBrowser">
    <!-- Minimizer allows component to get minimized -->
    <minimizer text="Occurrences Browser" />
    <!-- Occurrences table -->
    <flexible-table
      v-show="selected.scheme[true] != null || selected.scheme[false] != null"
      :sort-desc="true"
      :items="items"
      :fields="fields"
      sort-by="occurrences"
      @hover="hoveredMapping = $event && $event.mapping" >
      <span
        slot="from"
        slot-scope="data" >
        <item-name
          :item="data.value"
          :show-text="false"
          :show-tooltip="true"
          :is-link="data.value && $util.canConceptBeSelected(data.value, selected.scheme[true])"
          :is-highlighted="$jskos.compare(data.value, selected.concept[true])"
          @click.native="data.value && $util.canConceptBeSelected(data.value, selected.scheme[true]) && setSelected('concept', true, data.value)" />
      </span>
      <span
        slot="to"
        slot-scope="data" >
        <item-name
          :item="data.value"
          :show-text="false"
          :show-tooltip="true"
          :is-link="data.value && $util.canConceptBeSelected(data.value, selected.scheme[false])"
          :is-highlighted="$jskos.compare(data.value, selected.concept[false])"
          @click.native="data.value && $util.canConceptBeSelected(data.value, selected.scheme[false]) && setSelected('concept', false, data.value)" />
      </span>
      <span
        slot="fromScheme"
        slot-scope="data" >
        {{ data.value && data.value.notation ? data.value.notation[0].toUpperCase() : "" }}
      </span>
      <span
        slot="toScheme"
        slot-scope="data" >
        {{ data.value && data.value.notation ? data.value.notation[0].toUpperCase() : "" }}
      </span>
      <span
        slot="occurrences"
        slot-scope="data" >
        <span v-if="data.value == null">...</span>
        <span v-else-if="data.value == -1">-</span>
        <span v-else>
          <auto-link
            :link="data.value.url"
            :text="String(data.value.count)" />
        </span>
      </span>
      <span
        slot="actions"
        slot-scope="data" >
        <font-awesome-icon
          v-b-tooltip.hover="{ title: 'convert to mapping', delay: $util.delay.medium }"
          v-if="data.value && data.item.mapping"
          icon="edit"
          class="button toMapping"
          @click="toMapping(data)" />
      </span>
      <span
        slot="HEAD_actions"
        slot-scope="data" />
    </flexible-table>
    <div
      v-show="!loading && items.length == 0"
      class="noItems fontWeight-heavy" >
      No occurrences found
    </div>
    <!-- Full screen loading indicator -->
    <loading-indicator-full v-if="loading" />
  </div>
</template>

<script>
import ItemName from "./ItemName"
import AutoLink from "./AutoLink"
import Minimizer from "./Minimizer"
import axios from "axios"
import LoadingIndicatorFull from "./LoadingIndicatorFull"
import _ from "lodash"
import FlexibleTable from "vue-flexible-table"

/**
 * The occurrences browser component.
 */
export default {
  name: "OccurrencesBrowser",
  components: { ItemName, AutoLink, Minimizer, LoadingIndicatorFull, FlexibleTable },
  data () {
    return {
      /** Current list of occurrences */
      occurrences: [],
      /** Current axios cancel token */
      cancelToken: null,
      /** List of supported schemes by occurrences-api */
      supportedSchemes: null,
      /** Determines whether occurrences are loading */
      loading: false,
      /** Unique loading ID for each request */
      loadingId: null,
      /** Items for bootstrap table */
      items: []
    }
  },
  computed: {
    /**
     * Fields (columns) for bootstrap table
     */
    fields() {
      return [
        {
          key: "fromScheme",
          label: "Scheme",
          width: "12%",
          minWidth: "",
          sortable: true
        },
        {
          key: "from",
          label: "Concept",
          width: "24%",
          minWidth: "",
          sortable: true
        },
        {
          key: "toScheme",
          label: "Scheme",
          width: "12%",
          minWidth: "",
          sortable: true
        },
        {
          key: "to",
          label: "Concept",
          width: "24%",
          minWidth: "",
          sortable: true
        },
        {
          key: "occurrences",
          label: "(Co-)Occurrences",
          width: "20%",
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
    // Only for watching!
    selectedLeft() {
      return this.selected.concept[true]
    },
    selectedRight() {
      return this.selected.concept[false]
    }
  },
  watch: {
    selectedLeft(newValue, oldValue) {
      this.reloadIfChanged(newValue, oldValue)
    },
    selectedRight(newValue, oldValue) {
      this.reloadIfChanged(newValue, oldValue)
    },
    occurrences() {
      // Rebuild items array when occurrences changed
      let items = []
      for (let occurrence of this.occurrences) {
        if (!occurrence || !occurrence.memberSet || occurrence.memberSet.length == 0 || occurrence.memberSet.length > 2) {
          // Should not occur, skip
          continue
        }
        items.push({
          occurrences: occurrence,
          actions: false
        })
        let fromTos = ["to", "from"]
        let fromToMap = []
        for (let member of occurrence.memberSet) {
          if (this.$jskos.compare(member, this.selected.concept[true])) {
            fromToMap[member.uri] = "from"
            _.pull(fromTos, "from")
          } else if (this.$jskos.compare(member, this.selected.concept[false])) {
            fromToMap[member.uri] = "to"
            _.pull(fromTos, "to")
          }
        }
        for (let member of occurrence.memberSet) {
          let fromTo = fromToMap[member.uri] || fromTos.pop()
          items[items.length-1][fromTo] = member
          items[items.length-1][fromTo+"Scheme"] = member.inScheme[0]
          // refresh member
          let item =  items[items.length-1]
          this.getObject({ object: member, scheme: member.inScheme[0] }).then(concept => {
            if (!concept) {
              // if concept couldn't be loaded, at least try to load the member's scheme
              return this.getObject({ object: member.inScheme[0] })
            }
            item[fromTo] = concept
            item[fromTo+"Scheme"] = concept.inScheme[0]
            this.addMappingToItem(item)
          }).then(scheme => {
            if (!scheme) return
            item[fromTo+"Scheme"] = scheme
            this.addMappingToItem(item)
          })
        }
        items[items.length-1].actions = occurrence.memberSet.length > 1
      }
      this.items = items
    }
  },
  mounted() {
    this.$util.setupTableScrollSync()
    this.reloadOccurrences()
  },
  methods: {
    reloadIfChanged(newValue, oldValue) {
      if (oldValue == null && newValue != null || oldValue != null && newValue == null || oldValue.uri != newValue.uri) {
        this.reloadOccurrences()
      }
    },
    /** Reloads occurrences from api */
    reloadOccurrences() {
      let promise
      let currentId = this.$util.generateID()
      this.loadingId = currentId
      if (!this.supportedSchemes) {
        // Load supported schemes
        // TODO: - Put this into API
        promise = axios.get("//coli-conc.gbv.de/occurrences/api/voc")
          .then(response => {
            this.supportedSchemes = _.get(response, "data", [])
          })
          .catch(error => {
            console.error(error)
            // TODO: - Better error handling
            this.supportedSchemes = []
          })
      } else {
        promise = Promise.resolve()
      }
      promise.then(() => {
        if (currentId != this.loadingId) return
        let uris = []
        let promises = []
        for (let [scheme, concept] of [[this.selected.scheme[true], this.selected.concept[true]], [this.selected.scheme[true], this.selected.concept[false]]]) {
          if (concept && this.isSupported(scheme)) {
            uris.push(concept.uri)
          }
        }
        if (uris.length == 0) {
          return []
        }
        if (this.loading && this.cancelToken != null) {
          this.cancelToken.cancel("Occurrences: There was a newer request.")
        }
        this.loading = true
        this.cancelToken = this.$api.token()
        for (let uri of uris) {
          promises.push(axios.get(this.config.occurrenceProviders[0].url, {
            params: {
              member: uri,
              scheme: "*",
              threshold: 5
            },
            cancelToken: this.cancelToken.token
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
            cancelToken: this.cancelToken.token
          }).catch(error => {
            console.error("Occurrences API Error:", error)
            return null
          }))
        }
        return Promise.all(promises)
      }).then(responses => {
        if (currentId != this.loadingId) return
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
        this.occurrences = occurrences.sort((a, b) => parseInt(b.count || 0) - parseInt(a.count || 0)).slice(0, 10)
        this.loading = false
      }).catch(error => {
        console.error("Occurrences Error:", error)
        this,occurrences = []
        this.loading = false
      })
    },
    addMappingToItem(item) {
      let mapping = {
        from: { "memberSet": [item.from] },
        to: { "memberSet": [item.to] },
        fromScheme: item.fromScheme,
        toScheme: item.toScheme,
        type: [this.$util.defaultMappingType.uri]
      }
      mapping = this.$jskos.addMappingIdentifiers(mapping)
      item.mapping = mapping
    },
    /**
     * Converts a co-occurrence into a mapping and saves it as the current mapping
     */
    toMapping(data) {
      this.$store.commit({
        type: "mapping/set",
        mapping: data.item.mapping
      })
    },
    /** Returns whether a scheme is supported by the occurrences-api */
    isSupported(scheme) {
      let supported = false
      for (let supportedScheme of this.supportedSchemes) {
        if (this.$jskos.compare(scheme, supportedScheme)) {
          supported = true
        }
      }
      return supported
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

#occurrencesBrowser {
  position: relative;
  display: flex;
  flex-direction: column;
}
.toMapping {
  font-size: 12px;
}
.noItems {
  margin: 30px auto 5px auto;
  flex: 5 0 auto;
}

</style>
