<template>
  <div>
    <!-- Button -->
    <div
      class="dataModalButton"
      @click="openDataModal">
      <font-awesome-icon icon="code" />
    </div>
    <!-- Data modal -->
    <data-modal
      ref="dataModal"
      :data="data"
      :type="type"
      :url="url" />
  </div>
</template>

<script>
import DataModal from "./DataModal"

/**
 * A wrapper offering a data sources button that opens a DataModal with the provided data.
 */
export default {
  name: "DataModalButton",
  components: { DataModal },
  props: {
    /**
     * JSKOS data (either object or array)
     */
    data: {
      type: [Object, Array],
      default: null,
    },
    /**
     * JSKOS type (one of `concept`, `scheme`, or `mapping`)
     *
     * Mostly important for mappings that are prepared differently from other JSKOS types. Also used for JSKOS validation.
     */
    type: {
      type: String,
      default: null,
      validator: function (value) {
        return ["concept", "scheme", "mapping",  "annotation", "concordance"].indexOf(value) !== -1
      },
    },
    /**
     * API URL for data (if it exists).
     */
    url: {
      type: String,
      default: null,
    },
  },
  methods: {
    openDataModal() {
      this.$refs.dataModal.show()
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.dataModalButton {
  z-index: @zIndex-3;
}

</style>
