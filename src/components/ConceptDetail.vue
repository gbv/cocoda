<template>
  <div
    v-if="item != null"
    class="conceptDetail">
    <!-- Ancestors / Broader -->
    <div class="conceptDetail-ancestors">
      <div
        v-if="ancestors.length > 3 && !settings.showAllAncestors"
        v-b-tooltip.hover="{ title: showAncestors ? $t('conceptDetail.showLessAncestors') : $t('conceptDetail.showAllAncestors'), delay: $util.delay.medium }"
        class="button conceptDetail-ancestors-expand"
        @click="showAncestors = !showAncestors">
        <font-awesome-icon
          :icon="showAncestors ? 'angle-down' : 'angle-right'" />
      </div>
      <div
        v-for="(concept, index) in ancestors.filter(concept => concept != null)"
        :key="concept.uri">
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
          v-b-tooltip.hover="{ title: $t('conceptDetail.showAllAncestors'), delay: $util.delay.medium }"
          class="conceptDetail-ancestors-more button"
          @click="showAncestors = true">
          <font-awesome-icon
            class="u-flip-horizontal"
            icon="ellipsis-v" />
        </span>
      </div>
      <!-- Broader -->
      <div
        v-for="(concept) in (ancestors.length == 0 && item.__BROADERLOADED__ ? broader : []).filter(concept => concept != null)"
        :key="concept.uri">
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
    <div class="conceptDetail-name">
      <!-- Button to clear scheme -->
      <div
        v-b-tooltip.hover="{ title: $t('conceptDetail.clearConcept'), delay: $util.delay.medium }"
        class="button"
        style="display: inline-block; margin: 0px 2px 0px 2px;"
        @click="$router.push({ path: getRouterUrl(selected.scheme[isLeft], isLeft) })">
        <font-awesome-icon icon="times-circle" />
      </div>
      <item-name
        :item="item"
        :is-highlighted="true"
        font-size="normal" />
      <font-awesome-icon
        v-b-tooltip.hover="{ title: $jskos.isContainedIn(item, favoriteConcepts) ? $t('schemeSelection.starRemove') : $t('schemeSelection.starAdd'), delay: $util.delay.medium }"
        :class="$jskos.isContainedIn(item, favoriteConcepts) ? 'starFavorite' : 'starNormal'"
        class="pointer fontSize-verySmall"
        icon="star"
        @click="$jskos.isContainedIn(item, favoriteConcepts) ? $store.dispatch('removeConceptFromFavorites', item) : $store.dispatch('addConceptToFavorites', item)" />
      <div
        v-if="showAddToMappingButton"
        v-b-tooltip.hover="{ title: $t('general.addToMapping'), delay: $util.delay.medium }"
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

    <!-- Notes and alternative labels -->
    <b-card
      :key="'conceptDetail-note-tabs'+iteration"
      no-body
      class="conceptDetail-note-tabs">
      <b-tabs
        no-fade
        card>
        <!-- scopeNotes, editorialNotes, altLabels, and GND terms -->
        <!-- TODO: Should altLabels really be called "Register Entries"? -->
        <b-tab
          v-for="([notes, title], index) in [[item.scopeNote, $t('conceptDetail.scope')], [item.editorialNote, $t('conceptDetail.editorial')], [{ de: gndTerms }, $t('conceptDetail.gnd')]].filter(element => element[0] != null && $util.lmContent(element[0]) != null && $util.lmContent(element[0]).length)"
          :key="'note'+index+'-'+iteration"
          :title="title"
          :active="title == 'GND' && !hasNotes(item)"
          class="conceptDetail-notes">
          <div class="conceptDetail-note">
            <span v-html="notesOptions.visiblePart($util.lmContent(notes))" />
            <b-collapse
              :id="'note'+index"
              tag="span"
              class="no-transition">
              <span v-html="notesOptions.hiddenPart($util.lmContent(notes))" />
            </b-collapse>
            <a
              v-if="notesOptions.isTruncated($util.lmContent(notes))"
              v-b-toggle="'note'+index"
              href=""
              @click.prevent>
              <span class="when-opened">{{ $t("conceptDetail.showLess") }}</span>
              <span class="when-closed">{{ $t("conceptDetail.showMore") }}</span>
            </a>
          </div>
        </b-tab>
        <b-tab :title="$t('conceptDetail.labels')">
          <div
            v-for="language in [$util.getLanguage(item.prefLabel)].concat(Object.keys(item.prefLabel || {}).filter(language => language != $util.getLanguage(item.prefLabel))).filter(language => language && language != '-')"
            :key="`conceptDetail-prefLabel-${language}`"
            class="conceptDetail-identifier">
            <b>{{ $t("conceptDetail.prefLabel") }} ({{ language }}):</b>
            <span @click="copyAndSearch($util.prefLabel(item, language))">
              {{ $util.prefLabel(item, language) }}
            </span>
          </div>
          <!-- Explanation:
            1. Get all language keys for altLabels (Object.keys)
            2. Create objects in the form { language, label } (map)
            3. Flatten the array (reduce)
            4. Filter `-` language (filter)
            5. Sort current language higher (sort)
           -->
          <div
            v-for="({ language, label }, index) in Object.keys(item.altLabel || {}).map(language => item.altLabel[language].map(label => ({ language, label }))).reduce((prev, cur) => prev.concat(cur), []).filter(item => item.language != '-').sort((a, b) => a.language == $util.getLanguage(item.altLabel) ? -1 : (b.language == $util.getLanguage(item.altLabel) ? 1 : 0))"
            :key="`conceptDetail-altLabel-${language}-${index}`"
            class="conceptDetail-identifier">
            <b>{{ $t("conceptDetail.altLabel") }} ({{ language }}):</b>
            <span @click="copyAndSearch(label)">
              {{ label }}
            </span>
          </div>
        </b-tab>
        <b-tab
          :key="'zzzzzzzzzz'+iteration"
          :title="$t('conceptDetail.info')">
          <!-- URI and identifier -->
          <div
            v-for="(identifier, index) in [item.uri].concat(item.identifier).filter(identifier => identifier != null)"
            :key="index"
            :class="identifier.startsWith('http') ? 'conceptDetail-identifier' : 'conceptDetail-identifier'">
            <font-awesome-icon
              :icon="identifier.startsWith('http') ? 'link' : 'id-card'"
              @dblclick="copyToClipboard(elementForEvent($event))" />
            <auto-link :link="identifier" />
          </div>
          <div
            v-for="type in types"
            :key="`conceptDetail-type-${type.uri}`"
            class="conceptDetail-identifier">
            <b>Type:</b> <auto-link
              :link="type.uri"
              :text="$util.prefLabel(type)" />
          </div>
          <div
            v-if="item.creator && item.creator.length"
            class="conceptDetail-identifier">
            <font-awesome-icon icon="user" /> {{ $util.prefLabel(item.creator[0]) }}
          </div>
          <div
            v-if="item.created"
            class="conceptDetail-identifier">
            <b>{{ $t("conceptDetail.created") }}:</b> {{ $util.dateToString(item.created, true) }}
          </div>
          <div
            v-if="item.modified"
            class="conceptDetail-identifier">
            <b>{{ $t("conceptDetail.modified") }}:</b> {{ $util.dateToString(item.modified, true) }}
          </div>
          <template v-if="item.definition">
            <div
              v-for="language in [$util.getLanguage(item.definition)].concat(Object.keys(item.definition).filter(language => language != $util.getLanguage(item.definition) && language != '-'))"
              :key="`conceptDetail-defintion-${language}`"
              class="conceptDetail-identifier">
              <b>{{ $t("conceptDetail.definition") }} ({{ language }}):</b> {{ $util.definition(item, language).join(", ") }}
            </div>
          </template>
        </b-tab>
        <!-- Search Links (see https://github.com/gbv/cocoda/issues/220) -->
        <b-tab
          v-if="config.searchLinks"
          :title="$t('conceptDetail.searchLinks')">
          <ul style="margin-bottom: 0;">
            <li
              v-for="(searchLink, index) of searchLinks"
              :key="'searchLink' + isLeft + index">
              <a
                :href="searchLink.url"
                target="_blank">
                {{ searchLink.label }}
              </a>
            </li>
          </ul>
        </b-tab>
      </b-tabs>
    </b-card>

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
import objects from "../mixins/objects"
import computed from "../mixins/computed"

/**
 * Component that displays an item's (either scheme or concept) details (URI, notation, identifier, ...).
 */
export default {
  name: "ConceptDetail",
  components: {
    AutoLink, ItemName, LoadingIndicator, ItemDetailNarrower
  },
  mixins: [objects, computed],
  props: {
    /**
     * The concept object whose details should be displayed.
     */
    item: {
      type: Object,
      default: null
    },
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true
    },
    /**
     * Settings - see [`ItemDetail`](#itemdetail).
     */
    settings: {
      type: Object,
      default: () => { return {} }
    }
  },
  data () {
    return {
      /** Temporarily show all ancestors if user clicked the ellipsis */
      showAncestors: false,
      /** Force some elements to reload by incrementing this value to prevent showing old text */
      iteration: 0,
      /**
       * A helper object that deals with showing and truncating the notes and alternative labels
       */
      notesOptions: {
        divider: "∤",
        maximumCharacters: 140,
        /**
         * Rejoin notes back together
         */
        join(notes) {
          if (Array.isArray(notes)) {
            return notes.join(this.divider)
          } else {
            return notes
          }
        },
        /**
         * Returns visible part of notes
         */
        visiblePart(notes) {
          let notesString = this.join(notes)
          notesString = notesString.substring(0, this.cutPosition(notesString))
          return this.replaceDivider(notesString)
        },
        /**
         * Returns hidden part of notes
         */
        hiddenPart(notes) {
          let notesString = this.join(notes)
          return this.replaceDivider(notesString.substring(this.cutPosition(notesString)))
        },
        /**
         * Returns the index between visible and hidden part of notes
         */
        cutPosition(notesString) {
          let re = new RegExp(this.divider, "g")
          let maximumCharacters = this.maximumCharacters - Math.min((notesString.substring(0, this.maximumCharacters - 20).match(re) || []).length, 9) * 10
          if (this.showAll || notesString.length - maximumCharacters <= 20) {
            return notesString.length
          }
          // Go back from position maximumCharacters and find next space, newLine, or divider
          let lastSpace = notesString.substring(0, maximumCharacters).lastIndexOf(" ")
          let lastNewline = notesString.substring(0, maximumCharacters).lastIndexOf("\n")
          let lastDivider = notesString.substring(0, maximumCharacters).lastIndexOf(this.divider)
          return Math.max(lastSpace, lastNewline, lastDivider)
        },
        /**
         * Returns whether notes should be truncated
         */
        isTruncated(notes) {
          let notesString = this.join(notes)
          return !this.showAll && notesString.length > this.cutPosition(notesString)
        },
        /**
         * Replaces dividers with line breaks
         */
        replaceDivider(notes) {
          return notes.split(this.divider).join("<br>")
        }
      }
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
      let notation = this.$util.notation(this.item)
      let prefLabel = this.$util.prefLabel(this.item)
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
          label: this.$util.prefLabel(searchLink)
        })
      }
      // Filter out duplicate URLs (e.g. Wikipedia)
      searchLinks = searchLinks.filter((link, index, self) =>
        index === self.findIndex(l => (
          l.url == link.url
        ))
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
      let concepts = _.get(this.item, "__GNDCONCEPTS__", [])
      let gndTerms = []
      let relevanceOrder = ["conceptDetail.relevanceVeryHigh", "conceptDetail.relevanceHigh", "conceptDetail.relevanceMedium", "conceptDetail.relevanceLow"]
      for (let relevance of relevanceOrder) {
        let term = `<strong>${this.$t("conceptDetail.relevance")}: ${this.$t(relevance)}</strong> - `
        let terms = []
        for (let concept of concepts.filter(concept => concept.__GNDTYPE__.RELEVANCE == this.$t(relevance, "en"))) {
          if (concept && (this.$util.prefLabel(concept, null, false))) {
            terms.push(_.escape(this.$util.prefLabel(concept)))
          }
        }
        if (terms.length > 0) {
          term = term + terms.join(", ")
          gndTerms.push(term)
        }
      }
      return gndTerms
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
    }
  },
  mounted() {
    // Initial refresh
    this.refresh()
  },
  methods: {
    refresh() {
      this.showAncestors = false
      // Load GND terms
      this.loadGndTerms()
      // Reset notes
      this.notesOptions.showMore = {}
      this.notesOptions.showAll = this.settings.showAllNotes
      // Increment iteration to force reload some elements
      this.iteration += 1
    },
    loadGndTerms() {
      // TODO: Refactoring necessary!
      if (!this.item) return
      let itemBefore = this.item
      let gnd = this._getObject({ uri: "http://bartoc.org/en/node/430" })
      // Don't load GND terms for GND items
      if (this.$jskos.compare(gnd, _.get(itemBefore, "inScheme[0]"))) {
        return
      }
      this.getMappings({
        direction: "both",
        from: itemBefore,
      }).then(mappings => {
        let gndConcepts = []
        for (let mapping of mappings) {
          let concepts = this.$jskos.conceptsOfMapping(mapping)
          for (let concept of concepts) {
            if (this.$jskos.compare(gnd, _.get(concept, "inScheme[0]"))) {
              this.$set(concept, "__GNDTYPE__", this.$jskos.mappingTypeByType(mapping.type))
              gndConcepts.push(concept)
            }
          }
        }
        gndConcepts = _.uniqWith(gndConcepts, this.$jskos.compare)
        return this.loadConcepts(gndConcepts)
      }).then(concepts => {
        // Filter out all null values
        concepts = concepts.filter(concept => concept != null)
        this.$set(itemBefore, "__GNDCONCEPTS__", concepts)
      }).catch(error => {
        console.error("ConceptDetail: Error when loading GND mappings:", error)
      })
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
     * Enable show more for a specific note
     */
    notesShowMore(status, index) {
      this.notesOptions.showMore[index] = status
      this.iteration += 1
    },
    /**
     * Determines whether a concept has notes (scopeNote, editorialNote, or altLabel)
     */
    hasNotes(concept) {
      let parts = ["scopeNote", "editorialNote", "altLabel"]
      let hasNotes = false
      for (let part of parts) {
        hasNotes = hasNotes || (concept != null && concept[part] != null && concept[part].de != null && concept[part].de.length > 0)
      }
      return hasNotes
    },
    /**
     * Copy and search on other side
     */
    copyAndSearch(label) {
      this.$emit("searchConcept", label)
    },
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.conceptDetail-scheme {
  margin-top: 5px;
}

.conceptDetail-ancestors {
  margin: 5px;
  padding-left: 5px;
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
.conceptDetail-identifier a {
  padding: 0 3px;
}
.conceptDetail-identifier svg {
  user-select: none;
}

.conceptDetail-notes {
  margin-top: 0px;
  display: flex;
}
.conceptDetail-note {
  padding: 0 5px;
  flex: 1;
}

</style>

<style lang="less">
@import "../style/main.less";
.conceptDetail-note-tabs {
  margin-top: 5px;
}
.conceptDetail-note-tabs .tabs {
  box-shadow: 0 0px 0px 0 hsla(0, 0%, 0%, 0.1);
}
.conceptDetail-note-tabs .card-header {
  padding: 2px 10px 10px 10px;
  background-color: @color-primary-5;
  user-select: none;
  .fontWeight-heavy;
}
.conceptDetail-note-tabs .card-header-tabs {
  margin-bottom: -10px;
}
.conceptDetail-note-tabs .nav-link {
  padding: 4px 12px 0px 12px;
}
.conceptDetail-note-tabs .card-body {
  .m-borderRadius(0px 0px 5px 5px;);
  padding: 15px 10px;
  background-color: @color-background-card;
}
.conceptDetail-note-tabs .card-body br {
  line-height: 24px;
}
</style>
