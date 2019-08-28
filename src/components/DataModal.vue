<template>
  <b-modal
    ref="dataModal"
    :title="`${$t('dataModal.title')} (${numberText})`"
    class="fontSize-normal"
    centered
    hide-footer
    size="lg">
    <div class="dataModal-links">
      <div>
        <a
          href=""
          @click.prevent="copyToClipboard($refs.jsonCode)">
          <font-awesome-icon icon="clipboard" />
          {{ $t("dataModal.exportClipboard") }}
        </a>
      </div>
      <div class="dataModal-links-withTitle">
        <div class="fontWeight-heavy">
          {{ $t("dataModal.localDownload") }} ({{ count.toLocaleString() }})
        </div>
        <div>
          <div>
            <a
              :href="'data:application/json;charset=utf-8,' + encodedData"
              :download="filename + '.json'"
              target="_blank">
              <font-awesome-icon icon="download" /><br>.json
            </a>
          </div>
          <div v-if="encodedDataNdjson">
            <a
              :href="'data:application/json;charset=utf-8,' + encodedDataNdjson"
              :download="filename + '.ndjson'"
              target="_blank">
              <font-awesome-icon icon="download" /><br>.ndjson
            </a>
          </div>
        </div>
      </div>
      <div
        class="dataModal-links-withTitle"
        :style="Object.keys(urls).length > 1 ? 'flex: 1.6;' : 'flex: 1.3;'">
        <div class="fontWeight-heavy">
          {{ $t("dataModal.apiLinks") }} ({{ (totalCount || count).toLocaleString() }})
        </div>
        <div v-if="url">
          <div
            v-for="(title, index) in Object.keys(urls)"
            :key="`dataModal-links-urls-${index}`">
            <a
              :href="urls[title]"
              target="_blank">
              <font-awesome-icon icon="link" /><br>{{ title || $t("dataModal.apiUrl") }}
            </a>
          </div>
          <div
            v-for="(download, index) in apiDownloadUrls"
            :key="`dataModal-links-apiDownload-${index}`">
            <a
              :href="download.url"
              target="_blank">
              <font-awesome-icon icon="download" /><br>{{ download.title }}
            </a>
          </div>
        </div>
        <div v-else>
          <div>{{ $t("dataModal.noApiUrls") }}</div>
        </div>
      </div>
    </div>
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

.dataModal-links {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  text-align: center;
}
.dataModal-links > * {
  flex: 1;
}

.dataModal-links-withTitle {
  display: flex;
  flex-direction: column;
}
.dataModal-links-withTitle > *:last-child {
  display: flex;
  flex-wrap: wrap;
}
.dataModal-links-withTitle > *:last-child > * {
  flex: 1;
}

.dataModal-json {
  height: 600px;
  overflow: auto;
  margin-top: 20px;
}

</style>
