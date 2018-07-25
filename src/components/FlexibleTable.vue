<template>
  <div
    :style="tableStyle()"
    class="flexibleTable" >
    <!-- Head -->
    <div class="flexibleTable-head">
      <!-- Just one row in head -->
      <div class="flexibleTable-row">
        <div
          v-for="field in fields"
          :key="'HEAD_' + field.key"
          :style="cellStyle(field)"
          :class="field.class"
          class="flexibleTable-cell"
          @click="sort(field)" >
          <!-- Slot for head cell content. Override with <template slot="HEAD_key" slot-scope="{ field }"> -->
          <slot
            :name="'HEAD_' + field.key"
            :field="field">
            {{ field.label || capitalizeFirst(field.key) }}
            <span
              class="flexibleTable-cell-sort" >
              <font-awesome-icon
                v-if="sortBy == field.key && sortDirection == 1"
                icon="sort-up" />
              <font-awesome-icon
                v-else-if="sortBy == field.key && sortDirection == -1"
                icon="sort-down" />
              <font-awesome-icon
                v-else-if="field.sortable"
                icon="sort" />
            </span>
          </slot>
        </div>
      </div>
    </div>
    <!-- Body -->
    <div class="flexibleTable-body">
      <!-- One row for each item -->
      <div
        v-for="(item, item_index) in sortedItems"
        :key="'ITEM' + item_index"
        :class="item._rowClass"
        class="flexibleTable-row">
        <div
          v-for="field in fields"
          :key="'ITEM_' + item_index + '_' + field.key"
          :style="cellStyle(field)"
          :class="field.class"
          class="flexibleTable-cell">
          <!-- Slot for cell content. Override with <template slot="HEAD_key" slot-scope="{ item }"> -->
          <slot
            :name="field.key"
            :item="item"
            :value="item[field.key]" >
            {{ defaultCellContent(item[field.key]) }}
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FontAwesomeIcon from "@fortawesome/vue-fontawesome"

export default {
  name: "FlexibleTable",
  components: { FontAwesomeIcon },
  props: {
    /**
     * An array of field objects with the following properties:
     * - key: key for the field/column (required)
     * - label: label for the column (optional, defaults to key with capitalized first letter)
     * - class: class name for the cell (optional)
     * - width: CSS width of the column (optional)
     * - minWidth: CSS minWidth of the column (optional)
     * - sortable: true if this field should be sortable
     * - compare: custom compare function for sorting this field
     */
    fields: {
      type: Array,
      default: () => []
    },
    /**
     * An array if items to be shown in the table.
     * By default, the raw content under the field keys are shown.
     * Use slots for a custom appearance.
     *
     * Additional keys:
     * - _rowClass: class for the row
     */
    items: {
      type: Array,
      default: () => []
    },
    /**
     * Maximum width of the whole table.
     */
    maxWidth: {
      type: String,
      default: "100%"
    },
    /**
     * Maximum height of the whole table.
     */
    maxHeight: {
      type: String,
      default: "100%"
    },
  },
  data() {
    return {
      sortBy: null,
      sortDirection: 0,
    }
  },
  computed: {
    sortedItems() {
      if (this.sortDirection == 0 || !this.sortBy) {
        return this.items
      }
      let items = this.items.slice()
      let sortField = this.fields.find(f => f.key == this.sortBy)
      let compare = sortField && sortField.compare || ((a, b) => a[this.sortBy] < b[this.sortBy])
      items.sort(compare)
      if (this.sortDirection == -1) {
        items = items.reverse()
      }
      return items
    }
  },
  mounted() {
    let table = this.$el
    let thead = table.getElementsByClassName("flexibleTable-head")[0]
    let tbody = table.getElementsByClassName("flexibleTable-body")[0]
    // Synchronize head and body
    tbody.onscroll = () => {
      thead.scrollLeft = tbody.scrollLeft
    }
    thead.onscroll = () => {
      tbody.scrollLeft = thead.scrollLeft
    }
    // Account for vertical scroll bar
    if (tbody.scrollHeight > tbody.clientHeight) {
      thead.style.marginRight = "9px"
    } else {
      thead.style.marginRight = "0px"
    }
  },
  methods: {
    tableStyle() {
      return {
        maxWidth: this.maxWidth,
        maxHeight: this.maxHeight
      }
    },
    cellStyle(field) {
      let style = {}
      if (field.width != null) {
        style.flex = `0 0 ${field.width}`
      }
      if (field.minWidth != null) {
        style.minWidth = `${field.minWidth}`
      }
      return style
    },
    capitalizeFirst(string) {
      if (string.length == 0) {
        return string
      }
      return string[0].toUpperCase() + string.substring(1)
    },
    defaultCellContent(value) {
      if (typeof value === "object") {
        return value.id || value._id || value.uri || "Object"
      } else {
        return value
      }
    },
    sort(field) {
      if (this.sortBy == field.key) {
        if (this.sortDirection == 0) {
          this.sortDirection = 1
        } else if (this.sortDirection == 1) {
          this.sortDirection = -1
        } else {
          this.sortDirection = 0
        }
      } else {
        this.sortBy = field.key
        this.sortDirection = 1
      }
    },
  },
}
</script>

<style scoped>
.flexibleTable {
  display: flex;
  flex-direction: column;
  text-align: center;
}
.flexibleTable-head {
  flex: none;
  overflow: auto;
  font-weight: 700;
}
.flexibleTable-body {
  flex: 1;
  overflow: auto;
}
.flexibleTable-row {
  display: flex;
}
/* Cell styles */
.flexibleTable-cell {
  user-select: none;
  cursor: pointer;
  padding: 4px 2px;
  overflow: hidden;
  flex: 1;
}
.flexibleTable-head .flexibleTable-cell {
  border-bottom: 1px solid rgba(0,0,0,0.2);
}
.flexibleTable-head .flexibleTable-cell:hover {
  color: rgba(0,0,0,0.5);
}
.flexibleTable-body .flexibleTable-cell {
  border-bottom: 1px solid rgba(0,0,0,0.1);
}
.flexibleTable-cell-sort {
  margin-left: 2px;
}
/* Hide scrollbars in head */
.flexibleTable-head {
  -ms-overflow-style: none;
  overflow: -moz-scrollbars-none;
}
.flexibleTable-head::-webkit-scrollbar {
  display: none;
}
</style>
