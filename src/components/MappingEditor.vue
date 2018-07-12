<template>
  <div id="mappingEditor">
    <!-- Minimizer allows component to get minimized -->
    <minimizer text="Mapping Editor" />
    <div
      v-b-tooltip.hover="{ title: 'Export mapping', delay: $util.delay.medium }"
      class="mappingExport"
      @click="exportMapping()">
      <font-awesome-icon icon="share-square" />
    </div>
    <!-- Source and target sides for the mapping -->
    <div
      v-for="(isLeft, index0) in [true, false]"
      :key="index0"
      :style="{ order: index0 * 2 }"
      class="mappingEditorPart" >
      <div v-if="mapping.getScheme(isLeft) != null">
        <!-- Show scheme only if different scheme is selected on that side -->
        <div
          class="mappingScheme fontWeight-heavy">
          <span v-if="showScheme(isLeft)">
            {{ labelForScheme(mapping.getScheme(isLeft)) }}
          </span>
          <span v-else>&nbsp;</span>
        </div>
        <!-- All concepts in mapping -->
        <ul class="mappingConceptList">
          <li
            v-for="(concept, index) in mapping.getConcepts(isLeft)"
            :key="index" >
            <item-name
              :item="concept"
              :is-link="$util.canConceptBeSelected(concept, isLeft ? schemeLeft : schemeRight)"
              :is-highlighted="$util.compareConcepts(concept, isLeft ? selectedLeft : selectedRight)"
              @click.native="$util.canConceptBeSelected(concept, isLeft ? schemeLeft : schemeRight) && chooseUri(concept, isLeft)" />
            <!-- Delete button for concept -->
            <div
              class="mappingConceptDelete fontSize-small"
              @click="mapping.remove(concept, isLeft)">
              <font-awesome-icon icon="minus-circle" />
            </div>
          </li>
        </ul>
      </div>
      <div v-else >
        <div class="mappingNoConcepts">No Concepts</div>
      </div>
      <!-- Reason why adding a concept is not possible -->
      <div
        v-if="!isAddButtonEnabled(isLeft)"
        class="addButtonDisabledReason">
        {{ addButtonDisabledReason(isLeft) }}
      </div>
      <!-- Buttons (add, delete all) -->
      <div class="mappingButtons">
        <div class="mappingButtonsFiller" />
        <div
          v-b-tooltip.hover="{ title: isAddButtonEnabled(isLeft) ? 'add selected concept' : '', delay: $util.delay.medium }"
          :class="{ addButtonClickable: isAddButtonEnabled(isLeft), addButtonDisabled: !isAddButtonEnabled(isLeft) }"
          :id="'addButton'+index0"
          class="addButton"
          @click="addToMapping(isLeft)" >
          <font-awesome-icon icon="plus-circle" />
        </div>
        <div
          v-b-tooltip.hover="{ title: isDeleteAllButtonEnabled(isLeft) ? 'delete all concepts' : '', delay: $util.delay.medium }"
          :class="{ deleteAllButtonClickable: isDeleteAllButtonEnabled(isLeft), deleteAllButtonDisabled: !isDeleteAllButtonEnabled(isLeft) }"
          class="deleteAllButton"
          @click="deleteAll(isLeft)" ><font-awesome-icon icon="trash-alt" /></div>
        <div class="mappingButtonsFiller" />
      </div>
    </div>
    <!-- Selecting of mapping type (in between source and target sides via flex order) -->
    <div class="mappingTypeSelection">
      <mapping-type-selection
        v-show="schemeLeft != null || schemeRight != null"
        :mapping="mapping"/>
    </div>
    <!-- Export modal (TODO: Put into its own component and allow export of mappings, concepts, etc.) -->
    <b-modal
      ref="exportModal"
      hide-footer
      center
      size="lg"
      title="Export Mapping">
      <p><b-btn
        class="mt-3"
        @click.stop.prevent="exportClipboard">Copy to clipboard</b-btn></p>
      <p><a
        :href="'data:text/json;charset=utf-8,' + mappingEncoded"
        download="mapping.json"
        target="_blank">Download as .json file</a></p>
      <div
        ref="json"
        style="height: 600px; overflow: auto; margin-top: 20px;">
        <pre ref="jsonPre">{{ mappingPretty }}</pre>
      </div>
    </b-modal>
  </div>
</template>

<script>
import ItemName from "./ItemName"
import MappingTypeSelection from "./MappingTypeSelection"
import Minimizer from "./Minimizer"
import FontAwesomeIcon from "@fortawesome/vue-fontawesome"
var _ = require("lodash")

/**
 * The mapping editor component.
 */
