<template>
  <div
    id="mappingTable"
    :style="{ flex: flex }">
    <div
      v-show="items.length == 0 || true"
      class="mappingToolbar">
      <span @click="add">✚</span> <span @click="remove">－</span>
    </div>
    <div id="mappingTableWrapper">
      <vue-scrolling-table
        :scroll-horizontal="true"
        :scroll-vertical="true"
        :sync-header-scroll="true"
        :sync-footer-scroll="true"
        :include-footer="true"
        :dead-area-color="'white'">
        <template slot="thead">
          <tr>
            <th
              v-for="col in columns"
              :class="col.cssClasses"
              :key="col.id">{{ col.title }}</th>
          </tr>
        </template>
        <template slot="tbody">
          <tr
            v-for="item in items"
            :key="item.id">
            <td
              v-for="col in columns"
              :class="col.cssClasses"
              :key="col.id">{{ item[col.id] }}</td>
          </tr>
        </template>
      </vue-scrolling-table>
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
        sourceConcept: "Test",
        targetScheme: "RVK",
        targetConcept: "Test 2",
        creator: "Stefan",
        test: "Test"
      },
      items: []
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
.noItems, #mappingTableWrapper, .mappingToolbar {
  margin: 5px auto 5px auto;
}
#mappingTableWrapper {
  position: relative;
  flex: 1 1 auto;
  max-width: 100%;
  height: 0;
  font-size: 0.9em;
  text-align: center;
}
.noItems {
  flex: 5 0 auto;
}
.mappingToolbar {
  cursor: pointer;
  user-select: none;
}

table.scrolling {
  padding-left: 8px;
}

@table-cell-width: 120px;
@table-cell-width-short: 70px;
@table-cell-width-wide: 160px;
.colNormal {
  width: @table-cell-width;
  min-width: @table-cell-width;
  max-width: @table-cell-width;
}
.colShort {
  width: @table-cell-width-short;
  min-width: @table-cell-width-short;
  max-width: @table-cell-width-short;
}
.colWide {
  width: @table-cell-width-wide;
  min-width: @table-cell-width-wide;
  max-width: @table-cell-width-wide;
}
</style>
