<template>
  <div
    id="mappingEditor"
    :style="{ flex: flex }" />
</template>

<script>

/**
 * The mapping editor component.
 */
export default {
  name: "MappingEditor",
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
#mappingEditor {
  height: 0;
  overflow: hidden;
}
</style>
