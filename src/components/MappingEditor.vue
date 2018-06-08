<template>
  <div
    id="mappingEditor"
    :style="{ flex: flex }">
    <div
      v-b-tooltip.hover="mapping.reversible() ? 'reverse mapping' : 'not reversible, source can only have one concept'"
      v-show="schemeLeft != null || schemeRight != null"
      :class="{ mappingArrowReversible: mapping.reversible() }"
      class="mappingArrow"
      @click="mapping.reversible() && reverseMapping()">
      {{ mapping.reversed ? "←" : "→" }}
    </div>
    <div
      v-for="(isLeft, index0) in [true, false]"
      v-show="schemeLeft != null || schemeRight != null"
      :key="isLeft"
      class="mappingEditorPart" >
      <div v-if="mapping.getScheme(isLeft) != null">
        <div
          v-show="showScheme(isLeft)"
          class="mappingScheme font-heavy">{{ labelForScheme(mapping.getScheme(isLeft)) }}</div>
        <ul class="mappingConceptList">
          <li
            v-for="(concept, index) in mapping.getConcepts(isLeft)"
            :key="index" >
            <item-name
              :item="concept"
              @click="selected(concept)" />
            <div
              class="mappingConceptDelete"
              @click="mapping.remove(concept, isLeft)">X</div>
          </li>
        </ul>
      </div>
      <div v-else >
        <div class="mappingNoConcepts">No Concepts</div>
      </div>
      <div
        v-if="!isAddButtonEnabled(isLeft)"
        class="addButtonDisabledReason">
        {{ addButtonDisabledReason(isLeft) }}
      </div>
      <div class="mappingButtons">
        <div class="mappingButtonsFiller" />
        <div
          v-b-tooltip.hover="isAddButtonEnabled(isLeft) ? 'add selected concept' : ''"
          :class="{ addButtonClickable: isAddButtonEnabled(isLeft), addButtonDisabled: !isAddButtonEnabled(isLeft) }"
          :id="'addButton'+index0"
          class="addButton"
          @click="addToMapping(isLeft)" >
          <font-awesome-icon icon="plus-circle" />
        </div>
        <div
          v-b-tooltip.hover="isDeleteAllButtonEnabled(isLeft) ? 'delete all concepts' : ''"
          :class="{ deleteAllButtonClickable: isDeleteAllButtonEnabled(isLeft), deleteAllButtonDisabled: !isDeleteAllButtonEnabled(isLeft) }"
          class="deleteAllButton"
          @click="deleteAll(isLeft)" ><font-awesome-icon icon="trash-alt" /></div>
        <div class="mappingButtonsFiller" />
      </div>
    </div>
  </div>
</template>

<script>
import ItemName from "./ItemName"
import FontAwesomeIcon from "@fortawesome/vue-fontawesome"

/**
 * The mapping editor component.
 */
export default {
  name: "MappingEditor",
  components: { ItemName, FontAwesomeIcon },
  props: {
    /**
     * The height of the component as a flex value.
     */
    flex: {
      type: Number,
      default: 1
    },
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
  methods: {
    labelForScheme(scheme) {
      return scheme ? scheme.notation[0].toUpperCase() : "No Scheme"
    },
    reverseMapping() {
      if (!this.mapping.reverse()) {
        alert("Reversion not possible")
      }
    },
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
    isDeleteAllButtonEnabled(isLeft) {
      return this.mapping.getConcepts(isLeft).length > 0
    },
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
    addToMapping(isLeft) {
      if (!this.isAddButtonEnabled(isLeft)) {
        return
      }
      let concept = isLeft ? this.selectedLeft : this.selectedRight
      this.mapping.add(concept, isLeft ? this.schemeLeft : this.schemeRight, isLeft)
    },
    deleteAll(isLeft) {
      this.mapping.removeAll(isLeft)
    },
    showScheme(isLeft) {
      let chosenScheme = isLeft ? this.schemeLeft : this.schemeRight
      let mappingScheme = this.mapping.getScheme(isLeft)
      if (chosenScheme == null || mappingScheme == null) {
        return true
      }
      if (chosenScheme.uri != mappingScheme.uri) {
        return true
      }
      return false
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

#mappingEditor {
  position: relative;
  height: 0;
  overflow: hidden;
  display: flex;
}
.mappingEditorPart {
  flex: 1;
  width: 0;
  padding: 10px 10px 5px 10px;
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
      font-size: 12px;
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
  font-size: 1.6em;
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
  color: @buttonColor;
}
.addButtonDisabledReason {
  flex: 0 0 20px !important;
  margin: 0 auto;
  &:extend(.text-light-grey);
  font-size: 0.8em;
}
.addButtonClickable, .deleteAllButtonClickable {
  cursor: pointer;
  &:hover {
    color: @buttonColorHover;
  }
}
.addButtonDisabled, .deleteAllButtonDisabled {
  color: @buttonColorDisabled;
}

</style>
