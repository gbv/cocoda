<template>
  <!-- Mapping table -->
  <div class="mappingBrowser-table-container">
    <!-- Put default slot here -->
    <slot />
    <flexible-table
      :sections="sections"
      :fields="fields"
      class="mappingBrowser-table"
      @hover="hover">
      <span
        slot="sourceScheme"
        slot-scope="{ value }">
        <item-name
          :item="value"
          :show-text="false"
          :is-link="true"
          :is-left="true"
          font-size="sm"
          class="fontWeight-heavy" />
        <!-- null means repeating scheme, undefined means no scheme -->
        <div
          v-if="value === null"
          class="mappingBrowser-table-light mappingBrowser-table-paddingTopLeftAdjustment">
          "
        </div>
        <div
          v-if="value === undefined"
          class="mappingBrowser-table-light mappingBrowser-table-paddingTopAdjustment mappingBrowser-table-paddingLeftAdjustment">
          —
        </div>
      </span>
      <span
        slot="sourceConcepts"
        slot-scope="{ value }">
        <span
          v-for="concept in value"
          :key="concept.uri">
          <item-name
            v-if="!$jskos.isContainedIn(concept, loadingConcepts)"
            :item="concept"
            :show-text="false"
            :show-popover="true"
            :is-link="true"
            :is-left="true"
            :is-highlighted="$jskos.compare(concept, selected.concept[true]) || $jskos.compare(concept, selected.concept[false])" />
          <loading-indicator
            v-else
            size="sm" />
        </span>
        <!-- No concepts -->
        <div
          v-if="value.length === 0"
          class="mappingBrowser-table-light mappingBrowser-table-paddingLeftAdjustment">
          —
        </div>
      </span>
      <span
        slot="sourceConceptsLong"
        slot-scope="{ value }">
        <span
          v-for="concept in value"
          :key="concept.uri">
          <item-name
            v-if="!$jskos.isContainedIn(concept, loadingConcepts)"
            :item="concept"
            :show-text="true"
            :show-popover="true"
            :is-link="true"
            :is-left="true"
            :is-highlighted="$jskos.compare(concept, selected.concept[true]) || $jskos.compare(concept, selected.concept[false])" />
          <loading-indicator
            v-else
            size="sm" />
        </span>
        <!-- No concepts -->
        <div
          v-if="value.length === 0"
          class="mappingBrowser-table-light mappingBrowser-table-paddingLeftAdjustment">
          —
        </div>
      </span>
      <span
        slot="targetScheme"
        slot-scope="{ value }">
        <item-name
          :item="value"
          :show-text="false"
          :is-link="true"
          :is-left="false"
          font-size="sm"
          class="fontWeight-heavy" />
        <!-- null means repeating scheme, undefined means no scheme -->
        <div
          v-if="value === null"
          class="mappingBrowser-table-light mappingBrowser-table-paddingTopLeftAdjustment">
          "
        </div>
        <div
          v-if="value === undefined"
          class="mappingBrowser-table-light mappingBrowser-table-paddingTopAdjustment mappingBrowser-table-paddingLeftAdjustment">
          —
        </div>
      </span>
      <span
        slot="targetConcepts"
        slot-scope="{ value }">
        <span
          v-for="concept in value"
          :key="concept.uri">
          <span v-if="!$jskos.isContainedIn(concept, loadingConcepts)">
            <item-name
              :item="concept"
              :show-text="false"
              :show-popover="true"
              :is-link="true"
              :is-left="false"
              :is-highlighted="$jskos.compare(concept, selected.concept[false]) || $jskos.compare(concept, selected.concept[true])" /><br>
          </span>
          <loading-indicator
            v-else
            size="sm" />
        </span>
        <!-- No concepts -->
        <div
          v-if="value.length === 0"
          class="mappingBrowser-table-light mappingBrowser-table-paddingLeftAdjustment">
          —
        </div>
      </span>
      <span
        slot="targetConceptsLong"
        slot-scope="{ value }">
        <span
          v-for="concept in value"
          :key="concept.uri">
          <span v-if="!$jskos.isContainedIn(concept, loadingConcepts)">
            <item-name
              :item="concept"
              :show-text="true"
              :show-popover="true"
              :is-link="true"
              :is-left="false"
              :is-highlighted="$jskos.compare(concept, selected.concept[false]) || $jskos.compare(concept, selected.concept[true])" /><br>
          </span>
          <loading-indicator
            v-else
            size="sm" />
        </span>
        <!-- No concepts -->
        <div
          v-if="value.length === 0"
          class="mappingBrowser-table-light mappingBrowser-table-paddingLeftAdjustment">
          —
        </div>
      </span>
      <span
        slot="type"
        slot-scope="{ value }">
        <span
          v-if="value != null && $util.notation(value) != '→'"
          v-b-tooltip.hover="{ title: $util.prefLabel(value, null, false), delay: $util.delay.medium }">
          {{ $util.notation(value) }}
        </span>
      </span>
      <span
        slot="creator"
        slot-scope="{ item }">
        <span
          v-if="$settings.mappingBrowserShowIdentityWarning && item.mapping && item.mapping.creator && item.mapping.creator[0] && item.mapping.creator[0].uri && userUris && userUris.includes(item.mapping.creator[0].uri) && ($util.prefLabel(item.mapping.creator[0]) != $util.prefLabel(creator) || item.mapping.creator[0].uri != creator.uri)">
          <font-awesome-icon
            v-b-tooltip.hover="$t('mappingBrowser.creatorIsDifferent')"
            icon="exclamation"
            class="text-warning" />
        </span>
        <span
          v-if="item.creator != null"
          :id="`mappingBrowserTable-item-${item.uniqueId}-creator`">
          {{ item.creator }}
        </span>
        <!-- Creator popover -->
        <b-popover
          v-if="item.creator != null"
          :target="`mappingBrowserTable-item-${item.uniqueId}-creator`"
          :show.sync="popoverShown[`creator-${item.uniqueId}`]"
          triggers="hover"
          :delay="$util.delay.medium"
          placement="auto"
          @hide="popoverHide($event, `creator-${item.uniqueId}`)">
          <div class="font-default text-dark color-primary-0-bg fontSize-normal">
            <p class="fontWeight-heavy">{{ item.creator }}</p>
            <template v-if="item.mapping.creator && item.mapping.creator[0] && item.mapping.creator[0].uri">
              <p class="fontSize-small">
                <auto-link :link="item.mapping.creator[0].uri" />
              </p>
              <p
                class="button"
                @click="$set(popoverShown, `creator-${item.uniqueId}`, false); searchForCreator(item.mapping.creator[0].uri)">
                <font-awesome-icon
                  class="fontSize-small"
                  icon="search" />
                {{ $t("mappingBrowser.searchForMappingsByCreator") }}
              </p>
            </template>
          </div>
        </b-popover>
      </span>
      <span
        slot="actions"
        slot-scope="data">
        <!-- Annotation score/button -->
        <div
          v-if="data.item.mapping && data.item.mapping.annotations"
          :id="'mappingBrowser-hoveredMapping-annotationButton-' + data.item.uniqueId"
          :style="`color: ${annotationButtonColor(data.item.mapping.annotations)};`"
          style="display: inline-block; position: relative; min-width: 18px;"
          class="button fontWeight-heavy">
          <span v-if="data.item.mapping.annotations.find(annotation => annotation.motivation == 'moderating')">
            <font-awesome-icon
              style="color: #00DC00;"
              icon="check-square" />
          </span>
          <span v-else>
            {{ annotationsScore(data.item.mapping.annotations).sign }}{{ annotationsScore(data.item.mapping.annotations).score }}
          </span>
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
        <div
          v-if="showEditingTools"
          class="mappingBrowser-toolbar-button">
          <font-awesome-icon
            v-b-tooltip.hover="{ title: canEdit(data, user) ? $t('mappingBrowser.edit', [$util.prefLabel(data.item.registry)]) : $t('mappingBrowser.clone', [$util.prefLabel(currentRegistry)]), delay: $util.delay.medium }"
            :icon="canEdit(data, user) ? 'edit' : 'clone'"
            class="button"
            @click="edit(data)" />
        </div>
        <div
          v-if="showEditingTools && !$jskos.compare(data.item.registry, $store.getters.getCurrentRegistry)"
          class="mappingBrowser-toolbar-button">
          <font-awesome-icon
            v-if="canSave(data)"
            v-b-tooltip.hover="{ title: canSave(data) ? $t('mappingBrowser.saveAsMapping', [$util.prefLabel(currentRegistry)]) : '', delay: $util.delay.medium }"
            class="button"
            icon="angle-double-right"
            @click="saveMapping(data.item.mapping)" />
        </div>
        <div
          v-else-if="showEditingTools"
          class="mappingBrowser-toolbar-button">
          <font-awesome-icon
            v-if="canRemove(data, user)"
            v-b-tooltip.hover="{ title: $store.getters.getCurrentRegistry.provider.has.auth && !$store.getters.getCurrentRegistry.provider.auth ? $t('general.authNecessary') : $t('mappingBrowser.delete'), delay: $util.delay.medium }"
            class="button-delete"
            icon="trash-alt"
            @click="removeMapping(data.item.mapping)" />
        </div>
        <div
          v-if="showCocodaLink"
          class="mappingBrowser-toolbar-button">
          <font-awesome-icon
            v-b-tooltip.hover="{ title: $t('mappingBrowser.openInCocoda'), delay: $util.delay.medium }"
            class="button"
            icon="external-link-square-alt"
            @click="openInCocoda(data.item.mapping)" />
        </div>
      </span>
      <span
        slot="HEAD_actions"
        slot-scope="" />
      <span
        slot="ITEM_ROW"
        slot-scope="{ item }">
        <loading-indicator
          v-if="item.type == 'loading'"
          size="sm" />
        <span
          v-if="item.type == 'noItems'">
          {{ $t("mappingBrowser.noItems") }}
        </span>
      </span>
      <span
        slot="extra"
        slot-scope="data">
        <span
          v-if="data.item.occurrence == null"
          v-b-tooltip.hover="{ title: data.value.tooltip, delay: $util.delay.medium }">
          {{ data.value.date }}
        </span>
        <span v-else-if="data.item.occurrence.count == -1">-</span>
        <span v-else>
          <auto-link
            :link="data.item.occurrence.url"
            :text="String(data.item.occurrence.count)" />
        </span>
      </span>
      <span
        slot="BEFORE_SECTION"
        slot-scope="{ section }">
        <div style="display: flex; position: relative;">
          <div
            style="flex: 1; padding-left: 5px;"
            :class="{
              'fontWeight-heavy': true,
              'mappingBrowser-registry-selectable': section.registry.subject && section.registry.subject[0] && section.registry.subject[0].uri == 'http://coli-conc.gbv.de/registry-group/existing-mappings'
            }"
            @click="useRegistryForSaving(section.registry)">
            <registry-info
              :registry="section.registry"
              :show-details="false"
              :show-capabilities="false" />
          </div>
          <b-pagination
            v-if="section.totalCount > searchLimit"
            :value="section.page"
            :total-rows="section.totalCount"
            :per-page="searchLimit"
            class="mappingBrowser-pagination justify-content-center"
            :class="{
              'pagination-hide-goToLast': section.totalCount > 50000,
            }"
            style="flex: none; user-select: none; margin: 0; padding: 0;"
            size="sm"
            @input="$emit('pageChange', { registry: section.registry, page: $event, userInitiated: false })"
            @change="$emit('pageChange', { registry: section.registry, page: $event, userInitiated: true })" />
          <div
            style="flex: 1; text-align: right; padding-top: 3px;"
            :style="`padding-right: 30px;`"
            class="fontSize-small">
            <span v-if="section.items.length < section.totalCount">
              {{ section.items.length }} {{ $t("general.of") }}
            </span>
            {{ $tc(`dataModal.mapping`, section.totalCount, { count: section.totalCount.toLocaleString() }) }}
          </div>
          <data-modal-button
            :data="section.items.map(item => item.mapping).filter(mapping => mapping != null)"
            :url="section.url"
            :total-count="section.totalCount"
            type="mapping" />
        </div>
        <loading-indicator-full
          v-if="section.loading"
          size="sm" />
      </span>
    </flexible-table>
    <!-- Mapping detail modal -->
    <mapping-detail
      ref="mappingDetail"
      :mapping="mappingDetailMapping" />
    <!-- Mapping annotations popover -->
    <annotation-popover
      :id="hoveredId"
      :mapping="this.$store.state.hoveredMapping"
      id-prefix="mappingBrowser-hoveredMapping-annotationButton-"
      @refresh-annotations="refreshAnnotations" />
  </div>
