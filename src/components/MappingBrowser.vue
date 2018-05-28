<template>
  <div
    id="mappingBrowser"
    :style="{ flex: flex }">
    <mapping-editor class="main-component" />
    <mapping-table class="main-component" />
    <mapping-occurrences class="main-component" />
  </div>
</template>

<script>
import MappingEditor from "./MappingEditor"
import MappingOccurrences from "./MappingOccurrences"
import MappingTable from "./MappingTable"

/**
 * The mapping browser component which includes the mapping editor, mapping table, and mapping occurrences.
 */
export default {
  name: "MappingBrowser",
  components: {
    MappingEditor, MappingOccurrences, MappingTable
  },
  props: {
    /**
     * The width of the component as a flex value.
     */
    flex: {
      type: Number,
      default: 2
    }
  },
  data () {
    return {}
  }
}
</script>

<style scoped>
#mappingBrowser {
  flex: 2;
  width: 0;
  display: flex;
  flex-direction: column;
}
</style>
