<template>
  <div
    class="conceptListWrapper"
    :style="`${concepts.length == 0 ? 'min-height: 80px; max-height: 80px;' : ''}`">
    <!-- Minimizer allows the component to get minimized -->
    <minimizer
      :name="`conceptList_${isLeft}`"
      :text="$t('conceptList.title')" />
    <tabs
      v-model="dataChoice"
      style="position: absolute; top: 0; bottom: 0; left: 0; right: 0;"
      fill>
      <tab
        v-for="(choice, index) in dataChoices"
        :key="`conceptListWrapper-dataChoice-${index}`"
        :title="choice.label">
        <!-- List of concepts -->
        <concept-list
          :is-left="isLeft"
          :concepts="choice.concepts"
          :show-children="choice.showChildren"
          :no-items-label="choice.noItemsLabel" />
      </tab>
    </tabs>
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
    return {
      dataChoice: 0,
    }
  },
  computed: {
    dataChoices() {
      return [
        {
          label: this.$t("conceptList.topConcepts"),
          noItemsLabel: this.$t("schemeDetail.noTopConcepts"),
          concepts: this._topConcepts,
          showChildren: true,
        },
        {
          label: this.$t("schemeSelection.conceptQuick"),
          concepts: this.favoriteConcepts,
          showChildren: false,
        }
      ]
    },
    _topConcepts() {
      let uri = _.get(this.selected.scheme[this.isLeft], "uri", null)
      return _.get(this.topConcepts, uri)
    },
    concepts() {
      return this.dataChoices[this.dataChoice].concepts
    },
  },
}
</script>

<style lang="less">
@import "../style/main.less";

.conceptListWrapper .cocoda-vue-tabs-content {
  padding: 5px 0 0 0 !important;
}

</style>
