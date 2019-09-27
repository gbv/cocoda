<template>
  <div
    id="app"
    class="text-dark color-primary-0-bg fontSize-normal">
    <div class="alertsContainer">
      <b-alert
        v-for="(alert, index) in $store.state.alerts.alerts"
        :key="index"
        :variant="alert.variant"
        :show="alert.countdown || !alert.shouldCountdown"
        :dismissible="!alert.shouldCountdown"
        fade
        @dismissed="$store.commit({ type: 'alerts/setCountdown', alert, countdown: 0 })"
        @dismiss-count-down="$store.commit({ type: 'alerts/setCountdown', alert, countdown: $event })">
        {{ alert.text }}
      </b-alert>
    </div>
    <loading-indicator-full v-if="loading" />
    <div
      v-if="configLoaded"
      id="main">
      <b-card no-body>
        <b-tabs
          v-model="tab"
          card>
          <b-tab
            :disabled="!loading && concordances.length == 0"
            title="Concordances">
            <div style="display: flex;">
              <div
                v-for="field in concordanceTableFields"
                :key="field.key"
                :style="'padding: 0px 10px 0px 0px; flex: 0 0 ' + field.width">
                <b-input
                  v-if="field.key == 'from'"
                  v-model="filter.from"
                  type="text"
                  style="width: 55%; display: inline-block;"
                  size="sm"
                  placeholder="from" />
                <b-input
                  v-if="field.key == 'to'"
                  v-model="filter.to"
                  type="text"
                  style="width: 75%; display: inline-block;"
                  size="sm"
                  placeholder="to" />
                <b-input
                  v-if="field.key == 'creator'"
                  v-model="filter.creator"
                  type="text"
                  style="width: 80%; display: inline-block;"
                  size="sm"
                  placeholder="creator" />
                <span
                  v-if="filter[field.key] != null"
                  v-b-tooltip.hover="{ title: 'clear filter', delay: $util.delay.medium }"
                  icon="times"
                  class="button d-none d-md-inline-block"
                  @click="filter[field.key] = ''">
                  x
                </span>
                <b-button
                  v-if="field.key == 'from'"
                  class="d-none d-lg-inline-block"
                  variant="link"
                  size="sm"
                  @click="[filter.from, filter.to] = [filter.to, filter.from]">
                  <font-awesome-icon icon="exchange-alt" />
                </b-button>
              </div>
            </div>
            <flexible-table
              :fields="concordanceTableFields"
              :items="concordanceTableItems">
              <span
                slot="download"
                slot-scope="{ value }">
                <span
                  v-for="(distribution, index) in value"
                  :key="index">
                  <a
                    v-if="nameOfDistribution(distribution)"
                    :href="distribution.download">
                    {{ nameOfDistribution(distribution) }}
                  </a></span>
              </span>
              <span
                slot="mappings"
                slot-scope="{ value }">
                {{ (parseInt(value) || "?").toLocaleString() }}
              </span>
              <span
                slot="actions"
                slot-scope="{ item }">
                <font-awesome-icon
                  v-b-tooltip.hover="{ title: 'Show Mappings', delay: $util.delay.medium }"
                  icon="external-link-square-alt"
                  class="button"
                  @click="showMappingsForConcordance(item.concordance)" />
              </span>
            </flexible-table>
            <div style="display: flex;">
              <p style="font-weight: bold; flex: 1;">
                {{ concordanceTableItems.length }} concordances
              </p>
              <p style="text-align: right; font-weight: bold;">
                Total: {{ concordanceTableItems.reduce((total, current) => {
                  return total + parseInt(current.mappings) || 0
                }, 0).toLocaleString() }}
              </p>
            </div>
            <p>
              The list of concordances is <a :href="`${concordancesUrl}?download=ndjson`">also available in JSKOS format</a>.
            </p>
          </b-tab>
          <b-tab title="Search Mappings">
            <b-container class="search">
              <b-row>
                <b-col
                  cols="3"
                  class="label">
                  Source
                </b-col>
                <b-col cols="3">
                  <b-form-input
                    v-model="sourceScheme"
                    :state="sourceScheme == '' ? null : fromScheme != null"
                    type="text"
                    placeholder="scheme"
                    @keyup.enter.native="searchClicked" />
                </b-col>
                <b-col cols="4">
                  <b-form-input
                    v-model="sourceNotation"
                    type="text"
                    placeholder="notation"
                    @keyup.enter.native="searchClicked" />
                </b-col>
                <b-col cols="2">
                  <b-button
                    variant="outline-primary"
                    @click="swapClicked">
                    <!-- <font-awesome-icon icon="retweet" /> -->
                    <font-awesome-icon icon="long-arrow-alt-down" />
                    <font-awesome-icon icon="long-arrow-alt-up" />
                  </b-button>
                </b-col>
              </b-row>
              <b-row>
                <b-col
                  cols="3"
                  class="label">
                  Target
                </b-col>
                <b-col cols="3">
                  <b-form-input
                    v-model="targetScheme"
                    :state="targetScheme == '' ? null : toScheme != null"
                    type="text"
                    placeholder="scheme"
                    @keyup.enter.native="searchClicked" />
                </b-col>
                <b-col cols="4">
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
                  cols="3"
                  class="label">
                  Creator
                </b-col>
                <b-col cols="2">
                  <b-form-input
                    v-model="creator_"
                    type="text"
                    placeholder="creator"
                    @keyup.enter.native="searchClicked" />
                </b-col>
                <b-col
                  cols="2"
                  class="label">
                  Type
                </b-col>
                <b-col cols="3">
                  <b-select
                    v-model="type"
                    :options="typeOptions" />
                </b-col>
                <b-col cols="2" />
              </b-row>
              <b-row>
                <b-col
                  cols="3"
                  class="label">
                  <span
                    v-if="concordances.length > 0">
                    Concordance
                  </span>
                </b-col>
                <b-col cols="4">
                  <b-form-select
                    v-if="concordances.length > 0"
                    v-model="concordance"
                    :options="concordanceOptions" />
                </b-col>
                <b-col
                  class="text-right"
                  cols="3">
                  <b-button
                    variant="danger"
                    @click="clearClicked">
                    <font-awesome-icon icon="ban" /><span class="d-none d-lg-inline"> Clear</span>
                  </b-button>
                  <b-button
                    variant="primary"
                    @click="searchClicked">
                    <font-awesome-icon icon="search" /><span class="d-none d-md-inline"> Search</span>
                  </b-button>
                </b-col>
                <b-col cols="2" />
              </b-row>
            </b-container>
            <b-container
              :class="{
                mappingTable: true,
                'mappingTable-short': mappings.length <= 2
              }">
              <b-row>
                <b-col cols="12">
                  <mapping-table
                    v-show="mappings.length"
                    :mappings="mappings"
                    :actions="actions"
                    :show-labels="showLabels != 0"
                    :hide-duplicates="false"
                    @click="tableClicked" />
                </b-col>
              </b-row>
              <b-row>
                <b-col
                  cols="8">
                  <b-pagination
                    v-if="totalCount > 0"
                    v-model="page"
                    :total-rows="totalCount"
                    :per-page="10"
                    class="justify-content-begin"
                    style="user-select: none;"
                    size="sm" />
                </b-col>
                <b-col
                  cols="4"
                  class="text-right">
                  <p>{{ totalCount.toLocaleString() }} results</p>
                  <p v-if="downloadUrl && totalCount > 0">
                    <a :href="downloadUrl + 'json'">
                      <font-awesome-icon icon="download" /> .json
                    </a> |
                    <a :href="downloadUrl + 'ndjson'">
                      <font-awesome-icon icon="download" /> .ndjson
                    </a> |
                    <a :href="downloadUrl + 'csv'">
                      <font-awesome-icon icon="download" /> .csv
                    </a> |
                    <a :href="downloadUrl + 'tsv'">
                      <font-awesome-icon icon="download" /> .tsv
                    </a>
                  </p>
                  <b-form-checkbox
                    v-model="showLabels"
                    value="1"
                    unchecked-value="0">
                    Show Labels for Concepts
                  </b-form-checkbox>
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

