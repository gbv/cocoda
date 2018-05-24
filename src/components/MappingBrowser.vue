<template>
  <div id="mappingBrowser">
    <mapping-editor />
    <mapping-table />
    <mapping-occurrences />
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
  data () {
    return {}
  }
}
</script>

<style scoped>
#mappingBrowser {
  flex: 2;
  display: flex;
  flex-direction: column;
}
#mappingBrowser > div {
  outline: 1px solid #ccc;
  margin: 0px 0px 4px 0px;
}
</style>
