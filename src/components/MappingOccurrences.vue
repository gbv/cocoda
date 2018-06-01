<template>
  <div
    id="mappingOccurrences"
    :style="{ flex: flex }">
    <div class="defaultTableWrapper">
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
            :show-tooltip="true" />
        </span>
        <span
          slot="to"
          slot-scope="data">
          <item-name
            :item="data.value"
            :show-text="false"
            :show-tooltip="true" />
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
import axios from "axios"

/**
 * The mapping occurrences component.
 */
export default {
  name: "MappingOccurrences",
  components: { ItemName, AutoLink },
  props: {
    /**
     * The height of the component as a flex value.
     */
    flex: {
      type: Number,
      default: 1
    },
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
      leftResult: null,
      rightResult: null,
      mapping: this.$root.$data.mapping
    }
  },
  computed: {
    items() {
      let items = []
      let intermediateItems = []
      // Add selected concepts
      // TODO: - Scheme for selected concept might differ from scheme for mapping.
      if (!this.mapping.reversed) {
        intermediateItems.push({
          concept: this.selectedLeft,
          scheme: this.schemeLeft,
          type: "from"
        }, {
          concept: this.selectedRight,
          scheme: this.schemeRight,
          type: "to"
        })
      } else {
        intermediateItems.push({
          concept: this.selectedRight,
          scheme: this.schemeRight,
          type: "from"
        }, {
          concept: this.selectedLeft,
          scheme: this.schemeLeft,
          type: "to"
        })
      }
      for (let concept of this.mapping.jskos.from.memberSet) {
        if ((!this.selectedLeft || this.selectedLeft.uri != concept.uri) && (!this.selectedRight || this.selectedRight.uri != concept.uri)) {
          intermediateItems.push({
            concept: concept,
            scheme: this.mapping.jskos.fromScheme,
            type: "from"
          })
        }
      }
      for (let concept of this.mapping.jskos.to.memberSet) {
        if ((!this.selectedLeft || this.selectedLeft.uri != concept.uri) && (!this.selectedRight || this.selectedRight.uri != concept.uri)) {
          intermediateItems.push({
            concept: concept,
            scheme: this.mapping.jskos.toScheme,
            type: "to"
          })
        }
      }
      for (let item of intermediateItems) {
        if (item.concept == null) {
          continue
        }
        if (item.concept.OCCURRENCES == null) {
          this.loadOccurrences(item.concept)
        }
        items.push({
          occurrences: item.concept.OCCURRENCES
        })
        // items[items.length-1][item.type] = item.concept.notation[0]
        items[items.length-1][item.type] = item.concept
        items[items.length-1][item.type+"Scheme"] = item.scheme ? item.scheme.notation[0].toUpperCase() : "-"
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
  methods: {
    loadOccurrences(concept) {
      axios.get("//coli-conc.gbv.de/occurrences/api/", {
        params: {
          members: concept.uri
        }
      }).then(function(response) {
        concept.OCCURRENCES = response.data.length > 0 ? response.data[0] : -1
      }).catch(function(error) {
        console.log(error)
        concept.OCCURRENCES = -1
      })
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

#mappingOccurrences {
  height: 0;
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

