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
        style="position: relative;"
        @dragover.native="dragOver"
        @drop.native="drop($event, choice.droppedConcept)"
        @scroll.native="loadConceptsInView">
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
    <!-- Settings -->
    <component-settings>
      <b-form-checkbox
        v-model="conceptListAddToMappingSelectsConcept"
        style="user-select: none;">
        {{ $t("settings.conceptListAddToMappingSelectsConcept") }}
      </b-form-checkbox>
      <b-form-checkbox
        v-model="loadConceptsMappedStatus"
        v-b-tooltip="$t('settings.loadConceptsMappedStatusExplanation')"
        style="user-select: none;">
        {{ $t("settings.loadConceptsMappedStatus") }}
      </b-form-checkbox>
    </component-settings>
  </div>
</template>

<script>
import Minimizer from "./Minimizer"
import ConceptList from "./ConceptList"
import _ from "lodash"
import ComponentSettings from "./ComponentSettings"

import computed from "../mixins/computed"
import objects from "../mixins/objects"
import dragandrop from "../mixins/dragandrop"

export default {
  name: "ConceptListWrapper",
  components: { Minimizer, ConceptList, ComponentSettings },
  mixins: [computed, objects, dragandrop],
  props: {
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
    }
  },
  computed: {
    dataChoices() {
      let choices = [
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
              },
            },
          ],
          droppedConcept: concept => {
            this.$store.dispatch("addConceptToFavorites", concept)
          },
        },
      ]
      let index = 0
      for (let list of this.config.conceptLists || []) {
        let choice = {
          id: `custom-${index}`,
          label: this.$util.prefLabel(list),
          concepts: list.concepts.map(concept => this.getObject(concept, { type: "concept" })),
          showChildren: false,
          showScheme: true,
        }
        choices.push(choice)
        index += 1
      }
      // TODO: This must be solved differently, e.g. with a mouseover list to choose from.
      return choices
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
          value: id,
        })
      },
    },
    conceptListAddToMappingSelectsConcept: {
      get() {
        return this.$settings.conceptListAddToMappingSelectsConcept
      },
      set(value) {
        this.$store.commit({
          type: "settings/set",
          prop: "conceptListAddToMappingSelectsConcept",
          value,
        })
      },
    },
    loadConceptsMappedStatus: {
      get() {
        return this.$settings.loadConceptsMappedStatus
      },
      set(value) {
        this.$store.commit({
          type: "settings/set",
          prop: "loadConceptsMappedStatus",
          value,
        })
      },
    },
  },
  created() {
    this.loadConceptsInView = _.debounce(this._loadConceptsInView, 100)
  },
  methods: {
    /**
     * When the tab changed, instruct conceptList to scroll.
     */
    tabChanged({ index }) {
      let conceptList = _.get(this, `$refs.conceptList[${index}]`)
      conceptList && conceptList.scroll && conceptList.scroll()
      // Load concepts in view
      this.loadConceptsInView()
    },
    droppedConcept(concept, droppedConcept) {
      if (droppedConcept) {
        droppedConcept(concept)
      }
    },
    _loadConceptsInView() {
      let concepts = []
      let conceptList = _.get(this, `$refs.conceptList[${this.dataChoice}]`)
      let container = _.get(conceptList, "$parent.$el")
      if (conceptList && conceptList.$children && container) {
        for (let child of conceptList.$children) {
          if (!child || !child.$el) {
            continue
          }
          const element = child.$el
          if (this.checkInView(container, element)) {
            concepts.push(child.concept)
          }
        }
      }
      // Load concepts
      this.loadConcepts(concepts)
    },
    /**
     * from: https://stackoverflow.com/a/37285344
     *
     * Checks if element is in view relative to container element.
     * Note: container must have "position: relative"!
     */
    checkInView(container, element, partial = true) {
      let cTop = container.scrollTop
      let cBottom = cTop + container.clientHeight
      let eTop = element.offsetTop
      let eBottom = eTop + element.clientHeight
      let isTotal = (eTop >= cTop && eBottom <= cBottom)
      let isPartial = partial && (
        (eTop < cTop && eBottom > cTop) ||
        (eBottom > cBottom && eTop < cBottom)
      )
      return (isTotal || isPartial)
    },
  },
}
</script>

<style lang="less">
@import "../style/main.less";

.conceptListWrapper .cocoda-vue-tabs-content {
  padding: 5px 0 0 0 !important;
}
.conceptListWrapper .componentSettings {
  right: 3px;
  bottom: 7px;
}

</style>
