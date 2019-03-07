<template>
  <div id="mappingBrowser">
    <div
      v-show="selected.scheme[true] != null || selected.scheme[false] != null"
      id="mappingBrowserWrapper" >
      <div class="mappingBrowser-title">
        {{ $t("mappingBrowser.title") }}
      </div>
      <!-- Settings -->
      <div id="mappingBrowser-settingsButton">
        <font-awesome-icon
          v-b-tooltip.hover="{ title: $t('mappingBrowser.settingsButton'), delay: $util.delay.medium }"
          id="mappingBrowser-settingsButton-icon"
          icon="cog"
          class="button" />
        <b-popover
          :show.sync="settingsShow"
          target="mappingBrowser-settingsButton-icon"
          triggers="click"
          placement="bottomleft" >
          <div
            ref="settingsPopover" >
            <p><b>{{ $t("navbar.settings") }}</b></p>
            <b-form-checkbox
              v-b-tooltip.hover="{ title: $t('mappingBrowser.settingShowAllSchemesTooltip'), delay: $util.delay.medium }"
              v-model="showAllSchemes"
              style="user-select: none;">
              {{ $t("mappingBrowser.settingShowAllSchemes") }}
            </b-form-checkbox>
            <p v-if="settingsDownloadCurrent">
              <a
                href=""
                @click.prevent="downloadFile('mappings.ndjson', settingsDownloadCurrent)" >
                <br><font-awesome-icon icon="download" />
                {{ $t("settings.localDownloadJskos", [settingsDownloadCurrent.split("\n").length]) }}
              </a>
            </p>
            <p v-else-if="itemCount != 0">
              <loading-indicator size="sm" />
            </p>
          </div>
        </b-popover>
      </div>
      <div id="mappingBrowser-settings">
        <div
          v-for="group of registryGroups"
          :key="group.uri"
          class="mappingBrowser-settings-registryGroup" >
          <span
            :id="`registryGroup-${group.uri}`"
            class="mappingBrowser-settings-registryGroup-title fontWeight-heavy button" >
            {{ $util.prefLabel(group) }} <font-awesome-icon icon="caret-down" /><br>
          </span>
          <registry-notation
            v-for="registry in group.registries"
            :key="registry.uri"
            :registry="registry"
            :disabled="!showRegistry[registry.uri]"
            class="mappingBrowser-settings-registryGroup-notation"
            @click.native="showRegistry[registry.uri] = !showRegistry[registry.uri]"
            @mouseover.native="hoveredRegistry = registry"
            @mouseout.native="hoveredRegistry = null" />
          <b-popover
            :target="`registryGroup-${group.uri}`"
            :show.sync="registryGroupShow[group.uri]"
            triggers="click"
            placement="bottom" >
            <div
              :ref="`registryGroup-${group.uri}-popover`"
              class="mappingBrowser-settings-registryGroup-popover" >
              <b-form-checkbox
                v-for="(registry, index) in group.registries"
                :key="`registry_${index}`"
                v-model="showRegistry[registry.uri]"
                class="mappingBrowser-settings-registryGroup-popover-item"
                @mouseover.native="hoveredRegistry = registry"
                @mouseout.native="hoveredRegistry = null" >
                <registry-name :registry="registry" />
              </b-form-checkbox>
            </div>
          </b-popover>
        </div>
      </div>
      <!-- Mapping table -->
      <flexible-table
        v-show="items.length"
        :items="tableItems"
        :fields="fields"
        class="mappingBrowser-table"
        @hover="hoveredMapping = $event && $event.mapping; hoveredId = $event && $event.uniqueId" >
        <span
          slot="sourceScheme"
          slot-scope="{ value }" >
          <item-name
            :item="value"
            :show-text="false"
            :show-tooltip="true"
            font-size="sm"
            class="fontWeight-heavy" />
        </span>
        <span
          slot="sourceConcepts"
          slot-scope="{ value }" >
          <span
            v-for="concept in value"
            :key="concept.uri" >
            <item-name
              v-if="!$jskos.isContainedIn(concept, loadingConcepts)"
              :item="concept"
              :show-text="false"
              :show-tooltip="true"
              :is-link="true"
              :is-left="true"
              :is-highlighted="$jskos.compare(concept, selected.concept[true]) || $jskos.compare(concept, selected.concept[false])"
              @mouseover.native="hover(concept)" />
            <loading-indicator
              v-else
              size="sm" />
          </span>
        </span>
        <span
          slot="sourceConceptsLong"
          slot-scope="{ value }" >
          <span
            v-for="concept in value"
            :key="concept.uri" >
            <item-name
              v-if="!$jskos.isContainedIn(concept, loadingConcepts)"
              :item="concept"
              :show-text="true"
              :show-tooltip="false"
              :is-link="true"
              :is-left="true"
              :is-highlighted="$jskos.compare(concept, selected.concept[true]) || $jskos.compare(concept, selected.concept[false])"
              @mouseover.native="hover(concept)" />
            <loading-indicator
              v-else
              size="sm" />
          </span>
        </span>
        <span
          slot="targetScheme"
          slot-scope="{ value }" >
          <item-name
            :item="value"
            :show-text="false"
            :show-tooltip="true"
            font-size="sm"
            class="fontWeight-heavy" />
        </span>
        <span
          slot="targetConcepts"
          slot-scope="{ value }" >
          <span
            v-for="concept in value"
            :key="concept.uri">
            <span v-if="!$jskos.isContainedIn(concept, loadingConcepts)">
              <item-name
                :item="concept"
                :show-text="false"
                :show-tooltip="true"
                :is-link="true"
                :is-left="false"
                :is-highlighted="$jskos.compare(concept, selected.concept[false]) || $jskos.compare(concept, selected.concept[true])"
                @mouseover.native="hover(concept)" /><br>
            </span>
            <loading-indicator
              v-else
              size="sm" />
          </span>
        </span>
        <span
          slot="targetConceptsLong"
          slot-scope="{ value }" >
          <span
            v-for="concept in value"
            :key="concept.uri">
            <span v-if="!$jskos.isContainedIn(concept, loadingConcepts)">
              <item-name
                :item="concept"
                :show-text="true"
                :show-tooltip="false"
                :is-link="true"
                :is-left="false"
                :is-highlighted="$jskos.compare(concept, selected.concept[false]) || $jskos.compare(concept, selected.concept[true])"
                @mouseover.native="hover(concept)" /><br>
            </span>
            <loading-indicator
              v-else
              size="sm" />
          </span>
        </span>
        <span
          slot="type"
          slot-scope="{ value }" >
          <span
            v-b-tooltip.hover="{ title: value.prefLabel.en, delay: $util.delay.medium }"
            v-if="value != null && $util.notation(value) != '→'" >
            {{ $util.notation(value) }}
          </span>
        </span>
        <span
          slot="creator"
          slot-scope="{ item }" >
          <span
            v-b-tooltip.hover="{ title: item.creator, delay: $util.delay.long }"
            v-if="item.creator != null" >
            {{ item.creator }}
          </span>
        </span>
        <span
          slot="source"
          slot-scope="{ item }" >
          <registry-notation
            :registry="item.registry" />
        </span>
        <span
          slot="actions"
          slot-scope="data" >
          <!-- Annotation score/button -->
          <div
            v-if="data.item.mapping && data.item.mapping.annotations"
            :id="'mappingBrowser-hoveredMapping-annotationButton-' + data.item.uniqueId"
            :style="`color: ${annotationButtonColor(data.item.mapping.annotations)};`"
            style="display: inline-block; position: relative; min-width: 18px;"
            class="button fontWeight-heavy">
            {{ annotationsScore(data.item.mapping.annotations).sign }}{{ annotationsScore(data.item.mapping.annotations).score }}
          </div>
          <div
            v-if="data.item.mapping"
            class="mappingBrowser-toolbar-button">
            <font-awesome-icon
              v-b-tooltip.hover="{ title: $t('mappingBrowser.showDetail'), delay: $util.delay.medium }"
              icon="info-circle"
              class="button"
              @click="(mappingDetailMapping = data.item.mapping) && $refs.mappingDetail.show()" />
            <font-awesome-icon
              v-if="data.item.mapping.note"
              icon="comment"
              class="mappingBrowser-noteIcon" />
          </div>
          <div class="mappingBrowser-toolbar-button">
            <font-awesome-icon
              v-b-tooltip.hover="{ title: canSave(data.item.mapping) ? $t('mappingBrowser.saveAndEdit') : $t('mappingBrowser.edit'), delay: $util.delay.medium }"
              icon="edit"
              class="button"
              @click="edit(data)" />
          </div>
          <div
            v-if="!$jskos.compare(data.item.registry, $store.getters.getCurrentRegistry)"
            class="mappingBrowser-toolbar-button">
            <font-awesome-icon
              v-b-tooltip.hover="{ title: canSave(data.item.mapping) ? $t('mappingBrowser.saveAsMapping') : '', delay: $util.delay.medium }"
              v-if="canSave(data.item.mapping)"
              class="button"
              icon="save"
              @click="canSave(data.item.mapping) && saveMapping(data.item.mapping)" />
          </div>
          <div
            v-else
            class="mappingBrowser-toolbar-button">
            <font-awesome-icon
              v-b-tooltip.hover="{ title: $store.getters.getCurrentRegistry.provider.has.auth && !$store.getters.getCurrentRegistry.provider.auth ? $t('general.authNecessary') : $t('mappingBrowser.delete'), delay: $util.delay.medium }"
              v-if="(!$store.getters.getCurrentRegistry.provider.has.auth || $store.getters.getCurrentRegistry.provider.auth) && data.item.registry.provider.has.canRemoveMappings && (data.item.registry.uri == 'http://coli-conc.gbv.de/registry/local-mappings' || data.item.mapping.uri != null)"
              class="button-delete"
              icon="trash-alt"
              @click="(!$store.getters.getCurrentRegistry.provider.has.auth || $store.getters.getCurrentRegistry.provider.auth) && removeMapping(data.item.mapping)"
            />
          </div>
        </span>
        <span
          slot="HEAD_actions"
          slot-scope="" />
        <span
          slot="ITEM_ROW"
          slot-scope="{ item, value }" >
          <font-awesome-icon
            v-b-tooltip.hover="{ title: `${$t('mappingBrowser.showMore')} (${$util.prefLabel(item.registry)})`, delay: $util.delay.medium }"
            v-if="item.type == 'more'"
            icon="ellipsis-h"
            class="button"
            @click="showMore(value)" />
          <loading-indicator
            v-if="item.type == 'loading'"
            size="sm" />
          <span
            v-if="item.type == 'noItems'">
            <registry-notation
              :registry="item.registry"
              :disabled="true"
              :tooltip="false" />
            {{ $util.prefLabel(item.registry) }}: {{ $t("mappingBrowser.noItems") }}
          </span>
        </span>
        <span
          slot="count"
          slot-scope="data" >
          <span v-if="data.item.occurrence == null" />
          <span v-else-if="data.item.occurrence.count == -1">-</span>
          <span v-else>
            <auto-link
              :link="data.item.occurrence.url"
              :text="String(data.item.occurrence.count)" />
          </span>
        </span>
      </flexible-table>
      <div
        v-show="loading == 0 && items.length == 0"
        class="noItems fontWeight-heavy" >
        {{ $t("mappingBrowser.chooseConcept") }}
      </div>
    </div>
    <data-modal-button
      :data="items.map(item => item.mapping).filter(mapping => mapping != null)"
      type="mapping" />
    <!-- Mapping detail modal -->
    <mapping-detail
      ref="mappingDetail"
      :mapping="mappingDetailMapping" />
    <!-- Mapping annotations popover -->
    <annotation-popover
      :id="hoveredId"
      :mapping="hoveredMapping"
      id-prefix="mappingBrowser-hoveredMapping-annotationButton-" />
  </div>
