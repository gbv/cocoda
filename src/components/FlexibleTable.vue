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
          @click="field.sortable && sort(field)" >
          <!-- Slot for head cell content. Override with <template slot="HEAD_key" slot-scope="{ field }"> -->
          <slot
            :name="'HEAD_' + field.key"
            :field="field">
            {{ field.label || capitalizeFirst(field.key) }}
            <span
              class="flexibleTable-cell-sort" >
              <!--
                SVG icon by FontAwesome
                URL: https://fontawesome.com/icons/sort-up?style=solid
                License: https://fontawesome.com/license/free
               -->
              <svg
                v-if="sorting.sortBy == field.key && sorting.sortDirection == 1"
                width="10px"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -60 320 512">
                <path
                  fill="currentColor"
                  d="M279 224H41c-21.4 0-32.1-25.9-17-41L143 64c9.4-9.4 24.6-9.4 33.9 0l119 119c15.2 15.1 4.5 41-16.9 41z"/>
              </svg>
              <!--
                SVG icon by FontAwesome
                URL: https://fontawesome.com/icons/sort-down?style=solid
                License: https://fontawesome.com/license/free
               -->
              <svg
                v-else-if="sorting.sortBy == field.key && sorting.sortDirection == -1"
                width="10px"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -60 320 512">
                <path
                  fill="currentColor"
                  d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41z"/>
              </svg>
              <!--
                SVG icon by FontAwesome
                URL: https://fontawesome.com/icons/sort?style=solid
                License: https://fontawesome.com/license/free
               -->
              <svg
                v-else-if="field.sortable"
                width="10px"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -60 320 512">
                <path
                  fill="currentColor"
                  d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41zm255-105L177 64c-9.4-9.4-24.6-9.4-33.9 0L24 183c-15.1 15.1-4.4 41 17 41h238c21.4 0 32.1-25.9 17-41z"/>
              </svg>
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
        class="flexibleTable-row"
        @mouseover="$emit('hover', item)"
        @mouseout="$emit('hover', null)" >
        <div
          v-for="field in fields"
          :key="'ITEM_' + item_index + '_' + field.key"
          :style="cellStyle(field)"
          :class="field.class"
          class="flexibleTable-cell">
          <!-- Slot for cell content. Override with <template slot="HEAD_key" slot-scope="{ field, item, value }"> -->
          <slot
            :name="field.key"
            :field="field"
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
/**
 * Component that displays a flexible table. Usage is similar to that of [bootstrap-vue tables](https://bootstrap-vue.js.org/docs/components/table).
 */
export default {
  name: "FlexibleTable",
  props: {
    /**
     * An array of field objects with the following properties:
     *
     * - `key`: key for the field/column (required)
     * - `label`: label for the column (optional, defaults to key with capitalized first letter)
     * - `class`: class name for the cell (optional)
     * - `width`: CSS width of the column (optional)
     * - `minWidth`: CSS minWidth of the column (optional)
     * - `sortable`: true if this field should be sortable (optional, default false)
     * - `compare`: custom compare function for sorting this field (optional)
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
     * Additional keys (optional):
     *
     * - `_rowClass`: class for the row
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
    /**
     * Key to sort table by (overridden by user choice).
     */
    sortBy: {
      type: String,
      default: null
    },
    /**
     * Direction to sort table by (overridden by user choice).
     *
     * `0` - no sorting,
     * `1` - ascending,
     * `-1` - descending
     */
    sortDirection: {
      type: Number,
      default: 1
    },
  },
  data() {
    return {
      // Contains the current sorting preferences.
      sorting: {
        sortBy: null,
        sortDirection: 0,
      },
    }
  },
  computed: {
    /**
     * Returns a sorted list of items according to the current sorting preferences.
     */
    sortedItems() {
      if (this.sorting.sortDirection == 0 || !this.sorting.sortBy) {
        return this.items
      }
      let items = this.items.slice()
      let sortField = this.fields.find(f => f.key == this.sorting.sortBy)
      let compare = sortField && sortField.compare || ((a, b) => a[this.sorting.sortBy] < b[this.sorting.sortBy])
      items.sort(compare)
      if (this.sorting.sortDirection == -1) {
        items = items.reverse()
      }
      return items
    }
  },
  mounted() {
    // Set initial sorting preferences
    this.sorting.sortBy = this.sortBy
    this.sorting.sortDirection = this.sortDirection
    // Prepare table
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
    /**
     * Style object for the whole table.
     */
    tableStyle() {
      return {
        maxWidth: this.maxWidth,
        maxHeight: this.maxHeight
      }
    },
    /**
     * Style object for each cell.
     */
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
    /**
     * Capitalizes the first letter of a string.
     */
    capitalizeFirst(string) {
      if (string.length == 0) {
        return string
      }
      return string[0].toUpperCase() + string.substring(1)
    },
    /**
     * Determines default table cell content.
     * Objects and arrays won't be displayed.
     */
    defaultCellContent(value) {
      if (typeof value === "object") {
        return value.id || value._id || value.uri || "Object"
      } else {
        return value
      }
    },
    /**
     * Sets the sorting preferences.
     */
    sort(field) {
      if (this.sorting.sortBy == field.key) {
        if (this.sorting.sortDirection == 0) {
          this.sorting.sortDirection = 1
        } else if (this.sorting.sortDirection == 1) {
          this.sorting.sortDirection = -1
        } else {
          this.sorting.sortDirection = 0
        }
      } else {
        this.sorting.sortBy = field.key
        this.sorting.sortDirection = 1
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
  padding: 4px 2px;
  overflow: hidden;
  flex: 1;
}
.flexibleTable-head .flexibleTable-cell {
  user-select: none;
  cursor: pointer;
  border-bottom: 1px solid rgba(0,0,0,0.2);
}
.flexibleTable-head .flexibleTable-cell:hover {
  color: rgba(0,0,0,0.5);
}
.flexibleTable-body .flexibleTable-cell {
  border-bottom: 1px solid rgba(0,0,0,0.1);
}
.flexibleTable-body .flexibleTable-row:hover .flexibleTable-cell {
  background-color: rgba(0,0,0,0.1);
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
