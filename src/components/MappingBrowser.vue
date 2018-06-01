<template>
  <div
    id="mappingBrowser"
    :style="{ flex: flex }">
    <div
      v-if="schemeLeft != null || schemeRight != null"
      id="mappingBrowserWrapper">
      <div
        v-show="items.length == 0 || true"
        class="mappingToolbar">
        Add or remove test:
        <span @click="add">✚</span> <span @click="remove">－</span>
      </div>
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
            slot="sourceConcept"
            slot-scope="data">
            <item-name
              :item="data.value"
              :show-text="false"
              :show-tooltip="true" />
          </span>
          <span
            slot="targetConcept"
            slot-scope="data">
            <item-name
              :item="data.value"
              :show-text="false"
              :show-tooltip="true" />
          </span>
        </b-table>
      </div>
      <div
        v-show="items.length == 0"
        class="noItems">
        No mappings.
      </div>
    </div>
    <div
      v-else
      id="mappingBrowserWelcome">
      <h2>Welcome to Cocoda!</h2>
    </div>
  </div>
</template>

<script>
import ItemName from "./ItemName"

/**
 * The mapping browser component.
 */
export default {
  name: "MappingBrowser",
  components: { ItemName },
  props: {
    /**
     * The height of the component as a flex value.
     */
    flex: {
      type: Number,
      default: 1
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
      columns: [
        { id: "sourceScheme", title: "Scheme", cssClasses: "colShort" },
        { id: "sourceConcept", title: "Concept", cssClasses: "colWide" },
        { id: "targetScheme", title: "Scheme", cssClasses: "colShort" },
        { id: "targetConcept", title: "Concept", cssClasses: "colWide" },
        { id: "creator", title: "Creator", cssClasses: "colNormal" },
        { id: "test", title: "Test", cssClasses: "colShort" }
      ],
      sampleItem: {
        sourceScheme: "DDC",
        sourceConcept: {
          uri: "test",
          prefLabel: {
            de: "Test Label Source Concept"
          },
          notation: ["ABC"]
        },
        targetScheme: "RVK",
        targetConcept: {
          uri: "test",
          prefLabel: {
            de: "Test Label Target Concept"
          },
          notation: ["DEF"]
        },
        creator: "VZG"
      },
      items: []
    }
  },
  computed: {
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
          key: "sourceConcept",
          label: "Concept",
          tdClass: "mtColShort",
          thClass: "mtColShort",
          sortable: true
        },
        {
          key: "targetScheme",
          label: "Scheme",
          tdClass: "mtColShort",
          thClass: "mtColShort",
          sortable: true
        },
        {
          key: "targetConcept",
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
#mappingBrowserWelcome {
  flex: 1;
  width: 0;
  text-align: center;
  margin: auto auto;
}
#mappingBrowserWrapper {
  flex: 1;
  width: 0;
  display: flex;
  flex-direction: column;
}
.noItems, .mappingToolbar {
  margin: 5px auto 5px auto;
}
.noItems {
  flex: 5 0 auto;
}
.mappingToolbar {
  user-select: none;
}
.mappingToolbar span {
  cursor: pointer;
  &:hover {
    color: @color-secondary-2-4;
  }
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
