<template>
  <div id="mappingBrowser">
    <div
      v-show="schemeLeft != null || schemeRight != null"
      id="mappingBrowserWrapper">
      <div class="defaultTableWrapper">
        <b-table
          ref="occurrencesTable"
          :items="items"
          :fields="fields"
          class="defaultTable"
          small
          thead-class="defaultTableHead"
          tbody-class="defaultTableBody">
          <span
            slot="sourceConcepts"
            slot-scope="data">
            <item-name
              v-for="concept in data.value"
              :key="concept.uri"
              :item="concept"
              :show-text="false"
              :show-tooltip="true" />
          </span>
          <span
            slot="targetConcepts"
            slot-scope="data">
            <item-name
              v-for="concept in data.value"
              :key="concept.uri"
              :item="concept"
              :show-text="false"
              :show-tooltip="true" />
          </span>
          <span
            slot="type"
            slot-scope="data">
            <span
              v-b-tooltip.hover="data.value.LABEL"
              v-if="data.value != null">
              {{ data.value.SYMBOL }}
            </span>
          </span>
        </b-table>
      </div>
      <div
        v-if="items.length > 0"
        class="mappingToolbar">
        <div /><div /><div style="text-align: right;">{{ items.length }} mappings</div>
      </div>
      <div
        v-else
        class="noItems">No mappings</div>
    </div>
  </div>
</template>

<script>
import ItemName from "./ItemName"
import axios from "axios"

/**
 * The mapping browser component.
 */
export default {
  name: "MappingBrowser",
  components: { ItemName },
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
      columns: []
    }
  },
  computed: {
    items() {
      let items = []
      let conceptList = [
        {
          concept: this.selectedLeft,
          fromTo: "from"
        },
        {
          concept: this.selectedRight,
          fromTo: "to"
        }
      ]
      for (let conceptItem of conceptList) {
        if (conceptItem.concept == null) {
          continue
        }
        let mappings = conceptItem.concept.MAPPINGS
        if (mappings == null) {
          // Load mappings
          this.loadMappings(conceptItem)
        } else {
          // Save mappings
          for (let mapping of mappings) {
            let item = {}
            item.sourceScheme = mapping.fromScheme.notation[0]
            item.targetScheme = mapping.toScheme.notation[0]
            item.sourceConcepts = mapping.from.memberSet || mapping.from.memberChoice
            item.targetConcepts = mapping.to.memberSet || mapping.to.memberChoice
            item.creator = mapping.creator || "?"
            item.type = (mapping.type && Array.isArray(mapping.type) && mapping.type.length > 0) ? this.$util.mappingTypeByUri(mapping.type[0]) : this.$util.defaultMappingType
            items.push(item)
          }
        }
      }
      return items
    },
    fields() {
      return [
        {
          key: "sourceScheme",
          label: "Scheme",
          tdClass: "mtColShort",
          thClass: "mtColShort",
          sortable: true
        },
        {
          key: "sourceConcepts",
          label: "Concept",
          tdClass: "mtColShort",
          thClass: "mtColShort",
          sortable: true
        },
        {
          key: "type",
          label: "",
          sortable: false
        },
        {
          key: "targetScheme",
          label: "Scheme",
          tdClass: "mtColShort",
          thClass: "mtColShort",
          sortable: true
        },
        {
          key: "targetConcepts",
          label: "Concept",
          tdClass: "mtColShort",
          thClass: "mtColShort",
          sortable: true
        },
        {
          key: "creator",
          tdClass: "mtColNormal",
          thClass: "mtColNormal",
          sortable: true
        }
      ]
    }
  },
  created() {
    for (let i = 0; i < 30; i++) {
      // this.items.push(this.sampleItem)
    }
  },
  methods: {
    add() {
      this.items.push(this.sampleItem)
    },
    remove() {
      this.items.pop()
    },
    loadMappings(conceptItem) {
      // Get GND mappings
      // TODO: - Put into its own mapping providers module.
      let params = {}
      let concept = conceptItem.concept
      params[conceptItem.fromTo] = concept.uri
      axios.get(this.$config.mappingProviders[0].url, {
        params: params
      }).then(function(response) {
        for (let mapping of response.data) {
          mapping.type = mapping.type || null
        }
        concept.MAPPINGS = response.data
      }).catch(function(error) {
        console.log("API error (mappings):", error)
      })
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

#mappingBrowser {
  height: 0;
  display: flex;
}
#mappingBrowserWrapper {
  flex: 1;
  width: 0;
  display: flex;
  flex-direction: column;
}
.noItems {
  margin: 5px auto 5px auto;
}
.noItems {
  flex: 5 0 auto;
}
.mappingToolbar {
  margin: 0 10px;
  display: flex;
}
.mappingToolbar > div {
  width: 0;
  flex: 1;
}

</style>

<style lang="less">

@table-cell-width: 120px;
@table-cell-width-short: 70px;
@table-cell-width-wide: 160px;
.mtColNormal {
  width: @table-cell-width * 3;
  min-width: @table-cell-width;
}
.mtColShort {
  width: @table-cell-width-short * 3;
  min-width: @table-cell-width-short;
}
.mtColWide {
  width: @table-cell-width-wide * 3;
  min-width: @table-cell-width-wide;
}
</style>