</template>

<script>
import ItemName from "./ItemName"
import RegistryName from "./RegistryName"
import AutoLink from "./AutoLink"
import Minimizer from "./Minimizer"
import LoadingIndicatorFull from "./LoadingIndicatorFull"
import LoadingIndicator from "./LoadingIndicator"
import RegistryNotation from "./RegistryNotation"
import FlexibleTable from "vue-flexible-table"
import DataModalButton from "./DataModalButton"
import MappingDetail from "./MappingDetail"
import AnnotationPopover from "./AnnotationPopover"
import _ from "lodash"

/**
 * The mapping suggestion browser component.
 */
export default {
  name: "MappingBrowser",
  components: { ItemName, RegistryName, AutoLink, Minimizer, LoadingIndicatorFull, LoadingIndicator, FlexibleTable, RegistryNotation, DataModalButton, MappingDetail, AnnotationPopover },
  data () {
    return {
      loading: 0,
      items: [],
      previousSelected: {
        concept: {
          [true]: null,
          [false]: null,
        },
        scheme: {
          [true]: null,
          [false]: null,
        }
      },
      localMappingsCurrent: 0,
      showMoreValues: {},
      /** Unique ID for each reload */
      loadingId: null,
      registryGroupShow: {},
      settingsShow: false,
      settingsDownloadCurrent: null,
      /** List of concepts whose labels are being loaded */
      loadingConcepts: [],
      /** List of concepts whose labels could not be loaded */
      errorConcepts: [],
      /** A variable to force tableItems to recompute */
      tableItemsRecompute: null,
      /** An object for refresh timers for registries */
      refreshTimers: {},
      /** Current mapping for mapping detail */
      mappingDetailMapping: null,
      /** Currently hovered registry */
      hoveredRegistry: null,
      /** Currently hovered item unique ID  */
      hoveredId: null,
    }
  },
  computed: {
    itemCount() {
      return this.items.filter(item => item.mapping != null || item.type == "loading").length
    },
    tableItems() {
      this.tableItemsRecompute
      let separatorPaddingBottom = " mappingBrowser-separatorPaddingBottom"
      let separatorPaddingTop = " mappingBrowser-separatorPaddingTop"
      let separatorBorder = " mappingBrowser-separatorBorder"
      let original = this.$store.state.mapping.original
      let hasChangedFromOriginal = this.$store.getters["mapping/hasChangedFromOriginal"]
      let items = this.items.slice()
      let newItems = []
      let previousRegistry = null
      let previousSourceScheme = null
      let previousTargetScheme = null
      let previousItem = null
      let currentSetLength = 0
      let skipCurrentRegistry = false
      const lengthPerSet = 5
      for (let item of items) {
        item = _.clone(item)
        if (!this.$jskos.compare(previousRegistry, item.registry)) {
          previousSourceScheme = null
          previousTargetScheme = null
          currentSetLength = 0
          skipCurrentRegistry = false
          previousRegistry = item.registry
          // Add separator classes
          item._rowClass += separatorBorder + separatorPaddingTop
          if (previousItem) {
            previousItem._rowClass += separatorPaddingBottom
          }
        }
        currentSetLength += 1
        // Truncate if necessary
        let maxLengthForThis = _.get(this.showMoreValues, `["${item.registry.uri}"]`, 1) * lengthPerSet
        if (!skipCurrentRegistry && !this.$settings.mappingBrowserShowAll && currentSetLength > maxLengthForThis) {
          skipCurrentRegistry = true
          // Add extra row if truncated
          newItems.push({
            "_wholeRow": true,
            "_rowClass": "mappingBrowser-table-row-showMore fontSize-small",
            value: item.registry.uri,
            type: "more",
            registry: item.registry,
          })
        }
        if (skipCurrentRegistry) {
          continue
        }
        // Hide repeating schemes
        if (item.sourceScheme && this.$jskos.compare(item.sourceScheme, previousSourceScheme)) {
          item.sourceScheme = null
        } else {
          previousSourceScheme = item.sourceScheme
        }
        if (item.targetScheme && this.$jskos.compare(item.targetScheme, previousTargetScheme)) {
          item.targetScheme = null
        } else {
          previousTargetScheme = item.targetScheme
        }
        // Generate unique ID as helper
        item.uniqueId = this.$util.generateID()
        // Add row class if mapping is the same as original
        if (original && this.$jskos.compareMappingsDeep(original, item.mapping)) {
          item._rowClass += hasChangedFromOriginal ? " mappingBrowser-table-row-editing-notSaved" : " mappingBrowser-table-row-editing-saved"
        }
        newItems.push(item)
        previousItem = item
      }
      // Add class to all items of hoveredRegistry
      for (let item of newItems.filter(item => this.$jskos.compare(item.registry, this.hoveredRegistry))) {
        item._rowClass += " mappingBrowser-hoveredRegistry"
      }

      return newItems
    },
    /**
     * List of fields (columns) to be used in bootstrap table
     */
    fields() {
      return [
        {
          key: "source",
          label: "",
          width: "0%",
          minWidth: "",
          align: "left",
          sortable: false,
          class: "mappingBrowser-table-source"
        },
        {
          key: "sourceScheme",
          label: "",
          width: "4%",
          minWidth: "",
          align: "left",
          sortable: false,
          class: "fontSize-small"
        },
        {
          key: "sourceConcepts",
          label: this.$t("mappingBrowser.from"),
          width: "10%",
          minWidth: "",
          align: "left",
          sortable: false,
          compare: (a, b) => this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "from"),
          class: "mappingBrowser-table-concepts"
        },
        {
          key: "sourceConceptsLong",
          label: this.$t("mappingBrowser.from"),
          width: "25%",
          minWidth: "",
          align: "left",
          sortable: false,
          compare: (a, b) => this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "from"),
          class: "mappingBrowser-table-conceptsLong"
        },
        {
          key: "type",
          label: "",
          width: "4%",
          minWidth: "",
          sortable: false,
          compare: (a ,b) => {
            let labelA = _.get(a, "type.prefLabel.en", "")
            let labelB = _.get(b, "type.prefLabel.en", "")
            if (labelA < labelB) {
              return -1
            }
            if (labelA > labelB) {
              return 1
            }
            return 0
          }
        },
        {
          key: "targetScheme",
          label: "",
          width: "4%",
          minWidth: "",
          align: "left",
          sortable: false,
          class: "fontSize-small"
        },
        {
          key: "targetConcepts",
          label: this.$t("mappingBrowser.to"),
          width: "10%",
          minWidth: "",
          align: "left",
          sortable: false,
          compare: (a, b) => this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "to"),
          class: "mappingBrowser-table-concepts"
        },
        {
          key: "targetConceptsLong",
          label: this.$t("mappingBrowser.to"),
          width: "25%",
          minWidth: "",
          align: "left",
          sortable: false,
          compare: (a, b) => this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "to"),
          class: "mappingBrowser-table-conceptsLong"
        },
        {
          key: "creator",
          label: this.$t("mappingBrowser.creator"),
          width: "9%",
          minWidth: "",
          align: "left",
          sortable: false,
          class: "mappingBrowser-table-creator"
        },
        {
          key: "count",
          label: "",
          width: "4%",
          minWidth: "",
          align: "right",
          sortable: false,
          compare: (a, b) => {
            let first = _.get(a, "occurrence.count", -1)
            let second = _.get(b, "occurrence.count", -1)
            if (first < second) {
              return -1
            }
            if (first > second) {
              return 1
            }
            return 0
          }
        },
        {
          key: "actions",
          label: "",
          width: "12%",
          minWidth: "",
          align: "right",
          sortable: false
        }
      ]
    },
    needsRefresh() {
      return this.$store.state.mapping.mappingsNeedRefresh
    },
    // show registries
    showRegistry() {
      let object = {}
      // Define setter and getter for each registry separately.
      for (let registry of this.mappingRegistries) {
        Object.defineProperty(object, registry.uri, {
          get: () => {
            let result = this.$settings.mappingBrowserShowRegistry[registry.uri]
            if (result == null) {
              return true
            }
            return result
          },
          set: (value) => {
            this.$store.commit({
              type: "settings/set",
              prop: "mappingBrowserShowRegistry",
              value: Object.assign({}, this.$settings.mappingBrowserShowRegistry, { [registry.uri]: value })
            })
            this.$store.commit("mapping/setRefresh", { registry: registry.uri })
          }
        })
      }
      return object
    },
    mappingRegistries() {
      return this.config.registries.filter(registry => registry.provider && (registry.provider.has.mappings || registry.provider.has.occurrences) && (registry.scheme == null || this.$jskos.compare(this.selected.scheme[true], registry.scheme) || this.$jskos.compare(this.selected.scheme[false], registry.scheme)))
    },
    registryGroups() {
      let groups = _.cloneDeep(this.config.registryGroups)
      for (let group of groups) {
        group.registries = []
      }
      let otherGroup = {
        uri: "http://coli-conc.gbv.de/registry-group/other-mappings",
        prefLabel: {
          de: "Andere Mappings",
          en: "Other Mappings"
        },
        registries: []
      }
      for (let registry of this.mappingRegistries) {
        let group = groups.find(group => group.uri == _.get(registry, "subject[0].uri")) || otherGroup
        group.registries.push(registry)
      }
      groups.push(otherGroup)
      groups = groups.filter(group => group.registries.length > 0)
      return groups
    },
    // Setting whether to show mappings from all schemes or only chosen schemes
    showAllSchemes: {
      get() {
        return this.$settings.mappingBrowserAllSchemes
      },
      set(value) {
        this.$store.commit({
          type: "settings/set",
          prop: "mappingBrowserAllSchemes",
          value
        })
        // Refresh
        this.$store.commit("mapping/setRefresh")
      }
    },
  },
  watch: {
    needsRefresh(refresh) {
      if (refresh) {
        let registry = this.$store.state.mapping.mappingsNeedRefreshRegistry
        if (registry) {
          this.reload(true, registry)
        } else {
          this.reload(true)
        }
        this.$store.commit("mapping/setRefresh", { refresh: false })
      }
    },
    selected: {
      handler() {
        this.reload()
      },
      deep: true
    },
    settingsShow(newValue) {
      // Prepare mappings download when settings are shown.
      if (newValue) {
        this.refreshSettingsDownload()
      } else {
        this.settingsDownloadCurrent = null
      }
    },
    locale() {
      // When locale changed, reload mapping recommendations
      // TODO: Only reload relevant sections.
      this.$store.commit("mapping/setRefresh")
    },
  },
  created() {
    this.reload = _.debounce(this.internalReload, 100)
    // Fill registryGroupsShow
    for (let group of this.registryGroups) {
      this.$set(this.registryGroupShow, group.uri, false)
    }
  },
  mounted() {
    this.$util.setupTableScrollSync()
    this.reload()
    // Add click event listener
    document.addEventListener("click", this.handleClickOutside)
  },
  destroyed() {
    // Remove click event listener
    document.removeEventListener("click", this.handleClickOutside)
  },
  methods: {
    refreshSettingsDownload() {
      // Function for minifying and stringifying a mapping for JSKOS export.
      // TODO: Code duplication with TheSettings! This should actually go into jskos-tools.
      let jskosExport = m => {
        let mapping = this.$jskos.minifyMapping(m)
        // Add labels to concepts in mapping
        for (let concept of this.$jskos.conceptsOfMapping(mapping)) {
          // TODO: Can be removed?
          let conceptInStore = this._getObject(concept)
          let language = this.$util.getLanguage(_.get(conceptInStore, "prefLabel"))
          if (language) {
            concept.prefLabel = _.pick(conceptInStore.prefLabel, [language])
          }
        }
        return JSON.stringify(mapping)
      }
      let mappings = this.items.map(item => item.mapping).filter(mapping => mapping != null)
      this.settingsDownloadCurrent = mappings.map(jskosExport).join("\n")
    },
    handleClickOutside(event) {
      // Handle registry group popovers
      for (let group of this.registryGroups) {
        let popover = _.get(this.$refs[`registryGroup-${group.uri}-popover`], "[0]")
        if (popover && !popover.contains(event.target)) {
          this.registryGroupShow[group.uri] = false
        }
      }
      // Handle settings popover
      let popover = this.$refs.settingsPopover
      if (popover && !popover.contains(event.target)) {
        this.settingsShow = false
      }
    },
    internalReload(force = false, registryToReload) {

      let promises = []

      let setPreviousSelected = () => {
        this.previousSelected = {}
        this.previousSelected.concept = {
          [true]: this.selected.concept[true] ? { uri: this.selected.concept[true].uri } : null,
          [false]: this.selected.concept[false] ? { uri: this.selected.concept[false].uri } : null,
        }
        this.previousSelected.scheme = {
          [true]: this.selected.scheme[true] ? { uri: this.selected.scheme[true].uri } : null,
          [false]: this.selected.scheme[false] ? { uri: this.selected.scheme[false].uri } : null,
        }
      }

      if (!this.selected.concept[true] && !this.selected.concept[false]) {
        // No selected concepts, not reloading and clearing items+previosSelected.
        this.items = []
        setPreviousSelected()
        return
      }
      if (
        !force &&
        this.$jskos.compare(this.selected.concept[true], this.previousSelected.concept[true]) &&
        this.$jskos.compare(this.selected.concept[false], this.previousSelected.concept[false]) &&
        this.$jskos.compare(this.selected.scheme[true], this.previousSelected.scheme[true]) &&
        this.$jskos.compare(this.selected.scheme[false], this.previousSelected.scheme[false])
      ) {
        // No change in concepts, not reloading.
        setPreviousSelected()
        return
      }
      setPreviousSelected()
      if (!force) {
        // Either concept or scheme changed => reset showMoreValues.
        this.showMoreValues = {}
      }

      let partialReload = true
      if (!registryToReload) {
        this.items = []
        partialReload = false
      }
      this.loading = 1

      // Set unique ID for this request
      let loadingId = this.$util.generateID()
      this.loadingId = loadingId
      // Question/TODO: - Use axios cancel tokens to remove old requests?

      // Prepare params
      let params = {
        direction: "both",
        mode: "or",
        selected: this.selected,
      }
      let from = _.get(this, "selected.concept[true]")
      let to = _.get(this, "selected.concept[false]")
      if (from) {
        params["from"] = from
      }
      if (to) {
        params["to"] = to
      }

      for (let registry of this.mappingRegistries) {

        // Remove auto refresh timer if necessary
        if (this.refreshTimers[registry.uri]) {
          window.clearInterval(this.refreshTimers[registry.uri])
        }

        // Add loading indicator.
        let loadingRow = {
          "_wholeRow": true,
          "_rowClass": "mappingBrowser-table-row-loading",
          value: "",
          type: "loading",
          registry,
        }
        if (!this.showRegistry[registry.uri]) {
          // Replace loadingRow with a hidden dummy row
          loadingRow = {
            "_wholeRow": true,
            "_rowClass": "mappingBrowser-table-row-hidden",
            value: "",
            registry,
          }
        }
        if (partialReload) {
          if (registry.uri != registryToReload) {
            // Skip
            continue
          }
          // Only remove mappings from current registry
          let index = this.items.findIndex(item => this.$jskos.compare(item.registry, registry))
          // 1. For a forced reload, current items for this registry will not be removed and instead replaced after the results were loaded.
          // 2. If the registry is supposed to be hidden though, items have to be replaced with the hidden dummy row.
          // 3. If the item at the index does not have a mapping, i.e. it is a loading or (more likely) a dummy row, replace it with a loading row.
          // The reason for this is to make the auto refresh seem more "seamless".
          if (!force || !this.showRegistry[registry.uri] || !this.items[index].mapping) {
            this.items = this.items.filter(item => !this.$jskos.compare(item.registry, registry))
            this.items = this.items.slice(0, index).concat([loadingRow], this.items.slice(index, this.items.length))
          }
        } else {
          this.items.push(loadingRow)
        }

        // Check if enabled
        if (!this.showRegistry[registry.uri]) {
          continue
        }

        let promise = this.getMappings({ ...params, registry: registry.uri, all: true }).then(mappings => {

          // Check loadingId
          if (this.loadingId != loadingId) {
            return
          }

          let items = []

          mappings = mappings.sort((a, b) => {
            // Sort mappings
            if (a._occurrence || b._occurrence) {
              // Sort by occurrence count descending
              return _.get(b, "_occurrence.count", 0) - _.get(a, "_occurrence.count", 0)
            }
            // TODO: - Put into utils/jskos-tools.
            const includes = (list, concept) => {
              for (let item of list) {
                if (this.$jskos.compare(item, concept)) {
                  return true
                }
              }
              return false
            }
            // TODO: - Put into utils/jskos-tools.
            const concepts = (mapping, isLeft) => {
              let fromTo = isLeft ? "from" : "to"
              return _.get(mapping, `${fromTo}.memberSet`) || _.get(mapping, `${fromTo}.memberChoice`) || _.get(mapping, `${fromTo}.memberList`) || []
            }
            let points = {
              a: 10, b: 10
            }
            _.forOwn({ a, b }, (mapping, key) => {
              let conceptsLeft = concepts(mapping, true)
              let conceptsRight = concepts(mapping, false)
              // Left concept is on left side of mapping.
              if (includes(conceptsLeft, this.selected.concept[true])) {
                points[key] -= 6
              }
              // Right concept is on right side of mapping.
              if (includes(conceptsRight, this.selected.concept[false])) {
                points[key] -= 4
              }
              // Right concept is on left side of mapping.
              if (includes(conceptsLeft, this.selected.concept[false])) {
                points[key] -= 3
              }
              // Left concept is on right side of mapping.
              if (includes(conceptsRight, this.selected.concept[true])) {
                points[key] -= 2
              }
              // Left scheme matches left side of mapping.
              if (this.$jskos.compare(mapping.fromScheme, this.selected.scheme[true])) {
                points[key] -= 1
              }
              // Right scheme matches right side of mapping.
              if (this.$jskos.compare(mapping.toScheme, this.selected.scheme[false])) {
                points[key] -= 1
              }
            })
            if (points.a - points.b != 0) {
              return points.a - points.b
            }
            // If the points are equal, sort by concepts (first from, then to).
            let value = this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "from")
            if (value != 0) {
              return value
            }
            return this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "to")
          })
          // Add items
          for (let mapping of mappings) {
            let item = { mapping, registry }
            item.sourceScheme = _.get(mapping, "fromScheme")
            item.targetScheme = _.get(mapping, "toScheme")
            // Skip mapping if showAllSchemes is off and schemes don't match
            if (!this.showAllSchemes) {
              // If one side doesn't have a scheme selected, always show all
              if (this.selected.scheme[true] && this.selected.scheme[false]) {
                let schemesCorrect = true
                for (let scheme of [item.sourceScheme, item.targetScheme]) {
                  let schemeCorrect = false
                  for (let isLeft of [true, false]) {
                    if (this.$jskos.compare(scheme, this.selected.scheme[isLeft])) {
                      schemeCorrect = true
                    }
                  }
                  schemesCorrect = schemesCorrect && schemeCorrect
                }
                if (!schemesCorrect) {
                  continue
                }
              }
            }
            item.sourceConcepts = this.$jskos.conceptsOfMapping(mapping, "from").filter(concept => concept != null)
            item.targetConcepts = this.$jskos.conceptsOfMapping(mapping, "to").filter(concept => concept != null)
            // Load prefLabels for all concepts
            // TODO: Optimize by loading multiple concepts simultaneously (#107)
            for (let concept of item.sourceConcepts) {
              let scheme = _.get(mapping, "fromScheme")
              this.hover(concept, scheme)
            }
            for (let concept of item.targetConcepts) {
              let scheme = _.get(mapping, "toScheme")
              this.hover(concept, scheme)
            }
            // Save concepts as xLabels attribute as well
            item.sourceConceptsLong = item.sourceConcepts
            item.targetConceptsLong = item.targetConcepts
            // Set source/targetScheme to empty string if from/to is null.
            if (!_.get(mapping, "from") && item.sourceConcepts.length == 0) {
              item.sourceScheme = null
            }
            if (!_.get(mapping, "to") && item.targetConcepts.length == 0) {
              item.targetScheme = null
            }
            // Skip if there are no concepts.
            if (item.sourceConcepts.length + item.targetConcepts.length == 0) {
              continue
            }
            // Highlight if selected concepts are in mapping and add inScheme to each concept
            let leftInSource = false
            for (let concept of item.sourceConcepts) {
              if (this.selected.concept[true] && concept.uri == this.selected.concept[true].uri) {
                leftInSource = true
              }
              concept.inScheme = _.get(concept, "inScheme") || [mapping.fromScheme]
            }
            let rightInSource = false
            for (let concept of item.targetConcepts) {
              if (this.selected.concept[false] && concept.uri == this.selected.concept[false].uri) {
                rightInSource = true
              }
              concept.inScheme = _.get(concept, "inScheme") || [mapping.toScheme]
            }
            item._rowClass = ""
            if (leftInSource && rightInSource) {
              item._rowClass = "mappingBrowser-table-row-match"
            }
            item.creator = mapping.creator && mapping.creator[0] || ""
            if (typeof item.creator === "object") {
              item.creator = this.$util.prefLabel(item.creator)
            }
            item.source = this.$util.prefLabel(registry)
            item.sourceShort = this.$util.notation(registry)
            item.type = this.$jskos.mappingTypeByType(mapping.type)
            item.occurrence = mapping._occurrence
            items.push(item)
          }

          // Insert items into this.items
          let index = this.items.findIndex(item => this.$jskos.compare(item.registry, registry))
          if (index >= 0) {

            if (items.length == 0) {
              let noItemsRow = {
                "_wholeRow": true,
                "_rowClass": "mappingBrowser-table-row-loading mappingBrowser-table-row-noItems fontSize-small text-grey",
                value: "",
                type: "noItems",
                registry,
              }
              items = [noItemsRow]
            }
            // Filter out all existing items for this registry before insertion.
            let newItems = this.items.filter(item => !this.$jskos.compare(item.registry, registry))
            this.items = newItems.slice(0, index).concat(items, newItems.slice(index, newItems.length))
          }

          // Set auto refresh timer if necessary
          if (registry.autoRefresh) {
            window.clearInterval(this.refreshTimers[registry.uri])
            this.refreshTimers[registry.uri] = setInterval(() => {
              this.$store.commit("mapping/setRefresh", { registry: registry.uri })
            }, _.isInteger(registry.autoRefresh) ? registry.autoRefresh : 5000)
          }

        }).catch(error => {
          console.warn("Error", error)
        })

        promises.push(promise)

      }

      Promise.all(promises).finally(() => {
        if (this.loadingId == loadingId) {
          this.loading = 0
          this.loadingId = null
          // If settings are shown, refresh download
          if (this.settingsShow) {
            this.refreshSettingsDownload()
          }
        }
      })
    },
    showMore(value) {
      this.showMoreValues[value] = _.get(this.showMoreValues, `["${value}"]`, 1) + 1
      // Force tableItems to recomputed (doesn't trigger by changing "showMoreValues")
      this.tableItemsRecompute = Math.random()
    },
    edit(data) {
      let copyWithReferences = mapping => {
        let newMapping = this.$jskos.copyDeep(mapping)
        newMapping.from.memberSet = mapping.from.memberSet.slice()
        if (newMapping.to.memberSet) {
          newMapping.to.memberSet = mapping.to.memberSet.slice()
        } else if (newMapping.to.memberList) {
          newMapping.to.memberList = mapping.to.memberList.slice()
        } else if (newMapping.to.memberChoice) {
          newMapping.to.memberChoice = mapping.to.memberChoice.slice()
        }
        newMapping._provider = mapping._provider
        newMapping.fromScheme = mapping.fromScheme
        newMapping.toScheme = mapping.toScheme
        return newMapping
      }
      let mapping = copyWithReferences(data.item.mapping)
      // Load concept prefLabel for each concept in mapping if necessary
      for (let concept of [].concat(mapping.from.memberSet, mapping.to.memberSet, mapping.to.memberList, mapping.to.memberChoice)) {
        this.hover(concept)
      }
      // Save mapping
      if (this.canSave(mapping)) {
        this.saveMapping(mapping).then(original => {
          this.$store.commit({
            type: "mapping/set",
            mapping: original,
            original
          })
        })
      } else {
        this.$store.commit({
          type: "mapping/set",
          mapping,
          original: mapping._provider && mapping._provider.has.canSaveMappings && this.$jskos.compare(mapping._provider.registry, this.$store.getters.getCurrentRegistry) ? copyWithReferences(mapping) : null
        })
      }
    },
    hover(concept, scheme) {
      if(concept && _.isEmpty(concept.prefLabel) && !this.$jskos.isContainedIn(concept, this.loadingConcepts) && !this.$jskos.isContainedIn(concept, this.errorConcepts) && this.getProvider(concept)) {
        // Load prefLabel to be shown as tooltip

        if ((!concept.inScheme || concept.inScheme.length == 0) && !scheme) {
          // TODO: - Error handling
          console.warn("No scheme for", concept)
          this.errorConcepts.push(concept)
          return
        }

        this.loadingConcepts.push(concept)
        this.loadDetails(concept, { scheme: _.get(concept, "inScheme[0]", scheme) }).then(result => {
          // Remove concept from list of loading concepts
          let index = this.loadingConcepts.findIndex(c => this.$jskos.compare(c, concept))
          if (index != -1) {
            this.loadingConcepts.splice(index, 1)
          }
          if (!result || !result.prefLabel) {
            this.errorConcepts.push(concept)
            return
          }
          this.saveObject(result)
        })
      }
    },
    loadNotation(concept) {
      if(concept && !concept.notation && this.getProvider(concept)) {
        // Load notation

        if (!concept.inScheme || concept.inScheme.length == 0) {
          // TODO: - Error handling
          console.warn("No scheme for", concept)
          return
        }
        this.loadDetails(concept, { scheme: _.get(concept, "inScheme[0]", scheme) }).then(result => {
          this.saveObject(result)
        })
      }
    },
    removeMapping(mapping) {
      this.loadingGlobal = true
      this.$store.dispatch({ type: "mapping/removeMappings", mappings: [mapping] }).then(([success]) => {
        if (success) {
          this.alert(this.$t("alerts.mappingDeleted"), null, "success2")
        } else {
          this.alert(this.$t("alerts.mappingNotDeleted"), null, "danger")
        }
        // Refresh list of mappings/suggestions.
        this.$store.commit("mapping/setRefresh", { registry: _.get(this.$store.getters.getCurrentRegistry, "uri") })
      }).finally(() => {
        this.loadingGlobal = false
      })
    },
    /** Saving of mappigns */
    canSave(mapping) {
      if (!mapping || !mapping.fromScheme || !mapping.toScheme) {
        return false
      }
      // Don't allow saving if it's the current registry
      if (mapping._provider && this.$jskos.compare(mapping._provider.registry, this.$store.getters.getCurrentRegistry)) {
        return false
      }
      // TODO: Do this differently to prevent going through all local mappings on each reload.
      if (!mapping.identifier) {
        mapping = this.$jskos.addMappingIdentifiers(mapping)
      }
      let id = (mapping.identifier || []).find(id => id.startsWith("urn:jskos:mapping:content"))
      if (!id) {
        return false
      }
      return true
    },
    saveMapping(mapping) {
      this.loading = 1
      this.loadingGlobal = true
      // Adjust creator
      let creator = this.creator
      let creatorName = this.$util.prefLabel(creator, null, false)
      // Adjust creator property by putting current creator in the front
      mapping.creator = [creator].concat((mapping.creator || []).filter(c => !(creator.uri && c.uri && creator.uri == c.uri) && !(creatorName && this.$util.prefLabel(c, null, false) && creatorName == this.$util.prefLabel(c, null, false))))

      return this.$store.dispatch({ type: "mapping/saveMappings", mappings: [{ mapping }] }).then(mappings => {
        return mappings[0]
      }).catch(() => {
        return null
      }).then(mapping => {
        if (!mapping) {
          let message = this.$t("alerts.mappingNotSaved")
          if (this.$store.getters.getCurrentRegistry.provider.has.auth && !this.$store.getters.getCurrentRegistry.provider.auth) {
            message += " " + this.$t("general.authNecessary")
          }
          this.alert(message, null, "danger")
        }
        return mapping
      }).finally(() => {
        this.loadingGlobal = false
        // Refresh list of mappings/suggestions.
        this.$store.commit("mapping/setRefresh", { registry: _.get(this.$store.getters.getCurrentRegistry, "uri") })
      })
    },
    annotationsScore(annotations) {
      let score = 0
      for (let { bodyValue } of annotations.filter(annotation => annotation.motivation == "assessing")) {
        score += parseInt(bodyValue) || 0
      }
      let sign = score > 0 ? "+" : (score < 0 ? "-" : "±")
      score = Math.abs(score)
      return { score, sign }
    },
    annotationButtonColor(annotations) {
      // A score of +3 or -3 means it will have 100% transparency.
      let maxIntensity = 3
      let { score, sign } = this.annotationsScore(annotations)
      let delta = Math.min(score / maxIntensity, 1) * 150
      let r = 85, g = 85, b = 85
      if (sign == "-") {
        r += delta
        g -= 50
        b -= 50
      } else if (sign == "+") {
        g += delta
        r -= 50
        b -= 50
      }
      let color = `rgb(${r}, ${g}, ${b})`
      return color
    },
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

