<template>
  <div
    id="app"
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
        ref="navbar" />
      <!-- Swap sides button -->
      <div
        v-show="selected.scheme[true] || selected.scheme[false]"
        id="swapSides"
        v-b-tooltip.hover="{ title: $t('general.swapSides'), delay: defaults.delay.medium }"
        @click="swapSides">
        <font-awesome-icon icon="exchange-alt" />
      </div>
      <!-- Main -->
      <div
        class="main">
        <div
          v-if="config.error"
          class="flexbox-row configError fontSize-large">
          <div v-html="$t(`general.${config.error}`, config)" />
        </div>
        <div
          v-else-if="schemes.length"
          class="flexbox-row">
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
            <minimizer
              :name="`browserComponent_${isLeft}`"
              :is-column="true" />
            <!-- Concept scheme selection -->
            <concept-scheme-selection
              :ref="isLeft ? 'conceptSchemeSelectionLeft' : 'conceptSchemeSelectionRight'"
              :is-left="isLeft"
              :style="selected.scheme[isLeft] != null ? '' : 'flex: 1;'"
              class="mainComponent visualComponent" />
            <!-- ItemDetail and ConceptList -->
            <div
              v-if="selected.scheme[isLeft] != null"
              class="conceptBrowser">
              <!-- ItemDetail -->
              <item-detail
                :id="'itemDetailComponent_' + isLeft"
                :item="selected.concept[isLeft] || selected.scheme[isLeft]"
                :is-left="isLeft"
                :settings="itemDetailSettings[isLeft ? 'left' : 'right']"
                class="mainComponent visualComponent conceptBrowserItem conceptBrowserItemDetail"
                @searchMappings="searchMappings($event)"
                @searchConcept="setConceptSearchQuery(isLeft, $event, true)" />
              <!-- Slider -->
              <resizing-slider />
              <!-- ConceptList -->
              <concept-list-wrapper
                :id="'conceptListComponent_' + isLeft"
                :ref="isLeft ? 'conceptListLeft' : 'conceptListRight'"
                :is-left="isLeft"
                class="mainComponent visualComponent conceptBrowserItem conceptBrowserItemList" />
            </div>
          </div>

          <!-- Slider -->
          <resizing-slider
            v-if="mappingRegistries.length > 0"
            :is-column="true"
            class="order2" />

          <!-- Mapping tools and occurrences browser -->
          <div
            v-if="mappingRegistries.length > 0"
            id="mappingTool"
            class="mappingTool order3">
            <div
              v-show="selected.scheme[true] || selected.scheme[false] || (forceMappingBrowser && $store.getters['mapping/getConcepts']().length > 0) || !forceMappingBrowser"
              id="mappingEditorComponent"
              class="mappingToolItem mainComponent visualComponent">
              <!-- MappingEditor -->
              <mapping-editor
                v-if="selected.scheme[true] || selected.scheme[false] || (forceMappingBrowser && $store.getters['mapping/getConcepts']().length > 0)" />
              <!-- Placeholder -->
              <div
                v-else
                class="placeholderComponentCenter">
                <div class="fontWeight-heavy fontSize-large">
                  <p>{{ $t("general.welcome") }}</p>
                  <p>
                    <a
                      :href="`./user-manual-${locale}.html`"
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
                  <hr v-if="!forceMappingBrowser">
                  <p v-if="!forceMappingBrowser">
                    <span v-if="$refs.mappingBrowser && $refs.mappingBrowser.tabIndexes && $refs.mappingBrowser.tabIndexes.concordances != null">
                      <a
                        href=""
                        @click.prevent="showConcordances">{{ $t("general.showConcordances") }}</a> -
                    </span>
                    <a
                      href=""
                      @click.prevent="showMappingSearch">{{ $t("general.showMappingSearch") }}</a>
                  </p>
                </div>
              </div>
              <!-- Minimizer allows component to get minimized -->
              <minimizer
                v-show="!forceMappingEditor"
                ref="mappingEditorMinimizer"
                name="mappingEditorComponent"
                :text="$t('mappingEditor.title')"
                :force-minimized="forceMappingEditor ? false : null" />
            </div>
            <!-- Slider -->
            <resizing-slider
              v-show="(selected.scheme[true] || selected.scheme[false] || forceMappingBrowser) && (selected.scheme[true] || selected.scheme[false] || (forceMappingBrowser && $store.getters['mapping/getConcepts']().length > 0) || !forceMappingBrowser)"
              :cocoda-red="true" />
            <div
              v-show="selected.scheme[true] || selected.scheme[false] || forceMappingBrowser"
              id="mappingBrowserComponent"
              class="mappingToolItem mainComponent visualComponent">
              <!-- MappingBrowser -->
              <mapping-browser ref="mappingBrowser" />
              <!-- Minimizer allows component to get minimized -->
              <minimizer
                ref="mappingBrowserMinimizer"
                name="mappingBrowserComponent"
                :text="$t('mappingBrowser.title')" />
            </div>
          </div>

          <!-- Slider -->
          <resizing-slider
            v-if="mappingRegistries.length > 0"
            :is-column="true"
            class="order4" />
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import TheNavbar from "./components/TheNavbar"
import MappingEditor from "./components/MappingEditor"
import MappingBrowser from "./components/MappingBrowser"
import ConceptListWrapper from "./components/ConceptListWrapper"
import ItemDetail from "./components/ItemDetail"
import ResizingSlider from "./components/ResizingSlider"
import _ from "lodash"
import LoadingIndicatorFull from "./components/LoadingIndicatorFull"
import Minimizer from "./components/Minimizer"
import { refreshRouter } from "./store/plugins"
import ConceptSchemeSelection from "./components/ConceptSchemeSelection"
import cdk from "cocoda-sdk"

