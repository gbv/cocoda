<template>
  <div id="mappingBrowser">
    <!-- Settings -->
    <component-settings :tooltip="$t('mappingBrowser.settingsButton')" />
    <tabs
      v-model="tab"
      style="position: absolute; top: 0; bottom: 0; left: 0; right: 0;"
      fill>
      <tab
        v-if="concordancesShown"
        :title="$t('mappingBrowser.concordances')"
        @click="handleClick">
        <template v-if="concordances && concordances.length">
          <!-- Registry selection, add concordance button, and modal -->
          <div
            v-if="concordanceRegistries.length"
            class="mappingBrowser-concordanceMenu">
            <div
              v-if="canCreateConcordance()"
              class="button mappingBrowser-addConcordanceButton"
              @click="editConcordance(null)">
              <font-awesome-icon
                v-b-tooltip.hover="{ title: $t('concordanceEditor.addConcordanceButton'), delay: defaults.delay.medium }"
                icon="plus-square" />
              New
            </div>
            <registry-notation
              v-for="registry in concordanceRegistries"
              :key="registry.uri"
              :registry="registry"
              :disabled="!$jskos.compareFast(registry, currentConcordanceRegistry)"
              class="mappingBrowser-search-registryNotation pointer"
              @click.native="$store.commit({
                type: 'settings/set',
                prop: 'mappingRegistry',
                value: registry.uri
              })" />
          </div>
          <concordance-editor-modal
            ref="concordanceEditorModal"
            :concordance="concordanceToEdit" />
          <div style="display: flex; padding: 0px 4px;">
            <div
              v-for="field in concordanceTableFields"
              :key="field.key"
              :style="'padding: 0px 10px 0px 0px; flex: 0 0 ' + field.width">
              <b-input
                v-if="field.key == 'from'"
                v-model="concordanceFilter.from"
                type="text"
                style="width: 55%; display: inline-block;"
                size="sm"
                :placeholder="$t('mappingBrowser.from')" />
              <b-input
                v-if="field.key == 'to'"
                v-model="concordanceFilter.to"
                type="text"
                style="width: 75%; display: inline-block;"
                size="sm"
                :placeholder="$t('mappingBrowser.to')" />
              <b-input
                v-if="field.key == 'creator'"
                v-model="concordanceFilter.creator"
                type="text"
                style="width: 80%; display: inline-block;"
                size="sm"
                :placeholder="$t('mappingBrowser.creator')" />
              <span
                v-if="concordanceFilter[field.key] != null"
                v-b-tooltip.hover="{ title: 'clear filter', delay: defaults.delay.medium }"
                icon="times"
                class="button mappingBrowser-from650"
                @click="concordanceFilter[field.key] = ''">
                x
              </span>
              <b-button
                v-if="field.key == 'from'"
                class="mappingBrowser-from750"
                variant="link"
                size="sm"
                style="padding-right: 0; margin-right: -5px;"
                tabindex="-1"
                @click="[concordanceFilter.from, concordanceFilter.to] = [concordanceFilter.to, concordanceFilter.from]">
                <font-awesome-icon icon="exchange-alt" />
              </b-button>
            </div>
          </div>
          <div style="flex: 1; height: 0; position: relative;">
            <flexible-table
              style="position: absolute; top: 0; bottom: 0; left: 0; right: 0;"
              :fields="concordanceTableFields"
              :items="concordanceTableItems"
              :sort-by="'date'"
              :sort-direction="-1">
              <span
                slot="mappings"
                slot-scope="{ item, value }">
                {{ (isNaN(value) ? "?" : value).toLocaleString() }}
                <font-awesome-icon
                  v-b-tooltip.hover="{ title: $t('mappingBrowser.showMappings'), delay: defaults.delay.medium }"
                  icon="external-link-square-alt"
                  class="button"
                  @click="showMappingsForConcordance(item.concordance)" />
              </span>
              <span
                slot="actions"
                slot-scope="{ item }">
                <div class="mappingBrowser-toolbar-button">
                  <font-awesome-icon
                    v-if="canUpdateConcordance({ concordance: item.concordance })"
                    v-b-tooltip.hover="{ title: $t('mappingBrowser.editConcordanceTooltip'), delay: defaults.delay.medium }"
                    icon="edit"
                    class="button"
                    @click="editConcordance(item.concordance)" />
                  <font-awesome-icon
                    v-else-if="isCreatorOrContributor(item.concordance, user) && item.concordance._registry.isAuthorizedFor({
                      type: 'mappings',
                      action: 'update',
                      user,
                    })"
                    v-b-tooltip="$t('mappingBrowser.canSaveIntoConcordanceTooltip')"
                    class="button"
                    style="font-size: 12px;"
                    icon="pencil-alt" />
                </div>
                <div class="mappingBrowser-toolbar-button">
                  <font-awesome-icon
                    v-b-tooltip.hover="{ title: $t('mappingBrowser.showConcordanceDetail'), delay: defaults.delay.medium }"
                    icon="info-circle"
                    class="button"
                    @click="(concordanceToEdit = item.concordance) && $refs.concordanceDetail.show()" />
                </div>
              </span>
              <span
                slot="from"
                slot-scope="{ value }">
                <item-name
                  :item="value"
                  :show-text="false"
                  :is-link="value.__SAVED__ === true"
                  :is-left="true"
                  font-size="sm" />
              </span>
              <span
                slot="to"
                slot-scope="{ value }">
                <item-name
                  :item="value"
                  :show-text="false"
                  :is-link="value.__SAVED__"
                  :is-left="false"
                  font-size="sm" />
              </span>
              <span
                slot="creator"
                slot-scope="{ value }">
                {{ value }}
              </span>
              <span
                slot="date"
                slot-scope="{ value }">
                <date-string :date="value" />
              </span>
            </flexible-table>
          </div>
          <div style="display: flex;">
            <p style="font-weight: bold; flex: 1; padding-left: 5px;">
              {{ concordanceTableItems.length }} {{ $t("mappingBrowser.concordances") }}
            </p>
            <p style="text-align: right; font-weight: bold; padding-right: 45px;">
              {{ $t("mappingBrowser.total") }}: {{ concordanceTableItems.reduce((total, current) => {
                return total + current.mappings || 0
              }, 0).toLocaleString() }} {{ $t("general.of") }} {{ totalNumberOfMappings && totalNumberOfMappings.toLocaleString() || "?" }}
            </p>
            <data-modal-button
              v-if="concordances && concordances.length > 0"
              :data="concordances"
              :position-right="20"
              :url="concordanceUrls"
              type="concordance" />
            <!-- Concordance detail modal -->
            <concordance-detail
              ref="concordanceDetail"
              :concordance="concordanceToEdit" />
          </div>
        </template>
      </tab>
      <tab
        :title="$t('mappingBrowser.mappingSearch')"
        @click="handleClick">
        <div style="flex: none; padding: 0px 4px;">
          <div style="display: flex; flex-wrap: wrap;">
            <b-input
              v-model="searchFilterInput.fromScheme"
              :state="searchFilterInput.fromScheme == '' ? null : searchFromScheme != null"
              style="flex: 1; margin: 3px; min-width: 40px;"
              size="sm"
              :placeholder="$t('mappingBrowser.searchSourceScheme')"
              @keyup.native="lockScheme[true] = false"
              @keyup.enter.native="searchClicked"
              @drop="!lockScheme[true] && drop($event, { scheme: 'searchFilterInput.fromScheme', concept: 'searchFilterInput.fromNotation' })" />
            <div
              v-b-tooltip="lockScheme[true] ? $t('mappingBrowser.unlockScheme') : $t('mappingBrowser.lockScheme')"
              class="button"
              style="flex: none; font-size: 12px; margin: auto 8px auto 2px;"
              @click="lockScheme[true] = !lockScheme[true]">
              <font-awesome-icon :icon="lockScheme[true] ? 'lock' : 'lock-open'" />
            </div>
            <b-input
              v-model="searchFilterInput.fromNotation"
              style="flex: 2; margin: 3px; min-width: 60px;"
              size="sm"
              :placeholder="$t('mappingBrowser.searchSourceNotation')"
              @keyup.enter.native="searchClicked"
              @drop="drop($event, { scheme: lockScheme[true] ? null : 'searchFilterInput.fromScheme', concept: 'searchFilterInput.fromNotation' })" />
            <div
              class="button"
              style="flex: none; font-size: 16px; margin: auto 5px;"
              @click="swapClicked">
              <font-awesome-icon icon="exchange-alt" />
            </div>
            <b-input
              v-model="searchFilterInput.toScheme"
              :state="searchFilterInput.toScheme == '' ? null : searchToScheme != null"
              style="flex: 1; margin: 3px; min-width: 40px;"
              size="sm"
              :placeholder="$t('mappingBrowser.searchTargetScheme')"
              @keyup.native="lockScheme[false] = false"
              @keyup.enter.native="searchClicked"
              @drop="!lockScheme[false] && drop($event, { scheme: 'searchFilterInput.toScheme', concept: 'searchFilterInput.toNotation' })" />
            <div
              v-b-tooltip="lockScheme[false] ? $t('mappingBrowser.unlockScheme') : $t('mappingBrowser.lockScheme')"
              class="button"
              style="flex: none; font-size: 12px; margin: auto 8px auto 2px;"
              @click="lockScheme[false] = !lockScheme[false]">
              <font-awesome-icon :icon="lockScheme[false] ? 'lock' : 'lock-open'" />
            </div>
            <b-input
              v-model="searchFilterInput.toNotation"
              style="flex: 2; margin: 3px; min-width: 60px;"
              size="sm"
              :placeholder="$t('mappingBrowser.searchTargetNotation')"
              @keyup.enter.native="searchClicked"
              @drop="drop($event, { scheme: lockScheme[false] ? null : 'searchFilterInput.toScheme', concept: 'searchFilterInput.toNotation' })" />
            <b-button
              style="flex: none; margin: 3px;"
              variant="primary"
              size="sm"
              @click="searchClicked">
              <font-awesome-icon icon="search" />{{ $t("mappingBrowser.searchSubmit") }}
            </b-button>
            <div
              v-b-tooltip="{
                title: $t(`mappingBrowser.${searchFilterExtended ? 'searchCollapse' : 'searchExtend'}`),
                placement: searchFilterExtended ? 'left' : 'bottom',
              }"
              class="button fontSize-large"
              style="flex: none; margin: 3px; position: relative; width: 20px;"
              @click="searchFilterExtended = !searchFilterExtended">
              <font-awesome-icon
                v-if="searchFilterExtended"
                style="vertical-align: -0.3em;"
                icon="chevron-up" />
              <font-awesome-icon
                v-else
                style="vertical-align: -0.3em;"
                icon="filter" />
              <!-- Small indicator whether a filter is currently applied. -->
              <span
                v-if="!searchFilterExtended && (searchFilterInput.creator || searchFilterInput.type || searchFilterInput.partOf)"
                style="position: absolute; top: -9px; right: -3px;"
                class="text-success">
                •
              </span>
            </div>
            <template v-if="searchFilterExtended">
              <div style="flex-basis: 100%; height: 0;" />
              <div style="text-align: right; flex: none; margin: auto 5px;">
                {{ $t("mappingBrowser.creator") }}:
              </div>
              <div style="flex: 2; margin: 3px; display: flex; align-items: center;">
                <b-input
                  v-model="searchFilterInput.creator"
                  size="sm"
                  :placeholder="$t('mappingBrowser.creator')"
                  @keyup.enter.native="searchClicked" />
                <div
                  v-if="authorized && searchFilterInput.creator != userUris.join('|')"
                  v-b-tooltip.hover="{ title: $t('mappingBrowser.searchInsertSelfIntoCreator'), delay: defaults.delay.medium }"
                  class="button"
                  style="margin-left: 2px;"
                  @click="searchFilterInput.creator = userUris.join('|')">
                  <font-awesome-icon icon="user" />
                </div>
              </div>
              <div style="text-align: right; flex: none; margin: auto 5px;">
                {{ $t("mappingBrowser.searchType") }}:
              </div>
              <b-select
                v-model="searchFilterInput.type"
                style="flex: 3; margin: 3px;"
                size="sm"
                :options="typeOptions"
                @keyup.enter.native="searchClicked" />
              <div
                v-b-tooltip.hover="{ title: $t('mappingBrowser.searchBidirectionalTooltip'), delay: defaults.delay.medium }"
                style="text-align: right; flex: none; margin: auto 5px;">
                {{ $t("mappingBrowser.searchBidirectional") }}:
                <b-form-checkbox
                  v-model="searchFilterInput.direction"
                  style="display: inline-block;"
                  size="sm"
                  value="both"
                  unchecked-value=""
                  @keyup.enter.native="searchClicked" />
              </div>
              <div style="flex-basis: 100%; height: 0;" />
              <div style="text-align: right; flex: none; margin: auto 5px;">
                {{ $t("mappingBrowser.searchCardinality") }}:
              </div>
              <b-form-select
                v-model="searchFilterInput.cardinality"
                style="flex: 1; margin: 3px;"
                size="sm"
                :options="cardinalityOptions"
                @keyup.enter.native="searchClicked" />
              <div style="text-align: right; flex: none; margin: auto 5px;">
                {{ $t("mappingBrowser.searchAnnotated") }}:
              </div>
              <b-form-select
                v-model="searchFilterInput.annotated"
                style="flex: 1; margin: 3px;"
                size="sm"
                :options="annotatedOptions"
                @keyup.enter.native="searchClicked" />
              <div style="flex-basis: 100%; height: 0;" />
              <div style="text-align: right; flex: none; margin: auto 5px;">
                {{ $t("mappingBrowser.concordance") }}:
              </div>
              <b-form-select
                v-model="searchFilterInput.partOf"
                style="flex: 2; margin: 3px;"
                size="sm"
                :options="concordanceOptions"
                @keyup.enter.native="searchClicked" />
              <!-- Registry selection -->
              <registry-notation
                v-for="registry in searchRegistries"
                :key="registry.uri"
                :registry="registry"
                :disabled="!showRegistry[registry.uri]"
                class="mappingBrowser-search-registryNotation"
                :class="{
                  pointer: !$jskos.compareFast(registry, currentRegistry)
                }"
                @click.native="showRegistry[registry.uri] = !showRegistry[registry.uri]"
                @mouseover.native="hoveredRegistry = registry"
                @mouseout.native="hoveredRegistry = null" />
              <b-button
                style="flex: none; margin: 3px;"
                variant="danger"
                size="sm"
                @click="clearSearchFilter">
                <font-awesome-icon icon="ban" />
                {{ $t("mappingBrowser.searchClear") }}
              </b-button>
            </template>
          </div>
        </div>
        <mapping-browser-table
          v-if="searchSections.length"
          class="mappingBrowser-search-table"
          :sections="searchSections"
          :search-limit="componentSettings.resultLimit"
          :show-editing-tools="showEditingTools"
          :show-cocoda-link="showCocodaLink"
          :registry-has-errored="registryHasErrored"
          @pageChange="changePage('search', $event)" />
        <div
          v-else
          class="fontWeight-heavy"
          style="text-align: center; margin-top: 20px;">
          {{ $t("search.noResults") }}
        </div>
        <!-- Share button -->
        <div
          id="mappingBrowser-search-shareButton"
          class="button">
          <font-awesome-icon icon="share-alt-square" /> {{ $t("mappingBrowser.searchShareLabel") }}
        </div>
        <b-popover
          :show.sync="searchShareShow"
          target="mappingBrowser-search-shareButton"
          triggers="click"
          placement="bottomleft">
          <div
            ref="searchSharePopover">
            <p><b>{{ $t("mappingBrowser.searchShareTitle") }}</b></p>
            <p style="user-select: none;">
              <b-form-checkbox
                v-model="searchShareIncludeSelected">
                {{ $t("mappingBrowser.searchShareInclude") }}
              </b-form-checkbox>
            </p>
            <p id="mappingBrowser-search-shareLinkInput">
              <pre><code>{{ searchShareLink }}</code></pre>
            </p>
            <p style="text-align: right;">
              <b-button
                size="sm"
                variant="primary"
                @click="copyToClipboard('mappingBrowser-search-shareLinkInput')">
                {{ $t("mappingBrowser.searchShareCopy") }}
              </b-button>
            </p>
          </div>
        </b-popover>
      </tab>
      <tab
        v-if="showNavigator"
        :title="$t('mappingBrowser.mappingNavigator')"
        @click="handleClick">
        <div
          v-show="!selected.concept[true] && !selected.concept[false]"
          class="noItems fontWeight-heavy">
          {{ $t("mappingBrowser.chooseConcept") }}
        </div>
        <div
          v-if="selected.concept[true] || selected.concept[false]"
          class="mappingBrowser-navigator-results">
          <div
            v-for="group of registryGroups"
            :key="`mappingBrowser-registryGroup-${group.stored}`"
            class="mappingBrowser-registryGroup">
            <div class="mappingBrowser-registryGroup-header">
              <span
                :id="`registryGroup-${group.stored}`"
                class="mappingBrowser-registryGroup-title fontWeight-heavy">
                {{ group.label }}
              </span>
              <span
                style="white-space: nowrap; float: right">
                <registry-notation
                  v-for="registry in group.registries.filter(registry => $jskos.isContainedIn(registry, navigatorRegistries))"
                  :key="registry.uri"
                  :registry="registry"
                  :disabled="!showRegistry[registry.uri]"
                  class="mappingBrowser-registryGroup-notation"
                  :class="{
                    pointer: !$jskos.compareFast(registry, currentRegistry)
                  }"
                  @click.native="showRegistry[registry.uri] = !showRegistry[registry.uri]"
                  @mouseover.native="hoveredRegistry = registry"
                  @mouseout.native="hoveredRegistry = null" />
              </span>
            </div>
            <mapping-browser-table
              v-if="(group.stored ? navigatorSectionsDatabases : navigatorSectionsRecommendations).length"
              :sections="group.stored ? navigatorSectionsDatabases : navigatorSectionsRecommendations"
              :search-limit="componentSettings.resultLimit"
              :registry-has-errored="registryHasErrored"
              @pageChange="changePage('navigator', $event)" />
            <div
              v-else-if="selected.concept[true] || selected.concept[false]"
              class="fontWeight-heavy"
              style="text-align: center; margin-top: 20px;">
              {{ $t("search.noResults") }}
            </div>
          </div>
        </div>
      </tab>
    </tabs>
  </div>