#mappingBrowser {
  position: relative;
  display: flex;
}
#mappingBrowserWrapper {
  flex: 1;
  width: 0;
  display: flex;
  flex-direction: column;
}
.mappingBrowser-title {
  .componentTitle;
  flex: none;
  margin: 0 auto;
}
#mappingBrowser-settingsButton {
  position: absolute;
  right: 20px;
  top: -6px;
}
#mappingBrowser-settings {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  margin: 5px 5px 15px 5px;
  padding: 5px;
  box-shadow: 0 1px 2px 0 @color-shadow;
}
.mappingBrowser-setting {
  user-select: none;
  margin: 0 15px;
}
.mappingBrowser-settings-registryGroup {
  flex: 1;
  text-align: center;
}
.mappingBrowser-settings-registryGroup-title {
  margin-right: 10px;
}
.mappingBrowser-settings-registryGroup-notation {
  margin: 0 4px;
  cursor: pointer;
}
.mappingBrowser-settings-registryGroup-popover {
  display: flex;
  flex-direction: column;
  margin: 10px 10px;
}
.mappingBrowser-settings-registryGroup-popover-item {
  flex: 1;
  margin: 5px 0;
}
.mappingBrowser-table {
  flex: 1;
}
.noItems {
  margin: 30px auto 5px auto;
  flex: 5 0 auto;
}
.mappingBrowser-noteIcon {
  color: @color-button;
  position: absolute;
  right: -4px;
  top: -2px;
  font-size: 8px;
}
.mappingBrowser-toolbar-button {
  display: inline-block;
  position: relative;
  width: 16px;
  text-align: center;
}

