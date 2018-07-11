<template>
  <div
    v-if="item != null"
    class="conceptDetail font-size-small">

    <!-- Ancestors / Broader -->
    <div class="conceptDetailAncestors">
      <div
        v-show="settings.showSchemeInAncestors"
        class="conceptDetailAncestorsItem">
        <item-name
          :item="scheme"
          :is-link="true"
          font-size="small"
          @click.native="chooseUri(scheme, isLeft)" />
      </div>
      <!-- Ancestors -->
      <div
        v-for="(concept, index) in item.ancestors"
        v-if="concept != null"
        :key="concept.uri"
        class="conceptDetailAncestorsItem" >
        <span v-if="showAncestors || settings.showAllAncestors || index == 0 || index == item.ancestors.length - 1 || item.ancestors.length <= 3">
          <font-awesome-icon
            class="flipHorizontal"
            icon="level-up-alt" />
          <item-name
            :item="concept"
            :is-link="true"
            font-size="small"
            @click.native="chooseUri(concept, isLeft)" />
        </span>
        <span
          v-b-tooltip.hover="{ title: 'show all ancestors', delay: $util.delay.medium }"
          v-else-if="index == 1"
          class="conceptDetailAncestorsMore"
          @click="showAncestors = true" >
          <font-awesome-icon
            class="flipHorizontal"
            icon="ellipsis-v" />
        </span>
      </div>
      <!-- Broader -->
      <div
        v-for="(concept) in (item.ancestors.length == 0 && item.BROADERLOADED ? item.broader : [])"
        v-if="concept != null"
        :key="concept.uri"
        class="conceptDetailAncestorsItem" >
        <font-awesome-icon
          icon="sort-up" />
        <item-name
          :item="concept"
          :is-link="true"
          font-size="small"
          @click.native="chooseUri(concept, isLeft)" />
      </div>
      <!-- Show LoadingIndicator when ancestors exist, but are not loaded yet -->
      <loading-indicator
        v-if="item.ancestors.length != 0 && item.ancestors.includes(null) || item.ancestors.length == 0 && item.broader.length != 0 && !item.BROADERLOADED"
        size="sm" />
    </div>

    <!-- Name of concept -->
    <item-name
      :item="item"
      :is-highlighted="true"
      font-size="normal" />

    <!-- Notes and alternative labels -->
    <b-card
      :key="'conceptDetailNoteTabs'+iteration"
      no-body
      class="conceptDetailNoteTabs">
      <b-tabs
        no-fade
        card>
        <!-- scopeNotes, editorialNotes, altLabels, and GND terms -->
        <!-- TODO: Should altLabels really be called "Register Entries"? -->
        <b-tab
          v-for="([notes, title], index) in [[item.scopeNote, 'Scope'], [item.editorialNote, 'Editorial'], [item.altLabel, 'Register Entries'], [{ de: item.GNDTERMS }, 'GND']]"
          v-if="notes != null && notes.de != null && notes.de.length > 0"
          :key="'note'+index+'-'+iteration"
          :title="title"
          :active="title == 'GND' && !hasNotes(item)"
          class="conceptDetailNotes">
          <div class="conceptDetailNote">
            <span v-html="notesOptions.visiblePart(notes.de)" /><b-collapse
              :id="'note'+index"
              tag="span"
              class="no-transition">
              <span v-html="notesOptions.hiddenPart(notes.de)" />
            </b-collapse>
            <a
              v-b-toggle="'note'+index"
              v-if="notesOptions.isTruncated(notes.de)"
              href=""
              @click.prevent >
              <span class="when-opened">show less</span>
              <span class="when-closed">show more</span>
            </a>
          </div>
        </b-tab>
        <b-tab
          :key="'zzzzzzzzzz'+iteration"
          title="IDs" >
          <!-- URI and identifier -->
          <div
            v-for="(identifier, index) in [item.uri].concat(item.identifier)"
            v-if="identifier != null"
            :key="index"
            :class="identifier.startsWith('http') ? 'conceptDetailUri' : 'conceptDetailIdentifier'">
            <font-awesome-icon
              :icon="identifier.startsWith('http') ? 'link' : 'id-card'"
              @dblclick="copy" />
            <auto-link :link="identifier" />
          </div>
        </b-tab>
      </b-tabs>
    </b-card>

    <!-- Narrower concepts -->
    <div
      v-if="item.narrower && item.narrower.length > 0"
      class="conceptDetailNarrower">
      <div class="font-heavy">Narrower Concepts:</div>
      <div
        v-for="concept in item.narrower"
        v-if="concept != null"
        :key="concept.uri"
        class="conceptDetailNarrowerItem">
        <font-awesome-icon
          class="flipHorizontal"
          icon="level-down-alt" />
        <item-name
          :item="concept"
          :is-link="true"
          font-size="small"
          @click.native="chooseUri(concept, isLeft)" />
      </div>
      <!-- Show LoadingIndicator when narrower exist, but are not loaded yet -->
      <loading-indicator
        v-if="item.narrower.length != 0 && item.narrower.includes(null)"
        size="sm" />
    </div>

  </div>
</template>

<script>
import AutoLink from "./AutoLink"
import ItemName from "./ItemName"
import FontAwesomeIcon from "@fortawesome/vue-fontawesome"
import LoadingIndicator from "./LoadingIndicator"
var _ = require("lodash")

/**
 * Component that displays an item's (either scheme or concept) details (URI, notation, identifier, ...).
 */
