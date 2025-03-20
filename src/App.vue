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
                v-if="!(isLeft ? selectedSchemeLeft : selectedSchemeRight).concepts || (isLeft ? selectedSchemeLeft : selectedSchemeRight).concepts.length"
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
import TheNavbar from "./components/TheNavbar.vue"
import MappingEditor from "./components/MappingEditor.vue"
import MappingBrowser from "./components/MappingBrowser.vue"
import ConceptListWrapper from "./components/ConceptListWrapper.vue"
import ItemDetail from "./components/ItemDetail.vue"
import ResizingSlider from "./components/ResizingSlider.vue"
import _ from "lodash"
import LoadingIndicatorFull from "./components/LoadingIndicatorFull.vue"
import Minimizer from "./components/Minimizer.vue"
import { refreshRouter } from "./store/plugins.js"
import ConceptSchemeSelection from "./components/ConceptSchemeSelection.vue"
import { cdk } from "cocoda-sdk"

// Import mixins
import auth from "./mixins/auth.js"
import objects from "./mixins/cdk.js"
import computed from "./mixins/computed.js"
import pageVisibility from "./mixins/page-visibility.js"

// Use css-element-queries (https://github.com/marcj/css-element-queries) to be able to specify CSS element queries like .someClass[min-width~="800px"]. Used mainly in MappingBrowser.
import { ElementQueries } from "css-element-queries"
import { getItem, getItemByUri, loadConcepts, loadSchemes, saveItem } from "./items"
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
      return getItem(this.selected.concept[true])
    },
    selectedSchemeRight() {
      return getItem(this.selected.scheme[false])
    },
    selectedConceptRight() {
      return getItem(this.selected.concept[false])
    },
    selectedSchemeLeft() {
      return getItem(this.selected.scheme[true])
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
          object1 = uri1 && getItem({ uri: uri1 }),
          object2 = uri2 && getItem({ uri: uri2 })
        // Compare objects if they exist to prevent unnecessary reloads.
        if (object1 && object2) {
          if (!this.$jskos.compareFast(object1, object2)) {
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
      if (!this.$jskos.compareFast(newValue, oldValue)) {
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
      if (!this.$jskos.compareFast(newValue, oldValue)) {
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
    user(current, previous) {
      /**
       * Show alerts when user was logged in/out, set name/identity if necessary
       */
      if (previous !== undefined && !previous && current) {
        // Logged in
        this.alert(this.$t("alerts.loggedIn"), null, "success")
        // Set name if necessary
        const name = this.getNameForIdentity()
        if (name) {
          this.$store.commit({
            type: "settings/set",
            prop: "creator",
            value: name,
          })
        }
        // Switch to different mapping registry if Local is selected
        if (this.localMappingsRegistry && this.$jskos.compareFast(this.currentRegistry, this.localMappingsRegistry)) {
          // Find first registry that allows saving mappings
          const newRegistry = this.config.registries.find(
            registry => this.$jskos.mappingRegistryIsStored(registry)
              && !this.$jskos.compareFast(registry, this.localMappingsRegistry)
              && registry.isAuthorizedFor({
                type: "mappings",
                action: "create",
                user: current,
              }),
          )
          if (newRegistry) {
            // Set the registry
            this.$store.commit({
              type: "settings/set",
              prop: "mappingRegistry",
              value: newRegistry.uri,
            })
            // Show an alert that the registry was changed
            this.alert(
              this.$t("alerts.loggedInRegistryChanged", [this.$jskos.prefLabel(newRegistry)]),
              0,
              "warning",
              this.$t("alerts.loggedInRegistryChangedUndoButton"),
              // Handler if button is clicked
              (alert) => {
                // Hide alert
                this.$store.commit({ type: "alerts/setCountdown", alert, countdown: 0 })
                // Switch back to local mappings
                this.$store.commit({
                  type: "settings/set",
                  prop: "mappingRegistry",
                  value: this.localMappingsRegistry.uri,
                })
              },
            )
          }
        }
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
      } else if (previous && current) {
        // Check if name was updated and change name if necessary
        if (previous && previous.name && current && current.name && current.uri == this.creator.uri && this.creatorName === previous.name) {
          this.$store.commit({
            type: "settings/set",
            prop: "creator",
            value: current.name,
          })
        }
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
        const minimizer = this.$refs.mappingBrowserMinimizer
        if (minimizer) {
          minimizer.minimized = false
        }
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
    languages() {
      // Relay language changes to registry providers
      this.updateLanguagesForSchemeRegistries()
      // Also re-insert prefLabels after delay
      _.delay(() => {
        this.insertPrefLabel(true)
        this.insertPrefLabel(false)
      }, 100)
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
      await loadSchemes()
      // Also reloaded languages for scheme registries now that all schemes are loaded
      this.updateLanguagesForSchemeRegistries()
      // Store favorite concepts and load their details
      this.favoriteConcepts.forEach(concept => saveItem(concept, { type: "concept" }))
      loadConcepts(this.favoriteConcepts)
      // Load mapping trash
      await this.$store.dispatch("mapping/loadMappingTrash")
      // Load concept data for concepts in mapping trash
      const trash = this.$store.state.mapping.mappingTrash
      const trashConcepts = trash.reduce((concepts, { mapping }) => {
        for (const side of ["from", "to"]) {
          concepts = concepts.concat(this.$jskos.conceptsOfMapping(mapping, side).map(concept => (saveItem({ uri: concept.uri, inScheme: [mapping[`${side}Scheme`]] }))))
        }
        return concepts
      }, [])
      loadConcepts(trashConcepts)
      // Application is now considered loaded
      this.loaded = true
      this.loadingGlobal = false
      // Load from parameters
      // TODO: Should this be finished before loaded is set?
      this.loadFromParametersOnce(true)
      // Check for update every 60 seconds
      if (this.config.autoRefresh.update) {
        this.enableUpdateCheck()
      }
      // Set schemes in registries to objects from Cocoda
      for (let registry of this.config.registries) {
        if (_.isArray(registry.schemes)) {
          registry._jskos.schemes = registry.schemes.map(scheme => getItem(scheme) || scheme)
        }
      }
      this.$log.log(`Application loaded in ${((new Date()) - time)/1000} seconds.`)
    },
    enableUpdateCheck() {
      this.repeatLoadBuildInfo = cdk.loadBuildInfo({
        url: "./build-info.json",
        buildInfo: this.config.buildInfo,
        interval: this.config.autoRefresh.update,
        callImmediately: true,
        callback: (error, buildInfo, previousBuildInfo) => {
          // ? Should a new build (not only a newer commit) also be shown as an update?
          if (!error && previousBuildInfo && buildInfo.gitCommit != previousBuildInfo.gitCommit) {
            this.alert(this.$t("alerts.newVersionText"), 0, "warning", this.$t("alerts.newVersionLink"), () => {
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
      let prefLabel = this.$jskos.prefLabel(getItem(this.selected.concept[isLeft]), { fallbackToUri: false })
      // Adjust prefLabel by removing everything from the first non-whitespace, non-letter character.
      let regexResult = /^[\s\wäüöÄÜÖß]*\w/.exec(prefLabel)
      this.setConceptSearchQuery(isLeft, regexResult ? regexResult[0] : prefLabel)
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
        let topConcepts = _.get(getItemByUri(uri), "topConcepts")
        for (let concept of topConcepts || []) {
          swapOpen(concept)
        }
      }
    },
    async loadFromParameters(firstLoad = false) {
      this.loading = true

      // Check route to see if navigation is necessary
      const query = this.$route.query

      // Prepare application by selecting schemes and concepts from URL parameters.
      const selected = {
        scheme: {
          true: query.fromScheme,
          false: query.toScheme,
        },
        concept: {
          true: query.from,
          false: query.to,
        },
      }

      const setSelectedOnSide = async (isLeft) => {
        // Get from store
        let schemeUri = selected.scheme[isLeft]
        let scheme = null
        if (schemeUri) {
          scheme = getItem({ uri: schemeUri })
        }
        let concept = null
        if (scheme && selected.concept[isLeft]) {
          concept = saveItem({ uri: selected.concept[isLeft] }, { scheme, type: "concept" })
        }

        try {
          await this.setSelected({
            concept,
            scheme,
            isLeft,
            noQueryRefresh: true,
            noLoading: true,
          })
        } catch (error) {
          this.$log.warn(error)
          // ? Should we show a user-facing error?
        }
      }

      const selectMapping = async () => {
        if (query.mapping || query.mappingUri || query.mappingIdentifier) {
          // Decode mapping from query
          let mappingFromQuery = null
          if (query.mapping) {
            try {
              mappingFromQuery = this.adjustMapping(this.$jskos.normalize(JSON.parse(query.mapping)))
            } catch(error) {
              this.$log.warn("Error decoding mapping from URL parameter:", error)
            }
          }
          if (_.isEqual(mappingFromQuery, {})) {
            mappingFromQuery = null
          }
          // Load mapping from URI/identifier if available
          let loadedMappings = []
          try {
            if (query.mappingUri) {
              loadedMappings.push(await this.getMapping({ uri: query.mappingUri }))
            } else if (query.mappingIdentifier) {
              loadedMappings = await this.getMappings({ identifier: query.mappingIdentifier })
            }
          } catch (error) {
            this.$log.warn("Error loading mapping from URL parameter:", error)
          }
          loadedMappings = loadedMappings.filter(Boolean)
          let mapping = mappingFromQuery, original = null
          if (loadedMappings.length) {
            // Prefer mapping from writable registry if there are multiples
            original = loadedMappings.find(m => _.get(m, "_registry").isAuthorizedFor && _.get(m, "_registry").isAuthorizedFor({
              type: "mappings",
              action: "create",
              user: this.user,
            })) || loadedMappings[0]
            mapping = mapping || this.adjustMapping(this.$jskos.copyDeep(original))
          }

          this.$store.commit({
            type: "mapping/set",
            mapping,
            original,
            noQueryRefresh: true,
          })

          // ? Should concepts in mapping be selected like before?

          // Load concept data
          loadConcepts(this.$jskos.conceptsOfMapping(mapping))

          // We want to show the mapping part of the application if there's a mapping loaded
          if (mapping && firstLoad) {
            this.forceMappingBrowser = true
          }
        }
      }

      // Note that error handling is done inside each method, so there should be no errors here
      await Promise.all([
        setSelectedOnSide(true),
        setSelectedOnSide(false),
        selectMapping(),
      ])
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
        }
      }
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
    updateLanguagesForSchemeRegistries() {
      for (let scheme of this.schemes) {
        scheme = getItem(scheme)
        if (scheme._registry) {
          scheme._registry.languages = this.languages
        }
      }
    },
  },
}
</script>

<style lang="less">
@import "./style/main.less";
@import "./style/colors.css";

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
  background-color: var(--color-background-secondary);
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
  flex: 3;
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
  background-color: var(--color-background);
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
  color: rgb(var(--color-button));
}
#swapSides:hover {
  color: var(--color-button-hover);
}

.tooltip {
  pointer-events: none !important;
}
// Override border color for all cocoda-vue-tabs
.cocoda-vue-tabs-header-item.cocoda-vue-tabs-header-item-active {
  border-bottom-color: var(--color-primary) !important;
  background-color: var(--color-background-heading) !important;
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
