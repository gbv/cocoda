<template>
  <div
    v-if="item != null"
    class="conceptDetail">
    <!-- Ancestors / Broader -->
    <div class="conceptDetail-ancestors">
      <div
        v-if="ancestors.length > 3 && !settings.showAllAncestors"
        v-b-tooltip.hover="{ title: showAncestors ? $t('conceptDetail.showLessAncestors') : $t('conceptDetail.showAllAncestors'), delay: defaults.delay.medium }"
        class="button conceptDetail-ancestors-expand"
        @click="showAncestors = !showAncestors">
        <font-awesome-icon
          :icon="showAncestors ? 'angle-down' : 'angle-right'" />
      </div>
      <div
        v-for="(concept, index) in ancestors.filter(concept => concept != null).reverse()"
        :key="`conceptDetail-${isLeft}-ancesters-${concept.uri}-${index}`"
        :class="{
          'concept-mappingsExist': (showAncestors || settings.showAllAncestors || index == 0 || index == ancestors.length - 1 || ancestors.length <= 3) && loadConceptsMappedStatus && $store.getters.mappedStatus(concept, isLeft),
          'concept-mappingsDoNotExist': loadConceptsMappedStatus && !$store.getters.mappedStatus(concept, isLeft)
        }">
        <span v-if="showAncestors || settings.showAllAncestors || index == 0 || index == ancestors.length - 1 || ancestors.length <= 3">
          <font-awesome-icon
            class="u-flip-horizontal"
            icon="level-up-alt" />
          <item-name
            :item="concept"
            :is-link="true"
            :is-left="isLeft"
            font-size="small" />
        </span>
        <span
          v-else-if="index == 1"
          v-b-tooltip.hover="{ title: $t('conceptDetail.showAllAncestors'), delay: defaults.delay.medium }"
          class="conceptDetail-ancestors-more button"
          @click="showAncestors = true">
          <font-awesome-icon
            class="u-flip-horizontal"
            icon="ellipsis-v" />
        </span>
      </div>
      <!-- Broader -->
      <div
        v-for="(concept, index) in (ancestors.length == 0 && item.__BROADERLOADED__ ? broader : []).filter(concept => concept != null)"
        :key="`conceptDetail-${isLeft}-broader-${concept.uri}-${index}`"
        :class="{
          'concept-mappingsExist': loadConceptsMappedStatus && $store.getters.mappedStatus(concept, isLeft),
          'concept-mappingsDoNotExist': loadConceptsMappedStatus && !$store.getters.mappedStatus(concept, isLeft)
        }">
        <font-awesome-icon
          icon="sort-up" />
        <item-name
          :item="concept"
          :is-link="true"
          :is-left="isLeft"
          font-size="small" />
      </div>
      <!-- Show LoadingIndicator when ancestors exist, but are not loaded yet -->
      <loading-indicator
        v-if="ancestors.length != 0 && ancestors.includes(null) || ancestors.length == 0 && broader.length != 0 && !item.__BROADERLOADED__"
        size="sm" />
    </div>

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
      <template v-for="([languageList, tabTitle], tabIndex) in [[mainLanguages, $t('conceptDetail.mainTab')], [additionalLanguages, $t('conceptDetail.additionalLanguagesTab')]].filter(([languages]) => languages.length)">
        <tab
          :key="tabIndex"
          :title="tabTitle">
          <template v-for="{ title, languageMap, isArray } in content.filter(part => languageList.find(language => part.languageMap[language]))">
            <div
              :key="title"
              style="margin-bottom: 8px;">
              <template v-for="language in languageList.filter(language => languageMap[language])">
                <div
                  v-for="(text, index) in isArray ? languageMap[language] : [languageMap[language]]"
                  :key="`${language}-${index}`"
                  class="conceptDetail-identifier">
                  <span @click="copyAndSearch(text)">
                    {{ text }}
                  </span>
                  <sup class="text-lightGrey">{{ title }} - {{ language }}</sup>
                </div>
              </template>
            </div>
          </template>
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
        <template v-if="item.definition">
          <b>{{ $t("conceptDetail.definition") }}:</b>
          <div
            v-for="({ language, definition }, index) in Object.keys(item.definition || {}).map(language => item.definition[language].map(definition => ({ language, definition }))).reduce((prev, cur) => prev.concat(cur), []).filter(item => item.language != '-').sort(sortByLanguage)"
            :key="`conceptDetail-${isLeft}-defintion-${language}-${index}`"
            class="conceptDetail-identifier">
            {{ definition }} <sup class="text-lightGrey">{{ language }}</sup>
          </div>
        </template>
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
import LoadingIndicator from "./LoadingIndicator.vue"
import ItemDetailNarrower from "./ItemDetailNarrower.vue"
import DateString from "./DateString.vue"
import _ from "lodash"
import axios from "axios"

// Import mixins
import objects from "@/mixins/cdk.js"
import computed from "@/mixins/computed.js"
import hotkeys from "@/mixins/hotkeys.js"
import mappedStatus from "@/mixins/mapped-status.js"

import { getItem, getItems, loadConcepts, modifyItem, saveItem } from "@/items"

