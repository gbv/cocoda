<template>
  <div
    id="concordanceApp"
    class="font-default">
    <div class="alertsContainer">
      <b-alert
        v-for="(alert, index) in $store.state.alerts.alerts"
        :key="index"
        :variant="alert.variant"
        :show="alert.countdown || !alert.shouldCountdown"
        :dismissible="!alert.shouldCountdown"
        fade
        style="display: flex;"
        @dismissed="$store.commit({ type: 'alerts/setCountdown', alert, countdown: 0 })"
        @dismiss-count-down="$store.commit({ type: 'alerts/setCountdown', alert, countdown: $event })">
        <div
          style="flex: 1;"
          v-html="alert.text" />
        <div
          v-if="alert.buttonText"
          class="fontWeight-heavy">
          <a
            href=""
            @click.prevent="alert.buttonHandler(alert, $event)"
            v-html="alert.buttonText" />
        </div>
      </b-alert>
    </div>
    <!-- Full screen loading indicator -->
    <loading-indicator-full v-if="loadingGlobal || loading" />
    <template v-if="loaded">
      <the-navbar
        ref="navbar"
        title="Concordances"
        :reduced="true" />
      <!-- Main -->
      <div
        class="main">
        <div class="flexbox-row">
          <!-- Mapping tools and occurrences browser -->
          <div
            id="mappingTool"
            class="mappingTool order3">
            <div
              id="mappingBrowserComponent"
              class="mappingToolItem mainComponent visualComponent">
              <!-- MappingBrowser -->
              <mapping-browser
                ref="mappingBrowser"
                :show-navigator="false"
                :show-editing-tools="false"
                :show-registry-override="['http://coli-conc.gbv.de/registry/coli-conc-mappings']"
                :show-cocoda-link="true" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import TheNavbar from "./components/TheNavbar.vue"
import MappingBrowser from "./components/MappingBrowser.vue"
import _ from "lodash"
import LoadingIndicatorFull from "./components/LoadingIndicatorFull.vue"
import { refreshRouter } from "./store/plugins.js"

// Import mixins
import auth from "./mixins/auth.js"
import objects from "./mixins/cdk.js"
import computed from "./mixins/computed.js"

// Use css-element-queries (https://github.com/marcj/css-element-queries) to be able to specify CSS element queries like .someClass[min-width~="800px"]. Used mainly in MappingBrowser.
import { ElementQueries } from "css-element-queries"
ElementQueries.listen()

/**
 * The main application.
 */
