<template>
  <div
    v-if="item != null"
    class="conceptDetail">
    <!-- Ancestors / Broader -->
    <concept-detail-ancestors
      :item="item"
      :is-left="isLeft"
      :settings="settings" />

    <!-- Name of concept -->
    <div
      class="conceptDetail-name"
      :class="{
        'concept-mappingsExist': loadConceptsMappedStatus && $store.getters.mappedStatus(item, isLeft),
        'concept-mappingsDoNotExist': loadConceptsMappedStatus && !$store.getters.mappedStatus(item, isLeft)
      }">
      <!-- Button to clear scheme -->
      <div
        v-b-tooltip.hover="{ title: $t('conceptDetail.clearConcept'), delay: defaults.delay.medium }"
        class="button conceptDetail-name-clearButton"
        @click="setSelected({ scheme: selected.scheme[isLeft], isLeft })">
        <font-awesome-icon icon="times-circle" />
      </div>
      <item-name
        :item="item"
        :is-highlighted="true"
        font-size="normal" />
      <font-awesome-icon
        v-b-tooltip.hover="{ title: $jskos.isContainedIn(item, favoriteConcepts) ? $t('schemeSelection.starRemove') : $t('schemeSelection.starAdd'), delay: defaults.delay.medium }"
        :class="$jskos.isContainedIn(item, favoriteConcepts) ? 'starFavorite' : 'starNormal'"
        class="pointer fontSize-verySmall"
        style="margin-left: 3px;"
        icon="star"
        @click="$jskos.isContainedIn(item, favoriteConcepts) ? $store.dispatch('removeConceptFromFavorites', item) : $store.dispatch('addConceptToFavorites', item)" />
      <div
        v-if="showAddToMappingButton"
        v-b-tooltip.hover="{ title: $t('general.addToMapping'), delay: defaults.delay.medium }"
        :class="{ button: showAddToMappingButton }"
        class="conceptDetail-name-addButton"
        @click="addToMapping({
          concept: item,
          scheme: (item.inScheme && item.inScheme[0]) || selected.scheme[isLeft],
          isLeft: isLeft
        })">
        <font-awesome-icon icon="plus-circle" />
      </div>
    </div>

    <tabs
      ref="tabs"
      v-model="tab"
      style="margin-top: 3px; position: relative;"
      borders="bottom"
      size="sm">
      <div
        v-if="previousConcept"
        v-b-tooltip.hover="{ title: $t('conceptDetail.previousConceptTooltip'), delay: defaults.delay.medium }"
        class="conceptDetail-previousButton">
        <router-link
          :to="getRouterUrl(previousConcept, isLeft, true)">
          <b-button
            variant="light"
            class="button">
            <font-awesome-icon icon="arrow-left" />
          </b-button>
        </router-link>
      </div>
      <div
        v-if="nextConcept"
        v-b-tooltip.hover="{ title: $t('conceptDetail.nextConceptTooltip'), delay: defaults.delay.medium }"
        class="conceptDetail-nextButton">
        <router-link
          :to="getRouterUrl(nextConcept, isLeft, true)">
          <b-button
            variant="light"
            class="button">
            <font-awesome-icon icon="arrow-right" />
          </b-button>
        </router-link>
      </div>
      <!-- Content tabs (Content, Translations) -->
      <template v-for="([contentMap, tabTitle], tabIndex) in [[mainLanguagesContentMap, $t('conceptDetail.mainTab')], [additionalLanguagesContentMap, $t('conceptDetail.additionalLanguagesTab')]].filter(([contentMap]) => Object.keys(contentMap).length)">
        <tab
          :key="tabIndex"
          :title="tabTitle">
          <content-map
            :content-map="contentMap"
            @click="copyAndSearch($event)" />
        </tab>
      </template>
      <!-- URI and identifier -->
      <tab :title="$t('conceptDetail.info')">
        <div
          v-for="(identifier, index) in [item.uri].concat(item.identifier).filter(identifier => identifier != null)"
          :key="`conceptDetail-${isLeft}-identifier-${index}`"
          :class="identifier.startsWith('http') ? 'conceptDetail-identifier' : 'conceptDetail-identifier'">
          <font-awesome-icon
            :icon="identifier.startsWith('http') ? 'link' : 'id-card'"
            @dblclick="copyToClipboard(elementForEvent($event))" />
          <auto-link :link="identifier" />
        </div>
        <div
          v-for="type in types"
          :key="`conceptDetail-${isLeft}-type-${type.uri}`"
          class="conceptDetail-identifier">
          <b>{{ $t("general.type") }}:</b>
          {{ $jskos.prefLabel(type, { language: locale }) }}
        </div>
        <div
          v-if="item.creator && item.creator.length"
          class="conceptDetail-identifier">
          <font-awesome-icon icon="user" /> {{ $jskos.prefLabel(item.creator[0]) }}
        </div>
        <div class="conceptDetail-identifier">
          <span v-if="item.created">
            <b>{{ $t("conceptDetail.created") }}:</b> <date-string :date="item.created" />
          </span>
          <span v-if="item.issued">
            <b>{{ $t("conceptDetail.issued") }}:</b> <date-string :date="item.issued" />
          </span>
          <span v-if="item.modified">
            <b>{{ $t("conceptDetail.modified") }}:</b> <date-string :date="item.modified" />
          </span>
        </div>
      </tab>
      <!-- coli-ana (see https://github.com/gbv/cocoda/issues/524) -->
      <tab
        v-if="memberList && memberList.length"
        :title="'coli-ana'">
        <ul class="coli-ana">
          <li>
            <div />
            <div>{{ $jskos.notation(item) }}</div>
            <div />
          </li>
          <li
            v-for="(member, index) of memberList"
            :key="`${member.uri}-${index}`"
            :class="{
              'font-weight-bold': memberList[index - 1] &&
                isMemberParentOf(memberList[index - 1], member) &&
                !isMemberParentOf(member, memberList[index + 1]),
            }">
            <div>
              <span
                v-if="isMemberParentOf(memberList[index - 1], member)">
                ↳
              </span>
            </div>
            <div>{{ member.notation[1] }}</div>
            <div>
              <item-name
                :item="member"
                :show-notation="false"
                :is-link="true"
                :is-left="isLeft"
                font-size="small" />
              <span v-if="!member.uri.includes('facet')">
                (<item-name
                  :item="member"
                  :show-text="false"
                  :is-link="false"
                  font-size="small" />)
              </span>
            </div>
          </li>
        </ul>
        <p
          v-if="!memberListComplete"
          v-html="$t('conceptDetail.coliAnaIncomplete')" />
        <p v-html="$t('conceptDetail.coliAnaInfo', { url: `${config['coli-ana']}?notation=${$jskos.notation(item)}` })" />
      </tab>
      <!-- Search Links (see https://github.com/gbv/cocoda/issues/220) -->
      <tab
        v-if="searchLinks.length"
        :key="`conceptDetail-${isLeft}-searchLinks`"
        :title="$t('conceptDetail.searchLinks')">
        <ul style="margin-bottom: 0;">
          <li
            v-for="(searchLink, index) of searchLinks"
            :key="`searchLink-${isLeft}-${index}`">
            <a
              :href="searchLink.url"
              target="_blank">
              {{ searchLink.label }}
            </a>
          </li>
        </ul>
      </tab>
      <!-- Titles index in K10plus -->
      <tab
        v-if="scheme?.CQLKEY"
        ref="k10plusTab"
        :key="`conceptDetail-${isLeft}-k10plus`"
        :title="$t('conceptDetail.k10plus')">
        <ul>
          <li
            v-for="(title, index) in k10plusTitles.filter(Boolean)"
            :key="index">
            <a
              v-if="title"
              :href="title.url"
              target="k10plus"
              :title="$t('conceptDetail.k10plusTooltip')">
              <span v-html="title.citation" />
            </a>
          </li>
          <li v-if="k10plusTitles.includes(null) && k10plusTitles.length === k10plusTitleCount - k10plusInitialTitleCount + 1 ">
            <loading-indicator size="sm" />
          </li>
        </ul>
        <a
          v-if="k10plusTitles.length > 1 && k10plusTitles.includes(null)"
          href=""
          @click.prevent="k10plusTitleCount += k10plusInitialTitleCount">
          {{ $t("conceptDetail.k10plusLoadMore") }}
        </a>
      </tab>
    </tabs>

    <!-- Narrower concepts -->
    <item-detail-narrower
      :narrower="item.narrower"
      :is-left="isLeft" />
  </div>
</template>

<script>
import AutoLink from "./AutoLink.vue"
import ItemName from "./ItemName.vue"
import ConceptDetailAncestors from "./ConceptDetailAncestors.vue"
import ItemDetailNarrower from "./ItemDetailNarrower.vue"
import DateString from "./DateString.vue"
import ContentMap from "./ContentMap.vue"
import LoadingIndicator from "./LoadingIndicator.vue"
import _ from "lodash"
import axios from "axios"

// Import mixins
import objects from "@/mixins/cdk.js"
import computed from "@/mixins/computed.js"
import hotkeys from "@/mixins/hotkeys.js"
import mappedStatus from "@/mixins/mapped-status.js"

import { getItem, loadConcepts, modifyItem, saveItem } from "@/items"
import { mainLanguagesContentMapForConcept, additionalLanguagesContentMapForConcept } from "@/utils/concept-helpers"

/**
 * Component that displays an item's (either scheme or concept) details (URI, notation, identifier, ...).
 */
export default {
  name: "ConceptDetail",
  components: {
    AutoLink, ItemName, ConceptDetailAncestors, ItemDetailNarrower, DateString, ContentMap, LoadingIndicator,
  },
  mixins: [objects, computed, hotkeys, mappedStatus],
  props: {
    /**
     * The concept object whose details should be displayed.
     */
    item: {
      type: Object,
      default: null,
    },
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true,
    },
    /**
     * Settings - see [`ItemDetail`](#itemdetail).
     */
    settings: {
      type: Object,
      default: () => {
        return {}
      },
    },
  },
  data () {
    return {
      searchLinks: [],
      tab: 0,
      k10plusInitialTitleCount: 5,
      k10plusTitleCount: 5,
    }
  },
  computed: {
    _item() {
      return getItem(this.item)
    },
    scheme() {
      return getItem(_.get(this._item, "inScheme[0]") || this.selected.scheme[this.isLeft])
    },
    gnd() {
      return getItem({ uri: "http://bartoc.org/en/node/430" })
    },
    memberList() {
      return this._item && this._item.memberList && this._item.memberList.filter(Boolean)
    },
    memberListComplete() {
      return this._item && this._item.memberList && !this._item.memberList.includes(null)
    },
    showAddToMappingButton() {
      return this.$store.getters["mapping/canAdd"](this._item, _.get(this._item, "inScheme[0]") || this.selected.scheme[this.isLeft], this.isLeft)
    },
    searchLinkInfo() {
      return {
        uri: this._item && this._item.uri,
        language: this.locale,
        notation: this.$jskos.notation(this._item),
        prefLabel: this.$jskos.prefLabel(this._item, { fallbackToUri: false }),
      }
    },
    // Returns null or an array of type objects
    types() {
      if (!this._item || (this._item.type || []).length <= 1) {
        return []
      }
      let types = []
      const scheme = getItem(_.get(this.item, "inScheme[0]"))
      const schemeTypes = scheme.types || []
      for (let typeUri of this._item.type || []) {
        if (typeUri == "http://www.w3.org/2004/02/skos/core#Concept") {
          continue
        }
        let type = { uri: typeUri }
        // Try to find type in scheme types
        type = schemeTypes.find(t => this.$jskos.compare(t, type)) || type
        types.push(type)
      }
      return types
    },
    gndTerms() {
      // Assemble gndTerms array for display
      let mappings = _.get(this._item, "__GNDMAPPINGS__", [])
      let concepts = []
      for (let mapping of mappings) {
        for (let concept of this.$jskos.conceptsOfMapping(mapping)) {
          if (this.$jskos.compare(this.gnd, _.get(concept, "inScheme[0]")) && !concepts.find(c => this.$jskos.compare(c.concept, concept))) {
            concepts.push({
              concept: getItem(concept),
              type: this.$jskos.mappingTypeByType(mapping.type),
            })
          }
        }
      }
      let gndTerms = []
      let relevanceOrder = ["conceptDetail.relevanceVeryHigh", "conceptDetail.relevanceHigh", "conceptDetail.relevanceMedium", "conceptDetail.relevanceLow", "conceptDetail.relevanceGeneric"]
      for (let relevance of relevanceOrder) {
        for (let { concept } of concepts.filter(c => c.type.RELEVANCE == this.$t(relevance, "en"))) {
          if (concept && (this.$jskos.prefLabel(concept, { fallbackToUri: false }))) {
            gndTerms.push(_.escape(this.$jskos.prefLabel(concept)))
          }
        }
      }
      return gndTerms
    },
    k10plusTitles() {
      if (!this._item.K10PLUS) {
        return [null]
      }
      return this._item.K10PLUS || []
    },
    // Returns the available concept
    previousConcept() {
      return this.selected.previousConcept[this.isLeft]
    },
    nextConcept() {
      return this.selected.nextConcept[this.isLeft]
    },
    loadConceptsMappedStatusConceptsToLoad() {
      if (!this.item) {
        return []
      }
      return [this.item].concat(this.item.ancestors || [], this.item.broader || []).filter(concept => concept != null)
    },
    mainLanguagesContentMap() {
      return mainLanguagesContentMapForConcept(this.item)
    },
    additionalLanguagesContentMap() {
      return additionalLanguagesContentMapForConcept(this.item)
    },
  },
  watch: {
    // TODO: Can we watch `uri` directly?
    _item(newItem, oldItem) {
      // Refresh component if item changed
      if(!this.$jskos.compare(newItem, oldItem)) {
        this.refresh()
      }
    },
    settings(newSettings, oldSettings) {
      if (!_.isEqual(newSettings, oldSettings)) {
        // Refresh component if settings changed
        this.refresh()
      }
    },
    searchLinkInfo(newValue, oldValue) {
      if (!_.isEqual(newValue, oldValue)) {
        this.updateSearchLinks(newValue)
      }
    },
    tab() {
      if (this.$refs.k10plusTab?.isActive && !this._item.K10PLUS) {
        this.loadK10plus()
      }
    },
    k10plusTitleCount() {
      this.loadK10plus()
    },
  },
  mounted() {
    // Initial refresh
    this.refresh()
    this.updateSearchLinks(this.searchLinkInfo)
    // Enable shortcuts
    this.enableShortcuts()
  },
  methods: {
    shortcutHandler({ action, isLeft }) {
      if (action == "nextConcept" && isLeft == this.isLeft) {
        // Open next concept if available
        if (this.nextConcept) {
          this.setSelected({
            concept: this.nextConcept,
            isLeft,
          })
        }
      }
    },
    refresh() {
      this.k10plusTitleCount = this.k10plusInitialTitleCount
      // Load GND terms
      this.loadGndTerms()
      // Load details if not loaded
      // ? Why force: true?
      loadConcepts([this.item], { force: true })
      // Load coli-ana data
      this.loadColiAna()
    },
    async loadGndTerms() {
      // TODO: Refactoring necessary!
      if (!this.item) {
        return
      }
      let itemBefore = this._item
      if (!this.gnd) {
        return
      }
      // Don't load GND terms for GND items
      if (this.$jskos.compare(this.gnd, _.get(itemBefore, "inScheme[0]"))) {
        return
      }
      // Load GND mappings from all stored registries
      const mappingPromises = this.config.registries.filter(r => r.has.mappings && this.$jskos.mappingRegistryIsStored(r)).map(registry => this.getMappings({
        registry,
        direction: "both",
        from: itemBefore,
        toScheme: this.gnd.uri,
      }).catch(() => []))
      let mappings = _.flatten(await Promise.all(mappingPromises))

      // Get GND concepts and load their labels
      let gndConcepts = []
      for (let mapping of mappings) {
        let concepts = this.$jskos.conceptsOfMapping(mapping)
        for (let concept of concepts) {
          if (this.$jskos.compare(this.gnd, _.get(concept, "inScheme[0]"))) {
            gndConcepts.push(concept)
          }
        }
      }
      gndConcepts = _.uniqWith(gndConcepts, this.$jskos.compare)
      await loadConcepts(gndConcepts)

      // Set property "__GNDMAPPINGS__" for item
      modifyItem(itemBefore, "__GNDMAPPINGS__", mappings)
    },
    async loadColiAna() {
      const api = this.config["coli-ana"]
      if (!api) {
        return
      }
      const itemBefore = getItem(this._item, { relatedItems: true })
      if (!itemBefore) {
        return
      }
      if (itemBefore.memberList) {
        // Data already loaded
        return
      }
      const ddc = getItem({ uri: "http://dewey.info/scheme/edition/e23/" })
      if (!this.$jskos.compare(ddc, _.get(itemBefore, "inScheme[0]"))) {
        // Only DDC supported for now
        return
      }
      const result = await axios.get(`${api}analyze`, {
        params: {
          notation: this.$jskos.notation(itemBefore),
        },
      })
      const resultConcept = (result.data || []).find(c => this.$jskos.compare(c, itemBefore))
      if (resultConcept) {
        // Save each concept in memberList
        resultConcept.memberList.forEach(member => {
          member && saveItem(_.omit(member, ["notation"]), {
            scheme: ddc,
            type: "concept",
          })
        })
        // Save memberList to item
        modifyItem(
          itemBefore,
          "memberList",
          resultConcept.memberList,
        )
        // Load concept data (in parallel)
        loadConcepts(resultConcept.memberList.filter(Boolean))
        // Under certain conditions, activate the coli-ana tab
        this.$nextTick(() => {
          const tabs = this.$refs.tabs
          const coliAnaTab = tabs.tabs.findIndex(tab => tab.title === "coli-ana")
          if (itemBefore.__DETAILSLOADED__ === -1 && coliAnaTab !== -1) {
            tabs.activateTab(coliAnaTab)
          }
        })
      }
    },
    async loadK10plus() {
      if (!this.scheme?.CQLKEY) {
        modifyItem(this._item, "K10PLUS", [])
        return
      }
      if (this._item.K10PLUS && !this._item.K10PLUS.includes(null)) {
        return
      }
      if (!this._item.K10PLUS) {
        modifyItem(this._item, "K10PLUS", [null])
      }
      try {
        const result = await axios.get("https://ws.gbv.de/suggest/csl2/", {
          params: {
            citationstyle: "ieee",
            query: `pica.${this.scheme.CQLKEY.toLowerCase()}=${this.$jskos.notation(this._item)}`,
            database: "opac-de-627",
            highlight: "1",
            // ? Load multiple languages?
            language: "en",
            count: this.k10plusTitleCount + 1,
          },
        })
        modifyItem(this._item, "K10PLUS", (result.data?.[1] || []).map((citation, index) => {
          if (index === this.k10plusTitleCount) {
            return null
          }
          return {
            citation,
            url: `https://opac.k10plus.de/DB=2.299/PPNSET?PPN=${result.data[3][index].replace(/^.+:/,"")}`,
          }
        }))
      } catch (error) {
        console.warn("Error loading K10plus titles:", error)
      }
    },
    isMemberParentOf(member1, member2) {
      member1 = getItem(member1)
      member2 = getItem(member2)
      if (!member1 || !member2 || !member2.broader || !member2.broader.length) {
        return false
      }
      return this.$jskos.compare(member1, member2.broader[0])
    },
    /**
     * Function to get element for copy to clipboard
     */
    elementForEvent(event) {
      let element = event.target
      if (element.tagName.toLowerCase() == "path") {
        element = element.parentElement
      }
      element = element.nextElementSibling
      return element
    },
    /**
     * Determines whether a concept has notes (scopeNote, editorialNote, or altLabel)
     */
    hasNotes(concept) {
      let parts = ["scopeNote", "editorialNote", "altLabel"]
      let hasNotes = false
      for (let part of parts) {
        hasNotes = hasNotes || (this.$jskos.languageMapContent(concept, part) && this.$jskos.languageMapContent(concept, part).length)
      }
      return hasNotes
    },
    /**
     * Copy and search on other side
     */
    copyAndSearch(label) {
      this.$emit("searchConcept", label)
    },
    async updateSearchLinks(searchLinkInfo) {
      this.searchLinks = await this.$store.dispatch("getSearchLinks", {
        scheme: getItem(this.selected.scheme[this.isLeft]),
        ...searchLinkInfo,
      })
    },
    sortByLanguage(a, b) {
      const aIndex = this.languages.indexOf(a.language), bIndex = this.languages.indexOf(b.language)
      if (bIndex === -1) {
        return -1
      }
      if (aIndex === -1) {
        return 1
      }
      return aIndex - bIndex
    },
  },
}
</script>

