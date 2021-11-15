<template>
  <div
    id="mappingEditor"
    :class="canSaveCurrentMapping ? 'mappingEditor-notSaved' : (canExportCurrentMapping && !hasChangedFromOriginal ? 'mappingEditor-saved' : 'CurrentMappingEditor-cantSave')">
    <!-- Settings -->
    <component-settings :tooltip="$t('mappingEditor.settingsButton')" />
    <div
      v-if="canSaveCurrentMapping"
      class="mappingEditor-mappingNotSaved fontSize-small fontWeight-heavy">
      <registry-info
        :registry="$store.getters.getCurrentRegistry"
        :show-details="false"
        :show-capabilities="false"
        :show-editable="false"
        :inline="true" />: {{ $t("mappingEditor.notSaved") }}
    </div>
    <div class="mappingEditorToolbar">
      <div
        v-b-tooltip.hover="{ title: canSwapCurrentMapping ? $t('mappingEditor.swapMapping') : '', delay: defaults.delay.medium }"
        :class="{
          button: canSwapCurrentMapping,
          'button-disabled': !canSwapCurrentMapping
        }"
        class="mappingEditorToolbarItem"
        @click="swapMapping">
        <font-awesome-icon icon="exchange-alt" />
      </div>
      <div
        v-b-tooltip.hover="{ title: canSaveCurrentMapping ? $t('mappingEditor.saveMapping', [$jskos.prefLabel(currentRegistry)]) : '', delay: defaults.delay.medium }"
        :class="{
          button: canSaveCurrentMapping,
          'button-disabled': !canSaveCurrentMapping
        }"
        class="mappingEditorToolbarItem"
        @click="saveCurrentMapping">
        <font-awesome-icon icon="save" />
      </div>
      <div
        v-b-tooltip.hover="{ title: canDeleteCurrentMapping ? $t('mappingEditor.deleteMapping') : ($store.getters.getCurrentRegistry && (!$store.getters.getCurrentRegistry.has.auth || $store.getters.getCurrentRegistry.auth) ? '' : $t('general.authNecessary')), delay: defaults.delay.medium }"
        :class="{
          'button-delete': canDeleteCurrentMapping,
          'button-disabled': !canDeleteCurrentMapping
        }"
        class="mappingEditorToolbarItem"
        @click="deleteCurrentMapping">
        <font-awesome-icon icon="trash-alt" />
      </div>
      <div
        v-b-tooltip.hover="{ title: canCloneCurrentMapping ? $t('mappingEditor.cloneMapping') : '', delay: defaults.delay.medium }"
        :class="{
          'button': canCloneCurrentMapping,
          'button-disabled': !canCloneCurrentMapping
        }"
        class="mappingEditorToolbarItem"
        @click="cloneMapping">
        <font-awesome-icon icon="clone" />
      </div>
      <div
        v-b-tooltip.hover="{ title: canClearCurrentMapping ? $t('mappingEditor.clearMapping') : '', delay: defaults.delay.medium }"
        :class="{
          button: canClearCurrentMapping,
          'button-disabled': !canClearCurrentMapping
        }"
        class="mappingEditorToolbarItem"
        @click="clearMapping">
        <font-awesome-icon icon="ban" />
      </div>
      <div
        v-b-tooltip="{
          title: mappingStatus.message || '',
          placement: 'bottom'
        }"
        class="mappingEditorToolbarItem mappingEditor-mappingAlert fontWeight-heavy"
        :class="{
          'text-warning': mappingStatus.warning,
          'text-danger': mappingStatus.invalid,
        }">
        <font-awesome-icon
          v-if="$jskos.conceptsOfMapping(mapping).length > 0 && mappingStatus.message"
          icon="exclamation-circle" />
      </div>
    </div>
    <!-- Source and target sides for the mapping -->
    <div
      v-for="(isLeft, index0) in [true, false]"
      :key="index0"
      :style="{ order: index0 * 2 }"
      :class="{
        'mappingEditorPart-noConcepts': $store.getters['mapping/getScheme'](isLeft) == null || !$store.getters['mapping/getConcepts'](isLeft).length,
        'mappingEditorPart-dropTarget': $store.state.draggedConcept != null,
      }"
      class="mappingEditorPart"
      @dragover="dragOver"
      @drop="drop($event, isLeft)">
      <div v-if="$store.getters['mapping/getScheme'](isLeft) != null && $store.getters['mapping/getConcepts'](isLeft).length">
        <!-- Show scheme only if different scheme is selected on that side -->
        <div
          class="mappingScheme fontWeight-heavy">
          <item-name
            :item="$store.getters['mapping/getScheme'](isLeft)"
            :is-link="true"
            :is-left="isLeft"
            :show-text="false" />
        </div>
        <!-- All concepts in mapping -->
        <div class="mappingConceptList">
          <div>
            <div style="flex: 1" />
            <ul>
              <li
                v-for="(concept, index) in $store.getters['mapping/getConcepts'](isLeft)"
                :key="index">
                <item-name
                  :item="concept"
                  :is-link="true"
                  :is-left="isLeft"
                  :is-highlighted="$jskos.compare(concept, selected.concept[true]) || $jskos.compare(concept, selected.concept[false])"
                  :show-popover="true"
                  font-size="large" />
                <!-- Delete button for concept -->
                <span
                  v-b-tooltip.hover="{ title: $t('mappingEditor.removeConceptFromMapping'), delay: defaults.delay.medium }"
                  class="button fontSize-large"
                  @click="$store.commit({
                    type: 'mapping/remove',
                    concept,
                    isLeft
                  })">
                  <font-awesome-icon icon="times-circle" />
                </span>
              </li>
            </ul>
            <div style="flex: 1" />
          </div>
        </div>
      </div>
      <div v-else>
        <div class="mappingNoConcepts">
          <div
            v-if="$store.state.draggedConcept == null"
            style="margin-bottom: -12px;">
            {{ $t("mappingEditor.placeholder") }}<br><br>
          </div>
          <div
            v-else
            class="fontWeight-heavy">
            {{ $t("mappingEditor.placeholderDragging") }}
          </div>
          <div
            v-if="$store.state.draggedConcept == null"
            v-b-tooltip.hover="{ title: isAddButtonEnabled(isLeft) ? $t('mappingEditor.addConcept') : '', delay: defaults.delay.medium }"
            :class="{ button: isAddButtonEnabled(isLeft), 'button-disabled': !isAddButtonEnabled(isLeft) }"
            class="mappingEditor-addButton"
            @click="addToMappingInternal(isLeft)">
            <font-awesome-icon icon="plus-circle" />
          </div>
        </div>
      </div>
      <!-- Buttons (add, delete all) -->
      <!-- <div class="mappingButtons">
        <div class="mappingButtonsFiller" />
        <div
          v-b-tooltip.hover="{ title: isAddButtonEnabled(isLeft) ? 'add selected concept' : '', delay: defaults.delay.medium }"
          :class="{ button: isAddButtonEnabled(isLeft), 'button-disabled': !isAddButtonEnabled(isLeft) }"
          :id="'addButton'+index0"
          class="addButton"
          @click="addToMapping(isLeft)" >
          <font-awesome-icon icon="plus-circle" />
        </div>
        <div class="mappingButtonsFiller" />
      </div> -->
    </div>
    <!-- Selecting of mapping type (in between source and target sides via flex order) -->
    <div class="mappingTypeSelection">
      <mapping-type-selection
        :mapping="$store.state.mapping.mapping" />
    </div>
    <div class="mappingEditor-creator fontSize-small">
      {{ creatorName }}
    </div>
    <div class="mappingEditor-title">
      {{ $t("mappingEditor.title") }}
      <!-- Guideline link if available -->
      <span
        v-if="currentGuidelines"
        v-b-tooltip.hover="{ title: $t('mappingEditor.guidelines'), delay: defaults.delay.medium }">
        <a
          :href="currentGuidelines.url"
          target="_blank">
          <font-awesome-icon icon="question-circle" />
        </a>
      </span>
    </div>
    <!-- Delete mapping modal -->
    <b-modal
      ref="deleteModal"
      :title="$t('mappingEditor.deleteTitle')"
      hide-footer>
      <p style="text-align: center;">
        {{ $t("mappingEditor.deleteText") }}
        <span v-if="hasChangedFromOriginal">
          <br>{{ $t("mappingEditor.deleteChangesText") }}
        </span>
      </p>
      <div class="mappingEditor-deleteButtons">
        <b-button
          variant="danger"
          @click="deleteOriginalMapping(true) && $refs.deleteModal.hide()">
          {{ $t("mappingEditor.deleteConfirm") }}
        </b-button>
        <b-button
          variant="secondary"
          @click="$refs.deleteModal.hide()">
          {{ $t("mappingEditor.cancel") }}
        </b-button>
      </div>
    </b-modal>
    <!-- Mapping detail modal -->
    <mapping-detail
      ref="mappingDetail"
      :mapping="mapping" />
    <div
      class="mappingEditor-infoIcon">
      <font-awesome-icon
        v-b-tooltip.hover="{ title: $t('mappingBrowser.showDetail'), delay: defaults.delay.medium }"
        icon="info-circle"
        class="button"
        @click="$refs.mappingDetail.show()" />
    </div>
  </div>
