<template>
  <div
    class="conceptListWrapper"
    :style="`${concepts.length == 0 ? 'min-height: 80px; max-height: 80px;' : ''}`">
    <tabs
      :value="currentChoiceIndex"
      style="position: absolute; top: 0; bottom: 0; left: 0; right: 0;"
      fill
      @change="tabChanged">
      <tab
        v-for="(choice, index) in dataChoices"
        :key="`conceptListWrapper-dataChoice-${index}`"
        :title="choice.label"
        style="position: relative; overflow: hidden !important;"
        :hidden="choice !== currentChoice"
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
          :buttons="choice.buttons"
          :shown="index == currentChoiceIndex"
          @scroll="loadConceptsInView" />
      </tab>
      <template #title="slotProps">
        <span>
          {{ slotProps.tab.title }}
        </span>
      </template>
    </tabs>
    <!-- Concept List Selection Button -->
    <div
      v-if="dataChoices.filter(choice => choice.available).length > 1"
      :id="`conceptListWrapper-listSelectionButton-${isLeft}`"
      class="button conceptListWrapper-listSelectionButton">
      <font-awesome-icon icon="chevron-up" />
    </div>
    <!-- Settings -->
    <component-settings />
    <!-- Data Modal Button -->
    <data-modal-button
      :data="minimizeConcepts(currentChoice.concepts)"
      :position-right="20"
      :position-bottom="0"
      type="concept"
      :url="currentChoice.url" />
    <!-- Concept List Selection Popover -->
    <b-popover
      v-if="dataChoices.filter(choice => choice.available).length > 1"
      ref="listSelectionPopover"
      placement="top"
      :show.sync="listSelectionPopoverShow"
      :target="`conceptListWrapper-listSelectionButton-${isLeft}`">
      <div :id="`conceptListWrapper-listSelectionPopover-${isLeft}`">
        <div
          v-for="(choice, index) in dataChoices"
          v-show="choice.available"
          :key="`conceptListWrapper-listSelectionPopover-${isLeft}-${index}`"
          v-b-tooltip.hover="{ title: choice.tooltip, delay: defaults.delay.medium, html: true }"
          :class="{
            'fontWeight-heavy': choice === currentChoice,
            'conceptListWrapper-listSelectionPopover-choice': true,
          }"
          @click="chooseIndex(index)">
          <div
            class="fontSize-small"
            style="display: inline-block; width: 18px;">
            <font-awesome-icon :icon="choice.icon" />
          </div>
          {{ choice.label }}
        </div>
      </div>
    </b-popover>
    <!-- Reload button for lists -->
    <div
      v-if="currentChoice.reloadButton"
      class="dataModalButton fontSize-small conceptListWrapper-reloadButton"
      @click="reloadList">
      <font-awesome-icon icon="sync-alt" />
    </div>
    <!-- Full screen loading indicator -->
    <loading-indicator-full v-if="loading" />
    <!-- Minimizer allows the component to get minimized -->
    <minimizer
      v-if="concepts.length > 0"
      :name="`conceptList_${isLeft}`"
      :text="currentChoice.label" />
  </div>
</template>

<script>
import Minimizer from "./Minimizer.vue"
import ConceptList from "./ConceptList.vue"
import _ from "lodash"
import ComponentSettings from "./ComponentSettings.vue"
import DataModalButton from "./DataModalButton.vue"
import LoadingIndicatorFull from "./LoadingIndicatorFull.vue"

import computed from "@/mixins/computed.js"
import objects from "@/mixins/cdk.js"
import dragandrop from "@/mixins/dragandrop.js"
import hoverHandler from "@/mixins/hover-handler.js"
import mappedStatus from "@/mixins/mapped-status.js"
import { getItem, getItemByUri, saveItem, loadConcepts } from "@/items"

