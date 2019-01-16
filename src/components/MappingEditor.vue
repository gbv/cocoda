<template>
  <div
    id="mappingEditor"
    :class="canSaveMapping ? 'mappingEditor-notSaved' : (canExportMapping ? 'mappingEditor-saved' : 'mappingEditor-cantSave')">
    <div class="mappingEditorToolbar">
      <div
        v-b-tooltip.hover="{ title: canSaveMapping ? $t('mappingEditor.saveMapping') : '', delay: $util.delay.medium }"
        :class="{
          button: canSaveMapping,
          'button-disabled': !canSaveMapping
        }"
        class="mappingEditorToolbarItem"
        @click="saveMapping" >
        <font-awesome-icon icon="save" />
      </div>
      <div
        v-b-tooltip.hover="{ title: canDeleteMapping ? $t('mappingEditor.deleteMapping') : '', delay: $util.delay.medium }"
        :class="{
          'button-delete': canDeleteMapping,
          'button-disabled': !canDeleteMapping
        }"
        class="mappingEditorToolbarItem"
        @click="deleteMapping" >
        <font-awesome-icon icon="trash-alt" />
      </div>
      <div
        v-b-tooltip.hover="{ title: canClearMapping ? $t('mappingEditor.clearMapping') : '', delay: $util.delay.medium }"
        :class="{
          button: canClearMapping,
          'button-disabled': !canClearMapping
        }"
        class="mappingEditorToolbarItem"
        @click="clearMapping" >
        <font-awesome-icon icon="ban" />
      </div>
      <div
        v-b-tooltip.hover="{ title: canExportMapping ? $t('mappingEditor.commentMapping') : '', delay: $util.delay.medium }"
        :class="{
          button: canExportMapping,
          'button-disabled': !canExportMapping
        }"
        class="mappingEditorToolbarItem"
        @click="$refs.commentModal.show()" >
        <font-awesome-icon icon="comment" />
      </div>
    </div>
    <!-- Source and target sides for the mapping -->
    <div
      v-for="(isLeft, index0) in [true, false]"
      :key="index0"
      :style="{ order: index0 * 2 }"
      :class="{
        'mappingEditorPart-noConcepts': $store.getters['mapping/getScheme'](isLeft) == null || !$store.getters['mapping/getConcepts'](isLeft).length,
        'mappingEditorPart-dropTarget': draggedConcept != null,
      }"
      class="mappingEditorPart"
      @dragover="dragOver"
      @drop="drop($event, isLeft)" >
      <div v-if="$store.getters['mapping/getScheme'](isLeft) != null && $store.getters['mapping/getConcepts'](isLeft).length">
        <!-- Show scheme only if different scheme is selected on that side -->
        <div
          class="mappingScheme fontWeight-heavy" >
          <span v-if="showScheme(isLeft)">
            <item-name
              :item="$store.getters['mapping/getScheme'](isLeft)"
              :is-link="true"
              :is-left="isLeft"
              :show-text="false"
              :show-tooltip="true" />
          </span>
          <span v-else>&nbsp;</span>
        </div>
        <!-- All concepts in mapping -->
        <div class="mappingConceptList">
          <ul>
            <li
              v-for="(concept, index) in $store.getters['mapping/getConcepts'](isLeft)"
              :key="index" >
              <item-name
                :item="concept"
                :is-link="true"
                :is-left="isLeft"
                :is-highlighted="$jskos.compare(concept, selected.concept[true]) || $jskos.compare(concept, selected.concept[false])"
                font-size="large"
              />
              <!-- Delete button for concept -->
              <span
                class="button fontSize-large"
                @click="$store.commit({
                  type: 'mapping/remove',
                  concept,
                  isLeft
                })"
              >
                <font-awesome-icon icon="minus-circle" />
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div v-else >
        <div class="mappingNoConcepts">
          <div v-if="draggedConcept == null">{{ $t("mappingEditor.placeholder") }}<br><br></div>
          <div
            v-else
            class="fontWeight-heavy">{{ $t("mappingEditor.placeholderDragging") }}</div>
          <div
            v-b-tooltip.hover="{ title: isAddButtonEnabled(isLeft) ? $t('mappingEditor.addConcept') : '', delay: $util.delay.medium }"
            v-if="draggedConcept == null"
            :class="{ button: isAddButtonEnabled(isLeft), 'button-disabled': !isAddButtonEnabled(isLeft) }"
            class="mappingEditor-addButton"
            @click="addToMappingInternal(isLeft)" >
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
        v-show="selected.scheme[true] != null || selected.scheme[false] != null"
        :mapping="$store.state.mapping.mapping" />
    </div>
    <div class="mappingEditor-creator">
      {{ creatorName }}
    </div>
    <div class="mappingEditor-title">
      {{ $t("mappingEditor.title") }}
    </div>
    <!-- Delete mapping modal -->
    <b-modal
      ref="deleteModal"
      :title="$t('mappingEditor.deleteTitle')"
      class="mappingEditor-deleteModal"
      hide-footer >
      <b-button
        variant="danger"
        @click="deleteOriginalMapping(true) && $refs.deleteModal.hide()" >
        {{ $t("mappingEditor.deleteAndClear") }}
      </b-button>
      <b-button
        v-show="hasChangedFromOriginal"
        variant="warning"
        @click="deleteOriginalMapping() && $refs.deleteModal.hide()" >
        {{ $t("mappingEditor.deleteAndKeep") }}
      </b-button>
      <b-button
        variant="primary"
        @click="clearMapping() && $refs.deleteModal.hide()" >
        {{ $t("mappingEditor.keepAndClear") }}
      </b-button>
      <b-button
        variant="secondary"
        @click="$refs.deleteModal.hide()" >
        {{ $t("mappingEditor.cancel") }}
      </b-button>
    </b-modal>
    <!-- Comment mapping modal -->
    <b-modal
      ref="commentModal"
      :title="$t('mappingEditor.commentMappingTitle')"
      :ok-disabled="!haveNotesChanged"
      hide-header-close
      no-close-on-backdrop
      @shown="focusNote"
      @hide="comments = mappingComments"
      @ok="saveComment" >
      <b-form-textarea
        v-for="(comment, index) in comments"
        :key="`mappingEditor-comment-${index}`"
        :id="`mappingEditor-comment-${index}`"
        v-model="comments[index]"
        :rows="2"
        :max-rows="6"
        @keydown.native="textareaKeydown" />
    </b-modal>
    <data-modal-button
      :data="mapping"
      type="mapping" />
  </div>