export default {
  name: "MappingEditor",
  components: { ItemName, MappingTypeSelection, Minimizer, FontAwesomeIcon },
  props: {
    /**
     * The selected concept from the left hand concept browser.
     */
    selectedLeft: {
      type: Object,
      default: null
    },
    /**
     * The selected concept from the right hand concept browser.
     */
    selectedRight: {
      type: Object,
      default: null
    },
    /**
     * The selected scheme from the left hand concept browser.
     */
    schemeLeft: {
      type: Object,
      default: null
    },
    /**
     * The selected scheme from the right hand concept browser.
     */
    schemeRight: {
      type: Object,
      default: null
    }
  },
  data () {
    return {
      mapping: this.$root.$data.mapping
    }
  },
  computed: {
    /**
     * Returns a formatted version of the mapping
     */
    mappingPretty() {
      return JSON.stringify(this.$util.cleanJSKOS(this.$util.deepCopy(this.mapping.jskos)), null, 2)
    },
    /**
     * Returns an encoded version of the mapping for export
     */
    mappingEncoded() {
      return encodeURIComponent(JSON.stringify(this.$util.cleanJSKOS(this.$util.deepCopy(this.mapping.jskos))))
    }
  },
  methods: {
    labelForScheme(scheme) {
      return scheme ? scheme.notation[0] : "&nbsp;"
    },
    /**
     * Returns whether the add button should be enabled for a specific side
     */
    isAddButtonEnabled(isLeft) {
      let concept = isLeft ? this.selectedLeft : this.selectedRight
      if (!this.mapping.checkScheme(isLeft ? this.schemeLeft : this.schemeRight, isLeft)) {
        return false
      }
      if (concept == null) {
        return false
      }
      if (this.mapping.added(concept, isLeft)) {
        return false
      }
      return true
    },
    /**
     * Returns whether the delete all button should be enabled for a specific side
     */
    isDeleteAllButtonEnabled(isLeft) {
      return this.mapping.getConcepts(isLeft).length > 0
    },
    /**
     * Returns the reason why the add button is disabled
     */
    addButtonDisabledReason(isLeft) {
      let concept = isLeft ? this.selectedLeft : this.selectedRight
      if (!this.mapping.checkScheme(isLeft ? this.schemeLeft : this.schemeRight, isLeft)) {
        return "Scheme does not match."
      }
      if (concept == null) {
        return "Please select a concept."
      }
      if (this.mapping.added(concept, isLeft)) {
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
      let concept = isLeft ? this.selectedLeft : this.selectedRight
      this.mapping.add(concept, isLeft ? this.schemeLeft : this.schemeRight, isLeft)
    },
    /**
     * Removes all concepts from one side of the mapping
     */
    deleteAll(isLeft) {
      this.mapping.removeAll(isLeft)
    },
    /**
     * Returns whether to show the scheme's label for a specific side
     */
    showScheme(isLeft) {
      let chosenScheme = isLeft ? this.schemeLeft : this.schemeRight
      let mappingScheme = this.mapping.getScheme(isLeft)
      return !this.$util.compareSchemes(chosenScheme, mappingScheme)
    },
    /**
     * Opens the export modal
     */
    exportMapping() {
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
    }
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
  & > div {
    position: relative;
    top: 50%;
    transform: translateY(-50%);
  }
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
  & > li {
    position: relative;
    margin: 5px 12px 5px 0;
    & > .mappingConceptDelete {
      position: absolute;
      right: -10px;
      top: -5px;
      bottom: 0;
      margin: auto 0;
      cursor: pointer;
      z-index: 50;
      user-select: none;
      width: 12px;
      height: 12px;
      text-align: center;
      font-weight: bold;
      &:hover {
        color: @color-secondary-2-4;
      }
    }
  }
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

.mappingArrow {
  position: absolute;
  margin: auto auto;
  text-align: center;
  font-size: 1.6rem;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: 1.6em;
  height: 1.6em;
  user-select: none;
  z-index: 50;
}
.mappingArrowReversible {
  cursor: pointer;
  &:hover {
    color: @color-secondary-2-4;
  }
}

.mappingExport {
  position: absolute;
  width: 24px;
  font-size: 12px;
  text-align: center;
  margin: 5px auto;
  left: 0;
  right: 0;
  bottom: 0;
  cursor: pointer;
  user-select: none;
  z-index: 60;
  color: @color-button;
  &:hover {
    color: @color-button-hover;
  }
}

.mappingButtons {
  flex: 0 0 32px !important;
  display: flex;
  flex-direction: row !important;
}
.mappingButtonsFiller {
  flex: 1;
}

.addButton, .deleteAllButton {
  flex: none;
  z-index: 50;
  user-select: none;
  margin: 0 10px;
  font-size: 1.5rem;
  color: @color-button;
}
.addButtonDisabledReason {
  flex: 0 0 20px !important;
  margin: 0 auto;
  &:extend(.text-lightGrey);
  &:extend(.fontSize-small);
}
.addButtonClickable, .deleteAllButtonClickable {
  cursor: pointer;
  &:hover {
    color: @color-button-hover;
  }
}
.addButtonDisabled, .deleteAllButtonDisabled {
  color: @color-button-disabled;
}

</style>
