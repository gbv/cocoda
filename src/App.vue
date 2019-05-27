<template>
  <div
    id="app"
    class="font-default text-dark color-primary-0-bg fontSize-normal">
    <div class="alertsContainer">
      <b-alert
        v-for="(alert, index) in $store.state.alerts.alerts"
        :key="index"
        :variant="alert.variant"
        :show="alert.countdown != 0 || !alert.shouldCountdown"
        :dismissible="!alert.shouldCountdown"
        fade
        @dismissed="$store.commit({ type: 'alerts/setCountdown', alert, countdown: 0 })"
        @dismiss-count-down="$store.commit({ type: 'alerts/setCountdown', alert, countdown: $event })">
        <span v-html="alert.text" />
      </b-alert>
    </div>
    <the-navbar v-if="configLoaded" />
    <!-- Swap sides button -->
    <div
      v-show="selected.scheme[true] || selected.scheme[false]"
      id="swapSides"
      v-b-tooltip.hover="{ title: $t('general.swapSides'), delay: $util.delay.medium }"
      @click="swapSides">
      <font-awesome-icon icon="exchange-alt" />
    </div>
    <!-- Main -->
    <!-- Full screen loading indicator -->
    <loading-indicator-full v-if="loadingGlobal || loading" />
    <div
      v-if="configLoaded && schemes.length"
      class="main">
      <div class="flexbox-row">
        <!-- Concept components left side -->
        <div
          v-for="(isLeft, index) in [true, false]"
          :id="'browserComponent_' + isLeft"
          :key="'browser-'+index"
          :class="{
            order1: isLeft,
            order5: !isLeft
          }"
          class="browser mainComponent">
          <minimizer :is-column="true" />
          <!-- Concept scheme selection -->
          <concept-scheme-selection
            :ref="isLeft ? 'conceptSchemeSelectionLeft' : 'conceptSchemeSelectionRight'"
            :is-left="isLeft"
            :style="selected.scheme[isLeft] != null ? '' : 'flex: 1;'"
            class="mainComponent visualComponent" />
          <!-- ItemDetail and ConceptTree -->
          <div
            v-if="selected.scheme[isLeft] != null"
            class="conceptBrowser">
            <!-- ItemDetail -->
            <item-detail
              :id="'itemDetailComponent_' + isLeft"
              :item="selected.concept[isLeft] || selected.scheme[isLeft]"
              :is-left="isLeft"
              :settings="itemDetailSettings[isLeft ? 'left' : 'right']"
              class="mainComponent visualComponent conceptBrowserItem conceptBrowserItemDetail" />
            <!-- Slider -->
            <resizing-slider />
            <!-- ConceptTree -->
            <concept-tree
              :id="'conceptTreeComponent_' + isLeft"
              :ref="isLeft ? 'conceptTreeLeft' : 'conceptTreeRight'"
              :is-left="isLeft"
              class="mainComponent visualComponent conceptBrowserItem conceptBrowserItemTree" />
          </div>
        </div>

        <!-- Slider -->
        <resizing-slider
          :is-column="true"
          class="order2" />

        <!-- Mapping tools and occurrences browser -->
        <div
          id="mappingTool"
          class="mappingTool order3">
          <div
            id="mappingEditorComponent"
            class="mappingToolItem mainComponent visualComponent">
            <!-- MappingEditor -->
            <mapping-editor
              v-if="selected.scheme[true] || selected.scheme[false]" />
            <!-- Placeholder -->
            <div
              v-else
              class="placeholderComponentCenter">
              <div class="fontWeight-heavy fontSize-large">
                <p>{{ $t("general.welcome") }}</p>
                <p>
                  <a
                    href="https://gbv.github.io/cocoda/#manual"
                    target="_blank">{{ $t("general.manual") }}</a> -
                  <a
                    href="https://gbv.github.io/cocoda/"
                    target="_blank">{{ $t("general.documentation") }}</a> -
                  <a
                    href="https://github.com/gbv/cocoda"
                    target="_blank">{{ $t("general.github") }}</a>
                </p>
                <p v-if="config.feedbackUrl">
                  <br>
                  <a
                    :href="config.feedbackUrl"
                    target="_blank">{{ $t("general.feedback") }}</a>
                  <br>
                  {{ $t("general.feedback2") }}
                </p>
              </div>
            </div>
            <!-- Minimizer allows component to get minimized -->
            <minimizer
              ref="minimizer"
              :text="$t('mappingEditor.title')" />
          </div>
          <!-- Slider -->
          <resizing-slider :cocoda-red="true" />
          <div
            id="mappingBrowserComponent"
            class="mappingToolItem mainComponent visualComponent">
            <!-- MappingBrowser -->
            <mapping-browser />
            <!-- Minimizer allows component to get minimized -->
            <minimizer :text="$t('mappingBrowser.title')" />
          </div>
        </div>

        <!-- Slider -->
        <resizing-slider
          :is-column="true"
          class="order4" />
      </div>
    </div>
  </div>
