<template>
  <div
    :style="`${concepts.length == 0 ? 'min-height: 50px; max-height: 50px;' : ''}`">
    <!-- Minimizer allows the component to get minimized -->
    <minimizer
      :name="`conceptTree_${isLeft}`"
      :text="$t('conceptTree.title')" />
    <!-- List of concepts -->
    <concept-list
      :is-left="isLeft"
      :concepts="concepts"
      :show-children="true" />
  </div>
</template>

<script>
import Minimizer from "./Minimizer"
import ConceptList from "./ConceptList"

import computed from "../mixins/computed"
import objects from "../mixins/objects"

export default {
  name: "ConceptListWrapper",
  components: { Minimizer, ConceptList },
  mixins: [computed, objects],
  props: {
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {}
  },
  computed: {
    _topConcepts() {
      let uri = _.get(this.selected.scheme[this.isLeft], "uri", null)
      return _.get(this.topConcepts, uri)
    },
    concepts() {
      return this._topConcepts
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";


</style>
