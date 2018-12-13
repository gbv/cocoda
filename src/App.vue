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
    <the-navbar />
    <!-- Swap sides button -->
    <div
      v-b-tooltip.hover="{ title: $t('general.swapSides'), delay: $util.delay.medium }"
      v-show="selected.scheme[true] || selected.scheme[false]"
      id="swapSides"
      @click="swapSides" >
      <font-awesome-icon icon="exchange-alt" />
    </div>
    <!-- Main -->
    <div class="main">
      <div class="flexbox-row">
        <!-- Full screen loading indicator -->
        <loading-indicator-full v-if="loading" />

        <!-- Concept components left side -->
        <div
          v-for="(isLeft, index) in [true, false]"
          :key="'browser-'+index"
          :class="{
            order1: isLeft,
            order5: !isLeft
          }"
          :id="'browserComponent_' + isLeft"
          class="browser mainComponent" >
          <minimizer :is-column="true" />
          <!-- Concept scheme selection -->
          <div class="schemeSelectWrapper">
            <b-form-select
              :value="selected.scheme[isLeft]"
              :options="schemeOptions"
              class="schemeSelect fontWeight-heavy"
              @change="$router.push({ path: getRouterUrl($event, isLeft) })" />
            <div
              v-b-tooltip.hover="{ title: $t('general.showSchemeInfo'), delay: $util.delay.medium }"
              v-show="selected.scheme[isLeft] != null && selected.concept[isLeft] != null"
              class="button schemeSelectInfo"
              @click="$router.push({ path: getRouterUrl(selected.scheme[isLeft], isLeft) })" >
              <font-awesome-icon icon="info-circle" />
            </div>
            <div
              v-b-tooltip.hover="{ title: $t('general.clearScheme'), delay: $util.delay.medium }"
              v-show="selected.scheme[isLeft] != null"
              class="button schemeSelectInfo"
              @click="$router.push({ path: getRouterUrl(null, isLeft) })" >
              <font-awesome-icon icon="times-circle" />
            </div>
          </div>
          <!-- Concept and concept scheme quick selection -->
          <div
            v-show="selected.scheme[isLeft] == null"
            class="visualComponent placeholderComponent scrollable" >
            <p
              v-if="favoriteSchemes && favoriteSchemes.length"
              class="fontWeight-heavy" >
              {{ $t("schemeSelection.schemeQuick") }}
            </p>
            <p
              v-for="scheme in favoriteSchemes"
              :key="scheme.uri"
              class="quickSelectionItem" >
              <item-name
                :item="scheme"
                :is-link="true"
                :is-left="isLeft"
              />
            </p>
            <br>
            <p
              v-if="config.favoriteConcepts && config.favoriteConcepts.length"
              class="fontWeight-heavy" >
              {{ $t("schemeSelection.conceptQuick") }}
            </p>
            <p
              v-for="concept in config.favoriteConcepts"
              :key="concept.uri"
              class="quickSelectionItem" >
              <item-name
                :item="concept"
                :is-link="true"
                :is-left="isLeft"
              />
            </p>
          </div>
          <!-- ConceptSearch -->
          <concept-search
            v-if="selected.scheme[isLeft] != null"
            :ref="isLeft ? 'conceptSearchLeft' : 'conceptSearchRight'"
            :is-left="isLeft"
            :scheme="selected.scheme[isLeft]"
            class="conceptSearch"
          />
          <!-- ItemDetail and ConceptTree -->
          <div
            v-if="selected.scheme[isLeft] != null"
            class="conceptBrowser">
            <!-- ItemDetail -->
            <item-detail
              :item="selected.concept[isLeft] || selected.scheme[isLeft]"
              :is-left="isLeft"
              :settings="itemDetailSettings[isLeft ? 'left' : 'right']"
              :id="'itemDetailComponent_' + isLeft"
              class="mainComponent visualComponent conceptBrowserItem conceptBrowserItemDetail"
            />
            <!-- Slider -->
            <resizing-slider />
            <!-- ConceptTree -->
            <concept-tree
              :ref="isLeft ? 'conceptTreeLeft' : 'conceptTreeRight'"
              :is-left="isLeft"
              :id="'conceptTreeComponent_' + isLeft"
              class="mainComponent visualComponent conceptBrowserItem conceptBrowserItemTree"
            />
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
              v-if="selected.scheme[true] || selected.scheme[false]"
            />
            <!-- Placeholder -->
            <!-- ... -->
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
            <mapping-browser
              v-if="selected.scheme[true] || selected.scheme[false]"
            />
            <!-- Placeholder -->
            <div
              v-else
              class="placeholderComponentCenter" >
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
import ConceptSearch from "./components/ConceptSearch"
import ResizingSlider from "./components/ResizingSlider"
import ItemName from "./components/ItemName"
import _ from "lodash"
import LoadingIndicatorFull from "./components/LoadingIndicatorFull"
import Minimizer from "./components/Minimizer"
import { refreshRouter } from "./store/plugins"

// Use css-element-queries (https://github.com/marcj/css-element-queries) to be able to specify CSS element queries like .someClass[min-width~="800px"]. Used mainly in MappingBrowser.
const ElementQueries = require("css-element-queries/src/ElementQueries")
ElementQueries.listen()

/**
 * The main application.
 */