// Import mixins
import auth from "./mixins/auth"
import objects from "./mixins/objects"
import computed from "./mixins/computed"

/**
 * The main application.
 */
export default {
  name: "MappingsApp",
  components: {
    MappingTable, LoadingIndicatorFull, FlexibleTable,
  },
  mixins: [auth, objects, computed],
  data () {
    return {
      loading: false,
      loadingId: null,
      mappingSchemes: null,
      currentPage: 1,
      tab: 0,
      downloadUrl: null,
      concordances: [],
      mappings: [],
      totalCount: 0,
      itemDetailSettings: {
        left: {
          showTopConceptsInScheme: true,
        },
      },
      type: null,
      concordance: null,
      sourceScheme: "",
      sourceNotation: "",
      targetScheme: "",
      targetNotation: "",
      creator_: "",
      actions: [
        {
          name: "feedback",
          title: "Send Feedback",
          icon: "comment",
        },
        {
          name: "open",
          title: "Open in Cocoda",
          icon: "external-link-alt",
        },
      ],
      showLabels: "1",
      // Properties for URL parameters
      properties: {
        sourceScheme: "fromScheme",
        sourceNotation: "from",
        targetScheme: "toScheme",
        targetNotation: "to",
        creator_: "creator",
        type: "type",
        concordance: "concordance",
        currentPage: "page",
        showLabels: "showLabels",
      },
      // Filter for concordance table
      filter: {
        from: "",
        to: "",
        creator: "",
      },
    }
  },
  computed: {
    typeOptions() {
      let options = [{
        text: "all types",
        value: null,
      }]
      for (let type of this.$jskos.mappingTypes) {
        options.push({
          text: `${this.$util.notation(type)} ${this.$util.prefLabel(type)}`,
          value: type.uri,
        })
      }
      return options
    },
    fromScheme() {
      return this.mappingSchemes.find(
        scheme =>
          (this.$util.prefLabel(scheme, null, false) || "___NO_SCHEME___").toLowerCase() == this.sourceScheme.toLowerCase() ||
          (this.$util.notation(scheme) || "").toLowerCase() == this.sourceScheme.toLowerCase()
      )
    },
    toScheme() {
      return this.mappingSchemes.find(
        scheme =>
          (this.$util.prefLabel(scheme, null, false) || "___NO_SCHEME___").toLowerCase() == this.targetScheme.toLowerCase() ||
          (this.$util.notation(scheme) || "").toLowerCase() == this.targetScheme.toLowerCase()
      )
    },
    page: {
      get() {
        return parseInt(this.currentPage) || 1
      },
      set(value) {
        this.currentPage = value
      },
    },
    concordanceOptions() {
      let options = [
        { value: null, text: "all concordances" },
      ]

      for (let item of this.concordanceTableItems) {
        let text = `${item.from} to ${item.to} (${item.description})`
        options.push({
          value: item.concordance.uri,
          text,
        })
      }

      return options
    },
    concordanceTableFields() {
      return [
        {
          key: "from",
          label: "from",
          width: "13%",
          minWidth: "",
          sortable: true,
          align: "left",
          titleClass: "test",
        },
        {
          key: "to",
          label: "to",
          width: "9%",
          minWidth: "",
          sortable: true,
          align: "left",
        },
        {
          key: "description",
          label: "description",
          width: "24%",
          minWidth: "",
          sortable: true,
          align: "left",
        },
        {
          key: "creator",
          label: "creator",
          width: "16%",
          minWidth: "",
          sortable: true,
          align: "left",
        },
        {
          key: "date",
          label: "date",
          titleClass: "d-none d-md-inline",
          width: "10%",
          minWidth: "",
          sortable: true,
          align: "left",
        },
        {
          key: "download",
          label: "download",
          titleClass: "d-none d-lg-inline",
          width: "11%",
          minWidth: "",
          sortable: false,
          align: "left",
        },
        {
          key: "mappings",
          label: "mappings",
          titleClass: "d-none d-lg-inline",
          width: "13%",
          minWidth: "",
          sortable: true,
          align: "right",
          compare: (a, b) => (parseInt(a.mappings) || 0) - (parseInt(b.mappings) || 0),
        },
        {
          key: "actions",
          label: "",
          width: "4%",
          sortable: false,
          align: "right",
        },
      ]
    },
    concordanceTableItems() {
      let items = []
      for (let concordance of this.concordances) {
        let item = { concordance }
        item.from = this.$util.notation(_.get(concordance, "fromScheme")) || "-"
        item.to = this.$util.notation(_.get(concordance, "toScheme")) || "-"
        item.description = (this.$util.lmContent(concordance, "scopeNote") || [])[0] || "-"
        item.creator = this.$util.prefLabel(_.get(concordance, "creator[0]"), null, false) || "-"
        item.date = _.get(concordance, "modified") || _.get(concordance, "created") || ""
        item.download = _.get(concordance, "distributions", [])
        item.mappings = _.get(concordance, "extent")
        if (item.from.toLowerCase().startsWith(this.filter.from.toLowerCase()) && item.to.toLowerCase().startsWith(this.filter.to.toLowerCase()) && item.creator.toLowerCase().startsWith(this.filter.creator.toLowerCase())) {
          items.push(item)
        }
      }
      return items
    },
    concordancesUrl() {
      // TODO: Fix URLs in config file.
      let url = this.config.mappingProviders[0].status.replace("/status", "/concordances")
      return url
    },
    configLoaded() {
      return this.$store.state.configLoaded
    },
  },
  watch: {
    mappingSchemes() {
      if (this.mappingSchemes) {
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
    mappings() {
      for (let mapping of this.mappings) {
        let concepts = this.$jskos.conceptsOfMapping(mapping)
        for (let concept of concepts) {
          if (!concept.__DETAILSLOADED__ && concept._getDetails) {
            this.loadDetails(concept)
          }
        }
      }
    },
    showLabels() {
      this.saveToParameters()
    },
  },
  created() {
    // Set loading to true if mappingSchemes are not loaded yet.
    if (!this.mappingSchemes) {
      this.loading = true
    }
    // Load config and settings on first launch.
    this.$store.dispatch("loadConfig", _.get(this.$route, "query.config")).then(() => this.$store.dispatch("settings/load")).then(() => {
      // Load all schemes first before loading anything else
      this.loadSchemes().then(() => {
        // Load mapping mappingSchemes from API.
        axios.get(this.config.mappingProviders[0].status.replace("/status", "/voc")).then(({ data }) => {
          this.mappingSchemes = data
        }).catch(error => {
          console.warn("Error fetching mapping schemes:", error)
          this.mappingSchemes = []
        })
        // Load concordances from API.
        axios.get(this.concordancesUrl).then(({ data }) => {
          this.concordances = data
        }).catch(error => {
          console.warn("Error fetching mapping schemes:", error)
          this.concordances = []
        }).then(() => {
          // If there are no concordances, jump to second tab.
          if (this.concordances.length == 0 && this.tab == 0) {
            this.tab = 1
          }
        })
        // Load from parameters on popstate (when using the browser's forward and backward buttons).
        window.addEventListener("popstate", () => {
          this.loadFromParameters()
        })
      })
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
      query.tab = this.tab
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
      this.creator_ = ""
      this.type = null
      this.concordance = null
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
      }, 150)
      // Parameters
      let
        from = this.sourceNotation,
        to = this.targetNotation,
        fromScheme = _.get(this.fromScheme, "uri", ""),
        toScheme = _.get(this.toScheme, "uri", ""),
        creator = this.creator_,
        type = this.type || "",
        partOf = this.concordance || "",
        enc = encodeURIComponent
      // Set download URL
      let baseUrl = this.config.mappingProviders[0].status.replace("/status", "/")
      this.downloadUrl = `${baseUrl}?from=${enc(from)}&to=${enc(to)}&fromScheme=${enc(fromScheme)}&toScheme=${enc(toScheme)}&creator=${enc(creator)}&partOf=${enc(partOf)}&type=${enc(type)}&download=`
      // Find fromScheme/toScheme in schemes. FIXME: Use local suggest when typing!
      axios.get(baseUrl + "mappings", {
        params: {
          from, to, fromScheme, toScheme, type, creator, partOf,
          limit: 10,
          offset: (this.page - 1) * 10,
        },
      }).then(({ data, headers }) => {
        if (this.loadingId == loadingId) {
          for (let mapping of data || []) {
            this.adjustMapping(mapping)
          }
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
      if (name == "open" || name == "feedback") {
        let
          fromScheme = item.mapping.fromScheme.uri,
          toScheme = item.mapping.toScheme.uri,
          uri = item.mapping.uri,
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
        if (fromScheme && toScheme && (uri || identifier)) {
          let cocodaUrl = `${this.config.cocodaBaseUrl || "./"}?mapping={}&${uri ? "mappingUri" : "mappingIdentifier"}=${encodeURIComponent(uri || identifier)}&fromScheme=${encodeURIComponent(fromScheme)}&toScheme=${encodeURIComponent(toScheme)}&from=${encodeURIComponent(concepts.from)}&to=${encodeURIComponent(concepts.to)}`
          if (name == "open") {
            window.open(cocodaUrl)
          } else {
            if (cocodaUrl.startsWith("./")) {
              cocodaUrl = cocodaUrl.replace("./", location.href.substring(0, location.href.indexOf("mappings.html")))
            }
            let emailBody = `Hello,\n\nI'd like to give feedback regarding the following mapping:\n\n${cocodaUrl}\n\n`
            emailBody = encodeURIComponent(emailBody)
            window.open(`mailto:coli-conc@gbv.de?subject=Cocoda Mapping Feedback&body=${emailBody}`, "_self")
          }
        } else {
          this.alert("Mapping could not be opened in Cocoda.", null, "danger")
        }
      }
    },
    showMappingsForConcordance(concordance) {
      // Change tab to mappings.
      this.tab = 1
      // Clear all other search parameters.
      this.clear()
      // Change concordance.
      this.concordance = concordance.uri
      // Search.
      this.currentPage = 1
      this.searchClicked()
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

<style lang="less" scoped>
@import "./style/z-index.less";
@import "./style/colors.less";
@import "./style/text-styles.less";

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-width: 600px;
  max-width: 1400px;
  padding: 20px 20px;
  position: relative;
}

#app .search {
  margin-top: 10px;
}
#app .search > .row {
  margin-top: 5px;
}
#app .label {
  height: 38px;
  line-height: 38px;
  font-weight: bold;
  text-align: right;
}
#app .mappingTable {
  margin-top: 15px;
  padding-bottom: 10px;
}

#app .alertsContainer {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translate(-50%, 0);
  z-index: @zIndex-8;
  width: 600px;
}

#app .button {
  cursor: pointer;
  user-select: none;
  color: @color-button;
}
#app .button:hover {
  color: @color-button-hover;
}
#app .button-disabled {
  user-select: none;
  color: @color-button-disabled;
}
</style>

<style>
#app .mappingTable .flexibleTable-body {
  padding-bottom: 20px;
}
#app .mappingTable-short .flexibleTable-body {
  padding-bottom: 40px !important;
}
</style>
