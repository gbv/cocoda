<template>
  <div
    id="mappingTable"
    :style="{ flex: flex }" />
</template>

<script>

/**
 * The mapping table component.
 */
export default {
  name: "MappingTable",
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
    return {}
  }
}
</script>

<style scoped>
#mappingTable {
  height: 0;
  overflow: hidden;
}
</style>