</template>

<script>
import ItemName from "./ItemName.vue"
import MappingTypeSelection from "./MappingTypeSelection.vue"
import _ from "lodash"
import ComponentSettings from "./ComponentSettings.vue"
import MappingDetail from "./MappingDetail.vue"
import RegistryInfo from "./RegistryInfo.vue"

// Import mixins
import auth from "../mixins/auth.js"
import objects from "../mixins/cdk.js"
import dragandrop from "../mixins/dragandrop.js"
import hotkeys from "../mixins/hotkeys.js"
import computed from "../mixins/computed.js"
import { getItem, loadConcepts } from "@/items"

/**
 * The mapping editor component.
 */
export default {
  name: "MappingEditor",
  components: { ItemName, MappingTypeSelection, ComponentSettings, MappingDetail, RegistryInfo },
  mixins: [auth, objects, dragandrop, hotkeys, computed],
  computed: {
    mapping() {
      return this.$store.state.mapping.mapping
    },
    original() {
      return this.$store.state.mapping.original
    },
    canSaveCurrentMapping() {
      if (this.mappingStatus.invalid) {
        return false
      }
      if (this.$store.getters["mapping/canUpdate"]) {
        return this.hasChangedFromOriginal
      }
      return this.$store.getters["mapping/canCreate"]
    },
    canDeleteCurrentMapping() {
      return this.$store.getters["mapping/canDelete"]
    },
    canClearCurrentMapping() {
      return this.mapping.fromScheme || this.mapping.toScheme
    },
    canExportCurrentMapping() {
      return this.mapping.fromScheme && this.mapping.toScheme
    },
    canSwapCurrentMapping() {
      return this.$jskos.conceptsOfMapping(this.mapping, "to").length <= 1 && this.$jskos.conceptsOfMapping(this.mapping).length > 0
    },
    canCloneCurrentMapping() {
      return this.original.uri != null
    },
    /**
     * Returns null if the mapping is valid, otherwise a string with a reason for invalidity.
     */
    mappingStatus() {
      const registry = this.currentRegistry
      if (!registry) {
        return {
          message: this.$t("mappingEditor.warningNoRegistry"),
          invalid: false,
          warning: true,
        }
      }
      // Requires authentication for save
      if (!registry.isAuthorizedFor({
        type: "mappings",
        action: "create",
        user: this.user,
      })) {
        return {
          message: this.$t("registryInfo.notAuthenticated") + ` (${this.$jskos.prefLabel(registry)})`,
          invalid: true,
        }
      }
      // Requires fromScheme/toScheme
      for (let side of ["fromScheme", "toScheme"]) {
        if (!this.mapping[side]) {
          return {
            message: this.$t("mappingEditor.invalidMissing", [side]),
            invalid: true,
          }
        }
      }
      // Take fromSchemeFilter/toSchemeFilter into account if they exist.
      for (let side of ["fromScheme", "toScheme"]) {
        const whitelist = _.get(registry, `config.mappings.${side}Whitelist`)
        if (whitelist) {
          if (!whitelist.find(s => this.$jskos.compare(s, this.mapping[side]))) {
            return {
              message: this.$t("mappingEditor.invalidWhitelist", [`${side} ${this.$jskos.prefLabel(this.mapping[side], { fallbackToUri: false }) || ""}`, this.$jskos.prefLabel(registry)]),
              invalid: true,
            }
          }
        }
      }
      // Take mapping cardinality into account
      const cardinality = _.get(registry, "config.mappings.cardinality")
      if (cardinality == "1-to-1" && this.$jskos.conceptsOfMapping(this.mapping, "to").length > 1) {
        return {
          message: this.$t("mappingEditor.invalid1to1", [this.$jskos.prefLabel(registry)]),
          invalid: true,
        }
      }
      // Show warning if there is an original mapping, but it can't be updated
      // 1. Because the registry changed
      if (this.original.uri && !this.$jskos.compareFast(registry, this.original.registry)) {
        return {
          message: this.$t("mappingEditor.warningUpdateRegistry", [this.$jskos.prefLabel(this.original.registry), this.$jskos.prefLabel(registry)]),
          warning: true,
        }
      }
      // 2. Because user is not allowed to update the original mapping
      if (this.original.uri && !this.$store.getters["mapping/canUpdate"]) {
        return {
          message: this.$t("mappingEditor.warningUpdateNotAllowed"),
          warning: true,
        }
      }
      // Show a warning if fromScheme/toScheme in mapping has changed from original
      for (let side of ["fromScheme", "toScheme"]) {
        if (this.original.uri && !this.$jskos.compare(this.mapping[side], this.original.mapping[side])) {
          return {
            message: this.$t("mappingEditor.warningUpdateScheme", [side]),
            warning: true,
          }
        }
      }
      // Otherwise it's valid
      return {
        message: null,
        invalid: false,
        warning: false,
      }
    },
    /**
     * Returns an encoded version of the mapping for export
     */
    mappingEncoded() {
      return encodeURIComponent(JSON.stringify(this.prepareMapping()))
    },
    hasChangedFromOriginal() {
      return this.$store.getters["mapping/hasChangedFromOriginal"]
    },
    // Is used for watcher that sets the target scheme
    schemeRight() {
      return this.selected.scheme[false]
    },
    currentGuidelines() {
      return (this.config.guidelines || []).find(g => this.$jskos.compare(g.fromScheme, this.selected.scheme[true]) && this.$jskos.compare(g.toScheme, this.selected.scheme[false]))
    },
  },
  watch: {
    mappingEncoded() {
      // When mapping changed, maximize MappingEditor.
      let minimizerComponent = _.get(this.$el.parentElement.getElementsByClassName("minimizer"), "[0].__vue__")
      if (minimizerComponent) {
        minimizerComponent.toggleMinimize(false)
      }
      // Set toScheme on every change (mutation will do nothing if there are concepts in the mapping).
      this.$store.commit({
        type: "mapping/setScheme",
        isLeft: false,
        scheme: this.selected.scheme[false],
      })
    },
    schemeRight() {
      // Set toScheme on scheme change (mutation will do nothing if there are concepts in the mapping).
      this.$store.commit({
        type: "mapping/setScheme",
        isLeft: false,
        scheme: this.selected.scheme[false],
      })
    },
    creator() {
      this.setCreator()
    },
    "original.uri"() {
      this.setCreator()
    },
  },
  mounted() {
    // Enable shortcuts
    this.enableShortcuts()
    // Set creator (fixes #560)
    this.setCreator()
  },
  methods: {
    shortcutHandler({ action, isLeft }) {
      switch(action) {
        case "saveMapping":
          this.saveCurrentMapping()
          break
        case "clearMapping":
          this.clearMapping()
          break
        case "addConcept":
          this.addToMappingInternal(isLeft)
          break
      }
    },
    async saveCurrentMapping() {
      if (!this.canSaveCurrentMapping) return false
      if (this.creator) {
        // Set creator
        this.setCreator()
      } else {
        this.removeCreator()
      }
      // Determine whether it should update original mapping
      const updateOriginal = this.original.uri && this.$jskos.compareFast(this.currentRegistry, this.original.registry)
      // Save as new mapping or update mapping
      const mapping = await this[updateOriginal ? "putMapping" : "postMapping"]({
        registry: this.currentRegistry,
        mapping: this.mapping,
        _before: () => {
          this.loadingGlobal = true
        },
        _after: () => {
          this.loadingGlobal = false
        },
      })
      // Set saved mapping as original
      this.$store.commit({
        type: "mapping/set",
        original: mapping,
      })
      // Clear mapping if necessary
      if (this.componentSettings.clearOnSave) {
        this.clearMapping()
      }
    },
    setCreator() {
      // - All previous creators (except self) will be written to contributors.
      // - `creator` will be overridden by self.
      let contributor = (this.mapping.contributor || []).concat((this.mapping.creator || []).filter(c => !(this.creator.uri && c.uri && this.creator.uri == c.uri) && !(this.creatorName && this.$jskos.prefLabel(c, { fallbackToUri: false }) && this.creatorName == this.$jskos.prefLabel(c, { fallbackToUri: false }))))
      let creator = [this.creator]
      this.$store.commit({
        type: "mapping/setCreator",
        creator,
      })
      this.$store.commit({
        type: "mapping/setContributor",
        contributor,
      })
    },
    removeCreator() {
      // - All previous creators will be written to contributors.
      let contributor = (this.mapping.contributor || []).concat((this.mapping.creator || []))
      this.$store.commit({
        type: "mapping/setCreator",
        creator: null,
      })
      this.$store.commit({
        type: "mapping/setContributor",
        contributor,
      })
    },
    deleteCurrentMapping() {
      if (!this.canDeleteCurrentMapping) return false
      this.$refs.deleteModal.show()
      return true
    },
    async deleteOriginalMapping(clear = false) {
      await this.deleteMapping({
        mapping: this.mapping,
        _before: () => {
          this.loadingGlobal = true
        },
        _after: () => {
          this.loadingGlobal = false
        },
      })
      if (clear) {
        this.clearMapping()
      }
      return true
    },
    clearMapping() {
      if (!this.canClearCurrentMapping) return false
      this.$store.commit({
        type: "mapping/empty",
      })
      return true
    },
    labelForScheme(scheme) {
      return this.$jskos.notation(getItem(scheme), "scheme")
    },
    /**
     * Returns whether the add button should be enabled for a specific side
     */
    isAddButtonEnabled(isLeft) {
      return this.$store.getters["mapping/canAdd"](this.selected.concept[isLeft], this.selected.scheme[isLeft], isLeft)
    },
    /**
     * Returns whether the delete all button should be enabled for a specific side
     */
    isDeleteAllButtonEnabled(isLeft) {
      return this.$store.getters["mapping/getConcepts"](isLeft).length > 0
    },
    /**
     * Returns the reason why the add button is disabled
     * TODO: Remove.
     */
    addButtonDisabledReason(isLeft) {
      let concept = isLeft ? this.selected.concept[true] : this.selected.concept[false]
      if (!this.$store.getters["mapping/checkScheme"](isLeft ? this.selected.scheme[true] : this.selected.scheme[false], isLeft)) {
        return "Scheme does not match."
      }
      if (concept == null) {
        return "Please select a concept."
      }
      if (this.$store.getters["mapping/added"](concept, isLeft)) {
        return "Selected concept is already in mapping."
      }
      return "Other reason."
    },
    /**
     * Adds currently selected concept to mapping
     */
    addToMappingInternal(isLeft) {
      if (!this.isAddButtonEnabled(isLeft)) {
        return
      }
      let concept = isLeft ? this.selected.concept[true] : this.selected.concept[false]
      this.addToMapping({
        concept,
        scheme: this.selected.scheme[isLeft],
        isLeft,
      })
    },
    /**
     * Removes all concepts from one side of the mapping
     */
    deleteAll(isLeft) {
      this.$store.commit({
        type: "mapping/removeAll",
        isLeft,
      })
    },
    droppedConcept(concept, isLeft) {
      if (this.$jskos.isConcept(concept)) {
        // Add concept to mapping
        this.addToMapping({
          concept,
          scheme: (concept.inScheme && concept.inScheme[0]) || this.selected.scheme[isLeft],
          isLeft: isLeft,
        })
        // Load details if necessary
        loadConcepts([concept])
      }
    },
    swapMapping() {
      if (!this.canSwapCurrentMapping) {
        return
      }
      this.$store.commit({ type: "mapping/switch" })
    },
    cloneMapping() {
      let mapping = this.$jskos.copyDeep(this.mapping)
      delete mapping.uri
      this.$store.commit({
        type: "mapping/set",
        original: null,
      })
      this.$store.commit({
        type: "mapping/set",
        mapping,
      })
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

#mappingEditor {
  position: relative;
  display: flex;
  border: 1px solid @color-background;
}
.mappingEditor-cantSave {
  background-color: @color-background;
}
.mappingEditor-notSaved {
  background-color: @color-background-notSaved;
}
.mappingEditor-saved {
  background-color: @color-background-saved;
}
.mappingTypeSelection {
  flex: none;
  position: relative;
  order: 1;
  margin: auto 0;
  transform: translateY(-10px);
}
.mappingEditorPart {
  flex: 1;
  width: 0;
  padding: 30px 0px 30px 5px;
  margin-right: 5px;
  display: flex;
  flex-direction: column;
  position: relative;
}
.mappingEditorPart > div {
  flex: 1;
  height: 0;
  display: flex;
  flex-direction: column;
}
.mappingEditorPart-noConcepts > div {
  border: 1px dashed lightGrey;
  border-radius: 10px;
}
.mappingEditorPart-dropTarget > div {
  border: 1px dashed green;
  border-radius: 10px;
}
.mappingEditor-addButton {
  font-size: 1.8em;
}
.mappingEditor-addButton.button:hover {
  color: @color-action-2;
}
.mappingScheme {
  text-align: center;
  flex: none;
  margin: -29px 0 5px 0;
}
.mappingConceptList {
  flex: 1;
  height: 0;
  position: relative;
  align-items: center;
}
.mappingConceptList > div {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow: scroll;
  display: flex;
  flex-direction: column;
}
.mappingConceptList > div > ul {
  list-style: none;
  padding: 0;
}
.mappingConceptList > div > ul > li {
  position: relative;
  margin: 5px 12px 5px 0;
}
.mappingConceptLink:hover {
  color: @color-primary-0;
}
.mappingNoConcepts {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
  text-align: center;
  .fontSize-small;
  .text-lightGrey;
}

.mappingEditorToolbar {
  position: absolute;
  font-size: 16px;
  text-align: center;
  margin: 5px auto 0px auto;
  left: 30px;
  right: 30px;
  bottom: 0;
  display: flex;
  justify-content:center;
  align-items:center;
  z-index: @zIndex-2;
}
.mappingEditorToolbarItem {
  flex: 0;
  margin: 0 5px;
}

.mappingButtons {
  flex: 0 0 32px !important;
  display: flex;
  flex-direction: row !important;
}
.mappingButtonsFiller {
  flex: 1;
}

.mappingEditor-creator {
  position: absolute;
  bottom: -4px;
  right: 35px;
}

.mappingEditor-infoIcon {
  position: absolute;
  bottom: -4px;
  right: 15px;
  z-index: @zIndex-2;
}
.mappingEditor-infoIcon .button {
  color: @color-text-mediumLightGrey;
}
.mappingEditor-infoIcon .button:hover {
  color: @color-button-hover;
}

.mappingEditor-title {
  .componentTitle;
  position: absolute;
  top: 0px;
  left: 50%;
  transform: translateX(-50%);
  z-index: @zIndex-2;
}

.addButton {
  flex: none;
  margin: 0 10px;
  font-size: 1.5rem;
}
.mappingEditor-deleteButtons {
  display: flex;
  justify-content: center;
}
.mappingEditor-deleteButtons button {
  margin: 10px 20px;
}

.mappingEditor-mappingNotSaved {
  position: absolute;
  bottom: -1px;
  left: 0px;
  color: @color-button-delete;
  z-index: @zIndex-2;
}
.mappingEditor-mappingAlert {
  // Prevent other icons from moving by using min-width
  min-width: 16px;
  z-index: @zIndex-2;
}

</style>

<style>

#mappingEditor .componentSettings {
  right: -2px;
  bottom: -4px;
}

</style>
