<template>
  <div
    v-if="item != null"
    class="conceptDetail">
    <!-- inScheme -->
    <div
      v-show="settings.showSchemeInAncestors"
      class="conceptDetail-scheme" >
      <item-name
        :item="selected.scheme[isLeft]"
        :is-link="true"
        :is-left="isLeft"
        font-size="normal" />
    </div>
    <!-- Ancestors / Broader -->
    <div class="conceptDetail-ancestors">
      <div
        v-if="ancestors.length > 3 && !settings.showAllAncestors"
        class="button conceptDetail-ancestors-expand"
        @click="showAncestors = !showAncestors" >
        <font-awesome-icon
          :icon="showAncestors ? 'angle-down' : 'angle-right'" />
      </div>
      <div
        v-for="(concept, index) in ancestors"
        v-if="concept != null"
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
          v-b-tooltip.hover="{ title: $t('conceptDetail.showAllAncestors'), delay: $util.delay.medium }"
          v-else-if="index == 1"
          class="conceptDetail-ancestors-more button"
          @click="showAncestors = true" >
          <font-awesome-icon
            class="u-flip-horizontal"
            icon="ellipsis-v" />
        </span>
      </div>
      <!-- Broader -->
      <div
        v-for="(concept) in (ancestors.length == 0 && item.BROADERLOADED ? broader : [])"
        v-if="concept != null"
        :key="concept.uri" >
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
        v-if="ancestors.length != 0 && ancestors.includes(null) || ancestors.length == 0 && broader.length != 0 && !item.BROADERLOADED"
        size="sm" />
    </div>

    <!-- Name of concept -->
    <div class="conceptDetail-name">
      <item-name
        :item="item"
        :is-highlighted="true"
        font-size="normal" />
      <div
        v-b-tooltip.hover="{ title: showAddToMappingButton ? $t('general.addToMapping') : '', delay: $util.delay.medium }"
        :class="{ button: showAddToMappingButton, 'button-disabled': !showAddToMappingButton }"
        class="conceptDetail-name-addButton"
        @click="addToMapping" >
        <font-awesome-icon icon="plus-circle" />
      </div>
    </div>

    <!-- Notes and alternative labels -->
    <b-card
      :key="'conceptDetail-note-tabs'+iteration"
      no-body
      class="conceptDetail-note-tabs" >
      <b-tabs
        no-fade
        card >
        <!-- scopeNotes, editorialNotes, altLabels, and GND terms -->
        <!-- TODO: Should altLabels really be called "Register Entries"? -->
        <b-tab
          v-for="([notes, title], index) in [[item.scopeNote, $t('conceptDetail.scope')], [item.editorialNote, $t('conceptDetail.editorial')], [item.altLabel, $t('conceptDetail.registerEntries')], [{ de: item.GNDTERMS }, $t('conceptDetail.gnd')]]"
          v-if="notes != null && $util.lmContent(notes) != null && $util.lmContent(notes).length > 0"
          :key="'note'+index+'-'+iteration"
          :title="title"
          :active="title == 'GND' && !hasNotes(item)"
          class="conceptDetail-notes" >
          <div class="conceptDetail-note">
            <span v-html="notesOptions.visiblePart($util.lmContent(notes))" />
            <b-collapse
              :id="'note'+index"
              tag="span"
              class="no-transition" >
              <span v-html="notesOptions.hiddenPart($util.lmContent(notes))" />
            </b-collapse>
            <a
              v-b-toggle="'note'+index"
              v-if="notesOptions.isTruncated($util.lmContent(notes))"
              href=""
              @click.prevent >
              <span class="when-opened">{{ $t("conceptDetail.showLess") }}</span>
              <span class="when-closed">{{ $t("conceptDetail.showMore") }}</span>
            </a>
          </div>
        </b-tab>
        <b-tab
          :key="'zzzzzzzzzz'+iteration"
          :title="$t('conceptDetail.info')" >
          <!-- URI and identifier -->
          <div
            v-for="(identifier, index) in [item.uri].concat(item.identifier)"
            v-if="identifier != null"
            :key="index"
            :class="identifier.startsWith('http') ? 'conceptDetail-identifier' : 'conceptDetail-identifier'" >
            <font-awesome-icon
              :icon="identifier.startsWith('http') ? 'link' : 'id-card'"
              @dblclick="copyToClipboard(elementForEvent($event))" />
            <auto-link :link="identifier" />
          </div>
          <div
            v-if="item.creator && item.creator.length"
            class="conceptDetail-identifier" >
            <font-awesome-icon icon="user" /> {{ $util.prefLabel(item.creator[0]) }}
          </div>
          <div
            v-if="item.created"
            class="conceptDetail-identifier" >
            <b>{{ $t("conceptDetail.created") }}:</b> {{ item.created }}
          </div>
          <div
            v-if="item.modified"
            class="conceptDetail-identifier" >
            <b>{{ $t("conceptDetail.modified") }}:</b> {{ item.modified }}
          </div>
          <div
            v-if="item.definition"
            class="conceptDetail-identifier" >
            <b>{{ $t("conceptDetail.definition") }}:</b> {{ $util.definition(item).join(", ") }}
          </div>
        </b-tab>
        <b-tab
          v-if="item._wikipediaResults && ($util.lmContent(item._wikipediaResults) || []).length"
          title="Wikipedia" >
          <p
            v-for="(result, index) in $util.lmContent(item._wikipediaResults)"
            :key="`wikipediaResults-${isLeft}-${index}`" >
            <b><a
              :href="`https://${result.language}.wikipedia.org/?curid=${result.pageid}`"
              target="_blank">
              {{ result.title }}
            </a></b><br>
            <span v-html="result.extract || `... ${result.snippet} ...`" />
          </p>
        </b-tab>
      </b-tabs>
    </b-card>

    <!-- Narrower concepts -->
    <item-detail-narrower
      :narrower="item.narrower"
      :is-left="isLeft"
    />

  </div>