</template>

<script>
import ItemName from "./ItemName"
import AutoLink from "./AutoLink"
import LoadingIndicator from "./LoadingIndicator"
import LoadingIndicatorFull from "./LoadingIndicatorFull"
import RegistryInfo from "./RegistryInfo"
import FlexibleTable from "vue-flexible-table"
import MappingDetail from "./MappingDetail"
import AnnotationPopover from "./AnnotationPopover"
import DataModalButton from "./DataModalButton"
import _ from "lodash"

// Import mixins
import auth from "../mixins/auth"
import objects from "../mixins/objects"
import computed from "../mixins/computed"
import hoverHandler from "../mixins/hover-handler"

/**
 * The mapping suggestion browser component.
 */
export default {
  name: "MappingBrowser",
  components: { ItemName, AutoLink, LoadingIndicator, LoadingIndicatorFull, FlexibleTable, RegistryInfo, MappingDetail, AnnotationPopover, DataModalButton },
  mixins: [auth, objects, computed, hoverHandler],
  props: {
    sections: {
      type: Array,
      default: () => [],
    },
    searchLimit: {
      type: Number,
      default: 5,
    },
    showEditingTools: {
      type: Boolean,
      default: true,
    },
    /**
     * If true, a link to Cocoda for mappings will be shown.
     */
    showCocodaLink: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      /** Currently hovered item unique ID  */
      hoveredId: null,
      /** Current mapping for mapping detail */
      mappingDetailMapping: null,
      popoverShown: {},
      currentPopovers: {},
    }
  },
  computed: {
    /**
     * List of fields (columns) to be used in bootstrap table
     */
    fields() {
      return [
        {
          key: "sourceScheme",
          label: "",
          width: "4%",
          minWidth: "",
          align: "left",
          sortable: false,
          class: "fontSize-small",
        },
        {
          key: "sourceConcepts",
          label: this.$t("mappingBrowser.from"),
          width: "10%",
          minWidth: "",
          align: "left",
          sortable: false,
          compare: (a, b) => this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "from"),
          class: "mappingBrowser-table-concepts",
        },
        {
          key: "sourceConceptsLong",
          label: this.$t("mappingBrowser.from"),
          width: "22%",
          minWidth: "",
          align: "left",
          sortable: false,
          compare: (a, b) => this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "from"),
          class: "mappingBrowser-table-conceptsLong",
        },
        {
          key: "type",
          label: "",
          width: "4%",
          minWidth: "",
          sortable: false,
          compare: (a ,b) => {
            let labelA = this.$util.prefLabel(_.get(a, "type"), null, false)
            let labelB = this.$util.prefLabel(_.get(b, "type"), null, false)
            if (labelA < labelB) {
              return -1
            }
            if (labelA > labelB) {
              return 1
            }
            return 0
          },
        },
        {
          key: "targetScheme",
          label: "",
          width: "4%",
          minWidth: "",
          align: "left",
          sortable: false,
          class: "fontSize-small",
        },
        {
          key: "targetConcepts",
          label: this.$t("mappingBrowser.to"),
          width: "10%",
          minWidth: "",
          align: "left",
          sortable: false,
          compare: (a, b) => this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "to"),
          class: "mappingBrowser-table-concepts",
        },
        {
          key: "targetConceptsLong",
          label: this.$t("mappingBrowser.to"),
          width: "22%",
          minWidth: "",
          align: "left",
          sortable: false,
          compare: (a, b) => this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "to"),
          class: "mappingBrowser-table-conceptsLong",
        },
        {
          key: "creator",
          label: this.$t("mappingBrowser.creator"),
          width: "10%",
          minWidth: "",
          align: "left",
          sortable: false,
          class: "mappingBrowser-table-creator",
        },
        {
          key: "extra",
          label: this.$t("mappingBrowser.date"),
          width: "10%",
          minWidth: "",
          align: "center",
          sortable: false,
          class: "mappingBrowser-table-extra",
          compare: (a, b) => {
            let first = _.get(a, "occurrence.count", -1)
            let second = _.get(b, "occurrence.count", -1)
            if (first == -1 && second == -1) {
              first = _.get(a, "extra")
              second = _.get(b, "extra")
            }
            if (first < second) {
              return -1
            }
            if (first > second) {
              return 1
            }
            return 0
          },
        },
        {
          key: "actions",
          label: "",
          width: "12%",
          minWidth: "",
          align: "right",
          sortable: false,
        },
      ]
    },
    currentRegistry() {
      return this.$store.getters.getCurrentRegistry
    },
  },
  created() {
    this.hover = _.debounce(this._hover, 20)
  },
  mounted() {
    this.$util.setupTableScrollSync()
  },
  methods: {
    edit(data) {
      const canEdit = this.canEdit(data, this.user)
      if (canEdit) {
        // Select registry for editing
        this.useRegistryForSaving(data.item.registry)
      }
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
      this.$store.commit({
        type: "mapping/set",
        mapping,
        original: canEdit ? data.item.mapping : null,
      })
    },
    canRemove(data, user) {
      const registry = data.item.registry
      const mapping = data.item.mapping
      // Can't delete mapping from registry other than current
      if (!this.$jskos.compare(registry, this.currentRegistry)) {
        return false
      }
      let crossUser = !this.$util.mappingCreatorMatches(user, mapping)
      return registry.isAuthorizedFor({
        type: "mappings",
        action: "delete",
        user: this.user,
        crossUser,
      })
    },
    removeMapping(mapping) {
      this.loadingGlobal = true
      this.$store.dispatch({ type: "mapping/removeMappings", mappings: [mapping] }).then(([success]) => {
        if (success) {
          this.alert(this.$t("alerts.mappingDeleted", [this.$util.prefLabel(mapping._provider.registry, null, false)]), null, "success2", this.$t("general.undo"), alert => {
            // Hide alert
            this.$store.commit({ type: "alerts/setCountdown", alert, countdown: 0 })
            this.$store.dispatch({ type: "mapping/restoreMappingFromTrash", uri: mapping.uri }).then(success => {
              if (success) {
                this.alert(this.$t("alerts.mappingRestored", [this.$util.prefLabel(mapping._provider.registry, null, false)]), null, "success2")
              } else {
                this.alert(this.$t("alerts.mappingNotRestored", [this.$util.prefLabel(mapping._provider.registry, null, false)]), null, "danger")
              }
            })
          })
        } else {
          this.alert(this.$t("alerts.mappingNotDeleted", [this.$util.prefLabel(mapping._provider.registry, null, false)]), null, "danger")
        }
        // Refresh list of mappings/suggestions.
        this.$store.commit("mapping/setRefresh", { registry: _.get(this.currentRegistry, "uri") })
      }).catch(error => {
        console.error("MappingBrowserTable - Error removing mapping", error)
      }).then(() => {
        this.loadingGlobal = false
      })
    },
    canEdit(data, user) {
      return data.item.registry.isAuthorizedFor({
        type: "mappings",
        action: "update",
        user: user,
        crossUser: !this.$util.mappingCreatorMatches(user, _.get(data, "item.mapping")),
      })
    },
    /** Saving of mappigns */
    canSave(data) {
      const registry = data.item.registry
      const mapping = data.item.mapping
      if (!mapping) {
        return false
      }
      // Don't allow saving if it's the current registry
      if (this.$jskos.compare(registry, this.currentRegistry)) {
        return false
      }
      // Check multiple things regarding fromScheme/toScheme
      // TODO: Fix slight code duplication with MappingEditor's `mappingStatus`?
      for (let side of ["fromScheme", "toScheme"]) {
        // Require both sides
        if (!mapping[side]) {
          return false
        }
        // Check registry whitelist
        const whitelist = _.get(this.currentRegistry, `config.mappings.${side}Whitelist`)
        if (whitelist) {
          if (!whitelist.find(s => this.$jskos.compare(s, mapping[side]))) {
            return false
          }
        }
        // Check cardinality
        const cardinality = _.get(this.currentRegistry, "config.mappings.cardinality")
        if (cardinality == "1-to-1" && this.$jskos.conceptsOfMapping(mapping, "to").length > 1) {
          return false
        }
      }
      // Check if user is authorized in current registry
      if (!this.currentRegistry.isAuthorizedFor({
        type: "mappings",
        action: "create",
        user: this.user,
      })) {
        return false
      }
      return true
    },
    copyMappingAndAdjustCreator(mapping) {
      mapping = this.$jskos.copyDeep(mapping)
      // Adjust creator
      let creator = this.creator
      let creatorName = this.$util.prefLabel(creator, null, false)
      // - All previous creators (except self) will be written to contributors.
      // - `creator` will be overridden by self.
      if (creator && creatorName) {
        mapping.contributor = (mapping.contributor || []).concat((mapping.creator || []).filter(c => !(creator.uri && c.uri && creator.uri == c.uri) && !(creatorName && this.$util.prefLabel(c, null, false) && creatorName == this.$util.prefLabel(c, null, false))))
        mapping.creator = [creator]
      } else {
        mapping.contributor = (mapping.contributor || []).concat((mapping.creator || []))
        this.$delete(mapping, "creator")
      }
      if (mapping.contributor.length == 0) {
        this.$delete(mapping, "contributor")
      }
      return mapping
    },
    saveMapping(mapping) {
      mapping = this.copyMappingAndAdjustCreator(mapping)
      this.loadingGlobal = true
      return this.$store.dispatch({ type: "mapping/saveMappings", mappings: [{ mapping }] }).then(mappings => {
        return mappings[0]
      }).catch(() => {
        return null
      }).then(mapping => {
        if (!mapping) {
          let message = this.$t("alerts.mappingNotSaved", [this.$util.prefLabel(this.currentRegistry, null, false)])
          if (this.currentRegistry.provider.has.auth && !this.currentRegistry.provider.auth) {
            message += " " + this.$t("general.authNecessary")
          }
          this.alert(message, null, "danger")
        } else {
          this.alert(this.$t("alerts.mappingSaved", [this.$util.prefLabel(this.currentRegistry, null, false)]), null, "success2")
        }
        return mapping
      }).catch(error => {
        console.error("MappingBrowserTable - error in saveMapping:", error)
        return null
      }).then(mapping => {
        this.loadingGlobal = false
        // Refresh list of mappings/suggestions.
        this.$store.commit("mapping/setRefresh", { registry: _.get(this.currentRegistry, "uri") })
        // Return adjusted mapping
        return this.adjustMapping(mapping)
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
    _hover(event) {
      this.$store.commit({
        type: "setHoveredMapping",
        mapping: event && event.mapping,
      })
      this.hoveredId = event && event.uniqueId
    },
    canUseRegistryForSaving(registry) {
      return this.config.registries.find(r => registry.isAuthorizedFor({
        type: "mappings",
        action: "create",
        user: this.user,
      }) && this.$jskos.compare(r, registry)) != null
    },
    useRegistryForSaving(registry) {
      if (_.get(registry, "subject[0].uri") == "http://coli-conc.gbv.de/registry-group/existing-mappings") {
        this.$store.commit({
          type: "settings/set",
          prop: "mappingRegistry",
          value: registry.uri,
        })
      }
    },
    // Gets called by popovers @hide function to add them to currentPopovers
    popoverHide(event, id) {
      if (this.popoverShown[id]) {
        event.preventDefault()
        this.currentPopovers[id] = event
      }
    },
    hoverHandlers() {
      let handlers = []
      _.forEach(this.currentPopovers, (event, id) => {
        handlers.push({
          elements: [event.target, event.relatedTarget],
          delta: 5,
          handler: (isInside) => {
            if (!isInside) {
              this.$set(this.popoverShown, id, false)
              this.$delete(this.currentPopovers, id)
            }
          },
        })
      })
      return handlers
    },
    searchForCreator(uri) {
      let mappingBrowser = this.$parent
      while (mappingBrowser && mappingBrowser.$options.name != "MappingBrowser") {
        mappingBrowser = mappingBrowser.$parent
      }
      if (mappingBrowser && mappingBrowser.searchWithParams) {
        mappingBrowser.searchWithParams({
          fromScheme: "",
          fromNotation: "",
          toScheme: "",
          toNotation: "",
          creator: uri,
          direction: "",
          type: null,
          partOf: null,
        })
      }
    },
    // Event coming from annotation popover. Searches for the mapping in the result set and adjusts it's annotations.
    refreshAnnotations({ uri, annotations }) {
      for (let section of this.sections) {
        for (let item of section.items) {
          if (item.mapping && item.mapping.uri == uri) {
            item.mapping.annotations = annotations
          }
        }
      }
    },
    openInCocoda(mapping) {
      let url = "./?"
      // Open schemes/concepts from mapping, not the mapping itself
      for (let side of ["from", "to"]) {
        const concept = this.$jskos.conceptsOfMapping(mapping, side)[0]
        if (concept && concept.uri) {
          url += `${side}=${encodeURIComponent(concept.uri)}&`
        }
        const scheme = mapping[`${side}Scheme`]
        if (scheme && scheme.uri) {
          url += `${side}Scheme=${encodeURIComponent(scheme.uri)}&`
        }
      }
      // if (mapping.uri) {
      //   url += `mappingUri=${mapping.uri}`
      // } else {
      //   const identifier = mapping.identifier.find(id => id.startsWith("urn:jskos:mapping:content:"))
      //   if (identifier) {
      //     url += `mappingIdentifier=${identifier}`
      //   } else {
      //     this.alert("Unknown error trying to open mapping in Cocoda.")
      //     return
      //   }
      // }
      window.open(url.substring(0, url.length - 1), "_self")
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

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

.mappingBrowser-table-container {
  height: 0;
  flex: 1;
  position: relative;
}
.mappingBrowser-table {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

.mappingBrowser-table-row-match {
  background-color: @color-table-highlight-background-1;
}
.flexibleTable-body .flexibleTable-row:hover .flexibleTable-cell.mappingBrowser-table-row-match {
  background-color: @color-table-highlight-background-0;
}
.mappingBrowser-table-row-edited {
  background-color: @color-select-2;
}
.flexibleTable-body .flexibleTable-row:hover .flexibleTable-cell.mappingBrowser-table-row-edited {
  background-color: @color-select;
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

.mappingBrowser-table-light {
  color: @color-text-lightGrey;
}
.mappingBrowser-table-paddingTopLeftAdjustment {
  padding-left: 10px;
  padding-top: 5px;
}
.mappingBrowser-table-paddingLeftAdjustment {
  padding-left: 5px;
}
.mappingBrowser-table-paddingTopAdjustment {
  padding-top: 2px;
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

.mappingBrowser-registry-selectable:hover {
  text-decoration: underline;
  cursor: pointer;
}

.mappingBrowser-table .flexibleTable-section {
  position: relative;
}

.mappingBrowser-table[max-width~="800px"] .mappingBrowser-table-creator {
  display: none;
}
.mappingBrowser-table[max-width~="800px"] .mappingBrowser-table-extra {
  display: none;
}
.mappingBrowser-table[max-width~="700px"] .mappingBrowser-table-conceptsLong {
  display: none;
}
.mappingBrowser-table[min-width~="700px"] .mappingBrowser-table-concepts {
  display: none;
}

.mappingBrowser-pagination.pagination .page-item .page-link {
  border: none;
  line-height: 1;
  background: none;
}

.mappingBrowser-pagination.pagination .page-item.active .page-link {
  background-color: @color-primary-0;
}

.mappingBrowser-pagination.pagination.pagination-hide-goToLast > li:last-child {
  display: none;
}

.mappingBrowser-table .flexibleTable-section-before {
  background-color: @color-primary-5;
}

// Custom section class for current registry
.mappingBrowser-table-currentRegistrySection > .flexibleTable-section-before {
  background-color: @color-select-2;
}

</style>
