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
          {{ data.value ? data.value.notation[0].toUpperCase() : "-" }}
        </span>
        <span
          slot="toScheme"
          slot-scope="data">
          {{ data.value ? data.value.notation[0].toUpperCase() : "-" }}
        </span>
        <span
          slot="occurrences"
          slot-scope="data">
          <span v-if="data.value == null">...</span>
          <span v-else-if="data.value == -1">-</span>
          <span v-else>
            <auto-link
              :link="data.value.url"
              :text="data.value.count" />
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
  </div>
</template>

<script>
import ItemName from "./ItemName"
import AutoLink from "./AutoLink"
import Minimizer from "./Minimizer"
import axios from "axios"
import FontAwesomeIcon from "@fortawesome/vue-fontawesome"

/**
 * The occurrences browser component.
 */
export default {
  name: "OccurrencesBrowser",
  components: { ItemName, AutoLink, Minimizer, FontAwesomeIcon },
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
      supportedSchemes: null
    }
  },
  computed: {
    concepts() {
      let concepts = {}

      if (this.selectedLeft && this.$util.isSchemeInList(this.schemeLeft, this.supportedSchemes)) {
        concepts[this.selectedLeft.uri] = {
          concept: this.selectedLeft,
          scheme: this.schemeLeft,
          type: "from"
        }
      }
      if (this.selectedRight && this.$util.isSchemeInList(this.schemeRight, this.supportedSchemes)) {
        concepts[this.selectedRight.uri] = {
          concept: this.selectedRight,
          scheme: this.schemeRight,
          type: "to"
        }
      }

      return concepts
    },
    items() {
      let items = []
      for (let occurrence of this.occurrences) {
        if (occurrence.memberSet.length == 0) {
          // Should not occur, skip
          continue
        } else if (occurrence.memberSet.length == 1) {
          // One concept
          items.push({
            occurrences: occurrence,
            actions: false
          })
          let item = this.concepts[occurrence.memberSet[0].uri]
          items[items.length-1][item.type] = item.concept
          items[items.length-1][item.type+"Scheme"] = item.scheme
        } else {
          // Two concepts
          items.push({
            occurrences: occurrence,
            actions: true
          })
          let item = this.concepts[occurrence.memberSet[0].uri]
          items[items.length-1][item.type] = item.concept
          items[items.length-1][item.type+"Scheme"] = item.scheme
          item = this.concepts[occurrence.memberSet[1].uri]
          items[items.length-1][item.type] = item.concept
          items[items.length-1][item.type+"Scheme"] = item.scheme
        }
      }
      return items
    },
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
    concepts() {
      this.reloadOccurrences()
    }
  },
  mounted() {
    this.$util.setupTableScrollSync()
  },
  methods: {
    reloadOccurrences() {
      let vm = this
      this.occurrences = []
      let promise
      if (!this.supportedSchemes) {
        // Load supported schemes
        // TODO: - Put this into API
        promise = axios.get("//coli-conc.gbv.de/occurrences/api/voc")
          .then(function(response) {
            vm.supportedSchemes = response.data
          })
          .catch(function(error) {
            console.log(error)
            // TODO: - Better error handling
            vm.supportedSchemes = {}
          })
      } else {
        promise = Promise.resolve()
      }
      promise.then(() => {
        let urisString = Object.keys(vm.concepts).reduce(function(a, b) { return a + " " + b })
        if (vm.cancelToken != null) {
          vm.cancelToken.cancel("There was a newer search query.")
        }
        vm.cancelToken = vm.$api.token()
        axios.get(vm.$config.occurrenceProviders[0].url, {
          params: {
            members: urisString
          },
          cancelToken: vm.cancelToken.token
        }).then(function(response) {
          vm.occurrences = response.data
        }).catch(function(error) {
          console.log(error)
          vm.occurrences = []
        })
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