export default {
  name: "App",
  components: {
    TheNavbar, ConceptTree, ItemDetail, ConceptSearch, MappingEditor, MappingBrowser, ResizingSlider, ItemName, LoadingIndicatorFull, Minimizer
  },
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
    /**
     * Generates the options for the select element.
     */
    schemeOptions: function() {
      let options = [
        { value: null, text: this.$t("schemeSelection.title"), disabled: true }
      ]
      // Add from schemes
      for (var scheme of this.$store.state.schemes) {
        options.push(
          { value: scheme, text: this.$util.prefLabel(scheme) }
        )
      }
      return options
    },
    favoriteSchemes() {
      let schemes = []
      for (let uri of this.config.favoriteTerminologyProviders) {
        let scheme = this.$store.getters["objects/get"]({ uri })
        if (scheme && !this.$jskos.isContainedIn(scheme, schemes)) {
          schemes.push(scheme)
        }
      }
      // This does nothing except for triggering a refresh for this computed property when the list of schemes has changed.
      this.schemes
      return schemes
    },
    schemes() {
      return this.$store.state.schemes
    },
    // Needed to watch for changes in the left concept.
    selectedConceptLeft() {
      return this.selected.concept[true]
    },
    selectedSchemeRight() {
      return this.selected.scheme[false]
    },
    locale() {
      return this.$i18n.locale
    },
    settingsLocale() {
      return this.$settings.locale
    },
  },
  watch: {
    schemes() {
      if (this.schemes.length) {
        this.loadFromParametersOnce()
      }
      // Load favorite concepts into Vuex
      for (let concept of this.config.favoriteConcepts) {
        this.$store.dispatch({
          type: "objects/load",
          object: concept
        })
      }
    },
    $route({ query: toQuery }, { query: fromQuery }) {
      // Only refresh when one of the scheme/concept parameters changed
      let parameters = ["from", "fromScheme", "to", "toScheme"]
      let refresh = false
      for (let param of parameters) {
        // Try to get objects for both URIs
        let uri1 = fromQuery[param],
          uri2 = toQuery[param],
          object1 = this.$store.getters["objects/get"]({ uri: uri1 }),
          object2 = this.$store.getters["objects/get"]({ uri: uri2 })
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
        this.insertPrefLabel()
      },
      deep: true
    },
    /**
     * Insert prefLabel into target search field if the scheme on the right changes.
     */
    selectedSchemeRight(newValue, oldValue) {
      if (!this.$jskos.compare(newValue, oldValue)) {
        _.delay(() => {
          this.insertPrefLabel()
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
    // Set loading to true if schemes are not loaded yet.
    if (!this.schemes.length) {
      this.loading = true
    }
    document.onmousemove = event => {
      this.$store.commit({
        type: "setMousePosition",
        x: event.pageX,
        y: event.pageY
      })
    }
  },
  methods: {
    insertPrefLabel() {
      let prefLabel = this.$util.prefLabel(this.selectedConceptLeft, null, false)
      // Adjust prefLabel by removing everything from the first non-whitespace, non-letter character.
      let regexResult = /^[\s\wäüöÄÜÖß]*\w/.exec(prefLabel)
      if (this.$refs.conceptSearchRight && this.$refs.conceptSearchRight.length) {
        this.$refs.conceptSearchRight[0].setSearchQuery(regexResult ? regexResult[0] : "")
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
    },
    loadFromParameters() {
      this.loading = true

      // Check route to see if navigation is necessary
      let query = this.$route.query

      let promises = []

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
        promises.push(this.setSelected({
          concept: selected.concept[isLeft] ? { uri: selected.concept[isLeft] } : null,
          scheme: selected.scheme[isLeft] ? { uri: selected.scheme[isLeft] } : null,
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
        let loadMapping = (query["identifier"] ? this.$store.dispatch({ type: "mapping/getMappings", identifier: query["identifier"] }) : Promise.resolve([])).then(mappings => {
          if (query["identifier"] && mappings.length) {
            // Found original mapping.
            // Prefer local mapping over other mappings.
            // TODO: There needs to be a completely unique identifier for this.
            let original = mappings.find(mapping => mapping.LOCAL) || mappings[0]
            return decodeMapping.then(mapping => {
              if (mapping) {
                return [mapping, original]
              } else {
                return [original, original]
              }
            })
          } else {
            return decodeMapping.then(mapping => [mapping])
          }
        })
        let directions = ["from", "to"]
        let memberFields = ["memberSet", "memberList", "memberChoice"]
        promises.push(loadMapping.then(( [mappingFromQuery, original = null] ) => {
          let promises = []
          for (let direction of directions) {
            // Get scheme from store
            let scheme = this.$store.getters["objects/get"](mappingFromQuery[`${direction}Scheme`])
            // TODO: - Should scheme be set in mapping object? Would possibly caused scheme URI to change.
            // mappingFromQuery[`${direction}Scheme`] = scheme
            // TODO: - Show error if scheme does not exist?
            for (let memberField of memberFields) {
              if (!Array.isArray(mappingFromQuery[direction][memberField])) continue
              // Load data for each concept in mapping
              _.forEach(mappingFromQuery[direction][memberField], (concept, index) => {
                promises.push(this.$store.dispatch({
                  type: "objects/load",
                  object: concept,
                  scheme: scheme
                }).then(concept => {
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
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  min-width: 1220px;
  min-height: 680px;
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
.schemeSelectWrapper {
  flex: none;
  padding: 3px;
  display: flex;
  margin-right: 24px;
}
.schemeSelect {
  .m-borderRadius(2px);
  border: 0 !important;
  box-shadow: 0 1px 2px 0 @color-shadow;
  color: @color-primary-4 !important;
  flex: 1;
}
.schemeSelect.form-control {
  .fontSize-normal;
}
.schemeSelectInfo {
  flex: none;
  display: flex;
  justify-content: center;
  align-content: center;
  flex-direction: column;
  margin-left: 10px;
}
.conceptSearch {
  margin: 5px 0 0 0;
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
.mappingToolItem > div {
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

.quickSelectionItem {
  padding-top: 15px;
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
  top: 16px;
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
</style>