<style lang="less" scoped>
@import "@/style/main.less";

.conceptDetail-scheme {
  margin-top: 5px;
}

.conceptDetail-name {
  background-color: @color-secondary;
  position: relative;
  padding: 0 20px;
}
.conceptDetail-name-clearButton {
  position: absolute;
  left: 2px;
  top: 2px;
}
.conceptDetail-name-addButton {
  .fontSize-large;
  position: absolute;
  right: 3px;
  top: -2px;
  color: @color-background;
}

.conceptDetail-identifier {
  margin: 2px 5px;
}
.conceptDetail-identifier:last-child {
  margin-bottom: 0;
}
.conceptDetail-identifier a {
  padding: 0 3px;
}
.conceptDetail-identifier svg {
  user-select: none;
}

.conceptDetail-notes {
  margin-top: 0px;
  display: flex;
  flex-direction: column;
}
.conceptDetail-note {
  padding: 3px 5px;
  flex: 1;
}

.conceptDetail-previousButton {
  position: absolute;
  top: 30px;
  right: 20px;
  height: 23px;
  line-height: 23px;
}
.conceptDetail-nextButton {
  position: absolute;
  top: 30px;
  right: 0;
  height: 23px;
  line-height: 23px;
}
.conceptDetail-nextButton button, .conceptDetail-previousButton button {
  .fontSize-small;
  padding: 0px 4px;
}

// coli-ana styles
.coli-ana {
  list-style: none;
  padding-left: 0;
}
.coli-ana > li {
  display: flex;
}
.coli-ana > li > div:first-child {
  width: 8px;
  user-select: none;
  color: @color-text-lightGrey;
  font-weight: normal;
}
.coli-ana > li > div:not(:last-child) {
  font-family: monospace;
}
.coli-ana > li > div:last-child {
  flex: 1;
  padding-left: 5px;
}

</style>

<style>
.conceptDetail .cocoda-vue-tabs .cocoda-vue-tabs-content {
  padding: 8px 6px 6px 6px !important;
}
</style>
