<template>
  <div
    id="mappingEditor"
    :class="canSaveMapping ? 'mappingEditor-notSaved' : (canExportMapping && !hasChangedFromOriginal ? 'mappingEditor-saved' : 'mappingEditor-cantSave')">
    <!-- Settings -->
    <component-settings :tooltip="$t('mappingEditor.settingsButton')">
      <b-form-checkbox
        v-model="clearOnSave"
        v-b-tooltip.hover="{ title: $t('mappingEditor.settingClearOnSaveTooltip'), delay: $util.delay.medium }"
        style="user-select: none;">
        {{ $t("mappingEditor.settingClearOnSave") }}
      </b-form-checkbox>
      <b-form-checkbox
        v-model="only1to1mappings"
        v-b-tooltip.hover="{ title: $t('mappingEditor.settingOnly1to1mappingsTooltip'), delay: $util.delay.medium }"
        style="user-select: none;">
        {{ $t("mappingEditor.settingOnly1to1mappings") }}
      </b-form-checkbox>
    </component-settings>
    <div
      v-if="canSaveMapping"
      class="mappingEditor-mappingNotSaved fontSize-small fontWeight-heavy">
      {{ $util.prefLabel($store.getters.getCurrentRegistry) }}: {{ $t("mappingEditor.notSaved") }}
    </div>
    <div class="mappingEditorToolbar">
      <div
        v-b-tooltip.hover="{ title: canSwapMapping ? $t('mappingEditor.swapMapping') : '', delay: $util.delay.medium }"
        :class="{
          button: canSwapMapping,
          'button-disabled': !canSwapMapping
        }"
        class="mappingEditorToolbarItem"
        @click="swapMapping">
        <font-awesome-icon icon="exchange-alt" />
      </div>
      <div
        v-b-tooltip.hover="{ title: canSaveMapping ? $t('mappingEditor.saveMapping') : '', delay: $util.delay.medium }"
        :class="{
          button: canSaveMapping,
          'button-disabled': !canSaveMapping
        }"
        class="mappingEditorToolbarItem"
        @click="saveMapping">
        <font-awesome-icon icon="save" />
      </div>
      <div
        v-b-tooltip.hover="{ title: canDeleteMapping ? $t('mappingEditor.deleteMapping') : ((!$store.getters.getCurrentRegistry.provider.has.auth || $store.getters.getCurrentRegistry.provider.auth) ? '' : $t('general.authNecessary')), delay: $util.delay.medium }"
        :class="{
          'button-delete': canDeleteMapping,
          'button-disabled': !canDeleteMapping
        }"
        class="mappingEditorToolbarItem"
        @click="deleteMapping">
        <font-awesome-icon icon="trash-alt" />
      </div>
      <div
        v-b-tooltip.hover="{ title: canCloneMapping ? $t('mappingEditor.cloneMapping') : '', delay: $util.delay.medium }"
        :class="{
          'button': canCloneMapping,
          'button-disabled': !canCloneMapping
        }"
        class="mappingEditorToolbarItem"
        @click="cloneMapping">
        <font-awesome-icon icon="clone" />
      </div>
      <div
        v-b-tooltip.hover="{ title: canClearMapping ? $t('mappingEditor.clearMapping') : '', delay: $util.delay.medium }"
        :class="{
          button: canClearMapping,
          'button-disabled': !canClearMapping
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
                  v-b-tooltip.hover="{ title: $t('mappingEditor.removeConceptFromMapping'), delay: $util.delay.medium }"
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
            v-b-tooltip.hover="{ title: isAddButtonEnabled(isLeft) ? $t('mappingEditor.addConcept') : '', delay: $util.delay.medium }"
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
          v-b-tooltip.hover="{ title: isAddButtonEnabled(isLeft) ? 'add selected concept' : '', delay: $util.delay.medium }"
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
    <div class="mappingEditor-creator">
      {{ creatorName }}
    </div>
    <div class="mappingEditor-title">
      {{ $t("mappingEditor.title") }}
      <!-- Guideline link if available -->
      <span
        v-if="currentGuidelines"
        v-b-tooltip.hover="{ title: $t('mappingEditor.guidelines'), delay: $util.delay.medium }">
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
      class="mappingEditor-deleteModal"
      hide-footer>
      <b-button
        variant="danger"
        @click="deleteOriginalMapping(true) && $refs.deleteModal.hide()">
        {{ $t("mappingEditor.deleteAndClear") }}
      </b-button>
      <b-button
        v-show="hasChangedFromOriginal"
        variant="warning"
        @click="deleteOriginalMapping() && $refs.deleteModal.hide()">
        {{ $t("mappingEditor.deleteAndKeep") }}
      </b-button>
      <b-button
        variant="primary"
        @click="clearMapping() && $refs.deleteModal.hide()">
        {{ $t("mappingEditor.keepAndClear") }}
      </b-button>
      <b-button
        variant="secondary"
        @click="$refs.deleteModal.hide()">
        {{ $t("mappingEditor.cancel") }}
      </b-button>
    </b-modal>
    <data-modal-button
      :data="mapping"
      :position-right="18"
      type="mapping" />
  </div>