export default {
  name: "ConceptDetail",
  components: {
    AutoLink, ItemName, FontAwesomeIcon, LoadingIndicator
  },
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
     * Reference to the scheme
     */
    scheme: {
      type: Object,
      default: null
    },
    /**
     * Settings - see `ItemDetail`
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
          if (notesString.length - maximumCharacters <= 20) {
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
  watch: {
    item(newItem, oldItem) {
      // Refresh component if item changed
      if(!this.$util.compareConcepts(newItem, oldItem)) {
        this.refresh()
      }
    },
    settings() {
      // Refresh component if settings changed
      this.refresh()
    }
  },
  mounted() {
    // Initial refresh
    this.refresh()
  },
  methods: {
    refresh() {
      this.showAncestors = false
      // Scroll to top
      this.$el.parentElement.scrollTop = 0
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
      // Load GND mappings from and to item
      let promises = []
      for (let fromTo of ["from", "to"]) {
        let params = {}
        params[fromTo] = this.item.uri
        promises.push(this.$api.mappings(params).then(results => [results, fromTo]))
      }
      Promise.all(promises).then(results => {
        if (!this.$util.compareConcepts(itemBefore, this.item)) {
          // Abort if item changed in the meantime
          return []
        }
        let gndConcepts = []
        for (let [mappings, fromTo] of results) {
          let toFrom = fromTo == "from" ? "to" : "from"
          for(let mapping of mappings) {
            let startIndex = gndConcepts.length
            if (mapping[toFrom+"Scheme"].uri == "http://bartoc.org/en/node/430") {
              gndConcepts = gndConcepts.concat(mapping[toFrom].memberSet || mapping[toFrom].memberChoice || [])
            }
            // Save GND mapping type to concept
            while (startIndex < gndConcepts.length) {
              gndConcepts[startIndex].GNDTYPE = this.$util.mappingTypeByType(mapping.type)
              startIndex += 1
            }
          }
        }
        // Load concept objects from API
        let promises = []
        for (let concept of gndConcepts) {
          promises.push(this.$api.objects.get(concept.uri, "http://bartoc.org/en/node/430").then(object => {
            if (object) {
              object.GNDTYPE = concept.GNDTYPE
            }
            return object
          }))
        }
        return Promise.all(promises)
      }).then(results => {
        // Assemble gndTerms array for display
        let gndTerms = []
        let relevanceOrder = ["very high", "high", "medium", "low"]
        for (let relevance of relevanceOrder) {
          let term = `<strong>Relevance: ${relevance}</strong> - `
          let terms = []
          for (let concept of results.filter(concept => concept.GNDTYPE.RELEVANCE == relevance)) {
            if (concept && (concept.prefLabel.de || concept.prefLabel.en)) {
              terms.push(_.escape(concept.prefLabel.de || concept.prefLabel.en))
            }
          }
          if (terms.length > 0) {
            term = term + terms.join(", ")
            gndTerms.push(term)
          }
        }
        itemBefore.GNDTERMS = gndTerms
      }).catch(error => {
        console.error("ConceptDetail: Error when loading GND mappings:", error)
      })
    },
    /**
     * Copy to clipboard
     */
    copy(event) {
      let element = event.target
      if (element.tagName.toLowerCase() == "path") {
        element = element.parentElement
      }
      element = element.nextSibling
      window.getSelection().removeAllRanges()
      this.$util.selectText(element)
      _.delay(function() {
        let successful = document.execCommand("copy")
        if (!successful) {
          console.warn("Copy to clipboard failed.")
        }
        window.getSelection().removeAllRanges()
      }, 50)
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
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.conceptDetailAncestors {
  margin: 5px;
  & .conceptDetailAncestorsMore {
    width: 20px;
    padding-left: 2px;
    color: @buttonColor;
    cursor: pointer;
    &:hover {
      color: @buttonColorHover;
    }
  }
}

.conceptDetailIdentifier, .conceptDetailUri {
  margin: 5px;
  & a {
    background-color: lighten(@color-primary-1, 15%);
    border-radius: 5px;
    padding: 0 3px;
  }
  & svg {
    user-select: none;
  }
}

.conceptDetailNotes {
  margin-top: 0px;
  display: flex;
  & .conceptDetailNoteIcon {
    flex: none;
    padding: 1px 3px;
    height: 14px;
  }
  & .conceptDetailNote {
    padding: 0 5px;
    flex: 1;
    & .conceptDetailNotePoint {
      padding: 2px 0;
    }
  }
}

.conceptDetailNarrower {
  margin: 5px;
}

</style>

<style lang="less">
.conceptDetailNoteTabs, .card {
  border: none !important;
  & .tabs {
    box-shadow: 0 0px 0px 0 hsla(0, 0%, 0%, 0.1);
  }
  & .card-header {
    padding: 2px 10px 10px 10px;
    background-color: white;
    user-select: none;
  }
  & .card-header-tabs {
    margin-bottom: -10px;
  }
  & .nav-link {
    padding: 4px 12px 0px 12px;
  }
  & .card-body {
    padding: 10px;
    background-color: rgba(0,0,0,0.02);
    border-radius: 0px 0px 5px 5px;
    br {
      line-height: 24px;
    }
  }
}
.collapsed > .when-opened,
:not(.collapsed) > .when-closed {
  display: none;
}
.collapsing {
    -webkit-transition: none;
    transition: none;
    display: none;
}
.no-transition {
    transition: none !important;
}
</style>