export default {
  name: "ConcordanceApp",
  components: {
    TheNavbar, MappingBrowser, LoadingIndicatorFull,
  },
  mixins: [auth, objects, computed],
  data () {
    return {
      loaded: false,
      loading: false,
      loadFromParametersOnce: _.once(this.loadFromParameters),
    }
  },
  computed: {
    locale() {
      return this.$i18n.locale
    },
    settingsLocale() {
      // Hardcode English for now because there are no settings in which to change the language
      return "en"
    },
  },
  watch: {
    /**
     * Watches i18n locale (changed by user). Every change will be stored in settings.
     */
    locale(newValue, oldValue) {
      if (newValue != oldValue) {
        this.$store.commit({
          type: "settings/set",
          prop: "locale",
          value: newValue,
        })
        // Also re-insert prefLabels after delay
        _.delay(() => {
          this.insertPrefLabel(true)
          this.insertPrefLabel(false)
        }, 300)
      }
    },
    /**
     * Watches settings locale (changed usually only after settings were loaded).
     * Every change will be set as i18n locale.
     */
    settingsLocale(newValue) {
      if (newValue != this.locale) {
        this.$i18n.locale = newValue
      }
    },
  },
  created() {
    // Load application
    this.load()
  },
  methods: {
    async load() {
      const time = new Date()
      this.loadingGlobal = true
      // Load config
      await this.$store.dispatch("loadConfig", _.get(this.$route, "query.config"))
      // Load settings
      await this.$store.dispatch("settings/load")
      // Set page title
      document.title = this.config.title
      // Set locale
      this.$i18n.locale = this.settingsLocale
      // Load schemes
      await this.loadSchemes()
      // Application is now considered loaded
      this.loaded = true
      this.loadingGlobal = false
      // Load from parameters
      // TODO: Should this be finished before loaded is set?
      this.loadFromParametersOnce(true)
      // Set schemes in registries to objects from Cocoda
      for (let registry of this.config.registries) {
        if (_.isArray(registry.schemes)) {
          registry._jskos.schemes = registry.schemes.map(scheme => this.schemes.find(s => this.$jskos.compare(s, scheme)) || scheme)
        }
      }
      this.$log.log(`Application loaded in ${((new Date()) - time)/1000} seconds.`)
    },
    loadFromParameters(firstLoad = false) {
      this.loading = true

      // Check route to see if navigation is necessary
      let query = this.$route.query

      let promises = []

      // Set query.from/to/Scheme from mapping if not set
      let mapping
      try {
        mapping = JSON.parse(query["mapping"])
      } catch(error) {
        mapping = null
      }
      if (mapping && firstLoad) {
        for (let fromTo of ["from", "to"]) {
          // Check if fromScheme was not set
          if (!query[fromTo + "Scheme"]) {
            query[fromTo + "Scheme"] = _.get(mapping[fromTo + "Scheme"], "uri")
            // If concept in mapping is available, set that too
            if (this.$jskos.conceptsOfMapping(mapping, fromTo).length) {
              query[fromTo] = _.get(this.$jskos.conceptsOfMapping(mapping, fromTo), "[0].uri")
            }
          }
        }
      }

      // Prepare application by selecting mapping from URL parameters.
      if (query.mapping || query.mappingUri) {
        let decodeMapping = new Promise(resolve => {
          let mappingFromQuery = null
          try {
            mappingFromQuery = this.$jskos.normalize(JSON.parse(query["mapping"]))
          } catch(error) {
            // do nothing
          }
          if (_.isEqual(mappingFromQuery, {})) {
            resolve(null)
          } else {
            resolve(mappingFromQuery)
          }
        })
        let loadMapping = (query.mappingUri ? this.getMapping({ uri: query.mappingUri }) : (query.mappingIdentifier ? this.getMappings({ identifier: query.mappingIdentifier }) : Promise.resolve([]))).then(mappings => {
          if (!_.isArray(mappings)) {
            mappings = [mappings].filter(m => m)
          }
          if ((query.mappingUri || query.mappingIdentifier) && mappings.length) {
            // Found original mapping.
            // Prefer local mapping over other mappings.
            let original = mappings.find(mapping => _.get(mapping, "_registry").isAuthorizedFor && _.get(mapping, "_registry").isAuthorizedFor({
              type: "mappings",
              action: "create",
              user: this.user,
            })) || mappings[0]
            return decodeMapping.then(this.adjustMapping).then(mapping => {
              if (mapping) {
                return [mapping, original]
              } else {
                return [original, original]
              }
            })
          } else {
            return decodeMapping.then(this.adjustMapping).then(mapping => [mapping])
          }
        })
        let directions = ["from", "to"]
        let memberFields = ["memberSet", "memberList", "memberChoice"]
        promises.push(loadMapping.then(( [mappingFromQuery, original = null] ) => {
          let promises = []
          for (let direction of directions) {
            // Get scheme
            let scheme = mappingFromQuery[`${direction}Scheme`]
            for (let memberField of memberFields) {
              if (!Array.isArray(mappingFromQuery[direction][memberField])) continue
              // Load data for each concept in mapping
              _.forEach(mappingFromQuery[direction][memberField], (concept, index) => {
                promises.push(this.loadConcepts([concept], { scheme }).then(([concept]) => {
                  mappingFromQuery[direction][memberField][index] = concept
                }))
              })
            }
          }
          return Promise.all(promises).then(() => {
            this.$store.commit({
              type: "mapping/set",
              mapping: mappingFromQuery,
              original,
              noQueryRefresh: true,
            })
          })
        }))
      }

      Promise.all(promises).then(() => {
        this.loading = false
        refreshRouter(this.$store)
        if (firstLoad) {
          // Search share link
          if (query.search) {
            let filter = JSON.parse(query.search)
            this.searchMappings(filter)
          } else {
            this.showConcordances()
          }
        }
      }).catch((error) => {
        this.loading = false
        this.$log.warn(error)
        this.alert("There was an error loading data from URL.", null, "danger")
      })
    },
    searchMappings(filter) {
      let mappingBrowser = this.$refs.mappingBrowser
      if (mappingBrowser && mappingBrowser.searchWithParams) {
        mappingBrowser.searchWithParams(filter)
      }
    },
    showMappingSearch() {
      this.forceMappingBrowser = true
      this.searchMappings({})
    },
    showConcordances() {
      let mappingBrowser = this.$refs.mappingBrowser
      if (!mappingBrowser) {
        this.$log.warn("Could not show concordances because MappingBrowser component was not found.")
        return
      }
      if (mappingBrowser.concordancesLoaded) {
        if (mappingBrowser.tabIndexes.concordances != null) {
          this.forceMappingBrowser = true
          mappingBrowser.tab = mappingBrowser.tabIndexes.concordances
        }
      } else {
        // Add watcher to concordancesLoaded
        this.loadingGlobal = true
        let unwatch
        unwatch = this.$watch(
          () => mappingBrowser.concordancesLoaded,
          () => {
            this.loadingGlobal = false
            if (mappingBrowser.tabIndexes.concordances != null) {
              this.forceMappingBrowser = true
              mappingBrowser.tab = mappingBrowser.tabIndexes.concordances
            }
            // Remove watcher
            unwatch && unwatch()
          },
        )
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
#concordanceApp {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  min-width: 1220px;
  min-height: 640px;
}
.main {
  flex: 1;
  position: relative;
  background-color: @color-primary-5;
}
.flexbox-row {
  display: flex;
  position: absolute;
  top: 6px;
  bottom: 5px;
  left: 4px;
  right: 4px;
  margin: auto auto;
}

.browser {
  width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 315px;
}
.conceptBrowser {
  height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.conceptBrowserItem {
  height: 0;
  flex: 1;
  min-height: 200px;
}
.conceptBrowserItemDetail {
  flex: 4;
}
.conceptBrowserItemList {
  flex: 6;
}

.mappingTool {
  width: 0;
  flex: 2;
  display: flex;
  flex-direction: column;
  min-width: 540px;
}
.mappingToolItem {
  height: 0;
  min-height: 165px;
}
.mappingToolItem > div:first-child {
  height: 100%;
}
#mappingEditorComponent {
  flex: 1
}
#mappingBrowserComponent {
  flex: 2;
  min-height: 220px;
}

.placeholderComponent {
  text-align: left;
  padding: 40px 20px 40px 30px;
}
.placeholderComponentCenter > div {
  text-align: center;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
}

.alertsContainer {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translate(-50%, 0);
  z-index: @zIndex-8;
  width: 600px;
}

#swapSides {
  position: absolute;
  text-align: center;
  font-size: 20px;
  top: 6px;
  width: 50px;
  left: 0;
  right: 0;
  margin: 0 auto;
  cursor: pointer;
  user-select: none;
  color: @color-button;
}
#swapSides:hover {
  color: @color-button-hover;
}

.alert-success2 {
  color: @color-alert-success;
  background-color: @color-alert-success-background;
}

.tooltip {
  pointer-events: none !important;
}
// Override border color for all cocoda-vue-tabs
.cocoda-vue-tabs-header-item.cocoda-vue-tabs-header-item-active {
  border-bottom-color: @color-primary-0 !important;
  background-color: @color-background-heading !important;
}
// Override font-size for all cocoda-vue-tabs
.cocoda-vue-tabs-sm {
  font-size: 0.8rem !important;
}
.cocoda-vue-tabs-md {
  font-size: 0.9rem !important;
}
.cocoda-vue-tabs-lg {
  font-size: 1.1rem !important;
}
</style>