</template>

<script>
import ItemName from "./ItemName"
import MappingTypeSelection from "./MappingTypeSelection"
import Minimizer from "./Minimizer"
import DataModalButton from "./DataModalButton"
import _ from "lodash"

/**
 * The mapping editor component.
 */
export default {
  name: "MappingEditor",
  components: { ItemName, MappingTypeSelection, Minimizer, DataModalButton },
  data() {
    return {
      comments: [""]
    }
  },
  computed: {
    mapping() {
      return this.$store.state.mapping.mapping
    },
    original() {
      return this.$store.state.mapping.original
    },
    canSaveMapping() {
      return (this.original == null || this.hasChangedFromOriginal) && this.mapping.fromScheme && this.mapping.toScheme
    },
    canDeleteMapping() {
      return _.get(this.original, "_provider.has.canRemoveMappings", false)
    },
    canClearMapping() {
      return this.mapping.fromScheme || this.mapping.toScheme
    },
    canExportMapping() {
      return this.mapping.fromScheme && this.mapping.toScheme
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
    creator() {
      return this.$store.getters["settings/creator"]
    },
    creatorName() {
      return this.$util.prefLabel(this.creator)
    },
    mappingComments() {
      return this.$util.lmContent(this.mapping, "note") || []
    },
    haveNotesChanged() {
      let comments = this.comments.filter(c => c != "")
      return !_.isEqual(comments, this.mappingComments)
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
        scheme: this.selected.scheme[false]
      })
    },
    comments() {
      // Add one empty string if comments are empty
      let comments = this.comments.filter(c => c != "")
      if (!comments.length) {
        comments.push("")
      }
      if (!_.isEqual(comments, this.comments)) {
        this.comments = comments
      }
    },
    mappingComments(newValue, oldValue) {
      if (!_.isEqual(oldValue, newValue)) {
        this.comments = _.clone(newValue)
      }
    },
  },
  mounted() {
    // Add hotkey for saving the mapping
    this.addHotkey("ctrl+s,command+s", () => {
      this.saveMapping()
      return false
    })
    // Add hotkey for clearing the mapping
    this.addHotkey("ctrl+shift+c,command+shift+c", () => {
      this.clearMapping()
      return false
    })
    // Add hotkey for adding left
    this.addHotkey("ctrl+a,command+a", () => {
      this.addToMappingInternal(true)
      return false
    })
    // Add hotkey for adding right
    this.addHotkey("ctrl+d,command+d", () => {
      this.addToMappingInternal(false)
      return false
    })
    // Add hotkey for editing comments
    this.addHotkey("ctrl+k,command+k", () => {
      if (this.canExportMapping) {
        this.$refs.commentModal.show()
      }
      return false
    })
    // Enable hotkeys
    this.enableHotkeys()
  },
  destroyed() {
    // Disable hotkeys
    this.disableHotkeys()
  },
  methods: {
    saveMapping() {
      if (!this.canSaveMapping) return false
      if (!this.creatorName || this.creatorName == "") {
        this.alert("Please set your name in Settings (top right of the page).")
        return false
      }
      // Change creator of mapping before saving
      this.$store.commit({
        type: "mapping/setCreator",
        creator: [this.creator]
      })
      let mapping = this.prepareMapping()
      let original = this.original
      this.$store.dispatch({ type: "mapping/saveMappings", mappings: [{ mapping, original }]}).then(mappings => {
        this.alert(this.$t("alerts.mappingSaved"), null, "success2")
        let newMapping = mappings.find(m => this.$jskos.compareMappings(mapping, m))
        this.$store.commit({
          type: "mapping/set",
          original: newMapping
        })
      }).catch(error => {
        this.alert(error, null, "danger")
      }).then(() => {
        this.$store.commit("mapping/setRefresh", { onlyMain: true })
        if (this.$settings.mappingEditorClearOnSave) {
          this.clearMapping()
        }
      })
    },
    deleteMapping() {
      if (!this.canDeleteMapping) return false
      this.$refs.deleteModal.show()
      return true
    },
    deleteOriginalMapping(clear = false) {
      let mapping = this.prepareMapping(this.original)
      this.$store.dispatch({ type: "mapping/removeMappings", mappings: [mapping] }).then(() => {
        this.alert(this.$t("alerts.mappingDeleted"), null, "success2")
      }).catch(error => {
        this.alert(error, null, "danger")
      }).then(() => {
        this.$store.commit("mapping/setRefresh", { onlyMain: true })
        if (clear) {
          this.clearMapping()
        }
      })
      return true
    },
    clearMapping() {
      if (!this.canClearMapping) return false
      this.$store.commit({
        type: "mapping/empty"
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
    droppedConcept(concept, isLeft) {
      if (this.$jskos.isConcept(concept)) {
        // Add concept to mapping
        this.addToMapping({
          concept,
          scheme: (concept.inScheme && concept.inScheme[0]) || this.selected.scheme[isLeft],
          isLeft: isLeft
        })
      }
    },
    saveComment() {
      // Save comments
      let comments = this.comments.filter(c => c != "")
      if (this.haveNotesChanged) {
        let language = this.$util.getLanguage(_.get(this, "mapping.note")) || this.$util.fallbackLanguage
        this.$store.commit({
          type: "mapping/setNote",
          note: {
            [language]: comments
          }
        })
      }
    },
    focusNote() {
      document.getElementById("mappingEditor-comment-0").focus()
    },
    textareaKeydown(event) {
      // Save comment on ctrl + enter or cmd + enter
      if (!(event.keyCode == 13 && (event.metaKey || event.ctrlKey))) {
        return
      }
      this.saveComment()
      this.$refs.commentModal.hide()
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
  overflow: auto;
}
.mappingConceptList > ul {
  list-style: none;
  padding: 0 0 0 5px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}
.mappingConceptList > ul > li {
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
  right: 30px;
}
.mappingEditor-title {
  .componentTitle;
  position: absolute;
  top: 0px;
  left: 50%;
  transform: translateX(-50%);
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
