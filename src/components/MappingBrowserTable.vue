<template>
  <!-- Mapping table -->
  <div class="mappingBrowser-table-container">
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
          :show-tooltip="true"
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
            :show-tooltip="true"
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
            :show-tooltip="false"
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
          :show-tooltip="true"
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
              :show-tooltip="true"
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
              :show-tooltip="false"
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
          v-b-tooltip.hover="{ title: value.prefLabel.en, delay: $util.delay.medium }">
          {{ $util.notation(value) }}
        </span>
      </span>
      <span
        slot="creator"
        slot-scope="{ item }">
        <span
          v-if="item.mapping && item.mapping.creator && item.mapping.creator[0] && item.mapping.creator[0].uri && userUris && userUris.includes(item.mapping.creator[0].uri) && ($util.prefLabel(item.mapping.creator[0]) != $util.prefLabel(creator) || item.mapping.creator[0].uri != creator.uri)">
          <font-awesome-icon
            v-b-tooltip.hover="$t('mappingBrowser.creatorIsDifferent')"
            icon="exclamation"
            class="text-warning" />
        </span>
        <span
          v-if="item.creator != null"
          v-b-tooltip.hover="{ title: item.creator, delay: $util.delay.long }">
          {{ item.creator }}
        </span>
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
            v-b-tooltip.hover="{ title: $t('mappingBrowser.edit'), delay: $util.delay.medium }"
            icon="edit"
            class="button"
            @click="edit(data)" />
        </div>
        <div
          v-if="!$jskos.compare(data.item.registry, $store.getters.getCurrentRegistry)"
          class="mappingBrowser-toolbar-button">
          <font-awesome-icon
            v-if="canSave(data.item.mapping)"
            v-b-tooltip.hover="{ title: canSave(data.item.mapping) ? $t('mappingBrowser.saveAsMapping') : '', delay: $util.delay.medium }"
            class="button"
            icon="save"
            @click="canSave(data.item.mapping) && saveMapping(data.item.mapping)" />
        </div>
        <div
          v-else
          class="mappingBrowser-toolbar-button">
          <font-awesome-icon
            v-if="canRemove(data) && data.item.registry.provider.has.canRemoveMappings && (data.item.registry.uri == 'http://coli-conc.gbv.de/registry/local-mappings' || data.item.mapping.uri != null)"
            v-b-tooltip.hover="{ title: $store.getters.getCurrentRegistry.provider.has.auth && !$store.getters.getCurrentRegistry.provider.auth ? $t('general.authNecessary') : $t('mappingBrowser.delete'), delay: $util.delay.medium }"
            class="button-delete"
            icon="trash-alt"
            @click="removeMapping(data.item.mapping)" />
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
        <span v-if="data.item.occurrence == null">
          {{ data.value }}
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
              'mappingBrowser-registry-selectable': canUseRegistryForSaving(section.registry)
            }"
            @click="useRegistryForSaving(section.registry)">
            <registry-notation
              :tooltip="false"
              :registry="section.registry" />
            <registry-name :registry="section.registry" />
          </div>
          <b-pagination
            v-if="section.totalCount > 0"
            :value="section.page"
            :total-rows="section.totalCount"
            :per-page="searchLimit"
            class="mappingBrowser-pagination justify-content-center"
            style="flex: none; user-select: none; margin: 0; padding: 0;"
            size="sm"
            @change="$emit('pageChange', { registry: section.registry, page: $event })" />
          <div
            style="flex: 1; text-align: right; padding-top: 3px;"
            :style="`padding-right: ${section.totalCount > 0 ? 30 : 5}px;`"
            class="fontSize-small">
            <span v-if="section.items.length < section.totalCount">
              {{ section.items.length }} {{ $t("general.of") }}
            </span>
            {{ $tc(`dataModal.mapping`, section.totalCount, { count: section.totalCount.toLocaleString() }) }}
          </div>
          <data-modal-button
            v-if="section.totalCount > 0"
            :data="section.items.map(item => item.mapping).filter(mapping => mapping != null)"
            type="mapping" />
        </div>
        <loading-indicator-full v-if="section.loading" />
      </span>
    </flexible-table>
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
import AutoLink from "./AutoLink"
import LoadingIndicator from "./LoadingIndicator"
import LoadingIndicatorFull from "./LoadingIndicatorFull"
import RegistryNotation from "./RegistryNotation"
import RegistryName from "./RegistryName"
import FlexibleTable from "vue-flexible-table"
import MappingDetail from "./MappingDetail"
import AnnotationPopover from "./AnnotationPopover"
import DataModalButton from "./DataModalButton"
import _ from "lodash"

// Import mixins
import auth from "../mixins/auth"
import objects from "../mixins/objects"

/**
 * The mapping suggestion browser component.
 */
