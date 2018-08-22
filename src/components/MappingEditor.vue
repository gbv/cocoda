<template>
  <div id="mappingEditor">
    <!-- Minimizer allows component to get minimized -->
    <minimizer text="Mapping Editor" />
    <div class="mappingEditorToolbar">
      <div
        v-b-tooltip.hover="{ title: 'save mapping', delay: $util.delay.medium }"
        :class="{
          button: canSaveMapping(),
          'button-disabled': !canSaveMapping()
        }"
        class="mappingEditorToolbarItem"
        @click="saveMapping" >
        <font-awesome-icon icon="save" />
      </div>
      <div
        v-b-tooltip.hover="{ title: 'delete mapping', delay: $util.delay.medium }"
        :class="{
          button: canDeleteMapping(),
          'button-disabled': !canDeleteMapping()
        }"
        class="mappingEditorToolbarItem"
        @click="deleteMapping" >
        <font-awesome-icon icon="trash-alt" />
      </div>
      <div
        v-b-tooltip.hover="{ title: 'clear mapping', delay: $util.delay.medium }"
        :class="{
          button: canClearMapping(),
          'button-disabled': !canClearMapping()
        }"
        class="mappingEditorToolbarItem"
        @click="clearMapping" >
        <font-awesome-icon icon="ban" />
      </div>
      <div
        v-b-tooltip.hover="{ title: 'export mapping', delay: $util.delay.medium }"
        :class="{
          button: canExportMapping(),
          'button-disabled': !canExportMapping()
        }"
        class="mappingEditorToolbarItem"
        @click="exportMapping()" >
        <font-awesome-icon icon="share-square" />
      </div>
    </div>
    <!-- Source and target sides for the mapping -->
    <div
      v-for="(isLeft, index0) in [true, false]"
      :key="index0"
      :style="{ order: index0 * 2 }"
      class="mappingEditorPart" >
      <div v-if="$store.getters['mapping/getScheme'](isLeft) != null">
        <!-- Show scheme only if different scheme is selected on that side -->
        <div
          class="mappingScheme fontWeight-heavy" >
          <span v-if="showScheme(isLeft)">
            {{ labelForScheme($store.getters['mapping/getScheme'](isLeft)) }}
          </span>
          <span v-else>&nbsp;</span>
        </div>
        <!-- All concepts in mapping -->
        <ul class="mappingConceptList">
          <li
            v-for="(concept, index) in $store.getters['mapping/getConcepts'](isLeft)"
            :key="index" >
            <item-name
              :item="concept"
              :is-link="$util.canConceptBeSelected(concept, isLeft ? selected.scheme[true] : selected.scheme[false])"
              :is-highlighted="$jskos.compare(concept, isLeft ? selected.concept[true] : selected.concept[false])"
              @click.native="$util.canConceptBeSelected(concept, isLeft ? selected.scheme[true] : selected.scheme[false]) && setSelected('concept', isLeft, concept)" />
            <!-- Delete button for concept -->
            <div
              class="button mappingConceptDelete fontSize-large"
              @click="$store.commit({
                type: 'mapping/remove',
                concept,
                isLeft
              })"
            >
              <font-awesome-icon icon="minus-circle" />
            </div>
          </li>
        </ul>
      </div>
      <div v-else >
        <div class="mappingNoConcepts">No Concepts</div>
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
        v-show="selected.scheme[true] != null || selected.scheme[false] != null"
        :mapping="$store.state.mapping.mapping" />
    </div>
    <!-- Export modal (TODO: Put into its own component and allow export of mappings, concepts, etc.) -->
    <b-modal
      ref="exportModal"
      hide-footer
      center
      size="lg"
      title="Export Mapping" >
      <p><b-btn
        class="mt-3"
        @click.stop.prevent="exportClipboard">
        Copy to clipboard
      </b-btn></p>
      <p><a
        :href="'data:text/json;charset=utf-8,' + mappingEncoded"
        download="mapping.json"
        target="_blank" >
        Download as .json file
      </a></p>
      <div
        ref="json"
        style="height: 600px; overflow: auto; margin-top: 20px;" >
        <pre ref="jsonPre">{{ mappingPretty }}</pre>
      </div>
    </b-modal>
    <!-- Delete mapping modal -->
    <b-modal
      ref="deleteModal"
      class="mappingEditor-deleteModal"
      hide-footer
      title="Delete Mapping" >
      <b-button
        variant="danger"
        @click="deleteOriginalMapping(true) && $refs.deleteModal.hide()" >
        Delete original mapping and clear
      </b-button>
      <b-button
        v-show="hasChangedFromOriginal"
        variant="warning"
        @click="deleteOriginalMapping() && $refs.deleteModal.hide()" >
        Delete original mapping and keep changes
      </b-button>
      <b-button
        variant="primary"
        @click="clearMapping() && $refs.deleteModal.hide()" >
        Keep original mapping and clear
      </b-button>
      <b-button
        variant="secondary"
        @click="$refs.deleteModal.hide()" >
        Cancel
      </b-button>
    </b-modal>
  </div>