</template>

<script>
import AutoLink from "./AutoLink"
import ItemName from "./ItemName"
import LoadingIndicator from "./LoadingIndicator"
import ItemDetailNarrower from "./ItemDetailNarrower"
import _ from "lodash"

/**
 * Component that displays an item's (either scheme or concept) details (URI, notation, identifier, ...).
 */
export default {
  name: "ConceptDetail",
  components: {
    AutoLink, ItemName, LoadingIndicator, ItemDetailNarrower
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
  },
  watch: {
    item(newItem, oldItem) {
      // Refresh component if item changed
      if(!this.$jskos.compare(newItem, oldItem)) {
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
      let params = {
        direction: "both",
        from: this.item,
      }
      promises.push(this.$store.dispatch({ type: "mapping/getMappings", ...params }))
      Promise.all(promises).then(results => {
        if (!this.$jskos.compare(itemBefore, this.item)) {
          // Abort if item changed in the meantime
          return []
        }
        let gndConcepts = []
        for (let mappings of results) {
          for (let fromTo of ["from", "to"]) {
            let toFrom = fromTo == "from" ? "to" : "from"
            for(let mapping of mappings) {
              let startIndex = gndConcepts.length
              if (mapping[toFrom+"Scheme"].uri == "http://bartoc.org/en/node/430") {
                gndConcepts = gndConcepts.concat(mapping[toFrom].memberSet || mapping[toFrom].memberChoice || [])
              }
              // Save GND mapping type to concept
              while (startIndex < gndConcepts.length) {
                gndConcepts[startIndex].GNDTYPE = this.$jskos.mappingTypeByType(mapping.type)
                startIndex += 1
              }
            }
          }
        }
        // Load concept objects from API
        let promises = []
        for (let concept of gndConcepts) {
          // Only add GND concepts that are different from the item.
          if (!this.$jskos.compare(concept, itemBefore)) {
            promises.push(this.getObject({
              object: concept,
              scheme: { uri: "http://bartoc.org/en/node/430" }
            }).then(object => {
              if (object) {
                this.$store.commit({
                  type: "objects/set",
                  object,
                  prop: "GNDTYPE",
                  value: concept.GNDTYPE
                })
              }
              return object
            }))
          }
        }
        return Promise.all(promises)
      }).then(results => {
        // Filter out all null values
        results = results.filter(concept => concept != null)
        // Assemble gndTerms array for display
        let gndTerms = []
        // Use this.$parent.$t instead of this.$t to prevent a rare, very weird bug.
        let relevanceOrder = [this.$parent.$t("conceptDetail.relevanceVeryHigh"), this.$parent.$t("conceptDetail.relevanceHigh"), this.$parent.$t("conceptDetail.relevanceMedium"), this.$parent.$t("conceptDetail.relevanceLow")]
        for (let relevance of relevanceOrder) {
          let term = `<strong>${this.$parent.$t("conceptDetail.relevance")}: ${relevance}</strong> - `
          let terms = []
          for (let concept of results.filter(concept => concept.GNDTYPE.RELEVANCE == relevance)) {
            if (concept && (this.$util.prefLabel(concept, null, false))) {
              terms.push(_.escape(this.$util.prefLabel(concept)))
            }
          }
          if (terms.length > 0) {
            term = term + terms.join(", ")
            gndTerms.push(term)
          }
        }
        this.$store.commit({
          type: "objects/set",
          object: itemBefore,
          prop: "GNDTERMS",
          value: gndTerms
        })
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
    addToMapping() {
      this.$store.commit({
        type: "mapping/add",
        concept: this.item,
        scheme: (this.item.inScheme && this.item.inScheme[0]) || this.selected.scheme[this.isLeft],
        isLeft: this.isLeft
      })
    }
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
