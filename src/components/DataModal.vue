<template>
  <b-modal
    ref="dataModal"
    :title="$t('dataModal.title')"
    class="fontSize-normal"
    centered
    size="lg" >
    <span slot="modal-footer">
      {{ $t("dataModal.validation") }}:
      <span :class="validated ? 'text-success' : 'text-danger'">
        {{ validated ? $t("dataModal.validationSuccess") : $t("dataModal.validationFailure") }}
      </span>
      |
      JSKOS {{ $t("settings.version") }} {{ $jskos.version }}
      |
      <a
        href="https://gbv.github.io/jskos/jskos.html"
        target="_blank" >
        {{ $t("dataModal.jskosSpecification") }}
      </a>
    </span>
    <p>
      <b-button
        @click.stop.prevent="copyToClipboard($refs.jsonCode)">
        {{ $t("dataModal.exportClipboard") }}
      </b-button>
      <b-button
        :href="'data:application/json;charset=utf-8,' + encodedData"
        :download="filename + '.json'"
        target="_blank"
        variant="outline-warning" >
        {{ $t("dataModal.exportJson") }}
      </b-button>
      <b-button
        v-if="encodedDataNdjson"
        :href="'data:application/json;charset=utf-8,' + encodedDataNdjson"
        :download="filename + '.ndjson'"
        target="_blank"
        variant="outline-warning" >
        {{ $t("dataModal.exportNdjson") }}
      </b-button>
    </p>
    <div class="dataModal-json">
      <pre>
        <code
          ref="jsonCode"
          class="json">{{ jsonData }}</code>
      </pre>
    </div>
  </b-modal>
</template>

<script>
import _ from "lodash"

/**
 * A component (bootstrap modal) that allows viewing and exporting JSKOS data.
 */
export default {
  name: "DataModal",
  components: { },
  props: {
    /**
     * JSKOS data (either object or array)
     */
    data: {
      type: [Object, Array],
      default: null
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
        return ["concept", "scheme", "mapping"].indexOf(value) !== -1
      }
    }
  },
  data() {
    return {

    }
  },
  computed: {
    computedType() {
      return this.type || (this.$jskos.isConcept(this.isArray ? this.data[0] : this.data) ? "concept" : (this.$jskos.isScheme(this.isArray ? this.data[0] : this.data) ? "scheme" : null))
    },
    isArray() {
      return _.isArray(this.data)
    },
    filename() {
      let filename = this.computedType || "resource"
      if (this.isArray) {
        filename += "s"
      }
      return filename
    },
    preparedData() {
      if (this.data == null) {
        return null
      }
      let dataArray = this.data
      if (!this.isArray) {
        dataArray = [this.data]
      }
      let newData = []
      for (let object of dataArray) {
        // Prepare object depending on type
        let newObject
        if (this.computedType == "mapping") {
          newObject = this.$jskos.minifyMapping(object)
          newObject = this.$jskos.addMappingIdentifiers(newObject)
        } else {
          newObject = this.$jskos.copyDeep(object)
        }
        if (newObject) {
          newData.push(newObject)
        }
      }
      if (!this.isArray) {
        return newData[0]
      }
      return newData
    },
    jsonData() {
      return JSON.stringify(this.preparedData, null, 2)
    },
    encodedData() {
      return encodeURIComponent(this.jsonData)
    },
    encodedDataNdjson() {
      if (!this.isArray) {
        return null
      }
      return this.preparedData.map(object => JSON.stringify(object)).join("\n")
    },
    validated() {
      let type = this.computedType
      let validate = _.get(this.$jskos.validate, type, this.$jskos.validate.resource)
      if (!this.preparedData || !validate) {
        return false
      }
      let validated = true
      for (let object of this.isArray ? this.preparedData : [this.preparedData]) {
        validated = validated && validate(object)
      }
      return validated
    }
  },
  watch: {

  },
  methods: {
    show() {
      this.$refs.dataModal.show()
      // Add syntax highlighting
      this.$hljs.highlightBlock(this.$refs.jsonCode)
    },
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.dataModal-json {
  height: 600px;
  overflow: auto;
  margin-top: 20px;
}

// Small visual fix for pre-code block
.dataModal-json > pre {
  margin: -18px 0 -36px 0;
}

</style>
