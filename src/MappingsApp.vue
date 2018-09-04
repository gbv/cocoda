<template>
  <div
    id="app"
    class="text-dark color-primary-0-bg fontSize-normal" >
    <div class="alertsContainer">
      <b-alert
        v-for="(alert, index) in $store.state.alerts.alerts"
        :key="index"
        :variant="alert.variant"
        :show="alert.countdown || !alert.shouldCountdown"
        :dismissible="!alert.shouldCountdown"
        fade
        @dismissed="$store.commit({ type: 'alerts/setCountdown', alert, countdown: 0 })"
        @dismiss-count-down="$store.commit({ type: 'alerts/setCountdown', alert, countdown: $event })" >
        {{ alert.text }}
      </b-alert>
    </div>
    <loading-indicator-full v-if="loading" />
    <div id="main">
      <b-card no-body>
        <b-tabs
          v-model="tab"
          card >
          <b-tab
            title="Concordances">
            <h2>Concordances</h2>
            <flexible-table
              :fields="concordanceTableFields"
              :items="concordanceTableItems" >
              <span
                slot="download"
                slot-scope="{ value }" >
                <span
                  v-for="(distribution, index) in value"
                  :key="index" >
                  <a
                    v-if="nameOfDistribution(distribution)"
                    :href="distribution.download" >
                    {{ nameOfDistribution(distribution) }}
                </a></span>
              </span>
              <span
                slot="mappings"
                slot-scope="{ value }" >
                {{ (parseInt(value) || "?").toLocaleString() }}
              </span>
            </flexible-table>
            <p style="text-align: right; font-weight: bold;">
              Total: {{ concordances.reduce((total, current) => {
                return total + parseInt(current.extent) || 0
              }, 0).toLocaleString() }}
            </p>
            <p>
              The list of concordances is <a :href="`${concordancesUrl}?download=ndjson`">also available in JSKOS format</a>.
            </p>
          </b-tab>
          <b-tab title="Mappings">
            <h2>Search Mappings</h2>
            <b-container class="search">
              <b-row>
                <b-col
                  cols="2"
                  class="label">Source</b-col>
                <b-col cols="3">
                  <b-form-input
                    v-model="sourceScheme"
                    :state="sourceScheme == '' ? null : fromScheme != null"
                    type="text"
                    placeholder="scheme"
                    @keyup.enter.native="searchClicked" />
                </b-col>
                <b-col cols="5">
                  <b-form-input
                    v-model="sourceNotation"
                    type="text"
                    placeholder="notation"
                    @keyup.enter.native="searchClicked" />
                </b-col>
                <b-col cols="2">
                  <b-button
                    variant="outline-primary"
                    @click="swapClicked" >
                    <!-- <font-awesome-icon icon="retweet" /> -->
                    <font-awesome-icon icon="long-arrow-alt-down" />
                    <font-awesome-icon icon="long-arrow-alt-up" />
                  </b-button>
                </b-col>
              </b-row>
              <b-row>
                <b-col
                  cols="2"
                  class="label">Target</b-col>
                <b-col cols="3">
                  <b-form-input
                    v-model="targetScheme"
                    :state="targetScheme == '' ? null : toScheme != null"
                    type="text"
                    placeholder="scheme"
                    @keyup.enter.native="searchClicked" />
                </b-col>
                <b-col cols="5">
                  <b-form-input
                    v-model="targetNotation"
                    type="text"
                    placeholder="notation"
                    @keyup.enter.native="searchClicked" />
                </b-col>
                <b-col cols="2" />
              </b-row>
              <b-row>
                <b-col
                  cols="2"
                  class="label">Creator</b-col>
                <b-col cols="3">
                  <b-form-input
                    v-model="creator"
                    type="text"
                    placeholder="creator"
                    @keyup.enter.native="searchClicked" />
                </b-col>
                <b-col
                  cols="1"
                  class="label">Type</b-col>
                <b-col cols="4">
                  <b-select
                    v-model="type"
                    :options="typeOptions" />
                </b-col>
                <b-col cols="2" />
              </b-row>
              <b-row>
                <b-col cols="2" />
                <b-col cols="2">
                  <b-button
                    variant="danger"
                    @click="clearClicked" >
                    <font-awesome-icon icon="ban" /> Clear
                  </b-button>
                </b-col>
                <b-col cols="4" />
                <b-col
                  class="text-right"
                  cols="2" >
                  <b-button
                    variant="primary"
                    @click="searchClicked" >
                    <font-awesome-icon icon="search" /> Search
                  </b-button>
                </b-col>
                <b-col cols="2" />
              </b-row>
            </b-container>
            <b-container
              :class="{
                mappingTable: true,
                'mappingTable-short': mappings.length <= 2
              }"
            >
              <b-row v-if="totalCount > 0">
                <b-col
                  cols="12" >
                  <b-pagination
                    v-model="page"
                    :total-rows="totalCount"
                    :per-page="10"
                    class="justify-content-center"
                    style="user-select: none;"
                    size="sm" />
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="12">
                  <mapping-table
                    v-show="mappings.length"
                    :mappings="mappings"
                    :actions="actions"
                    :hide-duplicates="false"
                    @click="tableClicked" />
                </b-col>
              </b-row>
              <b-row>
                <b-col
                  cols="12"
                  class="text-center" >
                  <p>{{ totalCount.toLocaleString() }} results</p>
                  <p v-if="downloadUrl && totalCount > 0">
                    <a :href="downloadUrl + 'json'">
                      <font-awesome-icon icon="download" /> .json
                    </a> |
                    <a :href="downloadUrl + 'ndjson'">
                      <font-awesome-icon icon="download" /> .ndjson
                    </a>
                  </p>
                </b-col>
              </b-row>
            </b-container>
          </b-tab>
        </b-tabs>
      </b-card>
    </div>
  </div>