</template>

<script>
import ItemName from "./ItemName"
import MappingTypeSelection from "./MappingTypeSelection"
import Minimizer from "./Minimizer"
import _ from "lodash"

/**
 * The mapping editor component.
 */
export default {
  name: "MappingEditor",
  components: { ItemName, MappingTypeSelection, Minimizer },
  computed: {
    /**
     * Returns a formatted version of the mapping
     */
    mappingPretty() {
      return JSON.stringify(this.prepareMapping(), null, 2)
    },
    /**
     * Returns an encoded version of the mapping for export
     */
    mappingEncoded() {
      return encodeURIComponent(JSON.stringify(this.prepareMapping()))
    },
    hasChangedFromOriginal() {
      if (!this.$store.state.mapping.mapping) {
        return false
      }
      if (!this.$store.state.mapping.original) {
        return true
      }
      return !this.$jskos.compareMappings(this.$store.state.mapping.original, this.$store.state.mapping.mapping)
    },
  },
  methods: {
    saveMapping() {
      if (!this.canSaveMapping()) return false
      let mapping = this.prepareMapping()
      if (!mapping.creator || mapping.creator.length == 0) {
        let creatorName = this.$settings.creator || "You"
        mapping.creator = [{ prefLabel: { de: creatorName } }]
      }
      this.$api.saveMapping(mapping).then(mappings => {
        this.alert("Mapping was saved.", null, "success")
        let newMapping = mappings.find(m => this.$jskos.compareMappings(mapping, m))
        this.$store.commit({
          type: "mapping/set",
          original: newMapping
        })
      }).catch(error => {
        this.alert(error, null, "danger")
      }).then(() => {
        this.$store.commit("mapping/setRefresh", true)
      })
    },
    deleteMapping() {
      if (!this.canDeleteMapping()) return false
      this.$refs.deleteModal.show()
      return true
    },
    deleteOriginalMapping(clear = false) {
      let mapping = this.prepareMapping(this.$store.state.mapping.original)
      this.$api.removeMapping(mapping).then(() => {
        this.alert("Mapping was deleted.", null, "success")
      }).catch(error => {
        this.alert(error, null, "danger")
      }).then(() => {
        this.$store.commit("mapping/setRefresh", true)
        if (clear) {
          this.clearMapping()
        }
      })
      return true
    },
    clearMapping() {
      if (!this.canClearMapping()) return false
      this.$store.commit({
        type: "mapping/empty"
      })
      return true
    },
    canSaveMapping() {
      return (this.$store.state.mapping.original == null || this.hasChangedFromOriginal) && this.$store.state.mapping.mapping.fromScheme && this.$store.state.mapping.mapping.toScheme
    },
    canDeleteMapping() {
      return this.$store.state.mapping.original && this.$store.state.mapping.original.LOCAL
    },
    canClearMapping() {
      return this.$store.state.mapping.mapping.fromScheme || this.$store.state.mapping.mapping.toScheme
    },
    canExportMapping() {
      return this.$store.state.mapping.mapping.fromScheme && this.$store.state.mapping.mapping.toScheme
    },
    prepareMapping(mapping = null) {
      mapping = mapping || this.$jskos.minifyMapping(this.$store.state.mapping.mapping)
      mapping = this.$jskos.addMappingIdentifiers(mapping)
      return mapping
    },
    labelForScheme(scheme) {
      return scheme && scheme.notation ? scheme.notation[0].toUpperCase() : " "
    },
    /**
     * Returns whether the add button should be enabled for a specific side
     */
    isAddButtonEnabled(isLeft) {
      let concept = isLeft ? this.selected.concept[true] : this.selected.concept[false]
      if (!this.$store.getters["mapping/checkScheme"](isLeft ? this.selected.scheme[true] : this.selected.scheme[false], isLeft)) {
        return false
      }
      if (concept == null) {
        return false
      }
      if (this.$store.getters["mapping/added"](concept, isLeft)) {
        return false
      }
      return true
    },
    /**
     * Returns whether the delete all button should be enabled for a specific side
     */
    isDeleteAllButtonEnabled(isLeft) {
      return this.$store.getters["mapping/getConcepts"](isLeft).length > 0
    },
    /**
     * Returns the reason why the add button is disabled
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
    addToMapping(isLeft) {
      if (!this.isAddButtonEnabled(isLeft)) {
        return
      }
      let concept = isLeft ? this.selected.concept[true] : this.selected.concept[false]
      this.$store.commit({
        type: "mapping/add",
        concept,
        scheme: this.selected.scheme[isLeft],
        isLeft
      })
    },
    /**
     * Removes all concepts from one side of the mapping
     */
    deleteAll(isLeft) {
      this.$store.commit({
        type: "mapping/removeAll",
        isLeft
      })
    },
    /**
     * Returns whether to show the scheme's label for a specific side
     */
    showScheme(isLeft) {
      let chosenScheme = this.selected.scheme[isLeft]
      let mappingScheme = this.$store.getters["mapping/getScheme"](isLeft)
      return !this.$jskos.compare(chosenScheme, mappingScheme)
    },
    /**
     * Opens the export modal
     */
    exportMapping() {
      if (!this.canExportMapping()) return false
      this.$refs.exportModal.show()
    },
    /**
     * Exports the mapping to clipboard
     */
    exportClipboard() {
      window.getSelection().removeAllRanges()
      this.$util.selectText(this.$refs.json)
      _.delay(function() {
        let successful = document.execCommand("copy")
        if (!successful) {
          console.warn("Copy to clipboard failed.")
        }
        window.getSelection().removeAllRanges()
      }, 50)
    },
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

#mappingEditor {
  position: relative;
  overflow: hidden;
  display: flex;
  min-height: 200px;
}
.mappingTypeSelection {
  flex: none;
  position: relative;
  order: 1;
  margin-bottom: 28px;
}
.mappingTypeSelection > div {
  position: relative;
  top: 50%;
  transform: translateY(-50%);
}
.mappingEditorPart {
  flex: 1;
  width: 0;
  padding: 10px 5px 5px 10px;
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
.mappingScheme {
  text-align: center;
  flex: none;
  margin: 0 0 5px 0;
}
.mappingConceptList {
  padding: 0 0 0 5px;
  flex: 1;
  height: 0;
  overflow: auto;
  list-style: none;
}
.mappingConceptList > li {
  position: relative;
  margin: 5px 12px 5px 0;
}
.mappingConceptDelete {
  position: absolute;
  right: -8px;
  top: -1px;
  text-align: right;
}
.mappingConceptLink:hover {
  color: @color-primary-0;
}
.mappingNoConcepts {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
}

.mappingEditorToolbar {
  position: absolute;
  font-size: 16px;
  text-align: center;
  margin: 5px auto;
  left: 0;
  right: 0;
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

.addButton {
  flex: none;
  margin: 0 10px;
  font-size: 1.5rem;
}
.mappingEditor-deleteModal button {
  margin: 10px 0;
  width: 100%;
}

</style>
