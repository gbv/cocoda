<template>
  <div
    id="mappingOccurrences"
    :style="{ flex: flex }" />
</template>

<script>

/**
 * The mapping occurrences component.
 */
export default {
  name: "MappingOccurrences",
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
#mappingOccurrences {
  height: 0;
  overflow: hidden;
}
</style>
