<template>
  <b-modal
    ref="dataModal"
    :title="`${$t('dataModal.title')} (${numberText})`"
    class="fontSize-normal"
    centered
    hide-footer
    size="lg">
    <table class="dataModal-links">
      <tr v-if="count > 0">
        <td class="fontWeight-heavy">
          {{ $t("dataModal.localDownload") }} ({{ count.toLocaleString() }})
        </td>
        <td>
          <ul class="list-group list-group-horizontal">
            <li class="list-group-item p1">
              <a
                :href="'data:text/csv;charset=utf-8,' + encodedDataCsv"
                :download="filename + '.csv'"
                target="_blank">
                <font-awesome-icon icon="download" /> .csv
              </a>
            </li>
            <li class="list-group-item p1">
              <a
                :href="'data:application/json;charset=utf-8,' + encodedData"
                :download="filename + '.json'"
                target="_blank">
                <font-awesome-icon icon="download" /> .json
              </a>
            </li>
            <li
              v-if="encodedDataNdjson"
              class="list-group-item p1">
              <a
                :href="'data:application/json;charset=utf-8,' + encodedDataNdjson"
                :download="filename + '.ndjson'"
                target="_blank">
                <font-awesome-icon icon="download" /> .ndjson
              </a>
            </li>
            <li class="list-group-item p1">
              <a
                href=""
                @click.prevent="copyToClipboard($refs.jsonCode)">
                <font-awesome-icon icon="clipboard" />
                {{ $t("dataModal.exportClipboard") }}
              </a>
            </li>
          </ul>
        </td>
      </tr>
      <tr v-if="url">
        <td class="fontWeight-heavy">
          {{ $t("dataModal.apiLinks") }} ({{ (totalCount || count).toLocaleString() }})
        </td>
        <td>
          <ul class="list-group list-group-horizontal">
            <li
              v-for="(title, index) in Object.keys(urls)"
              :key="`dataModal-links-urls-${index}`"
              class="list-group-item p1">
              <a
                :href="urls[title]"
                target="_blank">
                <font-awesome-icon icon="link" /> {{ title || $t("dataModal.apiUrl") }}
              </a>
            </li>
            <li
              v-for="(download, index) in apiDownloadUrls"
              :key="`dataModal-links-apiDownload-${index}`"
              class="list-group-item p1">
              <a
                :href="download.url"
                target="_blank">
                <font-awesome-icon icon="download" /> {{ download.title }}
              </a>
            </li>
          </ul>
        </td>
      </tr>
    </table>
    <div class="dataModal-json">
      <pre><code
          ref="jsonCode"
      v-html="jsonHtml" /></pre>
    </div>
  </b-modal>
</template>

<script>
import _ from "lodash"
import formatHighlight from "json-format-highlight"

// Import mixins
import objects from "../mixins/objects"

/**
 * A component (bootstrap modal) that allows viewing and exporting JSKOS data.
 */
export default {
  name: "DataModal",
  components: { },
  mixins: [objects],
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
        return ["concept", "scheme", "mapping", "annotation", "concordance"].indexOf(value) !== -1
      },
    },
    /**
     * API URL or URLs for data (if it exists).
     *
     * For objects, provide a title as keys and the URLs as values.
     */
    url: {
      type: [String, Object],
      default: null,
    },
    /**
     * Total count of data if available from the API.
     */
    totalCount: {
      type: Number,
      default: null,
    },
  },
  data() {
    return {

    }
  },
  computed: {
    computedType() {
      return this.type || (this.$jskos.isConcept(this.isArray ? this.data[0] : this.data) ? "concept" : (this.$jskos.isScheme(this.isArray ? this.data[0] : this.data) ? "scheme" : null))
    },
    count() {
      return _.isArray(this.data) ? this.data.length : (this.data ? 1 : 0)
    },
    numberText() {
      let count = this.count
      if (this.totalCount && count != this.totalCount) {
        return `${count.toLocaleString()} ${this.$t("general.of")} ` + this.$tc(`dataModal.${this.computedType}`, this.totalCount, { count: this.totalCount.toLocaleString() })
      } else {
        return this.$tc(`dataModal.${this.computedType}`, count, { count })
      }
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
          // Remove all properties with null values
          newObject = _.pick(newObject, _.keys(newObject).filter(key => newObject[key] != null))
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
    jsonHtml() {
      return formatHighlight(this.preparedData)
    },
    encodedData() {
      return encodeURIComponent(this.jsonData)
    },
    encodedDataNdjson() {
      let data = this.preparedData
      if (!this.isArray) {
        data = [this.preparedData]
      }
      return encodeURIComponent(data.map(object => JSON.stringify(object)).join("\n"))
    },
    encodedDataCsv() {
      if (!this.computedType.startsWith("mapping")) {
        return null
      }

      let mappings = this.preparedData
      if (!this.isArray) {
        mappings = [mappings]
      }
      // Prepare CSV export
      let mappingCSV = this.$jskos.mappingCSV({
        lineTerminator: "\r\n",
        labels: true,
        creator: true,
        language: "de", // NOTE: Hardcoded language here and when preparing labels for CSV export because mappingCSV doesn't support a language override in each call (yet).
      })
      // Make a copy of all items so that we can freely modify them
      mappings = mappings.map(mapping => this.$jskos.copyDeep(mapping))
      // TODO: Some code duplication with TheSettings.
      for (let mapping of mappings) {
        // Prepare labels
        // ... for concepts
        for (let concept of this.$jskos.conceptsOfMapping(mapping)) {
          let conceptInStore = this._getObject(concept)
          let language = this.$util.getLanguage(_.get(conceptInStore, "prefLabel"))
          if (language) {
            // NOTE: Hardcoded language, see note above.
            concept.prefLabel = { de: _.get(conceptInStore.prefLabel, language) }
          }
        }
        // ... for creator
        if (mapping.creator && mapping.creator[0]) {
          mapping.creator[0].prefLabel = { de: this.$util.prefLabel(mapping.creator[0], null, false) }
        }
      }

      return encodeURIComponent(mappingCSV.fromMappings(mappings))
    },
    validated() {
      let type = this.computedType
      let validate = _.get(this.$jskos.validate, type, this.$jskos.validate && this.$jskos.validate.resource)
      if (!this.preparedData || !validate) {
        return false
      }
      let validated = true
      for (let object of this.isArray ? this.preparedData : [this.preparedData]) {
        validated = validated && validate(object)
      }
      return validated
    },
    urls() {
      return _.isObject(this.url) ? this.url : { "": this.url }
    },
    apiDownloadUrls() {
      if (!this.url) {
        return []
      }
      // Restrict type to mapping and concordance for download
      if (this.type !== "mapping" && this.type !== "concordance") {
        return []
      }
      let urls = []
      for (let type of ["json", "ndjson"]) {
        for (let title of Object.keys(this.urls)) {
          const address = this.urls[title]
          try {
            let url = new URL(address.startsWith("http") ? address : location.protocol + address)
            url.searchParams.set("download", type)
            urls.push({
              url,
              type,
              title: title ? `${title} (.${type})` : `.${type}`,
            })
          } catch(error) {
            // Do nothing
          }
        }
      }
      return urls
    },
  },
  watch: {

  },
  methods: {
    show() {
      this.$refs.dataModal.show()
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.dataModal-json {
  height: 600px;
  overflow: auto;
  margin-top: 20px;
}

</style>
