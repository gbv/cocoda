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
              @keyup.enter.native="search" />
          </b-col>
          <b-col cols="5">
            <b-form-input
              v-model="sourceNotation"
              type="text"
              placeholder="notation"
              @keyup.enter.native="search" />
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
              @keyup.enter.native="search" />
          </b-col>
          <b-col cols="5">
            <b-form-input
              v-model="targetNotation"
              type="text"
              placeholder="notation"
              @keyup.enter.native="search" />
          </b-col>
          <b-col cols="2" />
        </b-row>
        <b-row>
          <b-col
            cols="2"
            class="label"><!-- Creator --></b-col>
          <b-col cols="3">
            <!-- <b-form-input
              v-model="creator"
              disabled
              type="text"
              placeholder="creator"
              @keyup.enter.native="search" /> -->
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
              v-model="currentPage"
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
            <p>{{ totalCount }} results</p>
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
    </div>
  </div>
</template>

<script>
import axios from "axios"
import MappingTable from "./components/MappingTable"
import _ from "lodash"
import LoadingIndicatorFull from "./components/LoadingIndicatorFull"

/**
 * The main application.
 */
export default {
  name: "MappingsApp",
  components: {
    MappingTable, LoadingIndicatorFull
  },
  data () {
    return {
      loading: false,
      loadingId: null,
      schemes: null,
      currentPage: 1,
      downloadUrl: null,
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
      ]
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
  },
  watch: {
    schemes() {
      if (this.schemes) {
        this.loading = false
      } else {
        this.loading = true
      }
    },
    currentPage() {
      this.search()
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
  },
  methods: {
    clearClicked() {
      this.sourceNotation = ""
      this.sourceScheme = ""
      this.targetNotation = ""
      this.targetScheme = ""
      this.creator = ""
      this.type = null
      this.mappings = []
      this.totalCount = 0
      this.downloadUrl = null
    },
    swapClicked() {
      [this.sourceScheme, this.sourceNotation, this.targetScheme, this.targetNotation] = [this.targetScheme, this.targetNotation, this.sourceScheme, this.sourceNotation]
      this.searchClicked()
    },
    searchClicked() {
      this.currentPage = 1
      this.search()
    },
    search() {
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
        type = this.type || "",
        enc = encodeURIComponent
      // Set download URL
      let baseUrl = this.config.mappingProviders[0].url
      this.downloadUrl = `${baseUrl}?from=${enc(from)}&to=${enc(to)}&fromScheme=${enc(fromScheme)}&toScheme=${enc(toScheme)}&type=${enc(type)}&download=`
      // Find fromScheme/toScheme in schemes. FIXME: Use local suggest when typing!
      axios.get(baseUrl, {
        params: {
          from, to, fromScheme, toScheme, type,
          limit: 10,
          offset: (this.currentPage - 1) * 10,
        }
      }).then(({ data, headers }) => {
        if (this.loadingId == loadingId) {
          this.mappings = data
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
          identifier = item.mapping.identifier.find(id => id.startsWith("urn:jskos:mapping:content:"))
        if (fromScheme && toScheme && identifier) {
          window.open(`https://gbv.github.io/cocoda/dev/?mapping={}&identifier=${identifier}&fromScheme=${fromScheme}&toScheme=${toScheme}`)
        } else {
          this.alert("Mapping could not be opened in Cocoda.", null, "danger")
        }
      }
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
  margin-top: 30px;
  padding-bottom: 30px;
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