</style>

<style lang="less">
@import "../style/main.less";

.mappingBrowser-table {
  height: 0;
}

.mappingBrowser-table-row-match {
  background-color: @color-table-highlight-background-1;
}
.mappingBrowser-table-row-editing-saved {
  background-color: fadein(@color-background-saved, 6%);
}
.mappingBrowser-table-row-editing-notSaved {
  background-color: fadein(@color-background-notSaved, 6%);
}
.mappingBrowser-hoveredRegistry:before {
  position: absolute;
  content: "";
  background: @color-loading-overlay-background;
  top: 0; right: 0; left: 0; bottom: 0;
  z-index: @zIndex-10;
}
.mappingBrowser-table-row-showMore {
  height: 24px;
}
.mappingBrowser-table-row-loading > span > div {
  margin: 0 auto;
}
.mappingBrowser-table-row-noItems {
  text-align: left !important;
  padding-left: 3px !important;
}
.mappingBrowser-table-row-hidden {
  display: none;
}
.mappingBrowser-separatorPaddingBottom {
  padding-bottom: 10px !important;
}
.mappingBrowser-separatorPaddingTop {
  padding-top: 10px !important;
}
.mappingBrowser-separatorBorder {
  border-top: 1px solid @color-text-lightGrey;
}

.mappingBrowser-table-source {
  // Exactly enough for a two char wide registry notation.
  min-width: 33px;
  max-width: 33px;
  padding-left: 3px !important;
  padding-right: 0 !important;
}
.mappingBrowser-table .mappingBrowser-table-creator {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mappingBrowser-table .flexibleTable-head .flexibleTable-cell {
  padding: 4px 2px !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mappingBrowser-table[max-width~="800px"] .mappingBrowser-table-creator {
  display: none;
}
.mappingBrowser-table[max-width~="700px"] .mappingBrowser-table-conceptsLong {
  display: none;
}
.mappingBrowser-table[min-width~="700px"] .mappingBrowser-table-concepts {
  display: none;
}

</style>