</template>

<script>
import axios from "axios"
import MappingTable from "./components/MappingTable"
import FlexibleTable from "vue-flexible-table"
import _ from "lodash"
import LoadingIndicatorFull from "./components/LoadingIndicatorFull"

/**
 * The main application.
 */
export default {
  name: "MappingsApp",
  components: {
    MappingTable, LoadingIndicatorFull, FlexibleTable
  },
  data () {
    return {
      loading: false,
      loadingId: null,
      schemes: null,
      currentPage: 1,
      tab: 0,
      downloadUrl: null,
      concordances: [],
      mappings: [],
      totalCount: 0,
      itemDetailSettings: {
        left: {
          showTopConceptsInScheme: true
        }
      },
      type: null,
      sourceScheme: "",
      sourceNotation: "",
      targetScheme: "",
      targetNotation: "",
      creator: "",
      actions: [
        {
          name: "open",
          title: "Open in Cocoda",
          icon: "share"
        }
      ],
      // Properties for URL parameters
      properties: {
        sourceScheme: "fromScheme",
        sourceNotation: "from",
        targetScheme: "toScheme",
        targetNotation: "to",
        creator: "creator",
        type: "type",
        currentPage: "page",
      }
    }
  },
  computed: {
    typeOptions() {
      let options = [{
        text: "all types",
        value: null
      }]
      for (let type of this.$util.mappingTypes) {
        options.push({
          text: `${type.notation[0]} ${type.prefLabel.en}`,
          value: type.uri
        })
      }
      return options
    },
    fromScheme() {
      return this.schemes.find(
        scheme =>
          _.get(scheme, "prefLabel.de", "___NO_SCHEME___").toLowerCase() == this.sourceScheme.toLowerCase() ||
          _.get(scheme, "prefLabel.en", "___NO_SCHEME___").toLowerCase() == this.sourceScheme.toLowerCase() ||
          _.get(scheme, "notation[0]", "___NO_SCHEME___").toLowerCase() == this.sourceScheme.toLowerCase()
      )
    },
    toScheme() {
      return this.schemes.find(
        scheme =>
          _.get(scheme, "prefLabel.de", "___NO_SCHEME___").toLowerCase() == this.targetScheme.toLowerCase() ||
          _.get(scheme, "prefLabel.en", "___NO_SCHEME___").toLowerCase() == this.targetScheme.toLowerCase() ||
          _.get(scheme, "notation[0]", "___NO_SCHEME___").toLowerCase() == this.targetScheme.toLowerCase()
      )
    },
    page: {
      get() {
        return parseInt(this.currentPage) || 1
      },
      set(value) {
        this.currentPage = value
      }
    },
    concordanceTableFields() {
      return [
        {
          key: "from",
          width: "10%",
          minWidth: "",
          sortable: true,
          align: "left",
        },
        {
          key: "to",
          width: "10%",
          minWidth: "",
          sortable: true,
          align: "left",
        },
        {
          key: "description",
          width: "34%",
          minWidth: "",
          sortable: true,
          align: "left",
        },

        {
          key: "creator",
          width: "20%",
          minWidth: "",
          sortable: true,
          align: "left",
        },

        {
          key: "download",
          width: "12%",
          minWidth: "",
          sortable: false,
          align: "left",
        },

        {
          key: "mappings",
          width: "14%",
          minWidth: "",
          sortable: true,
          align: "right",
          compare: (a, b) => (parseInt(a.mappings) || 0) - (parseInt(b.mappings) || 0),
        },
      ]
    },
    concordanceTableItems() {
      let items = []
      for (let concordance of this.concordances) {
        let item = { concordance }
        item.from = _.get(concordance, "fromScheme.notation[0]", "-")
        item.to = _.get(concordance, "toScheme.notation[0]", "-")
        item.description = _.get(concordance, "scopeNote.de[0]") || _.get(concordance, "scopeNote.en[0]") || "-"
        item.creator = _.get(concordance, "creator[0].prefLabel.de") || _.get(concordance, "creator[0].prefLabel.en") || "-"
        item.download = _.get(concordance, "distributions", [])
        item.mappings = _.get(concordance, "extent")
        items.push(item)
      }
      return items
    },
    concordancesUrl() {
      // TODO: Fix URLs in config file.
      let url = this.config.mappingProviders[0].url
      url = url.substring(0, url.substring(0, url.length - 1).lastIndexOf("/")) + "/concordances"
      return url
    }
  },
  watch: {
    schemes() {
      if (this.schemes) {
        this.loading = false
        // Load search from parameters
        this.loadFromParameters()
      } else {
        this.loading = true
      }
    },
    currentPage(newValue) {
      if (newValue) {
        this.search()
      }
    },
    tab() {
      let query = _.cloneDeep(this.$route.query)
      query.tab = this.tab
      this.$router.push({ query })
    },
  },
  created() {
    // Set loading to true if schemes are not loaded yet.
    if (!this.schemes) {
      this.loading = true
    }
    // Load mapping schemes from API.
    axios.get(this.config.mappingProviders[0].url + "voc").then(({ data }) => {
      this.schemes = data
    }).catch(error => {
      console.warn("Error fetching mapping schemes:", error)
      this.schemes = []
    })
    // Load concordances from API.
    axios.get(this.concordancesUrl).then(({ data }) => {
      this.concordances = data
    }).catch(error => {
      console.warn("Error fetching mapping schemes:", error)
      this.concordances = []
    })
    // Load from parameters on popstate (when using the browser's forward and backward buttons).
    window.addEventListener("popstate", () => {
      this.loadFromParameters()
    })
  },
  methods: {
    loadFromParameters() {
      this.clear()
      let query = this.$route.query
      let search = false
      _.forEach(this.properties, (value, key) => {
        if (query[value] && query[value] != this[key]) {
          this[key] = query[value]
          search = true
        }
      })
      // Set tab
      this.tab = parseInt(query.tab) || this.tab || 0
      if (search) {
        // FIXME: saveToParameters will be called even with parameter save = false.
        this.search(false)
      }
    },
    saveToParameters() {
      let query = {}
      _.forEach(this.properties, (value, key) => {
        if (this[key]) {
          query[value] = this[key]
        }
      })
      this.$router.push({ query })
    },
    clearClicked() {
      this.clear()
      this.saveToParameters()
    },
    swapClicked() {
      [this.sourceScheme, this.sourceNotation, this.targetScheme, this.targetNotation] = [this.targetScheme, this.targetNotation, this.sourceScheme, this.sourceNotation]
      this.searchClicked()
    },
    searchClicked() {
      if (this.currentPage == 1) {
        this.search()
      } else {
        this.currentPage = 1
        // Changing currentPage triggers this.search().
      }
    },
    clear() {
      this.sourceNotation = ""
      this.sourceScheme = ""
      this.targetNotation = ""
      this.targetScheme = ""
      this.creator = ""
      this.type = null
      this.currentPage = 0
      this.mappings = []
      this.totalCount = 0
      this.downloadUrl = null
    },
    search(save = true) {
      // Save inputs to parameters
      if (save) {
        this.saveToParameters()
      }
      // Set unique ID for this request
      let loadingId = this.$util.generateID()
      this.loadingId = loadingId
      _.delay(() => {
        if (this.loadingId == loadingId) {
          this.loading = true
        }
      }, 100)
      // Parameters
      let
        from = this.sourceNotation,
        to = this.targetNotation,
        fromScheme = _.get(this.fromScheme, "uri", ""),
        toScheme = _.get(this.toScheme, "uri", ""),
        creator = this.creator,
        type = this.type || "",
        enc = encodeURIComponent
      // Set download URL
      let baseUrl = this.config.mappingProviders[0].url
      this.downloadUrl = `${baseUrl}?from=${enc(from)}&to=${enc(to)}&fromScheme=${enc(fromScheme)}&toScheme=${enc(toScheme)}&creator=${enc(creator)}&type=${enc(type)}&download=`
      // Find fromScheme/toScheme in schemes. FIXME: Use local suggest when typing!
      axios.get(baseUrl, {
        params: {
          from, to, fromScheme, toScheme, type, creator,
          limit: 10,
          offset: (this.page - 1) * 10,
        }
      }).then(({ data, headers }) => {
        if (this.loadingId == loadingId) {
          this.mappings = data || []
          this.totalCount = parseInt(headers["x-total-count"])
          if (!this.totalCount) {
            this.totalCount = data.length
          }
        }
      }).catch(() => null).then(() => {
        if (this.loadingId == loadingId) {
          this.loadingId = null
          this.loading = false
        }
      })
    },
    tableClicked({ name, item }) {
      if (name == "open") {
        let
          fromScheme = item.mapping.fromScheme.uri,
          toScheme = item.mapping.toScheme.uri,
          identifier = item.mapping.identifier.find(id => id.startsWith("urn:jskos:mapping:content:")),
          concepts = { from: "", to: "" }
        for (let fromTo of Object.keys(concepts)) {
          for (let bundle of ["memberSet", "memberChoice", "memberList"]) {
            let uri = _.get(item.mapping, `${fromTo}.${bundle}[0].uri`)
            if (uri) {
              concepts[fromTo] = uri
            }
          }
        }
        if (fromScheme && toScheme && identifier) {
          window.open(`https://gbv.github.io/cocoda/dev/?mapping={}&identifier=${identifier}&fromScheme=${fromScheme}&toScheme=${toScheme}&from=${concepts.from}&to=${concepts.to}`)
        } else {
          this.alert("Mapping could not be opened in Cocoda.", null, "danger")
        }
      }
    },
    nameOfDistribution(distribution) {
      let mimetype = distribution.mimetype
      if (mimetype.includes("json")) {
        return "JSKOS"
      }
      if (mimetype.includes("csv")) {
        return "CSV"
      }
      return null
    },
  },
}
</script>

<style lang="less">
@import "./style/main.less";

html, body {
  height: 100%;
  margin: 0;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 900px;
  margin: 30px auto;
  padding: 40px 20px;
  position: relative;
}

.search {
  margin-top: 30px;
}
.search > .row {
  margin-top: 5px;
}
.label {
  height: 38px;
  line-height: 38px;
  font-weight: bold;
  text-align: right;
}
.mappingTable {
  padding-bottom: 10px;
}
.mappingTable .flexibleTable-body {
  padding-bottom: 20px;
}
.mappingTable-short .flexibleTable-body {
  padding-bottom: 40px;
}

.alertsContainer {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translate(-50%, 0);
  z-index: @zIndex-8;
  width: 600px;
}
</style>