export default {
  name: "ConceptListWrapper",
  components: { Minimizer, ConceptList, ComponentSettings,  DataModalButton, LoadingIndicatorFull },
  mixins: [computed, objects, dragandrop, hoverHandler, mappedStatus],
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
      listSelectionPopoverShow: false,
      loading: 0,
    }
  },
  computed: {
    dataChoices() {
      // Determine top concepts URL
      let topConceptsUrl = _.get(getItem(this.selected.scheme[this.isLeft]), "_registry.top")
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
          available: this._topConcepts.length > 0,
          icon: "sitemap",
        },
        {
          id: "favoriteConcepts",
          label: this.$t("conceptList.favoriteConceptsShort"),
          tooltip: this.$t("conceptList.favoriteConcepts"),
          concepts: this.favoriteConcepts,
          showChildren: false,
          showScheme: true,
          available: true,
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
          icon: "star",
        },
      ]
      let index = 0
      for (let list of this.config.conceptLists || []) {
        // Skip list if selected scheme is not part of list
        if (list.schemes && !list.schemes.find(scheme => this.$jskos.compare(scheme, this.selected.scheme[this.isLeft]))) {
          index += 1
          continue
        }
        let notation = this.$jskos.notation(list), label = this.$jskos.prefLabel(list), tooltip = ""
        if (notation) {
          if (label) {
            tooltip = `<b>${label}</b><br>`
          }
          label = notation
        }
        tooltip += this.$jskos.languageMapContent(list, "scopeNote") || ""
        let choice = {
          id: `custom-${index}`,
          label,
          tooltip,
          concepts: list.concepts,
          showChildren: false,
          showScheme: true,
          url: list.url || list.conceptsUrl,
          available: list.concepts.length > 0,
          icon: "list",
        }
        choice.reloadButton = choice.url != null
        choices.push(choice)
        index += 1
      }
      return choices
    },
    _topConcepts() {
      let uri = _.get(this.selected.scheme[this.isLeft], "uri", null)
      return _.get(getItemByUri(uri), "topConcepts") || [null]
    },
    concepts() {
      return this.currentChoice.concepts
    },
    currentChoice: {
      get() {
        let id = this.$settings.conceptListChoice[this.isLeft]
        return this.dataChoices.find(choice => choice.id === id && choice.available) || this.dataChoices.find(choice => choice.available)
      },
      set(value) {
        this.$store.commit({
          type: "settings/set",
          prop: `conceptListChoice[${this.isLeft}]`,
          value: value.id,
        })
      },
    },
    currentChoiceIndex: {
      get() {
        return this.dataChoices.findIndex(choice => choice === this.currentChoice)
      },
      set(value) {
        this.currentChoice = this.dataChoices[value]
      },
    },
  },
  watch: {
    concepts() {
      this.loadConceptsInView()
    },
  },
  created() {
    this.loadConceptsInView = _.debounce(this._loadConceptsInView, 300)
  },
  methods: {
    chooseIndex(index) {
      this.currentChoiceIndex = index
      this.listSelectionPopoverShow = false
    },
    /**
     * When the tab changed, instruct conceptList to scroll.
     */
    tabChanged() {
      // Load concepts in view
      this.loadConceptsInView()
    },
    droppedConcept(concept, droppedConcept) {
      if (droppedConcept) {
        droppedConcept(concept)
      }
    },
    _loadConceptsInView() {
      const concepts = []
      const conceptList = _.get(this, `$refs.conceptList[${this.currentChoiceIndex}]`)
      const children = _.get(conceptList, "$children[0].$children")
      const container = _.get(conceptList, "$children[0].$el")
      if (children && container) {
        for (let child of children) {
          if (!child || !child.$el) {
            continue
          }
          const element = child.$el
          const concept = _.get(child, "$children[0].concept")
          if (concept && this.checkInView(container, element)) {
            concepts.push(concept)
          }
        }
      }
      // Save concepts because it might be necessary
      concepts.forEach(concept => saveItem(concept, { type: "concept", returnIfExists: true }))
      // Load concepts
      loadConcepts(concepts)
      // Load mapped status for concepts
      this.loadMappingsForConcepts(concepts, this.isLeft)
    },
    // Minimizes the concept list to only URIs and inScheme
    // TODO: Is this still necessary with the new changes?
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
    hoverHandlers() {
      return [
        {
          elements: [
            document.getElementById(`conceptListWrapper-listSelectionButton-${this.isLeft}`),
            document.getElementById(`conceptListWrapper-listSelectionPopover-${this.isLeft}`),
          ],
          delta: 5,
          handler: (isInside) => {
            this.listSelectionPopoverShow = isInside
          },
        },
      ]
    },
    async reloadList() {
      this.loading += 1
      let conceptLists = await this.$store.dispatch("loadConceptLists")
      this.$store.commit({
        type: "setConfig",
        option: "conceptLists",
        value: conceptLists,
      })
      this.loading -= 1
    },
  },
}
</script>

<style lang="less">
@import "@/style/main.less";

.conceptListWrapper .cocoda-vue-tabs-content {
  padding: 5px 0 0 0 !important;
}
.conceptListWrapper .componentSettings {
  right: 3px;
  bottom: 2px;
}
.conceptListWrapper-reloadButton {
  right: 41px !important;
  bottom: 1px !important;
}

.conceptListWrapper-listSelectionButton {
  position: absolute;
  left: 10px;
  top: 7px;
}
.conceptListWrapper-listSelectionPopover-choice {
  padding: 4px 5px;
}
.conceptListWrapper-listSelectionPopover-choice:hover {
  background-color: var(--color-background);
  cursor: pointer;
}

</style>
