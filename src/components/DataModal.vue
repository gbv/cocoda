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
        <td class="fontWeight-heavy text-right">
          {{ $t("dataModal.localDownload") }} ({{ count.toLocaleString() }})
        </td>
        <td>
          <ul class="list-group list-group-horizontal">
            <li
              v-if="encodedDataCsv"
              class="list-group-item py-2 border-0">
              <a
                :href="'data:text/csv;charset=utf-8,' + encodedDataCsv"
                :download="filename + '.csv'"
                target="_blank">
                <font-awesome-icon icon="download" /> .csv
              </a>
            </li>
            <li class="list-group-item py-2 border-0">
              <a
                :href="'data:application/json;charset=utf-8,' + encodedData"
                :download="filename + '.json'"
                target="_blank">
                <font-awesome-icon icon="download" /> .json
              </a>
            </li>
            <li
              v-if="encodedDataNdjson"
              class="list-group-item py-2 border-0">
              <a
                :href="'data:application/json;charset=utf-8,' + encodedDataNdjson"
                :download="filename + '.ndjson'"
                target="_blank">
                <font-awesome-icon icon="download" /> .ndjson
              </a>
            </li>
            <li class="list-group-item py-2 border-0">
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
        <td class="fontWeight-heavy text-right">
          {{ $t("dataModal.apiLinks") }} ({{ (totalCount || count).toLocaleString() }})
        </td>
        <td>
          <ul class="list-group list-group-horizontal list-group-flush">
            <li
              v-for="(title, index) in Object.keys(urls)"
              :key="`dataModal-links-urls-${index}`"
              class="list-group-item py-2 border-0">
              <a
                :href="urls[title]"
                target="_blank">
                <font-awesome-icon icon="link" /> {{ title || $t("dataModal.apiUrl") }}
              </a>
            </li>
            <li
              v-for="(download, index) in apiDownloadUrls"
              :key="`dataModal-links-apiDownload-${index}`"
              class="list-group-item py-2 border-0">
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
import objects from "@/mixins/cdk.js"
import { getItem } from "@/items"

/**
 * A component (bootstrap modal) that allows viewing and exporting JSKOS data.
 *
 * TODO: Rewrite to use new items plugin!
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
  },
  data() {
    return {
      preparedData: null,
    }
  },
  computed: {
    // data from store
    _dataFromStore() {
      return this.isArray ? this.data.map(i => getItem(i) || i) : getItem(this.data) || this.data
    },
    computedType() {
      return this.type || (this.$jskos.isConcept(this.isArray ? this._dataFromStore[0] : this._dataFromStore) ? "concept" : (this.$jskos.isScheme(this.isArray ? this._dataFromStore[0] : this._dataFromStore) ? "scheme" : "resource"))
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
      let filename = this.computedType
      if (this.isArray) {
        filename += "s"
      }
      return filename
    },
    jsonData() {
      if (!this.preparedData) {
        return ""
      }
      return JSON.stringify(this.preparedData, null, 2)
    },
    jsonHtml() {
      return formatHighlight(this.preparedData || {})
    },
    encodedData() {
      return encodeURIComponent(this.jsonData)
    },
    encodedDataNdjson() {
      if (!this.preparedData) {
        return null
      }
      let data = this.preparedData
      if (!this.isArray) {
        data = [this.preparedData]
      }
      return encodeURIComponent(data.map(object => JSON.stringify(object)).join("\n"))
    },
    encodedDataCsv() {
      if (!this.computedType.startsWith("mapping") || !this.preparedData) {
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
          let conceptInStore = getItem(concept)
          let language = this.$jskos.languagePreference.selectLanguage(_.get(conceptInStore, "prefLabel"))
          if (language) {
            // NOTE: Hardcoded language, see note above.
            concept.prefLabel = { de: _.get(conceptInStore.prefLabel, language) }
          }
        }
        // ... for creator
        if (mapping.creator && mapping.creator[0]) {
          mapping.creator[0].prefLabel = { de: this.$jskos.prefLabel(mapping.creator[0], { fallbackToUri: false }) }
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
      for (let type of (this.type === "mapping" ? ["csv", "tsv"] : []).concat(["json", "ndjson"])) {
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
      this.updatePreparedData()
      this.$refs.dataModal.show()
    },
    updatePreparedData() {
      if (this._dataFromStore == null) {
        this.preparedData = null
        return
      }
      let dataArray = this._dataFromStore
      if (!this.isArray) {
        dataArray = [this._dataFromStore]
      }
      let newData = []
      for (let object of dataArray) {
        // Prepare object depending on type
        let newObject
        if (this.computedType == "mapping") {
          newObject = this.$jskos.minifyMapping(object)
          newObject = this.$jskos.addMappingIdentifiers(newObject)
        } else {
          newObject = _.omit(object, Object.keys(object).filter(key => key.startsWith("_")))
          // Remove all properties with null values
          newObject = _.pick(newObject, _.keys(newObject).filter(key => newObject[key] != null))
        }
        if (newObject) {
          newData.push(newObject)
        }
      }
      if (!this.isArray) {
        this.preparedData = newData[0]
      } else {
        this.preparedData = newData
      }
    },
  },
}
</script>

<style lang="less" scoped>
@import "@/style/main.less";

.dataModal-json {
  height: 600px;
  overflow: auto;
  margin-top: 20px;
}

</style>