</template>

<script>
import MappingBrowserTable from "./MappingBrowserTable.vue"
import FlexibleTable from "vue-flexible-table"
import RegistryNotation from "./RegistryNotation.vue"
import ItemName from "./ItemName.vue"
import ComponentSettings from "./ComponentSettings.vue"
import DataModalButton from "./DataModalButton.vue"
import ConcordanceEditorModal from "./ConcordanceEditorModal.vue"
import ConcordanceDetail from "./ConcordanceDetail.vue"
import DateString from "./DateString.vue"
import _ from "lodash"
// Only use for cancel token generation!
import axios from "axios"

// Import mixins
import auth from "@/mixins/auth.js"
import objects from "@/mixins/cdk.js"
import dragandrop from "@/mixins/dragandrop.js"
import clickHandler from "@/mixins/click-handler.js"
import computed from "@/mixins/computed.js"
import pageVisibility from "@/mixins/page-visibility.js"
import { getItem, getItems, loadConcepts } from "@/items"

export default {
  name: "MappingBrowser",
  components: { FlexibleTable, MappingBrowserTable, RegistryNotation, ItemName, ComponentSettings, DataModalButton, ConcordanceEditorModal, ConcordanceDetail, DateString },
  mixins: [auth, objects, dragandrop, clickHandler, computed, pageVisibility],
  props: {
    /**
     * If false, the Mapping Navigator will be hidden.
     */
    showNavigator: {
      type: Boolean,
      default: true,
    },
    /**
     * If false, no editing tools will be shown (gets relayed to MappingBrowserTable).
     */
    showEditingTools: {
      type: Boolean,
      default: true,
    },
    /**
     * If true, a link to Cocoda for mappings will be shown (gets relayed to MappingBrowserTable).
     */
    showCocodaLink: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      tab: 0,
      concordancesLoaded: false,
      totalNumberOfMappings: null,
      /** Whether tab was automatically switched to Mapping Navigator once.
       *  Will not switch automatically again afterwards.
       */
      hasSwitchedToNavigator: false,
      searchShareShow: false,
      searchShareLinkPart: "",
      searchShareIncludeSelected: false,
      registryGroupShow: {},
      concordanceFilter: {
        from: "",
        to: "",
        creator: "",
      },
      // Search filter directly from input
      searchFilterInput: null,
      // Search filter to be set when "Search" is clicked
      searchFilter: null,
      searchFilterExtended: false,
      searchPages: {},
      searchResults: {},
      searchLoading: {},
      searchCancelToken: {},
      // Array of objects with registryUri and page (as parameters for search)
      searchNeedsRefresh: [],
      // Whether fromScheme/toScheme are locked to the selected scheme
      lockScheme: {
        [true]: true,
        [false]: true,
      },
      previousSelected: {
        concept: {
          [true]: null,
          [false]: null,
        },
        scheme: {
          [true]: null,
          [false]: null,
        },
      },
      navigatorPages: {},
      navigatorResults: {},
      navigatorLoading: {},
      // Array of booleans and/or registry URIs (as parameters for navigatorRefresh)
      navigatorNeedsRefresh: [],
      navigatorCancelToken: {},
      /** Currently hovered registry */
      hoveredRegistry: null,
      /** An object of repeat managers for registries for search */
      searchRepeatManagers: {},
      /** An object of repeat managers for registries for navigator */
      navigatorRepeatManagers: {},
      // Repeat manager for concordances
      concordancesRepeatManager: null,
      // An object of error statuses for registries
      registryHasErrored: {},
      concordanceToEdit: null,
    }
  },
  computed: {
    concordanceTableFields() {
      return [
        {
          key: "from",
          label: this.$t("mappingBrowser.from"),
          width: "13%",
          minWidth: "",
          sortable: true,
          align: "left",
          titleClass: "test",
        },
        {
          key: "to",
          label: this.$t("mappingBrowser.to"),
          width: "9%",
          minWidth: "",
          sortable: true,
          align: "left",
        },
        {
          key: "description",
          label: this.$t("mappingBrowser.description"),
          width: "30%",
          minWidth: "",
          sortable: true,
          align: "left",
          class: "mappingBrowser-from550",
        },
        {
          key: "creator",
          label: this.$t("mappingBrowser.creator"),
          width: "16%",
          minWidth: "",
          sortable: true,
          align: "left",
        },
        {
          key: "date",
          label: this.$t("mappingBrowser.date"),
          width: "10%",
          minWidth: "",
          sortable: true,
          align: "left",
          class: "mappingBrowser-from550",
        },
        {
          key: "mappings",
          label: this.$t("registryInfo.mappings"),
          width: "11%",
          minWidth: "",
          sortable: true,
          align: "right",
          compare: (a, b) => (parseInt(a.mappings) || 0) - (parseInt(b.mappings) || 0),
        },
        {
          key: "actions",
          label: "",
          width: "11%",
          sortable: false,
          align: "right",
          class: "mappingBrowser-actions",
        },
      ]
    },
    concordanceTableItems() {
      let items = []
      for (let concordance of (this.concordances || []).filter(c => this.$jskos.compare(c._registry, this.currentConcordanceRegistry))) {
        let item = { concordance }
        item.from = _.get(concordance, "fromScheme")
        item.from = getItem(item.from) || item.from
        item.fromNotation = this.$jskos.notation(item.from) || "-"
        item.to = _.get(concordance, "toScheme")
        item.to = getItem(item.to) || item.to
        item.toNotation = this.$jskos.notation(item.to) || "-"
        item.description = (this.$jskos.languageMapContent(concordance, "scopeNote", { language: this.locale }) || [])[0] || _.get(concordance, "notation[0]") || "-"
        item.creator = this.$jskos.prefLabel(_.get(concordance, "creator[0]"), { fallbackToUri: false }) || "-"
        item.date = _.get(concordance, "modified") || _.get(concordance, "created") || ""
        item.download = _.get(concordance, "distributions", [])
        item.mappings = parseInt(_.get(concordance, "extent"))
        if (item.fromNotation.toLowerCase().startsWith(this.concordanceFilter.from.toLowerCase()) && item.toNotation.toLowerCase().startsWith(this.concordanceFilter.to.toLowerCase()) && item.creator.toLowerCase().startsWith(this.concordanceFilter.creator.toLowerCase())) {
          items.push(item)
        }
      }
      return items
    },
    concordancesShown() {
      return !this.concordances || (this.concordances && this.concordances.length)
    },
    tabIndexes() {
      let indexes = {
        concordances: this.concordancesShown ? 0 : null,
        search: this.concordancesShown ? 1 : 0,
        navigator: this.concordancesShown ? 2 : 1,
      }
      if (!this.showNavigator) {
        delete indexes.navigator
      }
      return indexes
    },
    typeOptions() {
      let options = [{
        text: this.$t("mappingBrowser.searchAllTypes"),
        value: null,
      }]
      for (let type of this.$jskos.mappingTypes) {
        options.push({
          text: `${this.$jskos.notation(type)} ${this.$jskos.prefLabel(type)}`,
          value: type.uri,
        })
      }
      return options
    },
    cardinalityOptions() {
      return [
        {
          text: this.$t("mappingBrowser.searchCardinality1n"),
          value: "1-to-n",
        },
        {
          text: this.$t("mappingBrowser.searchCardinality11"),
          value: "1-to-1",
        },
      ]
    },
    annotatedOptions() {
      return [
        { value: null, text: "-" },
        { value: { annotatedFor: "assessing" }, text: this.$t("mappingBrowser.searchAnnotatedAssessingAny") },
        { value: { annotatedFor: "assessing", annotatedWith: "+1" }, text: this.$t("mappingBrowser.searchAnnotatedAssessingPlus") },
        { value: { annotatedFor: "assessing", annotatedWith: "-1" }, text: this.$t("mappingBrowser.searchAnnotatedAssessingMinus") },
        { value: { annotatedFor: "!assessing" }, text: this.$t("mappingBrowser.searchAnnotatedNotAssessing") },
        { value: { annotatedFor: "moderating" }, text: this.$t("mappingBrowser.searchAnnotatedConfirmed") },
        { value: { annotatedFor: "!moderating" }, text: this.$t("mappingBrowser.searchAnnotatedNotConfirmed") },
        { value: { annotatedFor: "none" }, text: this.$t("mappingBrowser.searchAnnotatedNone") },
      ]
    },
    concordanceOptions() {
      let options = [
        { value: null, text: "-" },
        { value: "any", text: this.$t("mappingBrowser.searchConcordancesAny") },
        { value: "none", text: this.$t("mappingBrowser.searchConcordancesNone") },
      ]

      for (let item of this.concordanceTableItems) {
        let text = `${item.fromNotation} to ${item.toNotation} (${item.description})`
        options.push({
          value: item.concordance.uri,
          text,
        })
      }

      return options
    },
    searchFromScheme() {
      return this.getSchemeForFilter(this.searchFilterInput.fromScheme)
    },
    searchToScheme() {
      return this.getSchemeForFilter(this.searchFilterInput.toScheme)
    },
    needsRefresh() {
      return this.$store.state.mapping.mappingsNeedRefresh
    },
    searchRegistries() {
      return _.get(this.registryGroups.find(group => group.stored), "registries", [])
    },
    mappingRegistriesSorted() {
      return _.flatten(this.registryGroups.map(group => group.registries))
    },
    navigatorRegistries() {
      return this.mappingRegistriesSorted.filter(registry =>
        (registry.supportsScheme && registry.supportsScheme(getItem(this.selected.scheme[true]))) ||
        (registry.supportsScheme && registry.supportsScheme(getItem(this.selected.scheme[false]))),
      )
    },
    registryGroups() {
      let groups = [
        {
          stored: true,
          label: this.$t("general.storedMappings"),
          registries: [],
        },
        {
          stored: false,
          label: this.$t("general.recommendedMappings"),
          registries: [],
        },
      ]
      for (let registry of this.mappingRegistries) {
        let group = groups.find(group => group.stored === this.$jskos.mappingRegistryIsStored(registry))
        group.registries.push(registry)
      }
      groups = groups.filter(group => group.registries.length > 0)
      // Move current registry to top
      for (let group of groups) {
        group.registries = group.registries.sort((a, b) => {
          if (this.$jskos.compareFast(a, this.currentRegistry)) {
            return -1
          }
          if (this.$jskos.compareFast(b, this.currentRegistry)) {
            return 1
          }
          return 0
        })
      }
      return groups
    },
    searchSections () {
      return this.resultsToSections(this.searchResults, this.searchPages, this.searchLoading, "mappingSearch-")
    },
    navigatorSections() {
      return this.resultsToSections(this.navigatorResults, this.navigatorPages, this.navigatorLoading, "mappingNavigator-")
    },
    navigatorSectionsDatabases () {
      return this.navigatorSections.filter(section => this.$jskos.mappingRegistryIsStored(section.registry))
    },
    navigatorSectionsRecommendations () {
      return this.navigatorSections.filter(section => !this.$jskos.mappingRegistryIsStored(section.registry))
    },
    searchShareLink () {
      let url = this.searchShareIncludeSelected ? window.location.href : window.location.href.split("?")[0]
      url += `${url.includes("?") ? "&" : "?"}${this.searchShareLinkPart}`
      return url
    },
    concordanceUrls() {
      let urls = {}
      for (let registry of this.concordanceRegistries) {
        if (registry.has.concordances !== false && registry._api.concordances) {
          urls[this.$jskos.prefLabel(registry)] = registry._api.concordances
        }
      }
      return urls
    },
    autoRefresh() {
      let autoRefresh = this.componentSettings.autoRefresh === undefined ? this.config.autoRefresh.mappings : this.componentSettings.autoRefresh * 1000
      if (autoRefresh) {
        autoRefresh = Math.max(autoRefresh, 5000)
      }
      return autoRefresh
    },
  },
  watch: {
    tab(tab, previousTab) {
      if (tab == this.tabIndexes.search) {
        // Unpause repeat managers
        for (let manager of Object.values(this.searchRepeatManagers)) {
          manager && manager.isPaused && manager.start()
        }
        // Changed tab to Mapping Search, refresh if necessary
        if (this.searchNeedsRefresh.length) {
          // If there's only one item, just run it
          if (this.searchNeedsRefresh.length == 1) {
            this.search(this.searchNeedsRefresh[0].registryUri, this.searchNeedsRefresh[0].page)
            return
          }
          if (this.searchNeedsRefresh.find(option => !option.registryUri)) {
            // Refresh all registries
            this.search()
          } else {
            // Refresh some registries
            let registryUris = _.uniq(this.searchNeedsRefresh.map(option => option.registryUri))
            for (let registryUri of registryUris) {
              // Use current page for that registry
              this.search(registryUri, this.searchPages[registryUri])
            }
          }
        }
      } else if (tab == this.tabIndexes.navigator) {
        // Changed tab to Mapping Navigator
        // Unpause repeat managers
        for (let manager of Object.values(this.navigatorRepeatManagers)) {
          manager && manager.isPaused && manager.start()
        }
        // refresh if necessary
        this.navigatorRefresh()
      } else if (tab == this.tabIndexes.concordances) {
        // Unpause repeat manager
        this.concordancesRepeatManager && this.concordancesRepeatManager.isPaused && this.concordancesRepeatManager.start()
      }
      // Pause repeat managers if necessary
      if (previousTab == this.tabIndexes.search) {
        for (let manager of Object.values(this.searchRepeatManagers)) {
          manager && !manager.isPaused && manager.stop()
        }
      }
      if (previousTab == this.tabIndexes.navigator) {
        for (let manager of Object.values(this.navigatorRepeatManagers)) {
          manager && !manager.isPaused && manager.stop()
        }
      }
      if (previousTab == this.tabIndexes.concordances) {
        this.concordancesRepeatManager && !this.concordancesRepeatManager.isPaused && this.concordancesRepeatManager.stop()
      }
    },
    isPageVisible(visible) {
      if (visible) {
        // Unpause repeat managers if necessary
        if (this.tab == this.tabIndexes.search) {
          for (let manager of Object.values(this.searchRepeatManagers)) {
            manager && manager.isPaused && manager.start()
          }
        } else if (this.tab == this.tabIndexes.navigator) {
          for (let manager of Object.values(this.navigatorRepeatManagers)) {
            manager && manager.isPaused && manager.start()
          }
        } else if (this.tab == this.tabIndexes.concordances) {
          this.concordancesRepeatManager && this.concordancesRepeatManager.isPaused && this.concordancesRepeatManager.start()
        }
      } else {
        // Pause all repeat managers
        for (let manager of [].concat(Object.values(this.searchRepeatManagers), Object.values(this.navigatorRepeatManagers), this.concordancesRepeatManager)) {
          manager && !manager.isPaused && manager.stop()
        }
      }
    },
    navigatorNeedsRefresh(value) {
      if (value.length > 0 && this.tab == this.tabIndexes.navigator) {
        this.navigatorRefresh()
      }
    },
    selected: {
      handler() {
        // Refresh navigator if anything has actually changed
        if (!(
          this.$jskos.compareFast(this.selected.concept[true], this.previousSelected.concept[true]) &&
          this.$jskos.compareFast(this.selected.concept[false], this.previousSelected.concept[false]) &&
          this.$jskos.compareFast(this.selected.scheme[true], this.previousSelected.scheme[true]) &&
          this.$jskos.compareFast(this.selected.scheme[false], this.previousSelected.scheme[false])
        )) {
          this.selectedChangedHandler()
        }
      },
      deep: true,
    },
    needsRefresh(refresh) {
      if (refresh) {
        let registry = this.$store.state.mapping.mappingsNeedRefreshRegistry
        if (registry) {
          this.navigatorNeedsRefresh.push(registry)
          this.search(registry, this.searchPages[registry])
        } else {
          this.navigatorNeedsRefresh.push(null)
          this.search()
        }
        this.$store.commit("mapping/setRefresh", { refresh: false })
      }
    },
    currentRegistry(registry) {
      if (!registry) {
        return
      }
      // Enable registry
      this.showRegistry[registry.uri] = true
      // Scroll to top of list as current registry is always shown at the top
      for (let element of document.getElementsByClassName("flexibleTable-body")) {
        element.scrollTop = 0
      }
    },
    locale(newValue, oldValue) {
      if (newValue != oldValue) {
        // Refresh all mapping recommendations (as they might include labels in a certain language)
        for (let registry of this.navigatorRegistries.filter(registry =>
          !this.$jskos.mappingRegistryIsStored(registry)
          && this.showRegistry[registry.uri],
        )) {
          this.navigatorNeedsRefresh.push(registry.uri)
        }
      }
    },
    lockScheme: {
      handler() {
        let changed = false
        for (let [fromTo, isLeft] of [["from", true], ["to", false]]) {
          if (this.lockScheme[isLeft]) {
            const scheme = getItem(this.selected.scheme[isLeft])
            this.searchFilterInput[`${fromTo}Scheme`] = scheme ? this.$jskos.notation(scheme) : ""
            changed = true
          }
        }
        if (changed) {
          this.searchClicked()
        }
      },
      deep: true,
    },
    "componentSettings.resultLimit"(newValue, oldValue) {
      // Refresh when resultLimit changes
      // Note: This is a workaround so that page numbers get adjusted according to the page chage.
      let type
      if (this.tab == this.tabIndexes.search) {
        type = "search"
      } else if (this.tab == this.tabIndexes.navigator) {
        type = "navigator"
      }
      if (type) {
        for (let registryUri of Object.keys(this[`${type}Results`])) {
          let previousPage = this[`${type}Pages`][registryUri] || 1
          let previousFirstIndex = (previousPage - 1) * oldValue
          let newPage = Math.floor(previousFirstIndex / newValue) + 1
          if (type == "search") {
            this.search(registryUri, newPage)
          } else {
            this.$set(this.navigatorPages, registryUri, newPage)
            this.navigatorNeedsRefresh.push(registryUri)
          }
        }
      }
    },
    "componentSettings.showAllSchemes"() {
      // Refresh when showAllSchemes changes
      this.$store.commit("mapping/setRefresh")
    },
    "componentSettings.navigatorShowResultsForLeft"() {
      // Refresh when navigatorShowResultsForLeft changes
      this.$store.commit("mapping/setRefresh")
    },
    "componentSettings.navigatorShowResultsForRight"() {
      // Refresh when navigatorShowResultsForRight changes
      this.$store.commit("mapping/setRefresh")
    },
    autoRefresh() {
      // Refresh when autoRefresh changes
      // Note: If we just set mapping/setRefresh, the page numbers will jump to 1.
      let type
      if (this.tab == this.tabIndexes.search) {
        type = "search"
      } else if (this.tab == this.tabIndexes.navigator) {
        type = "navigator"
      }
      if (type) {
        for (let registryUri of Object.keys(this[`${type}Results`])) {
          if (type == "search") {
            this.search(registryUri, this.searchPages[registryUri])
          } else {
            this.navigatorNeedsRefresh.push(registryUri)
          }
        }
      }
      if (this.concordancesRepeatManager) {
        // Set interval for concordancesRepeatManager
        this.concordancesRepeatManager.interval = this.autoRefresh * 2
      }
    },
  },
  created() {
    // Debounce navigator refresh
    this.navigatorRefresh = _.debounce(this._navigatorRefresh, 100)
    // Clear search
    this.clearSearchFilter()
    // Set tab to search on start
    this.tab = this.tabIndexes.search
  },
  async mounted() {
    if (!this.concordancesRepeatManager && this.concordanceRegistries.length) {
      if (this.autoRefresh) {
        this.concordancesRepeatManager = this.repeat({
          function: () => {
            return this.refreshConcordances()
          },
          // Refresh less often than mappings
          interval: this.autoRefresh * 2,
          callback: (error) => {
            if (error) {
              this.$log.warn("Mapping Browser (Concordances): Error during refresh", error)
            }
            // No action necessary since concordances are already updated
          },
        })
      } else {
        this.refreshConcordances()
      }
    }
    this.selectedChangedHandler()
  },
  beforeDestroy() {
    // Stop any repeat managers
    for (let manager of [].concat(Object.values(this.searchRepeatManagers), Object.values(this.navigatorRepeatManagers), this.concordancesRepeatManager)) {
      manager && !manager.isPaused && manager.stop()
    }
  },
  methods: {
    clickHandlers() {
      let popovers = []
      // Registry group popovers
      for (let group of this.registryGroups) {
        popovers.push({
          elements: [
            _.get(this.$refs[`registryGroup-${group.stored}-popover`], "[0]"),
            document.getElementById(`registryGroup-${group.stored}`),
          ],
          handler: () => {
            this.$set(this.registryGroupShow, group.stored, false)
          },
        })
      }
      // Search Link popover
      popovers.push({
        elements: [
          this.$refs.searchSharePopover,
          document.getElementById("mappingBrowser-search-shareButton"),
        ],
        handler: () => {
          // eslint-disable-next-line vue/no-side-effects-in-computed-properties
          this.searchShareShow = false
        },
      })
      return popovers
    },
    selectedChangedHandler() {
      this.navigatorPages = {}
      this.navigatorResults = {}
      this.navigatorNeedsRefresh.push(null)
      // Also adjust fromScheme/toScheme if locked
      let changed = false
      for (let [fromTo, isLeft] of [["from", true], ["to", false]]) {
        if (this.lockScheme[isLeft] && !this.$jskos.compareFast(this.selected.scheme[isLeft], this.previousSelected.scheme[isLeft])) {
          const scheme = getItem(this.selected.scheme[isLeft])
          this.searchFilterInput[`${fromTo}Scheme`] = scheme ? this.$jskos.notation(scheme) : ""
          changed = true
        }
      }
      if (changed) {
        this.searchClicked()
      }
      // Set previousSelected
      this.previousSelected = {}
      this.previousSelected.concept = {
        [true]: this.selected.concept[true] ? { uri: this.selected.concept[true].uri } : null,
        [false]: this.selected.concept[false] ? { uri: this.selected.concept[false].uri } : null,
      }
      this.previousSelected.scheme = {
        [true]: this.selected.scheme[true] ? { uri: this.selected.scheme[true].uri } : null,
        [false]: this.selected.scheme[false] ? { uri: this.selected.scheme[false].uri } : null,
      }
      // Automatically switch tab if a concept was selected for the first time
      if (!this.hasSwitchedToNavigator && (this.selected.concept[true] || this.selected.concept[false])) {
        this.tab = this.tabIndexes.navigator
        this.hasSwitchedToNavigator = true
      }
    },
    generateCancelToken() {
      return axios.CancelToken.source()
    },
    showMappingsForConcordance(concordance) {
      // Change tab to mapping search.
      this.tab = this.tabIndexes.search
      // Clear all other search parameters.
      this.clearSearchFilter({ ignoredLock: true })
      // Change concordance.
      this.searchFilterInput.partOf = concordance.uri
      // Search.
      this.searchClicked()
    },
    getSchemeForFilter(filter) {
      return getItems(this.schemes).find(scheme => {
        return filter && (this.$jskos.compare(scheme, { uri: filter }) || this.$jskos.notation(scheme).toLowerCase() == filter.toLowerCase())
      })
    },
    clearSearchFilter({ ignoredLock = false } = {}) {
      this.searchFilterInput = {
        fromScheme: (this.searchFilterInput && this.searchFilterInput.fromScheme) || "",
        fromNotation: "",
        toScheme: (this.searchFilterInput && this.searchFilterInput.toScheme) || "",
        toNotation: "",
        creator: "",
        direction: "",
        type: null,
        cardinality: "1-to-n",
        annotated: null,
        partOf: null,
      }
      if (ignoredLock || !this.lockScheme[true]) {
        this.searchFilterInput.fromScheme = ""
      }
      if (ignoredLock || !this.lockScheme[false]) {
        this.searchFilterInput.toScheme = ""
      }
      this.searchFilterExtended = false
      this.searchResults = {}
      this.searchClicked()
    },
    searchWithParams(filter) {
      this.tab = this.tabIndexes.search
      _.forOwn(filter, (value, key) => {
        if (value != null) {
          this.searchFilterInput[key] = value
        }
      })
      this.searchClicked()
    },
    searchClicked() {
      // Copy over input search filters to search filters
      this.searchFilter = _.cloneDeep(this.searchFilterInput)
      this.search(null, 1)
    },
    search(registryUri = null, page) {
      // If it's not currently the search tab, save search refresh for later
      if (this.tab != this.tabIndexes.search) {
        this.searchNeedsRefresh.push({ registryUri, page })
        return
      }
      this.searchNeedsRefresh = []
      // If there is a concordance filter, enable relevant registries
      if (this.searchFilter.partOf) {
        let toEnable = []
        for (let concordance of this.concordances.filter(c => this.$jskos.compare(c, { uri: this.searchFilter.partOf }))) {
          let registryUri = _.get(concordance, "_registry.uri")
          if (registryUri && !toEnable.includes(registryUri)) {
            toEnable.push(registryUri)
          }
        }
        if (toEnable.length > 0) {
          for (let uri of toEnable) {
            this.showRegistry[uri] = true
          }
        }
      }
      // TODO: Use only registries that support search/filter/sort
      let registries = this.searchRegistries.filter(registry => registryUri == null || registry.uri == registryUri)
      for (let registry of registries) {
        // Cancel previous requests
        if (this.searchCancelToken[registry.uri]) {
          this.searchCancelToken[registry.uri].cancel("There was a newer refresh operation.")
        }
        // Stop previous repeat
        const manager = this.searchRepeatManagers[registry.uri]
        if (manager && !manager.isPaused) {
          manager.stop()
        }
        // Check if enabled
        if (!this.showRegistry[registry.uri]) {
          this.$delete(this.searchResults, registry.uri)
          continue
        }
        let cancelToken = this.generateCancelToken()
        this.searchCancelToken[registry.uri] = cancelToken
        // From here on, check if token is invalid:
        // if (cancelToken != this.searchCancelToken[registry.uri]) { ... }
        this.$set(this.searchPages, registry.uri, page)
        this.$set(this.searchLoading, registry.uri, true)

        const getMappings = () => this.getMappings({
          from: this.searchFilter.fromNotation,
          to: this.searchFilter.toNotation,
          fromScheme: this.getSchemeForFilter(this.searchFilter.fromScheme),
          toScheme: this.getSchemeForFilter(this.searchFilter.toScheme),
          creator: this.searchFilter.creator,
          type: this.searchFilter.type,
          direction: this.searchFilter.direction,
          cardinality: this.searchFilter.cardinality,
          annotatedFor: this.searchFilter.annotated && this.searchFilter.annotated.annotatedFor,
          annotatedWith: this.searchFilter.annotated && this.searchFilter.annotated.annotatedWith,
          partOf: this.searchFilter.partOf,
          registry: registry.uri,
          sort: "created",
          order: "desc",
          offset: ((this.searchPages[registry.uri] || 1) - 1) * this.componentSettings.resultLimit,
          limit: this.componentSettings.resultLimit,
          cancelToken: cancelToken.token,
        })
        const handleResult = mappings => {
          if (cancelToken == this.searchCancelToken[registry.uri]) {
            // Handle error
            if (!mappings) {
              this.$set(this.registryHasErrored, registry.uri, true)
              // Set results to empty array if not yet set
              if (!this.searchResults[registry.uri] || this.searchResults[registry.uri].includes(null)) {
                this.$set(this.searchResults, registry.uri, [])
              }
              this.$set(this.searchLoading, registry.uri, false)
              return
            }
            this.$set(this.registryHasErrored, registry.uri, false)
            page = page || this.searchPages[registry.uri] || 1
            if (mappings.length == 0 && page > 1) {
              // When on a later page and there were zero mappings, go back one page
              // This can happen if there was a single mapping on a page and it go deleted, or mappings got deleted from the server while browsing
              this.search(registry.uri, page - 1)
            } else {
              this.$set(this.searchResults, registry.uri, mappings)
              this.$set(this.searchLoading, registry.uri, false)
              // Workaround: Set page again because certain circumstances can cause the page in searchPages to be set to the wrong value.
              this.$set(this.searchPages, registry.uri, page)
            }
          }
        }
        // Call cdk.repeat via mixin
        if (this.autoRefresh) {
          const manager = this.repeat({
            function: () => {
              return getMappings()
            },
            interval: this.autoRefresh,
            callback: (error, mappings) => {
              if (error) {
                this.$log.warn("Mapping Browser (Search): Error during refresh", error)
              }
              handleResult(mappings)
            },
          })
          this.$set(this.searchRepeatManagers, registry.uri, manager)
        } else {
          getMappings().then(handleResult)
        }
      }

      // Set share link
      let shareFilter = {}
      _.forOwn(this.searchFilter, (value, key) => {
        if (value) {
          shareFilter[key] = value
        }
      })
      let searchParam = encodeURIComponent(JSON.stringify(shareFilter))
      this.searchShareLinkPart = `search=${searchParam}`
    },
    _navigatorRefresh() {
      if (!this.navigatorNeedsRefresh.length) {
        return
      }
      let registriesToReload
      if (this.navigatorNeedsRefresh.includes(null)) {
        // Refresh all registries
        registriesToReload = null
      } else {
        // Refresh some registries
        registriesToReload = _.uniq(this.navigatorNeedsRefresh)
      }
      this.navigatorNeedsRefresh = []

      // let conceptsToLoad = []

      // Prepare params
      let params = {
        direction: "both",
        mode: "or",
        selected: {
          scheme: {
            [true]: getItem(this.selected.scheme[true]),
            [false]: getItem(this.selected.scheme[false]),
          },
        },
      }
      let from = this.componentSettings.navigatorShowResultsForLeft ? _.get(this, "selected.concept[true]") : null
      let to = this.componentSettings.navigatorShowResultsForRight ? _.get(this, "selected.concept[false]") : null
      if (from) {
        params["from"] = from
      }
      if (to) {
        params["to"] = to
      }
      // If no concept is selected, clear navigator
      if (!from && !to) {
        this.navigatorResults = {}
        return
      }

      // If no specific registry is reloaded, reset page numbers
      if (!registriesToReload) {
        this.navigatorPages = {}
      }

      for (let registry of this.navigatorRegistries) {

        if (registriesToReload && !registriesToReload.includes(registry.uri)) {
          // Skip
          continue
        }

        // Check if enabled
        if (!this.showRegistry[registry.uri]) {
          this.$delete(this.navigatorResults, registry.uri)
          continue
        }

        // Stop previous repeat
        const manager = this.navigatorRepeatManagers[registry.uri]
        if (manager && !manager.isPaused) {
          manager.stop()
        }

        // Cancel previous refreshs
        if (this.navigatorCancelToken[registry.uri]) {
          this.navigatorCancelToken[registry.uri].cancel("There was a newer refresh operation.")
        }
        let cancelToken = this.generateCancelToken()
        this.navigatorCancelToken[registry.uri] = cancelToken
        // From here on, check if token is invalid:
        // if (cancelToken != this.navigatorCancelToken[registry.uri]) { ... }

        if (!registriesToReload) {
          this.$set(this.navigatorResults, registry.uri, [null])
        }

        const getMappings = () => this.getMappings({
          ...params,
          registry: registry.uri,
          // For recommendations: Limit results.
          // TODO: We should support proper pagination here as well!
          limit: this.$jskos.mappingRegistryIsStored(registry) ? 100 : this.componentSettings.resultLimit,
          cancelToken: cancelToken.token,
        })
        const handleResult = mappings => {
          if (cancelToken != this.navigatorCancelToken[registry.uri]) {
            return
          }
          if (!mappings) {
            this.$set(this.registryHasErrored, registry.uri, true)
            // Set results to empty array if not yet set
            if (!this.navigatorResults[registry.uri] || this.navigatorResults[registry.uri].includes(null)) {
              this.$set(this.navigatorResults, registry.uri, [])
            }
            return
          }
          this.$set(this.registryHasErrored, registry.uri, false)
          // Traditional way of sorting navigator results
          // TODO: Should be improved by getting results from sorted the server
          mappings = mappings.sort((a, b) => {
            // Sort mappings
            if (a._occurrence || b._occurrence) {
              // Sort by occurrence count descending
              return _.get(b, "_occurrence.count", 0) - _.get(a, "_occurrence.count", 0)
            }
            let points = {
              a: 10, b: 10,
            }
            _.forOwn({ a, b }, (mapping, key) => {
              let conceptsLeft = this.$jskos.conceptsOfMapping(mapping, "from")
              let conceptsRight = this.$jskos.conceptsOfMapping(mapping, "to")

              let leftIsLeft = this.$jskos.isContainedIn(this.selected.concept[true], conceptsLeft)
              let rightIsRight = this.$jskos.isContainedIn(this.selected.concept[false], conceptsRight)

              if (leftIsLeft && rightIsRight) {
                // Mapping gets full score
                return
              }
              points[key] -= 1

              let leftIsRight = this.$jskos.isContainedIn(this.selected.concept[true], conceptsRight)
              let rightIsLeft = this.$jskos.isContainedIn(this.selected.concept[false], conceptsLeft)

              if (leftIsRight && rightIsLeft) {
                // Reverse mapping gets second highest score
                return
              }
              points[key] -= 1

              if (!leftIsLeft) {
                points[key] -= 4
              }
              if (!rightIsRight) {
                points[key] -= 3
              }
              if (!rightIsLeft) {
                points[key] -= 2
              }
              if (!leftIsRight) {
                points[key] -= 1
              }
            })
            if (points.b - points.a != 0) {
              return points.b - points.a
            }
            // If the points are equal, sort by existing position.
            return mappings.indexOf(a) - mappings.indexOf(b)
          })
          // Filter mappings if showAllSchemes is off and schemes don't match
          // Note: This has to be adjusted or removed when proper pagination for navigator results is implemented!
          mappings._totalCount = undefined
          if (!this.componentSettings.showAllSchemes) {
            mappings = mappings.filter(mapping => {
              if (this.selected.scheme[true] && this.selected.scheme[false]) {
                let schemesCorrect = true
                for (let scheme of [mapping.fromScheme, mapping.toScheme]) {
                  let schemeCorrect = false
                  for (let isLeft of [true, false]) {
                    if (this.$jskos.compare(scheme, this.selected.scheme[isLeft])) {
                      schemeCorrect = true
                    }
                  }
                  schemesCorrect = schemesCorrect && schemeCorrect
                }
                return schemesCorrect
              }
              // If one side doesn't have a scheme selected, always show all
              return true
            })
          }
          this.$set(this.navigatorResults, registry.uri, mappings)
          // Check if refresh leads to an empty page and decrement page if necessary
          if (this.navigatorPages[registry.uri] > 1 && mappings.length < (this.navigatorPages[registry.uri] - 1) * this.componentSettings.resultLimit + 1) {
            this.$set(this.navigatorPages, registry.uri, this.navigatorPages[registry.uri] - 1)
          }
        }

        // Call cdk.repeat via mixin
        if (this.autoRefresh) {
          const manager = this.repeat({
            function: () => {
              return getMappings()
            },
            interval: this.autoRefresh,
            callback: (error, mappings) => {
              if (error) {
                this.$log.warn("Mapping Browser (Navigator): Error during refresh", error)
              }
              handleResult(mappings)
            },
          })
          this.$set(this.navigatorRepeatManagers, registry.uri, manager)
        } else {
          getMappings().then(handleResult)
        }
      }
    },
    swapClicked() {
      this.lockScheme[true] = false
      this.lockScheme[false] = false
      ;[this.searchFilterInput.fromScheme, this.searchFilterInput.fromNotation, this.searchFilterInput.toScheme, this.searchFilterInput.toNotation] = [this.searchFilterInput.toScheme, this.searchFilterInput.toNotation, this.searchFilterInput.fromScheme, this.searchFilterInput.fromNotation]
      this.searchClicked()
    },
    resultsToSections(results, pages, loading, keyPrefix) {
      let sections = []
      for (let registry of this.mappingRegistriesSorted.filter(registry => results[registry.uri])) {
        let section = {
          id: registry.uri,
          randomId: this.generateID(),
        }
        section.registry = registry
        // Add custom class for current registry
        if (this.$jskos.compareFast(registry, this.currentRegistry)) {
          section._class = "mappingBrowser-table-currentRegistrySection"
        }
        section.items = []
        section.loading = loading[registry.uri]
        section.page = pages[registry.uri] || 1
        let mappings = results[registry.uri] || []
        section.totalCount = mappings._totalCount || mappings.length
        // Set section.loading if there is null in the results
        if (mappings.length == 1 && mappings[0] == null) {
          section.loading = true
        }
        if (mappings._url) {
          section.url = mappings._url
        }
        // Concept information possibly needs to be loaded
        loadConcepts(_.flatten(mappings.map(mapping => this.$jskos.conceptsOfMapping(mapping))))
        // Add items
        let skipped = 0 // Keep track of number of skipped items
        for (let mapping of mappings) {
          // For mappings recommendations: If mapping with the same member identifier could be found in the results for the current registry, skip item.
          // ! Temporarily disable this feature
          // if (!this.$jskos.mappingRegistryIsStored(registry)) {
          //   const currentRegistryResults = this.currentRegistry && results[this.currentRegistry.uri] || []
          //   const memberIdentifier = (mapping) => {
          //     return mapping && mapping.identifier.find(id => id && id.startsWith("urn:jskos:mapping:members:"))
          //   }
          //   if (currentRegistryResults.find(m => memberIdentifier(m) == memberIdentifier(mapping))) {
          //     skipped += 1
          //     continue
          //   }
          // }

          let item = { mapping, registry }
          item.sourceScheme = _.get(mapping, "fromScheme") || undefined
          item.targetScheme = _.get(mapping, "toScheme") || undefined
          item.sourceConcepts = this.$jskos.conceptsOfMapping(mapping, "from").filter(concept => concept != null)
          item.targetConcepts = this.$jskos.conceptsOfMapping(mapping, "to").filter(concept => concept != null)
          // // Load prefLabels for all concepts
          // conceptsToLoad = conceptsToLoad.concat(item.sourceConcepts).concat(item.targetConcepts)
          // Save concepts as xLabels attribute as well
          item.sourceConceptsLong = item.sourceConcepts
          item.targetConceptsLong = item.targetConcepts
          // Set source/targetScheme to empty string if from/to is null.
          if (!_.get(mapping, "from") && item.sourceConcepts.length == 0) {
            item.sourceScheme = undefined
          }
          if (!_.get(mapping, "to") && item.targetConcepts.length == 0) {
            item.targetScheme = undefined
          }
          // Skip if there are no concepts.
          if (item.sourceConcepts.length + item.targetConcepts.length == 0) {
            skipped += 1
            continue
          }
          // Highlight if selected concepts or current mapping have same members
          let selectedConceptsIdentifier = this.$jskos.mappingMembersIdentifier({ from: { memberSet: [this.selected.concept[true]] }, to: { memberSet: [this.selected.concept[false]] }})
          let currentMappingIdentifier = this.$jskos.mappingMembersIdentifier(this.$store.state.mapping.mapping)
          let highlight = mapping.identifier.includes(selectedConceptsIdentifier) || mapping.identifier.includes(currentMappingIdentifier)
          item._rowClass = ""
          if (highlight) {
            item._rowClass = "mappingBrowser-table-row-match"
          }
          // Highlight if this exact mapping is being edited right now
          let originalUri = _.get(this.$store.state.mapping.original, "uri")
          if (originalUri && mapping.uri == originalUri) {
            item._rowClass = "mappingBrowser-table-row-edited"
          }

          item.creator = mapping.creator && mapping.creator[0] || ""
          if (typeof item.creator === "object") {
            item.creator = this.$jskos.prefLabel(item.creator)
          }
          // Add modified or created date in extra
          item.extra = { date: mapping.modified || mapping.created }
          item.source = this.$jskos.prefLabel(registry)
          item.sourceShort = this.$jskos.notation(registry)
          item.type = this.$jskos.mappingTypeByType(mapping.type)
          item.occurrence = mapping._occurrence
          // Generate unique ID from mapping JSON and registry URI as helper
          item.uniqueId = this.hash(keyPrefix + registry.uri + JSON.stringify(_.omit(this.$jskos.copyDeep(mapping))))
          // Add class to all items of hoveredRegistry
          if (this.$jskos.compareFast(item.registry, this.hoveredRegistry)) {
            item._rowClass += " mappingBrowser-hoveredRegistry"
          }
          section.items.push(item)
        }
        if (mappings._totalCount === undefined) {
          section.items = section.items.slice((section.page - 1) * this.componentSettings.resultLimit, section.page * this.componentSettings.resultLimit)
        }
        section.totalCount -= skipped
        sections.push(section)
      }
      return sections
    },
    droppedConcept(object, targets) {
      _.forOwn(targets, (path, type) => {
        let text = ""
        if (type == "scheme") {
          // For scheme targtet, insert notation of inScheme of concept or notation of scheme
          if (this.$jskos.isScheme(object)) {
            text = _.get(object, "notation[0]")
          } else {
            text = _.get(object, "inScheme[0].notation[0]")
          }
        } else if (type == "concept") {
          // For concept, insert notation of concept
          if (this.$jskos.isConcept(object)) {
            text = _.get(object, "notation[0]")
          }
        }
        if (text) {
          _.set(this, path, text)
        }
      })
    },
    changePage(type, { registry, page, userInitiated }) {
      let currentPage = this[`${type}Pages`][registry.uri]
      if (userInitiated) {
        this.$set(this[`${type}Pages`], registry.uri, page)
        if (type == "search") {
          this.search(registry.uri, page)
        }
      } else if (page != currentPage) {
        // This is a workaround for bootstrap-vue's b-pagination to prevent an unwanted jump back to page 1
        // See: https://github.com/bootstrap-vue/bootstrap-vue/issues/3372
        this.$set(this[`${type}Pages`], registry.uri, page)
        this.$nextTick(() => {
          this.$set(this[`${type}Pages`], registry.uri, currentPage)
        })
      }
    },
    editConcordance(concordance) {
      this.concordanceToEdit = concordance
      this.$refs.concordanceEditorModal.show()
    },
    async refreshConcordances() {
      await this.loadConcordances()
      // Also retrieve total number of mappings in those registries
      this.totalNumberOfMappings = (await Promise.all(this.concordanceRegistries.map(r => r.getMappings({ limit: 1 })))).reduce((p, c) => p + c._totalCount, 0)
      this.concordancesLoaded = true
    },
  },
}
</script>