// Import mixins
import auth from "./mixins/auth"
import objects from "./mixins/cdk"
import computed from "./mixins/computed"
import pageVisibility from "./mixins/page-visibility"

// Use css-element-queries (https://github.com/marcj/css-element-queries) to be able to specify CSS element queries like .someClass[min-width~="800px"]. Used mainly in MappingBrowser.
const ElementQueries = require("css-element-queries/src/ElementQueries")
ElementQueries.listen()

/**
 * The main application.
 */
export default {
  name: "App",
  components: {
    TheNavbar, ConceptListWrapper, ItemDetail, MappingEditor, MappingBrowser, ResizingSlider, LoadingIndicatorFull, Minimizer, ConceptSchemeSelection,
  },
  mixins: [auth, objects, computed, pageVisibility],
  data () {
    return {
      loaded: false,
      loading: false,
      itemDetailSettings: {
        left: {
          showTopConceptsInScheme: false,
        },
        right: {
          showTopConceptsInScheme: false,
        },
      },
      loadFromParametersOnce: _.once(this.loadFromParameters),
      forceMappingBrowser: false,
      forceMappingEditor: false,
      repeatLoadBuildInfo: null,
    }
  },
  computed: {
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
  },
  watch: {
    /**
     * Watch route of vue-router and load from parameters if necessary.
     */
    $route({ query: toQuery }, { query: fromQuery }) {
      // Only refresh when one of the scheme/concept parameters changed
      let parameters = ["from", "fromScheme", "to", "toScheme"]
      let refresh = false
      for (let param of parameters) {
        // Try to get objects for both URIs
        let uri1 = fromQuery[param],
          uri2 = toQuery[param],
          object1 = uri1 && this.getObject({ uri: uri1 }),
          object2 = uri2 && this.getObject({ uri: uri2 })
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
      deep: true,
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
      deep: true,
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
    /**
     * Update local creator name if authorized user changed.
     */
    user(current, previous) {
      if (this.user && this.user.name != this.userName) {
        this.$store.commit({
          type: "settings/set",
          prop: "creator",
          value: this.user.name,
        })
      }
      /**
       * Show alerts when user was logged in/out.
       */
      if (previous !== undefined && !previous && current) {
        // Logged in
        this.alert(this.$t("alerts.loggedIn"), null, "success")
      } else if (previous && !current) {
        // Logged out
        this.alert(this.$t("alerts.loggedOut"), 10, "danger", this.$t("settings.logInButton"), () => {
          // Open Accounts page in settings
          const navbar = this.$refs.navbar
          if (navbar && navbar.openSettingsTab) {
            // Maybe prevent hardcoded tab index?
            navbar.openSettingsTab(0)
          }
        })
        // Reset user name and URI
        this.$store.commit({
          type: "settings/set",
          prop: "creator",
          value: "",
        })
        this.$store.commit({
          type: "settings/set",
          prop: "creatorUri",
          value: "",
        })
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
            value: this.userUris[0],
          })
        }
      }
    },
    /**
     * Unminimize mapping browser if force mapping browser is set to true
     */
    forceMappingBrowser(force) {
      if (force) {
        let minimizer = this.$refs.mappingBrowserMinimizer
        minimizer.minimized = false
      }
    },
    /**
     * Unminimize mapping editor if no scheme is selected
     */
    selected: {
      handler() {
        if (!this.selected.scheme[true] && !this.selected.scheme[false]) {
          this.forceMappingEditor = true
        } else {
          this.forceMappingEditor = false
        }
      },
      deep: true,
    },
    isPageVisible(visible) {
      if (visible) {
        // Unpause repeat managers for build info
        this.repeatLoadBuildInfo && this.repeatLoadBuildInfo.start()
      } else {
        // Pause repeat managers for build info
        this.repeatLoadBuildInfo && this.repeatLoadBuildInfo.stop()
      }
    },
    "$settings.checkForUpdates"(enabled) {
      if (enabled) {
        this.enableUpdateCheck()
      } else {
        this.repeatLoadBuildInfo && this.repeatLoadBuildInfo.stop()
        this.repeatLoadBuildInfo = null
      }
    },
  },
  created() {
    // Load application
    this.load()
    // Look up local mappings count and show warning if there are too many.
    setTimeout(async () => {
      if (this.localMappingsRegistry) {
        const mappings = await this.getMappings({ registry: this.localMappingsRegistry, limit: 1 })
        if (mappings._totalCount && mappings._totalCount >= 500) {
          this.alert(this.$t("general.tooManyMappings", { count: mappings._totalCount }), 0)
        }
      }
    }, 10000)
  },
  methods: {
    /**
     * Method that is called ONCE on application startup in the `created` hook.
     *
     * !DO NOT CALL MANUALLY!
     */
    async load() {
      const time = new Date()
      this.loadingGlobal = true
      // Load config
      await this.$store.dispatch("loadConfig", _.get(this.$route, "query.config"))
      // Load settings
      await this.$store.dispatch("settings/load")
      // Wait for authentication to initialize
      if (this.config.auth) {
        await this.$store.dispatch("auth/init", this.config.auth)
      }
      // Set page title
      document.title = this.config.title
      // Set locale
      this.$i18n.locale = this.settingsLocale
      // Load schemes
      await this.loadSchemes()
      // Load mapping trash
      await this.$store.dispatch("mapping/loadMappingTrash")
      // Application is now considered loaded
      this.loaded = true
      this.loadingGlobal = false
      // Load from parameters
      // TODO: Should this be finished before loaded is set?
      this.loadFromParametersOnce(true)
      // Check for update every 60 seconds
      if (this.config.autoRefresh.update && this.$settings.checkForUpdates) {
        this.enableUpdateCheck()
      }
      // Set schemes in registries to objects from Cocoda
      for (let registry of this.config.registries) {
        if (_.isArray(registry.schemes)) {
          registry._jskos.schemes = registry.schemes.map(scheme => this.schemes.find(s => this.$jskos.compare(s, scheme)) || scheme)
        }
      }
      this.$log.log(`Application loaded in ${((new Date()) - time)/1000} seconds.`)
    },
    enableUpdateCheck() {
      this.repeatLoadBuildInfo = cdk.loadBuildInfo({
        url: "./build-info.json",
        buildInfo: this.config.buildInfo,
        interval: this.config.autoRefresh.update,
        callImmediately: false,
        callback: (error, buildInfo, previousBuildInfo) => {
          // ? Should a new build (not only a newer commit) also be shown as an update?
          if (!error && previousBuildInfo && buildInfo.gitCommit != previousBuildInfo.gitCommit) {
            this.alert(this.$t("alerts.newVersionText"), 0, "info", this.$t("alerts.newVersionLink"), () => {
              location.reload(true)
            })
            this.repeatLoadBuildInfo && this.repeatLoadBuildInfo.stop()
            this.repeatLoadBuildInfo = null
          }
        },
      })
    },
    insertPrefLabel(isLeft) {
      if (!this.$settings.components.ConceptSchemeSelection.insertPrefLabel[!isLeft]) {
        return
      }
      let prefLabel = this.$jskos.prefLabel(this.selected.concept[isLeft], { fallbackToUri: false })
      // Adjust prefLabel by removing everything from the first non-whitespace, non-letter character.
      let regexResult = /^[\s\wäüöÄÜÖß]*\w/.exec(prefLabel)
      this.setConceptSearchQuery(isLeft, regexResult ? regexResult[0] : "")
    },
    setConceptSearchQuery(isLeft, query, open) {
      let conceptSchemeSelection = _.get(this, `$refs.conceptSchemeSelection${isLeft ? "Right" : "Left"}[0]`)
      if (conceptSchemeSelection) {
        conceptSchemeSelection.setConceptSearchQuery(query, open)
      }
    },
    refresh(key) {
      if (key == "minimize") {
        // Minimizer causes a refresh, therefore recheck item detail settings
        this.itemDetailSettings.left.showTopConceptsInScheme = this.conceptListLeft() != null && this.conceptListLeft().$el.dataset.minimized == "1"
        this.itemDetailSettings.right.showTopConceptsInScheme = this.conceptListRight() != null && this.conceptListRight().$el.dataset.minimized == "1"
      }
    },
    // Using ref in v-for results in an array as well as refreshing ItemDetail settings.
    conceptListLeft() {
      return Array.isArray(this.$refs.conceptListLeft) ? this.$refs.conceptListLeft[0] : this.$refs.conceptListLeft
    },
    conceptListRight() {
      return Array.isArray(this.$refs.conceptListRight) ? this.$refs.conceptListRight[0] : this.$refs.conceptListRight
    },
    swapSides() {
      let query = this.$route.query
      query = Object.assign(query, { from: query.to, fromScheme: query.toScheme, to: query.from, toScheme: query.fromScheme })
      // Question: Reverse mapping or not? (see also: issue #158)
      this.$router.push({ query })
      this.loadFromParameters()
      // Also re-insert prefLabels after delay
      _.delay(() => {
        this.insertPrefLabel(true)
        this.insertPrefLabel(false)
      }, 300)
      // Swap open status as well by recursively iterating over all concepts in tree
      let swapOpen = (concept) => {
        let openLeft = _.get(concept, "__ISOPEN__.true", false)
        let openRight = _.get(concept, "__ISOPEN__.false", false)
        this.open(concept, true, openRight)
        this.open(concept, false, openLeft)
        if (concept.narrower && !concept.narrower.includes(null)) {
          for (let child of concept.narrower) {
            swapOpen(child)
          }
        }
      }
      for (let uri of _.uniq([query.fromScheme, query.toScheme])) {
        let topConcepts = this.topConcepts[uri]
        for (let concept of topConcepts || []) {
          swapOpen(concept)
        }
      }
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
          false: query.toScheme,
        },
        concept: {
          true: query.from,
          false: query.to,
        },
      }

      for (let isLeft of [true, false]) {
        // Get from store
        let schemeUri = selected.scheme[isLeft]
        let scheme = null
        if (schemeUri) {
          scheme = this.getObject({ uri: schemeUri })
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
          noLoading: true,
        }))
      }
      // Prepare application by selecting mapping from URL parameters.
      if (query.mapping || query.mappingUri || query.mappingIdentifier) {
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
        promises.push(loadMapping.then(( [mappingFromQuery, original = null] ) => {
          let promises = []
          if (mappingFromQuery) {
            for (let direction of directions) {
              const scheme = mappingFromQuery[`${direction}Scheme`]
              const concepts = this.$jskos.conceptsOfMapping(mappingFromQuery, direction)
              const memberField = Object.keys(mappingFromQuery[direction])
              const isLeft = direction == "from" ? true : false
              // Select scheme+concept on side if there are none
              if (firstLoad && concepts.length && !selected.concept[isLeft]) {
                const concept = concepts[0]
                // ? Maybe add to outer promises?
                promises.push(this.setSelected({
                  concept,
                  scheme,
                  isLeft,
                  noQueryRefresh: true,
                  noLoading: true,
                }))
              }
              // Load data for each concept in mapping
              _.forEach(concepts, (concept, index) => {
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
            this.forceMappingBrowser = true
            this.searchMappings(filter)
          } else if (query.concordances !== undefined) {
            this.showConcordances()
          } else if (query.mappingUri || query.mappingIdentifier) {
            this.forceMappingBrowser = true
            this.searchMappings()
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
  padding: 0;
}

.placeholderComponent {
  text-align: left;
  padding: 40px 20px 40px 30px;
}
.configError, .placeholderComponentCenter {
  text-align: center;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}
.configError > div {
  position: absolute;
  width: 100%;
}
.configError {
  background-color: @color-background;
  width: 100%;
  height: 100%;
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