</template>

<script>
import TheNavbar from "./components/TheNavbar"
import MappingEditor from "./components/MappingEditor"
import MappingBrowser from "./components/MappingBrowser"
import ConceptTree from "./components/ConceptTree"
import ItemDetail from "./components/ItemDetail"
import ResizingSlider from "./components/ResizingSlider"
import _ from "lodash"
import axios from "axios"
import LoadingIndicatorFull from "./components/LoadingIndicatorFull"
import Minimizer from "./components/Minimizer"
import { refreshRouter } from "./store/plugins"
import ConceptSchemeSelection from "./components/ConceptSchemeSelection"

// Import mixins
import auth from "./mixins/auth"
import objects from "./mixins/objects"

// Use css-element-queries (https://github.com/marcj/css-element-queries) to be able to specify CSS element queries like .someClass[min-width~="800px"]. Used mainly in MappingBrowser.
const ElementQueries = require("css-element-queries/src/ElementQueries")
ElementQueries.listen()

/**
 * The main application.
 */
export default {
  name: "App",
  components: {
    TheNavbar, ConceptTree, ItemDetail, MappingEditor, MappingBrowser, ResizingSlider, LoadingIndicatorFull, Minimizer, ConceptSchemeSelection
  },
  mixins: [auth, objects],
  data () {
    return {
      loading: false,
      itemDetailSettings: {
        left: {
          showTopConceptsInScheme: false
        },
        right: {
          showTopConceptsInScheme: false
        }
      },
      loadFromParametersOnce: _.once(this.loadFromParameters),
    }
  },
  computed: {
    // Needed to watch for changes in the left concept.
    selectedConceptLeft() {
      return this.selected.concept[true]
    },
    selectedSchemeRight() {
      return this.selected.scheme[false]
    },
    selectedConceptRight() {
      return this.selected.concept[false]
    },
    selectedSchemeLeft() {
      return this.selected.scheme[true]
    },
    locale() {
      return this.$i18n.locale
    },
    settingsLocale() {
      let locale = this.$settings.locale
      // Only return valid lanugages, English as fallback.
      if (!(this.config.languages || []).includes(locale)) {
        locale = "en"
      }
      return locale
    },
    settingsLoaded() {
      return this.$store.state.settings.loaded
    },
    configLoaded() {
      return this.$store.state.configLoaded
    },
  },
  watch: {
    settingsLoaded() {
      this.$i18n.locale = this.settingsLocale
      this.start()
    },
    $route({ query: toQuery }, { query: fromQuery }) {
      // Only refresh when one of the scheme/concept parameters changed
      let parameters = ["from", "fromScheme", "to", "toScheme"]
      let refresh = false
      for (let param of parameters) {
        // Try to get objects for both URIs
        let uri1 = fromQuery[param],
          uri2 = toQuery[param],
          object1 = uri1 && this._getObject({ uri: uri1 }),
          object2 = uri2 && this._getObject({ uri: uri2 })
        // Compare objects if they exist to prevent unnecessary reloads.
        if (object1 && object2) {
          if (!this.$jskos.compare(object1, object2)) {
            refresh = true
          }
        // If at least one URI doesn't have an object, compare URIs directly.
        } else if (uri1 != uri2) {
          refresh = true
        }
      }
      if (refresh) {
        this.loadFromParameters()
      }
    },
    /**
     * This watches the selected concept on the left side and inserts its prefLabel into the search field on the right. This is a first step at helping the user find possible mapping matches from the target system.
     */
    selectedConceptLeft: {
      handler(newValue, oldValue) {
        if (_.isEqual(_.get(newValue, "prefLabel"), _.get(oldValue, "prefLabel"))) {
          return
        }
        this.insertPrefLabel(true)
      },
      deep: true
    },
    /**
     * Insert prefLabel into target search field if the scheme on the right changes.
     */
    selectedSchemeRight(newValue, oldValue) {
      if (!this.$jskos.compare(newValue, oldValue)) {
        _.delay(() => {
          this.insertPrefLabel(true)
        }, 50)
      }
    },
    /**
     * This watches the selected concept on the left side and inserts its prefLabel into the search field on the right. This is a first step at helping the user find possible mapping matches from the target system.
     */
    selectedConceptRight: {
      handler(newValue, oldValue) {
        if (_.isEqual(_.get(newValue, "prefLabel"), _.get(oldValue, "prefLabel"))) {
          return
        }
        this.insertPrefLabel(false)
      },
      deep: true
    },
    /**
     * Insert prefLabel into target search field if the scheme on the right changes.
     */
    selectedSchemeLeft(newValue, oldValue) {
      if (!this.$jskos.compare(newValue, oldValue)) {
        _.delay(() => {
          this.insertPrefLabel(false)
        }, 50)
      }
    },
    /**
     * Watches i18n locale (changed by user). Every change will be stored in settings.
     */
    locale(newValue, oldValue) {
      if (newValue != oldValue) {
        this.$store.commit({
          type: "settings/set",
          prop: "locale",
          value: newValue
        })
        // Also re-insert prefLabels after delay
        _.delay(() => {
          this.insertPrefLabel(true, false)
          this.insertPrefLabel(false, false)
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
    /**
     * Update local creator name if authorized user changed.
     */
    user(current, previous) {
      if (this.user) {
        if (this.user.name != this.userName) {
          this.$store.commit({
            type: "settings/set",
            prop: "creator",
            value: this.user.name
          })
        }
      }
      /**
       * Show alerts when user was logged in/out.
       */
      if (previous !== undefined && !previous && current) {
        // Logged in
        this.alert(this.$t("alerts.loggedIn"), null, "success")
      } else if (previous && !current) {
        // Logged out
        this.alert(this.$t("alerts.loggedOut"), null, "danger")
      }
    },
    /**
     * Make sure the local user URI is one of the associated URIs.
     */
    userUris() {
      if (this.userUris && this.userUris.length) {
        if (!this.userUris.includes(this.creator.uri)) {
          // Set creatorUri to first URI in list
          this.$store.commit({
            type: "settings/set",
            prop: "creatorUri",
            value: this.userUris[0]
          })
        }
      }
    },
    /**
     * Update authorized user's name if creator name changed.
     */
    userName() {
      if (this.authorized && this.user) {
        if (this.userName != this.user.name) {
          this.setName(this.userName).then(success => {
            if (!success) {
              // Reset name and show error
              this.$store.commit({
                type: "settings/set",
                prop: "creator",
                value: this.user.name
              })
              this.alert(this.$t("alerts.nameError"), null, "danger")
            }
          })
        }
      }
    },
  },
  created() {
    // Set loading to true if schemes are not loaded yet.
    if (!this.schemes.length) {
      this.loading = true
    }
    this.load()
    document.onmousemove = event => {
      this.$store.commit({
        type: "setMousePosition",
        x: event.pageX,
        y: event.pageY
      })
    }
    // Check for update every 60 seconds
    let updateMessageShown = false
    setInterval(() => {
      axios.get("./build-info.json", {
        headers: {
          "Cache-Control": "no-cache"
        }
      }).then(response => response.data).then(buildInfo => {
        if (buildInfo.gitCommit != this.config.buildInfo.gitCommit && !updateMessageShown) {
          this.alert(`${this.$t("alerts.newVersionText")} <a href="" class="alert-link">${this.$t("alerts.newVersionLink")}</a>`, 0, "info")
          updateMessageShown = true
        }
      }).catch(() => null)
    }, 60000)
  },
  methods: {
    load() {
      // Load config and settings on first launch.
      this.$store.dispatch("loadConfig", _.get(this.$route, "query.config")).then(() => this.$store.dispatch("settings/load")).then(() => {
        if (this.config.auth) {
          this.$store.dispatch("auth/init", this.config.auth)
        }
      })
    },
    /**
     * Properly start the application (called by settingsLoaded watcher).
     */
    start() {
      // Load schemes
      this.loadSchemes().then(() => {
        this.loadFromParametersOnce(true)
      })
    },
    insertPrefLabel(isLeft, both = true) {
      if (!this.$settings.autoInsertLabels) {
        return
      }
      let prefLabel = this.$util.prefLabel(this.selected.concept[isLeft], null, false)
      // Adjust prefLabel by removing everything from the first non-whitespace, non-letter character.
      let regexResult = /^[\s\wäüöÄÜÖß]*\w/.exec(prefLabel)
      // Insert on the left AND the right
      let sides = both ? [true, false] : [isLeft]
      for (let isLeft of sides) {
        let conceptSchemeSelection = _.get(this, `$refs.conceptSchemeSelection${isLeft ? "Left" : "Right"}[0]`)
        if (conceptSchemeSelection) {
          conceptSchemeSelection.setConceptSearchQuery(regexResult ? regexResult[0] : "")
        }
      }
    },
    refresh(key) {
      if (key == "minimize") {
        // Minimizer causes a refresh, therefore recheck item detail settings
        this.itemDetailSettings.left.showTopConceptsInScheme = this.conceptTreeLeft() != null && this.conceptTreeLeft().$el.dataset.minimized == "1"
        this.itemDetailSettings.right.showTopConceptsInScheme = this.conceptTreeRight() != null && this.conceptTreeRight().$el.dataset.minimized == "1"
      }
    },
    // Using ref in v-for results in an array as well as refreshing ItemDetail settings.
    conceptTreeLeft() {
      return Array.isArray(this.$refs.conceptTreeLeft) ? this.$refs.conceptTreeLeft[0] : this.$refs.conceptTreeLeft
    },
    conceptTreeRight() {
      return Array.isArray(this.$refs.conceptTreeRight) ? this.$refs.conceptTreeRight[0] : this.$refs.conceptTreeRight
    },
    swapSides() {
      let query = this.$route.query
      query = Object.assign(query, { from: query.to, fromScheme: query.toScheme, to: query.from, toScheme: query.fromScheme })
      // Question: Reverse mapping or not? (see also: issue #158)
      this.$router.push({ query })
      this.loadFromParameters()
      // Also re-insert prefLabels after delay
      _.delay(() => {
        this.insertPrefLabel(true, false)
        this.insertPrefLabel(false, false)
      }, 300)
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

      // Prepare application by selecting schemes and concepts from URL parameters.
      let selected = {
        scheme: {
          true: query.fromScheme,
          false: query.toScheme
        },
        concept: {
          true: query.from,
          false: query.to
        }
      }

      for (let isLeft of [true, false]) {
        // Get from store
        let schemeUri = selected.scheme[isLeft]
        let scheme = null
        if (schemeUri) {
          scheme = this._getObject({ uri: schemeUri })
        }
        let concept = null
        if (scheme && selected.concept[isLeft]) {
          concept = this.saveObject({ uri: selected.concept[isLeft] }, { scheme, type: "concept" })
        }

        promises.push(this.setSelected({
          concept,
          scheme,
          isLeft,
          noQueryRefresh: true,
        }))
      }
      // Prepare application by selecting mapping from URL parameters.
      if (query["mapping"]) {
        let decodeMapping = new Promise(resolve => {
          let mappingFromQuery = null
          try {
            mappingFromQuery = JSON.parse(query["mapping"])
          } catch(error) {
            // do nothing
          }
          if (_.isEqual(mappingFromQuery, {})) {
            resolve(null)
          } else {
            resolve(mappingFromQuery)
          }
        })
        let loadMapping = (query["identifier"] ? this.getMappings({ identifier: query["identifier"] }) : Promise.resolve([])).then(mappings => {
          if (query["identifier"] && mappings.length) {
            // Found original mapping.
            // Prefer local mapping over other mappings.
            // TODO: There needs to be a completely unique identifier for this.
            let original = mappings.find(mapping => _.get(mapping, "_provider.has.canSaveMappings")) || mappings[0]
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
                promises.push(this.loadDetails(concept, { scheme }).then(concept => {
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
              noQueryRefresh: true
            })
          })
        }))
      }

      if (promises.length) {
        Promise.all(promises).then(() => {
          this.loading = false
          refreshRouter(this.$store)
        }).catch((error) => {
          this.loading = false
          console.warn(error)
          this.alert("There was an error loading data from URL.", null, "danger")
        })
      } else {
        this.loading = false
      }
    }
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
.conceptBrowserItemTree {
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
}
#occurrencesBrowserComponent {
  flex: 2;
}
#mappingBrowserComponent {
  flex: 2;
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
</style>
