<template>
  <div id="occurrencesBrowser">
    <!-- Minimizer allows component to get minimized -->
    <minimizer text="Occurrences Browser" />
    <div
      v-show="schemeLeft != null || schemeRight != null"
      class="table-wrapper">
      <!-- Occurrences table -->
      <b-table
        ref="occurrencesTable"
        :sort-desc="true"
        :items="items"
        :fields="fields"
        sort-by="occurrences"
        class="table"
        small
        thead-class="table-head"
        tbody-class="table-body">
        <span
          slot="from"
          slot-scope="data">
          <item-name
            :item="data.value"
            :show-text="false"
            :show-tooltip="true"
            :is-link="data.value && $util.canConceptBeSelected(data.value, schemeLeft)"
            :is-highlighted="$util.compareConcepts(data.value, selectedLeft)"
            @click.native="data.value && $util.canConceptBeSelected(data.value, schemeLeft) && chooseUri(data.value, true)" />
        </span>
        <span
          slot="to"
          slot-scope="data">
          <item-name
            :item="data.value"
            :show-text="false"
            :show-tooltip="true"
            :is-link="data.value && $util.canConceptBeSelected(data.value, schemeRight)"
            :is-highlighted="$util.compareConcepts(data.value, selectedRight)"
            @click.native="data.value && $util.canConceptBeSelected(data.value, schemeRight) && chooseUri(data.value, false)" />
        </span>
        <span
          slot="fromScheme"
          slot-scope="data">
          {{ data.value && data.value.notation ? data.value.notation[0].toUpperCase() : "" }}
        </span>
        <span
          slot="toScheme"
          slot-scope="data">
          {{ data.value && data.value.notation ? data.value.notation[0].toUpperCase() : "" }}
        </span>
        <span
          slot="occurrences"
          slot-scope="data">
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
          slot-scope="data">
          <font-awesome-icon
            v-b-tooltip.hover="{ title: 'convert to mapping', delay: $util.delay.medium }"
            v-if="data.value"
            icon="edit"
            class="button toMapping"
            @click="toMapping(data)" />
        </span>
        <span
          slot="HEAD_actions"
          slot-scope="data">
          <font-awesome-icon icon="toolbox" />
        </span>
      </b-table>
    </div>
    <!-- Full screen loading indicator -->
    <div
      v-if="loading"
      class="loadingFull">
      <loading-indicator size="lg" />
    </div>
  </div>
</template>

<script>
import ItemName from "./ItemName"
import AutoLink from "./AutoLink"
import Minimizer from "./Minimizer"
import axios from "axios"
import FontAwesomeIcon from "@fortawesome/vue-fontawesome"
import LoadingIndicator from "./LoadingIndicator"
var _ = require("lodash")

/**
 * The occurrences browser component.
 */