export default {
  name: "MappingBrowser",
  components: { ItemName, AutoLink, LoadingIndicator, LoadingIndicatorFull, FlexibleTable, RegistryNotation, RegistryName, MappingDetail, AnnotationPopover, DataModalButton },
  mixins: [auth, objects],
  props: {
    sections: {
      type: Array,
      default: () => [],
    },
    searchLimit: {
      type: Number,
      default: 5,
    },
  },
  data () {
    return {
      /** Currently hovered item unique ID  */
      hoveredId: null,
      /** Current mapping for mapping detail */
      mappingDetailMapping: null,
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
          width: "22%",
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
          width: "22%",
          minWidth: "",
          align: "left",
          sortable: false,
          compare: (a, b) => this.$util.compareMappingsByConcepts(a.mapping, b.mapping, "to"),
          class: "mappingBrowser-table-conceptsLong"
        },
        {
          key: "creator",
          label: this.$t("mappingBrowser.creator"),
          width: "10%",
          minWidth: "",
          align: "left",
          sortable: false,
          class: "mappingBrowser-table-creator"
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
    currentRegistry() {
      return this.$store.getters.getCurrentRegistry
    },
  },
  watch: {
    currentRegistry(registry) {
      // If registry changes and does not match the registry of the current original mapping, remove original
      // TODO: Is this the best way to solve this? Maybe use URIs instead?
      if (!this.$jskos.compare(registry, _.get(this.$store.state.mapping.original, "_provider.registry"))) {
        this.$store.commit({
          type: "mapping/set",
          original: null,
        })
      }
    },
  },
  mounted() {
    this.$util.setupTableScrollSync()
  },
  methods: {
    edit(data) {
      let canEdit = this.canEdit(data)
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
        original: canEdit && mapping._provider && mapping._provider.has.canSaveMappings && this.$jskos.compare(mapping._provider.registry, this.currentRegistry) ? copyWithReferences(mapping) : null
      })
    },
    canEdit(data) {
      if (!data.item.mapping) {
        return false
      }
      if (!data.item.registry.provider.has.auth) {
        // Can always edit a mapping from a provider without auth
        return true
      }
      let mapping = data.item.mapping
      let creatorUris = (mapping.creator || []).map(creator => creator.uri).filter(uri => uri)
      if (_.intersection(creatorUris, this.userUris).length) {
        // Can only edit if one of the creator matches the logged in user
        return true
      } else {
        return false
      }
    },
    canRemove(data) {
      return this.canEdit(data) && (!this.currentRegistry.provider.has.auth || this.currentRegistry.provider.auth)
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
        this.$store.commit("mapping/setRefresh", { registry: _.get(this.currentRegistry, "uri") })
      }).then(() => {
        this.loadingGlobal = false
      })
    },
    /** Saving of mappigns */
    canSave(mapping) {
      if (!mapping || !mapping.fromScheme || !mapping.toScheme) {
        return false
      }
      // Don't allow saving if it's the current registry
      if (mapping._provider && this.$jskos.compare(mapping._provider.registry, this.currentRegistry)) {
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
      mapping = this.$jskos.copyDeep(mapping)
      this.loading = 1
      this.loadingGlobal = true
      // Adjust creator
      let creator = this.creator
      let creatorName = this.$util.prefLabel(creator, null, false)
      // - All previous creators (except self) will be written to contributors.
      // - `creator` will be overridden by self.
      mapping.contributor = (mapping.contributor || []).concat((mapping.creator || []).filter(c => !(creator.uri && c.uri && creator.uri == c.uri) && !(creatorName && this.$util.prefLabel(c, null, false) && creatorName == this.$util.prefLabel(c, null, false))))
      if (mapping.contributor.length == 0) {
        this.$delete(mapping, "contributor")
      }
      mapping.creator = [creator]

      return this.$store.dispatch({ type: "mapping/saveMappings", mappings: [{ mapping }] }).then(mappings => {
        return mappings[0]
      }).catch(() => {
        return null
      }).then(mapping => {
        if (!mapping) {
          let message = this.$t("alerts.mappingNotSaved")
          if (this.currentRegistry.provider.has.auth && !this.currentRegistry.provider.auth) {
            message += " " + this.$t("general.authNecessary")
          }
          this.alert(message, null, "danger")
        }
        return mapping
      }).catch(error => {
        console.error("MappingBrowser - error in saveMapping:", error)
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
    hover(event) {
      this.hoveredMapping = event && event.mapping
      this.hoveredId = event && event.uniqueId
    },
    canUseRegistryForSaving(registry) {
      return this.config.registries.filter(registry => registry.provider.has.canSaveMappings).find(r => this.$jskos.compare(r, registry)) != null
    },
    useRegistryForSaving(registry) {
      if (this.canUseRegistryForSaving(registry)) {
        this.$store.commit({
          type: "settings/set",
          prop: "mappingRegistry",
          value: registry.uri
        })
      }
    },
  }
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
  background-color: @color-select-1;
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
}

.mappingBrowser-table .flexibleTable-section-before {
  background-color: @color-primary-5;
}

</style>
