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
        v-for="(concept, index) in ancestors.filter(concept => concept != null)"
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
        @click="$router.push({ path: getRouterUrl(selected.scheme[isLeft], isLeft) })">
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
            variant="light">
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
            variant="light">
            <font-awesome-icon icon="arrow-right" />
          </b-button>
        </router-link>
      </div>
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
          {{ $jskos.prefLabel(type) }}
        </div>
        <div
          v-if="item.creator && item.creator.length"
          class="conceptDetail-identifier">
          <font-awesome-icon icon="user" /> {{ $jskos.prefLabel(item.creator[0]) }}
        </div>
        <div
          v-if="item.created"
          class="conceptDetail-identifier">
          <b>{{ $t("conceptDetail.created") }}:</b> {{ dateToString(item.created, true) }}
        </div>
        <div
          v-if="item.issued"
          class="conceptDetail-identifier">
          <b>{{ $t("conceptDetail.issued") }}:</b> {{ dateToString(item.issued, true) }}
        </div>
        <div
          v-if="item.modified"
          class="conceptDetail-identifier">
          <b>{{ $t("conceptDetail.modified") }}:</b> {{ dateToString(item.modified, true) }}
        </div>
        <template v-if="item.definition">
          <div
            v-for="language in [$jskos.languagePreference.selectLanguage(item.definition)].concat(Object.keys(item.definition).filter(language => language != $jskos.languagePreference.selectLanguage(item.definition) && language != '-'))"
            :key="`conceptDetail-${isLeft}-defintion-${language}`"
            class="conceptDetail-identifier">
            <b>{{ $t("conceptDetail.definition") }} ({{ language }}):</b> {{ $jskos.definition(item, { language }).join(", ") }}
          </div>
        </template>
      </tab>
      <tab :title="$t('conceptDetail.labels')">
        <div
          v-for="language in [$jskos.languagePreference.selectLanguage(item.prefLabel)].concat(Object.keys(item.prefLabel || {}).filter(language => language != $jskos.languagePreference.selectLanguage(item.prefLabel))).filter(language => language && language != '-')"
          :key="`conceptDetail-${isLeft}-prefLabel-${language}`"
          class="conceptDetail-identifier">
          <span
            class="fontWeight-medium"
            @click="copyAndSearch($jskos.prefLabel(item, { language }))">
            {{ $jskos.prefLabel(item, { language }) }}
          </span>
          <span class="text-lightGrey">({{ language }})</span>
        </div>
        <!-- Explanation:
            1. Get all language keys for altLabels (Object.keys)
            2. Create objects in the form { language, label } (map)
            3. Flatten the array (reduce)
            4. Filter `-` language (filter)
            5. Sort current language higher (sort)
           -->
        <div
          v-if="$jskos.languageMapContent(item, 'altLabel')"
          class="fontWeight-heavy"
          style="margin-top: 10px;">
          {{ $t("conceptDetail.altLabels") }}:
        </div>
        <div
          v-for="({ language, label }, index) in Object.keys(item.altLabel || {}).map(language => item.altLabel[language].map(label => ({ language, label }))).reduce((prev, cur) => prev.concat(cur), []).filter(item => item.language != '-').sort((a, b) => a.language == $jskos.languagePreference.selectLanguage(item.altLabel) ? -1 : (b.language == $jskos.languagePreference.selectLanguage(item.altLabel) ? 1 : 0))"
          :key="`conceptDetail-${isLeft}-altLabel-${language}-${index}`"
          class="conceptDetail-identifier">
          <span @click="copyAndSearch(label)">
            {{ label }}
          </span>
          <span class="text-lightGrey">({{ language }})</span>
        </div>
      </tab>
      <!-- GND terms, scopeNotes, editorialNotes -->
      <template
        v-for="([notes, title], index) in [[{ de: gndTerms }, $t('conceptDetail.gnd')], [item.scopeNote, $t('conceptDetail.scope')], [item.editorialNote, $t('conceptDetail.editorial')]].filter(item => Object.values(item[0] || {}).reduce((prev, cur) => prev + cur.length, 0) > 0)">
        <!-- TODO: Adjust this as soon as cocoda-vue-tabs has the option to hide tabs -->
        <tab
          :key="`conceptDetail-${isLeft}-notes-${index}`"
          :title="title"
          :hidden="notes == ''"
          class="conceptDetail-notes">
          <div
            v-for="({ language, note }, index2) in Object.keys(notes || {}).map(language => notes[language].map(note => ({ language, note }))).reduce((prev, cur) => prev.concat(cur), []).filter(item => item.language != '-').sort((a, b) => a.language == $jskos.languagePreference.selectLanguage(notes) ? -1 : (b.language == $jskos.languagePreference.selectLanguage(notes) ? 1 : 0))"
            :key="`conceptDetail-${isLeft}-notes-${language}-${index2}`"
            class="conceptDetail-note">
            <span v-html="note" />
            <span class="text-lightGrey"> ({{ language }})</span>
          </div>
        </tab>
      </template>
      <!-- Search Links (see https://github.com/gbv/cocoda/issues/220) -->
      <tab
        v-if="config.searchLinks"
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
import AutoLink from "./AutoLink"
import ItemName from "./ItemName"
import LoadingIndicator from "./LoadingIndicator"
import ItemDetailNarrower from "./ItemDetailNarrower"
import _ from "lodash"

// Import mixins
import objects from "../mixins/cdk"
import computed from "../mixins/computed"
import hotkeys from "../mixins/hotkeys"
import mappedStatus from "../mixins/mapped-status"

/**
 * Component that displays an item's (either scheme or concept) details (URI, notation, identifier, ...).
 */
export default {
  name: "ConceptDetail",
  components: {
    AutoLink, ItemName, LoadingIndicator, ItemDetailNarrower,
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
    }
  },
  computed: {
    showAddToMappingButton() {
      return this.$store.getters["mapping/canAdd"](this.item, _.get(this.item, "inScheme[0]") || this.selected.scheme[this.isLeft], this.isLeft)
    },
    ancestors() {
      return _.get(this.item, "ancestors", []) || []
    },
    broader() {
      return _.get(this.item, "broader", []) || []
    },
    // Search Links (see https://github.com/gbv/cocoda/issues/220)
    searchLinks() {
      let language = this.$i18n.locale
      let notation = this.$jskos.notation(this.item)
      let prefLabel = this.$jskos.prefLabel(this.item)
      let info = { language, notation, prefLabel }
      let searchLinks = []
      for (let searchLink of this.config.searchLinks) {
        // Test schemeUris
        let scheme = this.selected.scheme[this.isLeft]
        let schemeUris = searchLink.schemeUris || []
        let match = schemeUris.length ? false : true
        for (let uri of schemeUris) {
          if (this.$jskos.compare(scheme, { uri })) {
            match = true
          }
        }
        if (!match) {
          continue
        }
        // Construct URL
        let url = searchLink.url
        _.forOwn(info, (value, key) => {
          // Replace all occurrences of {key} with value
          url = _.replace(url, new RegExp(`{${key}}`, "g"), value)
        })
        searchLinks.push({
          url,
          label: this.$jskos.prefLabel(searchLink),
        })
      }
      // Filter out duplicate URLs (e.g. Wikipedia)
      searchLinks = searchLinks.filter((link, index, self) =>
        index === self.findIndex(l => (
          l.url == link.url
        )),
      )
      return searchLinks
    },
    // Returns null or an array of type objects
    types() {
      if (!this.item || (this.item.type || []).length <= 1) {
        return []
      }
      let types = []
      let schemeTypes = _.get(this.item, "inScheme[0].types", [])
      for (let typeUri of this.item.type || []) {
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
      let gnd = this.getObject({ uri: "http://bartoc.org/en/node/430" })
      let mappings = _.get(this.item, "__GNDMAPPINGS__", [])
      let concepts = []
      for (let mapping of mappings) {
        for (let concept of this.$jskos.conceptsOfMapping(mapping)) {
          if (this.$jskos.compare(gnd, _.get(concept, "inScheme[0]")) && !concepts.find(c => this.$jskos.compare(c.concept, concept))) {
            concepts.push({
              concept,
              type: this.$jskos.mappingTypeByType(mapping.type),
            })
          }
        }
      }
      let gndTerms = []
      let relevanceOrder = ["conceptDetail.relevanceVeryHigh", "conceptDetail.relevanceHigh", "conceptDetail.relevanceMedium", "conceptDetail.relevanceLow", "conceptDetail.relevanceGeneric"]
      for (let relevance of relevanceOrder) {
        let term = `<strong>${this.$t("conceptDetail.relevance")}: ${this.$t(relevance)}</strong> - `
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
  },
  watch: {
    item(newItem, oldItem) {
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
  },
  mounted() {
    // Initial refresh
    this.refresh()
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
      this.loadConcepts([this.item])
    },
    async loadGndTerms() {
      // TODO: Refactoring necessary!
      if (!this.item) return
      let itemBefore = this.item
      let gnd = this.getObject({ uri: "http://bartoc.org/en/node/430" })
      // Don't load GND terms for GND items
      if (this.$jskos.compare(gnd, _.get(itemBefore, "inScheme[0]"))) {
        return
      }
      // TODO CDK: This only loads mappings from one registry?
      let mappings = await this.getMappings({
        direction: "both",
        from: itemBefore,
        toScheme: gnd.uri,
      })

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
      await this.loadConcepts(gndConcepts)

      // Set property "__GNDMAPPINGS__" for item
      this.$set(itemBefore, "__GNDMAPPINGS__", mappings)
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
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

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
  background-color: @color-select-2;
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
.conceptDetail-name-addButton:hover {
  color: @color-action-1;
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

</style>

<style>
.conceptDetail .cocoda-vue-tabs .cocoda-vue-tabs-content {
  padding: 8px 6px 6px 6px !important;
}
</style>