/**
 * Component that displays an item's (either scheme or concept) details (URI, notation, identifier, ...).
 */
export default {
  name: "ConceptDetail",
  components: {
    AutoLink, ItemName, LoadingIndicator, ItemDetailNarrower, DateString,
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
      default: () => { return {} },
    },
  },
  data () {
    return {
      /** Temporarily show all ancestors if user clicked the ellipsis */
      showAncestors: false,
      searchLinks: [],
    }
  },
  computed: {
    _item() {
      return getItem(this.item)
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
    ancestors() {
      return getItems(_.get(this.item, "ancestors", []) || [])
    },
    broader() {
      return getItems(_.get(this.item, "broader", []) || [])
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
      let gnd = getItem({ uri: "http://bartoc.org/en/node/430" })
      let mappings = _.get(this._item, "__GNDMAPPINGS__", [])
      let concepts = []
      for (let mapping of mappings) {
        for (let concept of this.$jskos.conceptsOfMapping(mapping)) {
          if (this.$jskos.compare(gnd, _.get(concept, "inScheme[0]")) && !concepts.find(c => this.$jskos.compare(c.concept, concept))) {
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
        let term = ""
        let terms = []
        for (let { concept } of concepts.filter(c => c.type.RELEVANCE == this.$t(relevance, "en"))) {
          if (concept && (this.$jskos.prefLabel(concept, { fallbackToUri: false }))) {
            terms.push(_.escape(this.$jskos.prefLabel(concept)))
          }
        }
        if (terms.length > 0) {
          term = term + terms.join(", ")
          gndTerms.push(term)
        }
      }
      return gndTerms
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
    // Content to be shown under "Concept" and "Translations" tabs
    content() {
      const content = [
        {
          title: this.$t("conceptDetail.prefLabel"),
          prop: "prefLabel",
          languageMap: this.item.prefLabel,
        },
        {
          title: this.$t("conceptDetail.altLabel"),
          prop: "altLabel",
          languageMap: this.item.altLabel,
          isArray: true,
        },
        {
          title: this.$t("conceptDetail.gnd"),
          languageMap: this.gndTerms.length ? { de: this.gndTerms } : null,
          isArray: true,
        },
        {
          title: this.$t("conceptDetail.scope"),
          prop: "scopeNote",
          languageMap: this.item.scopeNote,
          isArray: true,
        },
        {
          title: this.$t("conceptDetail.editorial"),
          prop: "editorialNote",
          languageMap: this.item.editorialNote,
          isArray: true,
        },
      ]
      return content.filter(part => part.languageMap && Object.keys(part.languageMap).length)
    },
    // All available content languages
    allLanguages() {
      const props = this.content.map(part => part.prop).filter(Boolean)
      const languageSet = new Set()
      for (let prop of props) {
        Object.keys(this.item[prop] ?? {}).forEach(key => languageSet.add(key))
      }
      return Array.from(languageSet).filter(language => language !== "-")
    },
    // Main languages for content to be shown under Concept tab; usually selected language + English
    mainLanguages() {
      const props = this.content.map(part => part.prop).filter(Boolean)
      let language
      for (let prop of props) {
        language = this.$jskos.languagePreference.selectLanguage(this.item[prop])
        if (language) {
          break
        }
      }
      const languages = []
      if (language) {
        languages.push(language)
      }
      if (language !== "en" && this.allLanguages.includes("en")) {
        languages.push("en")
      }
      if (languages.length === 0) {
        languages.push(this.$jskos.languagePreference.getLanguages()?.[0])
      }
      return languages
    },
    // Additional languages for content to be shown under Translations tab; allLanguages minus mainLanguages
    additionalLanguages() {
      return this.allLanguages.filter(language => !this.mainLanguages.includes(language))
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
      this.showAncestors = false
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
      if (!this.item) return
      let itemBefore = this._item
      let gnd = getItem({ uri: "http://bartoc.org/en/node/430" })
      // Don't load GND terms for GND items
      if (this.$jskos.compare(gnd, _.get(itemBefore, "inScheme[0]"))) {
        return
      }
      // Load GND mappings from all stored registries
      const mappingPromises = this.config.registries.filter(r => r.has.mappings && this.$jskos.mappingRegistryIsStored(r)).map(registry => this.getMappings({
        registry,
        direction: "both",
        from: itemBefore,
        toScheme: gnd.uri,
      }).catch(() => []))
      let mappings = _.flatten(await Promise.all(mappingPromises))

      // Get GND concepts and load their labels
      let gndConcepts = []
      for (let mapping of mappings) {
        let concepts = this.$jskos.conceptsOfMapping(mapping)
        for (let concept of concepts) {
          if (this.$jskos.compare(gnd, _.get(concept, "inScheme[0]"))) {
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
      if (!api) return
      const itemBefore = getItem(this._item, { relatedItems: true })
      if (!itemBefore) return
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

.conceptDetail-ancestors {
  margin: 0;
  padding-left: 6px;
}
.conceptDetail-ancestors-expand {
  position: absolute;
  left: 5px;
}
.conceptDetail-ancestors-more {
  width: 20px;
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
