<template>
  <div
    id="mappingTable"
    :style="{ flex: flex }">
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
        striped
        small
        thead-class="defaultTableHead"
        tbody-class="defaultTableBody">
        <span
          slot="sourceConcept"
          slot-scope="data"
          v-html="data.value" />
        <span
          slot="targetConcept"
          slot-scope="data"
          v-html="data.value" />
      </b-table>
    </div>
    <div
      v-show="items.length == 0"
      class="noItems">
      No mappings.
    </div>
  </div>
</template>

<script>
import VueScrollingTable from "./VueScrollingTable"
/**
 * The mapping table component.
 */
export default {
  name: "MappingTable",
  components: { VueScrollingTable },
  props: {
    /**
     * The height of the component as a flex value.
     */
    flex: {
      type: Number,
      default: 1
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
        sourceConcept: "<span class='badge badge-secondary'>Test</span>",
        targetScheme: "RVK",
        targetConcept: "<span class='badge badge-secondary'>Test</span>",
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
          thClass: "mtColShort"
        },
        {
          key: "sourceConcept",
          label: "Concept",
          tdClass: "mtColWide",
          thClass: "mtColWide"
        },
        {
          key: "targetScheme",
          label: "Scheme",
          tdClass: "mtColShort",
          thClass: "mtColShort"
        },
        {
          key: "targetConcept",
          label: "Concept",
          tdClass: "mtColWide",
          thClass: "mtColWide"
        },
        {
          key: "creator",
          tdClass: "mtColNormal",
          thClass: "mtColNormal"
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

#mappingTable {
  height: 0;
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