<style lang="less" scoped>
@import "@/style/main.less";

.mappingBrowser-navigator-results {
  flex: 1;
}
.mappingBrowser-registryGroup-header {
  text-align: left;
  padding: 0.5em 3px 3px 2em;
}
.mappingBrowser-registryGroup-title {
  display:inline-block;
  letter-spacing: 0.1em;
}
.mappingBrowser-registryGroup-notation {
  margin: 0 4px;
}
.mappingBrowser-search-registryNotation {
  margin: auto 2px auto 4px;
}
.mappingBrowser-registryGroup-popover {
  display: flex;
  flex-direction: column;
  margin: 10px 10px;
}
.mappingBrowser-registryGroup-popover-item {
  flex: 1;
  margin: 5px 0;
}

#mappingBrowser {
  max-width: 100%;
}

.noItems {
  margin: 50px auto 5px auto;
  flex: 5 0 auto;
}

#mappingBrowser-search-shareButton {
  position: absolute;
  right: 20px;
  bottom: 0px;
  z-index: @zIndex-2;
  color: @color-text-mediumLightGrey;
}
#mappingBrowser-search-shareButton:hover {
  color: @color-button-hover;
}

.mappingBrowser-concordanceMenu {
  position: absolute;
  top: 45px;
  right: 10px;
}
.mappingBrowser-concordanceMenu > * {
  display: inline-block;
}
.mappingBrowser-addConcordanceButton {
  margin-right: 4px;
}

.mappingBrowser-toolbar-button {
  display: inline-block;
  position: relative;
  width: 16px;
  text-align: center;
}

</style>

<style lang="less">
@import "@/style/main.less";

#mappingBrowser[max-width~="750px"] .mappingBrowser-from750 {
  display: none;
}
#mappingBrowser[max-width~="650px"] .mappingBrowser-from650 {
  display: none;
}
#mappingBrowser[max-width~="550px"] .mappingBrowser-from550 {
  display: none;
}

#mappingBrowser > .cocoda-vue-tabs > .cocoda-vue-tabs-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 5px 0px 0px 0px;
}

// Correctly position search table
.mappingBrowser-search-table.mappingBrowser-table-container {
  height: 0;
  flex: 1;
  position: relative;
}
.mappingBrowser-search-table > .mappingBrowser-table {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

#mappingBrowser .componentSettings {
  right: 3px;
}
.mappingBrowser-actions > span > * {
  margin-right: 1px;
}

</style>
