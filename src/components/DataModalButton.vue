<template>
  <div>
    <!-- Button -->
    <div
      v-b-tooltip.hover="{ title: $t('dataModal.button'), delay: defaults.delay.medium }"
      class="dataModalButton"
      :style="`right: ${positionRight}px; bottom: ${positionBottom}px;`"
      @click="openDataModal">
      <font-awesome-icon icon="code" />
    </div>
    <!-- Data modal -->
    <data-modal
      ref="dataModal"
      :data="data"
      :type="type"
      :url="url"
      :total-count="totalCount" />
  </div>
</template>

<script>
import DataModal from "./DataModal.vue"

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
      type: [String, Object, Array],
      default: null,
    },
    /**
     * Total count of data if available from the API.
     */
    totalCount: {
      type: Number,
      default: null,
    },
    /**
     * Absolut position right (override if there are other buttons in the bottom right).
     */
    positionRight: {
      type: Number,
      default: 5,
    },
    /**
     * Absolut position bottom (override if necessary).
     */
    positionBottom: {
      type: Number,
      default: 0,
    },
  },
  methods: {
    openDataModal() {
      this.$refs.dataModal.show()
    },
  },
}
</script>