export default {
  name: "OccurrencesBrowser",
  components: { ItemName, AutoLink, Minimizer, FontAwesomeIcon, LoadingIndicator },
  props: {
    /**
     * The selected concept from the left hand concept browser.
     */
    selectedLeft: {
      type: Object,
      default: null
    },
    /**
     * The selected concept from the right hand concept browser.
     */
    selectedRight: {
      type: Object,
      default: null
    },
    /**
     * The selected scheme from the left hand concept browser.
     */
    schemeLeft: {
      type: Object,
      default: null
    },
    /**
     * The selected scheme from the right hand concept browser.
     */
    schemeRight: {
      type: Object,
      default: null
    }
  },
  data () {
    return {
      /** Current list of occurrences */
      occurrences: [],
      /** Reference to the current mapping */
      mapping: this.$root.$data.mapping,
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
          tdClass: "moColShort",
          thClass: "moColShort",
          sortable: true
        },
        {
          key: "from",
          label: "Concept",
          tdClass: "moColShort",
          thClass: "moColShort",
          sortable: true
        },
        {
          key: "toScheme",
          label: "Scheme",
          tdClass: "moColShort",
          thClass: "moColShort",
          sortable: true
        },
        {
          key: "to",
          label: "Concept",
          tdClass: "moColShort",
          thClass: "moColShort",
          sortable: true
        },
        {
          key: "occurrences",
          label: "(Co-)Occurrences",
          tdClass: "moColShort",
          thClass: "moColShort",
          sortable: true
        },
        {
          key: "actions",
          label: "",
          sortable: false
        }
      ]
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
          if (this.$util.compareConcepts(member, this.selectedLeft)) {
            fromToMap[member.uri] = "from"
            _.pull(fromTos, "from")
          } else if (this.$util.compareConcepts(member, this.selectedRight)) {
            fromToMap[member.uri] = "to"
            _.pull(fromTos, "to")
          }
        }
        for (let member of occurrence.memberSet) {
          let fromTo = fromToMap[member.uri] || fromTos.pop()
          items[items.length-1][fromTo] = member
          items[items.length-1][fromTo+"Scheme"] = member.inScheme[0]
          // refresh member
          let index = items.length-1
          this.$api.objects.get(member.uri, member.inScheme[0].uri).then(concept => {
            if (!concept) {
              // if concept couldn't be loaded, at least try to load the member's scheme
              return this.$api.objects.get(member.inScheme[0].uri)
            }
            this.items[index][fromTo] = concept
            this.items[index][fromTo+"Scheme"] = concept.inScheme[0]
          }).then(scheme => {
            if (!scheme) return
            this.items[index][fromTo+"Scheme"] = scheme
          })
        }
        items[items.length-1].actions = occurrence.memberSet.length > 1
      }
      this.items = items
    }
  },
  mounted() {
    this.$util.setupTableScrollSync()
  },
  methods: {
    reloadIfChanged(newValue, oldValue) {
      if (oldValue == null && newValue != null || oldValue != null && newValue == null || oldValue.uri != newValue.uri) {
        this.reloadOccurrences()
      }
    },
    /** Reloads occurrences from api */
    reloadOccurrences() {
      let vm = this
      let promise
      let currentId = this.$util.generateID()
      this.loadingId = currentId
      if (!this.supportedSchemes) {
        // Load supported schemes
        // TODO: - Put this into API
        promise = axios.get("//coli-conc.gbv.de/occurrences/api/voc")
          .then(function(response) {
            vm.supportedSchemes = response.data
          })
          .catch(function(error) {
            console.error(error)
            // TODO: - Better error handling
            vm.supportedSchemes = []
          })
      } else {
        promise = Promise.resolve()
      }
      promise.then(() => {
        if (currentId != this.loadingId) return
        let uris = []
        let promises = []
        for (let [scheme, concept] of [[this.schemeLeft, this.selectedLeft], [this.schemeRight, this.selectedRight]]) {
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
          promises.push(axios.get(this.$config.occurrenceProviders[0].url, {
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
          promises.push(axios.get(this.$config.occurrenceProviders[0].url, {
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
          let result = response.data
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
        this.occurrences = occurrences.sort((a, b) => parseInt(b.count) - parseInt(a.count)).slice(0, 10)
        this.loading = false
      }).catch(error => {
        console.error("Occurrences Error:", error)
        this,occurrences = []
        this.loading = false
      })
    },
    /**
     * Converts a co-occurrence into a mapping and saves it as the current mapping
     */
    toMapping(data) {
      this.mapping.jskos = {
        from: { "memberSet": [data.item.from] },
        to: { "memberSet": [data.item.to] },
        fromScheme: data.item.fromScheme,
        toScheme: data.item.toScheme,
        type: [this.$util.defaultMappingType.uri]
      }
    },
    /** Returns whether a scheme is supported by the occurrences-api */
    isSupported(scheme) {
      let supported = false
      for (let supportedScheme of this.supportedSchemes) {
        if (this.$util.compareSchemes(scheme, supportedScheme)) {
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

.loadingFull {
  width: 100%;
  height: 100%;
  position: absolute;
  overflow-y: auto;
  top: 0;
  left: 0;
  z-index: @zIndex-3;
  background-color: @color-loading-overlay-background;
  display: flex;
  justify-content: center;
  align-items: center;
}

</style>

<style>
.moColWide {
  width: 200px;
  min-width: 200px;
}
.moColShort {
  width: 150px;
  min-width: 100px;
}
</style>

