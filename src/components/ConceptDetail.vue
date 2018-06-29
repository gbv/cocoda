<template>
  <div
    v-if="item != null"
    class="conceptDetail font-size-small">

    <!-- Ancestors (display only broader concept by default, others can be expanded) -->
    <div class="conceptDetailAncestors">
      <div
        v-b-tooltip.hover="'show all ancestors'"
        v-show="!settings.showAllAncestors && !showAncestors && (settings.showSchemeInAncestors && item.ancestors.length > 1 || !settings.showSchemeInAncestors && item.ancestors.length > 2)"
        class="conceptDetailAncestorsMore"
        @click="showAncestors = true">
        <font-awesome-icon
          class="flipHorizontal"
          icon="ellipsis-v" />
      </div>
      <div
        v-show="settings.showSchemeInAncestors && (settings.showAllAncestors || showAncestors || item.ancestors.length <= 1)"
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
        v-show="showAncestors || settings.showAllAncestors || settings.showSchemeInAncestors && index == item.ancestors.length - 1 || !settings.showSchemeInAncestors && (item.ancestors.length <= 2 || index >= item.ancestors.length - 1)"
        :key="concept.uri"
        class="conceptDetailAncestorsItem" >
        <font-awesome-icon
          class="flipHorizontal"
          icon="level-up-alt" />
        <item-name
          :item="concept"
          :is-link="true"
          font-size="small"
          @click.native="chooseUri(concept, isLeft)" />
      </div>
      <!-- Broader -->
      <!-- v-show="showAncestors || settings.showAllAncestors || settings.showSchemeInAncestors && index == item.broader.length - 1 || !settings.showSchemeInAncestors && (item.broader.length <= 2 || index >= item.broader.length - 1)" -->
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

    <!-- GND Mappings -->
    <div
      v-if="settings.showGndMappings && gndMappings.length > 0"
      class="conceptDetailGndMappings">
      GND:
      <item-name
        v-for="(concept, index) in gndMappings"
        v-if="concept != null"
        :key="'gnd'+index"
        :item="concept"
        :show-text="false"
        :show-tooltip="true"
        font-size="sm"
        @mouseover.native="hoverGnd(concept)" />
    </div>

    <!--  -->
    <b-card
      v-if="item.scopeNote && item.scopeNote.de && item.scopeNote.de.length > 0 || item.editorialNote && item.editorialNote.de && item.editorialNote.de.length || item.altLabel && item.altLabel.de && item.altLabel.de.length"
      :key="'conceptDetailNoteTabs'+iteration"
      no-body
      class="conceptDetailNoteTabs">
      <b-tabs
        no-fade
        card>
        <!-- scopeNotes, editorialNotes, altLabels, and GND terms -->
        <!-- TODO: Should altLabels really be called "Register Entries"? -->
        <b-tab
          v-for="([notes, title], index) in [[item.scopeNote, 'Scope'], [item.editorialNote, 'Editorial'], [item.altLabel, 'Register Entries']]"
          v-if="notes != null && notes.de != null"
          :key="'note'+index+'-'+iteration"
          :title="title"
          class="conceptDetailNotes">
          <div class="conceptDetailNoteIcon">
            <font-awesome-icon icon="comment-alt" />
          </div>
          <div class="conceptDetailNote">
            <span v-html="notesOptions.visiblePart(notes.de)" /><b-collapse
              :id="'note'+index"
              tag="span">
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
          v-if="false"
          key="zzzzzzzzzz"
          title="GND" >
          GND terms
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
      gndMappings: [],
      showAncestors: false,
      iteration: 0,
      notesOptions: {
        divider: "∤",
        maximumCharacters: 120,
        join(notes) {
          if (Array.isArray(notes)) {
            return notes.join(this.divider)
          } else {
            return notes
          }
        },
        visiblePart(notes) {
          let notesString = this.join(notes)
          if (notesString.length > this.maximumCharacters) {
            notesString = notesString.substring(0, this.maximumCharacters)
          }
          return this.replaceDivider(notesString)
        },
        hiddenPart(notes) {
          let notesString = this.join(notes)
          return this.replaceDivider(notesString.substring(this.maximumCharacters))
        },
        isTruncated(notes) {
          let notesString = this.join(notes)
          return !this.showAll && notesString.length > this.maximumCharacters
        },
        replaceDivider(notes) {
          return notes.split(this.divider).join("<br>")
        }
      }
    }
  },
  watch: {
    item(newItem, oldItem) {
      if(!this.$util.compareConcepts(newItem, oldItem)) {
        this.refresh()
      }
    },
    settings() {
      this.refresh()
    }
  },
  mounted() {
    this.refresh()
  },
  methods: {
    refresh() {
      this.showAncestors = false
      // Scroll to top
      this.$el.parentElement.scrollTop = 0
      // Load GND mappings
      this.loadGndMappings()
      // Reset notes
      this.notesOptions.showMore = {}
      this.notesOptions.showAll = this.settings.showAllNotes
      this.iteration += 1
    },
    loadGndMappings() {
      this.gndMappings = []
      let itemBefore = this.item
      if (!this.settings.showGndMappings || !this.item) return
      // Load GND mappings from and to item
      let vm = this
      for (let fromTo of ["from", "to"]) {
        let params = {}
        params[fromTo] = this.item.uri
        this.$api.mappings(params).then(data => {
          if (!vm.$util.compareConcepts(itemBefore, vm.item)) {
            console.log("ConceptDetail: Item changed before GND mappings were loaded.")
            return
          }
          let toFrom = fromTo == "from" ? "to" : "from"
          for(let mapping of data) {
            if (mapping[toFrom+"Scheme"].uri == "http://bartoc.org/en/node/430") {
              vm.gndMappings = vm.gndMappings.concat(mapping[toFrom].memberSet || mapping[toFrom].memberChoice || [])
            }
          }
        }).catch(error => {
          console.log("ConceptDetail: Error when loading GND mappings:", error)
        })
      }
    },
    hoverGnd(concept) {
      if(concept && !concept.prefLabel) {
        // Load prefLabel to be shown as tooltip
        let vm = this
        this.$api.data({ uri: "http://bartoc.org/en/node/430" }, concept.uri)
          .then(function(data) {
            if (Array.isArray(data) && data.length > 0) {
              // Add prefLabel to concept
              vm.$set(concept, "prefLabel", data[0].prefLabel)
            } else {
              // TODO: - Error handling
              vm.$set(concept, "prefLabel", { de: " " })
            }
            if (data.length > 1) {
              console.log("For some reason, more than one set of properties was received for ", concept)
            }
          }).catch(function(error) {
            console.log("Request failed", error)
          })
      }
    },
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
          console.log("Copy to clipboard failed.")
        }
        window.getSelection().removeAllRanges()
      }, 50)
    },
    notesShowMore(status, index) {
      this.notesOptions.showMore[index] = status
      this.iteration += 1
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
.conceptDetailNoteTabs {
  border: none;
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
</style>