</template>

<script>
import ItemName from "./ItemName"
import MappingTypeSelection from "./MappingTypeSelection"
import DataModalButton from "./DataModalButton"
import _ from "lodash"
import ComponentSettings from "./ComponentSettings"

// Import mixins
import auth from "../mixins/auth"
import objects from "../mixins/objects"
import dragandrop from "../mixins/dragandrop"
import hotkeys from "../mixins/hotkeys"
import computed from "../mixins/computed"

/**
 * The mapping editor component.
 */
export default {
  name: "MappingEditor",
  components: { ItemName, MappingTypeSelection, DataModalButton, ComponentSettings },
  mixins: [auth, objects, dragandrop, hotkeys, computed],
  computed: {
    mapping() {
      return this.$store.state.mapping.mapping
    },
    original() {
      return this.$store.state.mapping.original
    },
    canSaveMapping() {
      if (this.mappingStatus.invalid) {
        return false
      }
      if (this.$store.getters["mapping/canUpdate"]) {
        return this.hasChangedFromOriginal
      }
      return this.$store.getters["mapping/canCreate"]
    },
    canDeleteMapping() {
      return this.$store.getters["mapping/canDelete"]
    },
    canClearMapping() {
      return this.mapping.fromScheme || this.mapping.toScheme
    },
    canExportMapping() {
      return this.mapping.fromScheme && this.mapping.toScheme
    },
    canSwapMapping() {
      return this.$jskos.conceptsOfMapping(this.mapping, "to").length <= 1 && this.$jskos.conceptsOfMapping(this.mapping).length > 0
    },
    canCloneMapping() {
      return this.original.uri != null
    },
    /**
     * Returns null if the mapping is valid, otherwise a string with a reason for invalidity.
     */
    mappingStatus() {
      const registry = this.$store.getters.getCurrentRegistry
      // Requires authentication for save
      if (!registry.isAuthorizedFor({
        type: "mappings",
        action: "create",
        user: this.user,
      })) {
        return {
          message: this.$t("registryInfo.notAuthenticated") + ` (${this.$util.prefLabel(registry)})`,
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
              message: this.$t("mappingEditor.invalidWhitelist", [`${side} ${this.$util.prefLabel(this.mapping[side], null, false) || ""}`, this.$util.prefLabel(registry)]),
              invalid: true,
            }
          }
        }
      }
      // Take mapping cardinality into account
      const cardinality = _.get(registry, "config.mappings.cardinality")
      if (cardinality == "1-to-1" && this.$jskos.conceptsOfMapping(this.mapping, "to").length > 1) {
        return {
          message: this.$t("mappingEditor.invalid1to1", [this.$util.prefLabel(registry)]),
          invalid: true,
        }
      }
      // Show warning if there is an original mapping, but it can't be updated
      // 1. Because the registry changed
      if (this.original.uri && !this.$jskos.compare(registry, this.original.registry)) {
        return {
          message: this.$t("mappingEditor.warningUpdateRegistry", [this.$util.prefLabel(this.original.registry), this.$util.prefLabel(registry)]),
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
    // Setting whether to clear editor after saving a mapping
    clearOnSave: {
      get() {
        return this.$settings.mappingEditorClearOnSave
      },
      set(value) {
        this.$store.commit({
          type: "settings/set",
          prop: "mappingEditorClearOnSave",
          value,
        })
      },
    },
    // Setting whether to only allow 1-to-1 mappings
    only1to1mappings: {
      get() {
        return this.$settings.mappingCardinality == "1-to-1" ? true : false
      },
      set(value) {
        this.$store.commit({
          type: "settings/set",
          prop: "mappingCardinality",
          value: value ? "1-to-1" : "1-to-n",
        })
      },
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
  },
  methods: {
    shortcutHandler({ action, isLeft }) {
      switch(action) {
        case "saveMapping":
          this.saveMapping()
          break
        case "clearMapping":
          this.clearMapping()
          break
        case "addConcept":
          this.addToMappingInternal(isLeft)
          break
      }
    },
    saveMapping() {
      if (!this.canSaveMapping) return false
      if (this.creatorName && this.creatorName != "") {
        // Set creator
        this.setCreator()
      } else {
        this.removeCreator()
      }
      let mapping = this.prepareMapping()
      mapping.modified = (new Date()).toISOString()
      this.loadingGlobal = true
      this.$store.dispatch({ type: "mapping/saveMapping" }).then(mapping => {
        if (!mapping) {
          // TODO: Adjust
          let message = this.$t("alerts.mappingNotSaved", [this.$util.prefLabel(this.$store.getters.getCurrentRegistry, null, false)])
          if (this.$store.getters.getCurrentRegistry.provider.has.auth && !this.$store.getters.getCurrentRegistry.provider.auth) {
            message += " " + this.$t("general.authNecessary")
          }
          this.alert(message, null, "danger")
          return
        }
        this.alert(this.$t("alerts.mappingSaved", [this.$util.prefLabel(this.$store.getters.getCurrentRegistry, null, false)]), null, "success2")
        this.$store.commit({
          type: "mapping/set",
          original: this.adjustMapping(mapping),
        })
        if (this.clearOnSave) {
          this.clearMapping()
        }
      }).catch(error => {
        console.error("MappingEditor - error in saveMapping:", error)
      }).then(() => {
        this.loadingGlobal = false
        this.$store.commit("mapping/setRefresh", { registry: _.get(this.$store.getters.getCurrentRegistry, "uri") })
      })
    },
    setCreator() {
      // - All previous creators (except self) will be written to contributors.
      // - `creator` will be overridden by self.
      let contributor = (this.mapping.contributor || []).concat((this.mapping.creator || []).filter(c => !(this.creator.uri && c.uri && this.creator.uri == c.uri) && !(this.creatorName && this.$util.prefLabel(c, null, false) && this.creatorName == this.$util.prefLabel(c, null, false))))
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
    deleteMapping() {
      if (!this.canDeleteMapping) return false
      this.$refs.deleteModal.show()
      return true
    },
    deleteOriginalMapping(clear = false) {
      this.loadingGlobal = true
      this.$store.dispatch({ type: "mapping/removeMapping" }).then(success => {
        if (success) {
          this.alert(this.$t("alerts.mappingDeleted", [this.$util.prefLabel(this.$store.getters.getCurrentRegistry, null, false)]), null, "success2")
          this.$store.commit("mapping/setRefresh", { registry: _.get(this.$store.getters.getCurrentRegistry, "uri") })
          if (clear) {
            this.clearMapping()
          }
        } else {
          this.alert(this.$t("alerts.mappingNotDeleted", [this.$util.prefLabel(this.$store.getters.getCurrentRegistry, null, false)]), null, "danger")
        }
      }).catch(error => {
        console.error("MappingEditor - error in deleteOriginalMapping:", error)
      }).then(() => {
        this.loadingGlobal = false
      })
      return true
    },
    clearMapping() {
      if (!this.canClearMapping) return false
      this.$store.commit({
        type: "mapping/empty",
      })
      return true
    },
    prepareMapping(mapping = null) {
      mapping = mapping || this.$jskos.minifyMapping(this.mapping)
      mapping = this.$jskos.addMappingIdentifiers(mapping)
      return mapping
    },
    labelForScheme(scheme) {
      return this.$util.notation(scheme, "scheme")
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
        this.loadDetails(concept)
      }
    },
    swapMapping() {
      if (!this.canSwapMapping) {
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
  padding-top: 20px;
  transform: translateY(-12px);
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
  margin: 0 0 5px 0;
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
  margin: 5px auto;
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
  bottom: 2px;
  right: 43px;
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
.mappingEditor-deleteModal button {
  margin: 10px 0;
  width: 100%;
}

.mappingEditor-mappingNotSaved {
  position: absolute;
  top: 0;
  right: 20px;
  color: @color-button-delete;
  z-index: @zIndex-2;
}
.mappingEditor-mappingAlert {
  // Prevent other icons from moving by using min-width
  min-width: 16px;
  z-index: @zIndex-2;
}

</style>
