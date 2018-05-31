<template>
  <div
    id="mappingBrowser"
    :style="{ flex: flex }">
    <mapping-editor
      ref="mainElement0"
      :flex="flexes[0]"
      :selected-left="selectedLeft"
      :selected-right="selectedRight"
      :scheme-left="schemeLeft"
      :scheme-right="schemeRight"
      class="main-component"
      data-direction="row" />
    <div
      ref="resizeSlider0"
      class="resizeSliderRow"
      @mousedown="startResizing($event, 0, false)" />
    <mapping-table
      ref="mainElement1"
      :flex="flexes[1]"
      class="main-component"
      data-direction="row" />
    <div
      ref="resizeSlider1"
      class="resizeSliderRow"
      @mousedown="startResizing($event, 1, false)" />
    <mapping-occurrences
      ref="mainElement2"
      :selected-left="selectedLeft"
      :selected-right="selectedRight"
      :scheme-left="schemeLeft"
      :scheme-right="schemeRight"
      :flex="flexes[2]"
      class="main-component"
      data-direction="row" />
  </div>
</template>

<script>
import MappingEditor from "./MappingEditor"
import MappingOccurrences from "./MappingOccurrences"
import MappingTable from "./MappingTable"
import * as mixins from "../mixins"

/**
 * The mapping browser component which includes the mapping editor, mapping table, and mapping occurrences.
 */
export default {
  name: "MappingBrowser",
  components: {
    MappingEditor, MappingOccurrences, MappingTable
  },
  mixins: [mixins.resizingMixin],
  props: {
    /**
     * The width of the component as a flex value.
     */
    flex: {
      type: Number,
      default: 2
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
      flexes: [1.0, 1.0, 1.0]
    }
  }
}
</script>

<style scoped>
#mappingBrowser {
  width: 0;
  display: flex;
  flex-direction: column;
}
</style>
