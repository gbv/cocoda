<template>
  <div
    class="conceptListWrapper"
    :style="`${concepts.length == 0 ? 'min-height: 80px; max-height: 80px;' : ''}`">
    <!-- Minimizer allows the component to get minimized -->
    <minimizer
      :name="`conceptList_${isLeft}`"
      :text="dataChoices[dataChoice].label" />
    <tabs
      v-model="dataChoice"
      style="position: absolute; top: 0; bottom: 0; left: 0; right: 0;"
      fill
      @change="tabChanged">
      <tab
        v-for="(choice, index) in dataChoices"
        :key="`conceptListWrapper-dataChoice-${index}`"
        :title="choice.label"
        @dragover.native="dragOver"
        @drop.native="drop($event, choice.droppedConcept)">
        <!-- List of concepts -->
        <concept-list
          ref="conceptList"
          :is-left="isLeft"
          :concepts="choice.concepts"
          :show-children="choice.showChildren"
          :show-scheme="choice.showScheme"
          :no-items-label="choice.noItemsLabel"
          :buttons="choice.buttons" />
      </tab>
    </tabs>
  </div>
</template>

<script>
import Minimizer from "./Minimizer"
import ConceptList from "./ConceptList"
import _ from "lodash"

import computed from "../mixins/computed"
import objects from "../mixins/objects"
import dragandrop from "../mixins/dragandrop"

export default {
  name: "ConceptListWrapper",
  components: { Minimizer, ConceptList },
  mixins: [computed, objects, dragandrop],
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
    }
  },
  computed: {
    dataChoices() {
      return [
        {
          id: "topConcepts",
          label: this.$t("conceptList.topConcepts"),
          noItemsLabel: this.$t("schemeDetail.noTopConcepts"),
          concepts: this._topConcepts,
          showChildren: true,
          showScheme: false,
        },
        {
          id: "favoriteConcepts",
          label: this.$t("schemeSelection.conceptQuick"),
          concepts: this.favoriteConcepts,
          showChildren: false,
          showScheme: true,
          buttons: [
            {
              position: "before",
              icon: "times-circle",
              tooltip: this.$t("schemeSelection.starRemove"),
              onClick: (event, concept) => {
                this.$store.dispatch("removeConceptFromFavorites", concept)
              }
            }
          ],
          droppedConcept: concept => {
            this.$store.dispatch("addConceptToFavorites", concept)
          },
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
    dataChoice: {
      get() {
        let id = this.$settings.conceptListChoice[this.isLeft]
        let index = this.dataChoices.findIndex(choice => choice.id === id)
        return index != -1 ? index : 0
      },
      set(value) {
        let id = _.get(this.dataChoices, `[${value}].id`)
        this.$store.commit({
          type: "settings/set",
          prop: `conceptListChoice[${this.isLeft}]`,
          value: id
        })
      }
    },
  },
  methods: {
    /**
     * When the tab changed, instruct conceptList to scroll.
     */
    tabChanged({ index }) {
      let conceptList = _.get(this, `$refs.conceptList[${index}]`)
      conceptList && conceptList.scroll && conceptList.scroll()
    },
    droppedConcept(concept, droppedConcept) {
      if (droppedConcept) {
        droppedConcept(concept)
      }
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
