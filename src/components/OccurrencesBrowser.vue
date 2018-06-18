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
            @click.native="data.value && $util.canConceptBeSelected(data.value, schemeRight) && chooseUri(data.value, false)" />
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
      </b-table>
    </div>
  </div>
</template>

<script>
import ItemName from "./ItemName"
import AutoLink from "./AutoLink"
import Minimizer from "./Minimizer"
import axios from "axios"

/**
 * The occurrences browser component.
 */
export default {
  name: "OccurrencesBrowser",
  components: { ItemName, AutoLink, Minimizer },
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
      mapping: this.$root.$data.mapping
    }
  },
  computed: {
    concepts() {
      let concepts = {}

      if (this.selectedLeft) {
        concepts[this.selectedLeft.uri] = {
          concept: this.selectedLeft,
          scheme: this.schemeLeft,
          type: "from"
        }
      }
      if (this.selectedRight) {
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
            occurrences: occurrence
          })
          let item = this.concepts[occurrence.memberSet[0].uri]
          items[items.length-1][item.type] = item.concept
          items[items.length-1][item.type+"Scheme"] = item.scheme ? item.scheme.notation[0].toUpperCase() : "-"
        } else {
          // Two concepts
          items.push({
            occurrences: occurrence
          })
          let item = this.concepts[occurrence.memberSet[0].uri]
          items[items.length-1][item.type] = item.concept
          items[items.length-1][item.type+"Scheme"] = item.scheme ? item.scheme.notation[0].toUpperCase() : "-"
          item = this.concepts[occurrence.memberSet[1].uri]
          items[items.length-1][item.type] = item.concept
          items[items.length-1][item.type+"Scheme"] = item.scheme ? item.scheme.notation[0].toUpperCase() : "-"
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
      this.occurrences = []
      let urisString = Object.keys(this.concepts).reduce(function(a, b) { return a + " " + b })
      console.log(urisString)
      let vm = this
      axios.get(this.$config.occurrenceProviders[0].url, {
        params: {
          members: urisString
        }
      }).then(function(response) {
        vm.occurrences = response.data
        console.log(vm.occurrences)
      }).catch(function(error) {
        console.log(error)
        vm.occurrences = []
      })
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

