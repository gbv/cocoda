<template>
  <div
    :style="`${concepts.length == 0 ? 'min-height: 80px; max-height: 80px;' : ''}`">
    <!-- Minimizer allows the component to get minimized -->
    <minimizer
      :name="`conceptList_${isLeft}`"
      :text="$t('conceptList.title')" />
    <!-- Data Selection -->
    <div style="width: 100%; height: 100%; display: flex; flex-direction: column;">
      <div style="flex: none; width: 100%; text-align: center;">
        <b-dropdown
          class="conceptListWrapper-dataChoiceDropdown"
          size="sm"
          variant="light"
          :text="dataChoices[dataChoice].label">
          <b-dropdown-item
            v-for="(choice, index) in dataChoices"
            :key="`conceptListWrapper-dataChoice-${index}`"
            href="#"
            @click="dataChoice = index">
            {{ choice.label }}
          </b-dropdown-item>
        </b-dropdown>
      </div>
      <!-- List of concepts -->
      <concept-list
        style="flex: 1;"
        :is-left="isLeft"
        :concepts="concepts"
        :show-children="dataChoices[dataChoice].showChildren"
        :no-items-label="dataChoices[dataChoice].noItemsLabel" />
    </div>
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

<style lang="less" scoped>
@import "../style/main.less";


</style>
