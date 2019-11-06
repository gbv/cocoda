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
        v-for="(choice, index) in dataChoices.filter(c => c.concepts.length || c.showWhenEmpty)"
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
          :buttons="choice.buttons"
          :shown="index == dataChoice" />
      </tab>
      <template v-slot:title="slotProps">
        <span
          v-b-tooltip.hover="{ title: dataChoices[slotProps.index].tooltip, delay: $util.delay.medium, html: true }">
          {{ slotProps.tab.title }}
        </span>
      </template>
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
    <!-- Data Modal Button -->
    <data-modal-button
      :data="minimizeConcepts(dataChoices[dataChoice].concepts)"
      :position-right="20"
      :position-bottom="5"
      type="concept"
      :url="dataChoices[dataChoice].url" />
  </div>
</template>

<script>
import Minimizer from "./Minimizer"
import ConceptList from "./ConceptList"
import _ from "lodash"
import ComponentSettings from "./ComponentSettings"
import DataModalButton from "./DataModalButton"

import computed from "../mixins/computed"
import objects from "../mixins/objects"
import dragandrop from "../mixins/dragandrop"

export default {
  name: "ConceptListWrapper",
  components: { Minimizer, ConceptList, ComponentSettings,  DataModalButton },
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
      // Determine top concepts URL
      let topConceptsUrl = _.get(this.selected.scheme[this.isLeft], "_provider.registry.top")
      if (topConceptsUrl) {
        // Add selected schemes URI
        topConceptsUrl += `?uri=${encodeURIComponent(this.selected.scheme[this.isLeft].uri)}`
      }
      let choices = [
        {
          id: "topConcepts",
          label: this.$t("conceptList.topConceptsShort"),
          tooltip: this.$t("conceptList.topConcepts"),
          noItemsLabel: this.$t("schemeDetail.noTopConcepts"),
          concepts: this._topConcepts,
          showChildren: true,
          showScheme: false,
          url: topConceptsUrl,
        },
        {
          id: "favoriteConcepts",
          label: this.$t("conceptList.favoriteConceptsShort"),
          tooltip: this.$t("conceptList.favoriteConcepts"),
          concepts: this.favoriteConcepts,
          showChildren: false,
          showScheme: true,
          showWhenEmpty: true,
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
        let notation = this.$util.notation(list), label = this.$util.prefLabel(list), tooltip = ""
        if (notation) {
          tooltip = `<b>${label}</b><br>`
          label = notation
        }
        tooltip += this.$util.lmContent(list, "scopeNote")
        let choice = {
          id: `custom-${index}`,
          label,
          tooltip,
          concepts: list.concepts.map(concept => this.getObject(concept, { type: "concept" })),
          showChildren: false,
          showScheme: true,
          url: list.url,
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
    // Minimizes the concept list to only URIs and inScheme
    minimizeConcepts(concepts) {
      let newList = []
      for (let concept of concepts) {
        if (!concept) {
          continue
        }
        let newConcept = {
          uri: concept.uri,
          notation: concept.notation,
        }
        if (concept.inScheme && concept.inScheme[0] && concept.inScheme[0].uri) {
          newConcept.inScheme = [{ uri: concept.inScheme[0].uri }]
        }
        newList.push(newConcept)
      }
      return newList
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
