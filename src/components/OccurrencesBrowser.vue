<template>
  <div id="occurrencesBrowser">
    <minimizer text="Occurrences Browser" />
    <div
      v-show="schemeLeft != null || schemeRight != null"
      class="defaultTableWrapper">
      <b-table
        ref="occurrencesTable"
        :sort-desc="true"
        :items="items"
        :fields="fields"
        sort-by="occurrences"
        class="defaultTable"
        small
        thead-class="defaultTableHead"
        tbody-class="defaultTableBody">
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
            v-b-tooltip.hover="'convert to mapping'"
            v-if="data.value"
            icon="edit"
            class="toMapping"
            @click="toMapping(data)" />
        </span>
        <span
          slot="HEAD_actions"
          slot-scope="data">
          <font-awesome-icon icon="toolbox" />
        </span>
      </b-table>
    </div>
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
      occurrences: [],
      mapping: this.$root.$data.mapping,
      cancelToken: null,
      supportedSchemes: null,
      loading: false,
      items: []
    }
  },
  computed: {
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
      console.log("Occurrences changed", this.occurrences.slice())
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
    reloadOccurrences() {
      let vm = this
      this.loading = true
      let promise
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
            vm.supportedSchemes = {}
          })
      } else {
        promise = Promise.resolve()
      }
      promise.then(() => {
        let uris = []
        let promises = []
        for (let concept of [this.selectedLeft, this.selectedRight]) {
          if (concept) {
            uris.push(concept.uri)
          }
        }
        if (uris.length == 0) {
          return []
        }
        if (this.loading && this.cancelToken != null) {
          this.cancelToken.cancel("Occurrences: There was a newer request.")
        }
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
        return Promise.all(promises)
      }).then(responses => {
        let occurrences = []
        for (let response of responses) {
          let result = response.data
          occurrences = occurrences.concat(result)
        }
        // Sort occurrences and only save top 10
        console.log(occurrences)
        this.occurrences = occurrences.sort((a, b) => parseInt(b.count) - parseInt(a.count)).slice(0, 10)
        console.log(this.occurrences)
        this.loading = false
        console.log("Occurrences loaded")
      }).catch(error => {
        console.error("Occurrences Error:", error)
        this,occurrences = []
        this.loading = false
      })
    },
    toMapping(data) {
      this.mapping.jskos = {
        from: { "memberSet": [data.item.from] },
        to: { "memberSet": [data.item.to] },
        fromScheme: data.item.fromScheme,
        toScheme: data.item.toScheme,
        type: [this.$util.defaultMappingType.uri]
      }
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
  color: @buttonColor;
  user-select: none;
  cursor: pointer;
  &:hover {
    color: @buttonColorHover;
  }
}

.loadingFull {
  width: 100%;
  height: 100%;
  position: absolute;
  overflow-y: auto;
  top: 0;
  left: 0;
  z-index: 100;
  background-color: #ffffff55;
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

