<template>
  <div
    v-if="_item != null"
    class="itemName"
    :draggable="draggable"
    @dragstart="dragStart(_item, $event)"
    @dragend="dragEnd"
    @mouseover="hovering(true)"
    @mouseout="hovering(false)">
    <div
      :is="isValidLink ? 'router-link' : 'div'"
      :id="tooltipDOMID"
      :to="url"
      class="itemName-inner"
      :class="[
        {
          'itemName-hovered': isValidLink && isHovered,
          'itemName-highlighted': isHighlighted,
          'itemName-hoverable': !preventExternalHover && isValidLink,
        },
        'fontSize-'+(fontSize || 'normal')
      ]">
      <!-- Show icon for combined concepts -->
      <span
        v-if="_item && _item.type && _item.type.includes('http://rdf-vocabulary.ddialliance.org/xkos#CombinedConcept')"
        v-b-tooltip.hover="{ title: $t('itemDetail.combinedConcept'), delay: defaults.delay.medium }"
        class="itemName-icon fontSize-small">
        <font-awesome-icon icon="puzzle-piece" />
      </span>
      <!-- Show icon for non-indexing concepts -->
      <span
        v-if="_item && _item.type && _item.type.includes('http://schema.vocnet.org/NonIndexingConcept')"
        v-b-tooltip.hover="{ title: $t('itemDetail.nonIndexingConcept'), delay: defaults.delay.medium }"
        class="itemName-icon fontSize-small">
        <font-awesome-icon icon="diagram-project" />
      </span>
      <!-- Text for notation -->
      <span
        v-if="_showNotation && notation"
        :class="{ 'fontWeight-heavy': showText }"
        :style="showText ? 'margin-right: 3px;' : ''"
        v-html="notation" />
      <!-- Text for prefLabel -->
      <span v-if="showText || !notation">{{ prefLabel }}</span>
      <!-- Fallback to URI for concepts if no other data exists -->
      <auto-link
        v-if="fallbackToUri && !notation && !prefLabel && _item?.uri"
        :link="_item?.uri" />
    </div>
    <!-- Show icon for schemes without concepts or concepts where no data could be loaded -->
    <div
      v-if="showMissingDataIndicator"
      v-b-tooltip.hover="{ title: isScheme ? $t('itemDetail.noConcepts') : $t('itemDetail.unknownConcept'), delay: defaults.delay.medium }"
      class="missingDataIndicator">
      •
    </div>
  </div>
</template>

<script>
import _ from "lodash"
import dragandrop from "@/mixins/dragandrop.js"
import { getItem } from "@/items"
import AutoLink from "./AutoLink.vue"

/**
 * Component that displays an item's notation (if defined) and prefLabel.
 */
export default {
  name: "ItemName",
  components: { AutoLink },
  mixins: [dragandrop],
  props: {
    /**
     * The item whose notation and name this component will display.
     */
    item: {
      type: Object,
      default: null,
    },
    /**
     * The font size for the text (small, normal, large).
     */
    fontSize: {
      type: String,
      default: "normal",
    },
    /**
     * Determines whether to show or hide the notation text.
     */
    showNotation: {
      type: Boolean,
      default: true,
    },
    /**
     * Determines whether to show or hide the label text.
     */
    showText: {
      type: Boolean,
      default: true,
    },
    /**
     * Determines whether to show item URI if there is neither a notation nor a label.
     */
    fallbackToUri: {
      type: Boolean,
      default: false,
    },
    /**
     * Determines whether it is a link.
     */
    isLink: {
      type: Boolean,
      default: false,
    },
    /**
     * Only for isLink: Side on which to open item.
     */
    isLeft: {
      type: Boolean,
      default: true,
    },
    /**
     * Determines whether the item is highlighted
     */
    isHighlighted: {
      type: Boolean,
      default: false,
    },
    /**
     * If true, this ItemName will not be hovered if the same concept is hovered elsewhere.
     * Use this option if ItemName is used in large quantities, otherwise there will be a substantial performance penalty.
     */
    preventExternalHover: {
      type: Boolean,
      default: false,
    },
    /**
     * Determines whether the item is draggable
     */
    draggable: {
      type: Boolean,
      default: true,
    },
    /**
     * Determines whether the item should be forced to open on the specified side in `isLeft`
     */
    forceSide: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      /** Unique DOM ID for tooltip */
      tooltipDOMID: this.generateID(),
      /** Determines whether the item is hovered from inside (to show tooltip after prefLabel loaded) */
      isHoveredFromHere: false,
      url: "",
      isValidLink: false,
      interval: null,
    }
  },
  computed: {
    _item() {
      return getItem(this.item, { relatedItems: true }) || this.item
    },
    isHovered() {
      return this.isHoveredFromHere || (!this.preventExternalHover && this.$jskos.compareFast(this.$store.state.hoveredConcept, this._item))
    },
    _showNotation() {
      return !this.showNotation ? false : (
        _.get(this._item, "inScheme[0].DISPLAY.hideNotation") === true && this.showText && this.prefLabel
          ? false
          : true
      )
    },
    notation() {
      return this.getNotation(this._item, null, true)
    },
    prefLabel() {
      return this.getPrefLabel(this._item)
    },
    isScheme() {
      return this.$jskos.isScheme(this._item)
    },
    showMissingDataIndicator() {
      if (this.isScheme) {
        return this._item.concepts && !this._item.concepts.length
      }
      if (this._item?.__DETAILSLOADED__ === -1) {
        return true
      }
      if (this._item?.__DETAILSLOADED__ === 0 && !_.get(this._item, "inScheme[0].concepts.length")) {
        return true
      }
      return false
    },
  },
  created() {
    this.hovering = _.debounce(this._hovering, 20)
  },
  methods: {
    _hovering(status) {
      if (status) {
        this.isHoveredFromHere = true
        if (this.$jskos.isConcept(this._item)) {
          this.$store.commit({
            type: "setHoveredConcept",
            concept: this._item,
            element: this.$el,
          })
        }
        // Set URL
        this.url = this.getRouterUrl(this._item, this.isLeft, this.forceSide)
        // Set isValidLink
        if (!this.isLink) {
          this.isValidLink = false
        } else {
          // Check if scheme is available or item itself is a scheme.
          this.isValidLink = this.getProvider(this._item) != null
        }
        // Check whether mouse is still in element.
        window.clearInterval(this.interval)
        this.interval = setInterval(() => {
          if (!this.isMouseOver()) {
            this.isHoveredFromHere = false
            window.clearInterval(this.interval)
          }
        }, 500)
      } else {
        this.isHoveredFromHere = false
        if (this.$jskos.isConcept(this._item)) {
          this.$store.commit({
            type: "setHoveredConcept",
            concept: null,
          })
        }
        window.clearInterval(this.interval)
      }
    },
  },
}

</script>

<style lang="less" scoped>
@import "@/style/main.less";
@import "../style/colors.css";

.itemName {
  display: inline;
  user-select: text;
}
.itemName-inner, .itemName-inner > * {
  color: var(--color-text) !important;
  display: inline;
}
.itemName-hovered, .itemName-hoverable:hover {
  cursor: pointer;
  text-decoration: underline;
}
.itemName-highlighted {
  color: var(--color--itemName-highlighted) !important;
}
.itemName-icon {
  margin-right: 3px;
}

/* Multiline text truncation: http://hackingui.com/front-end/a-pure-css-solution-for-multiline-text-truncation/ */
.itemName-details {
  overflow: hidden;
  position: relative;
  line-height: 1.2em;
  max-height: 7.2em;
  text-align: justify;
  margin-right: -1em;
  padding-right: 1.5em;
}
.itemName-details:before {
  content: '...';
  position: absolute;
  right: 0.5em;
  bottom: 0;
}
.itemName-details:after {
  content: '';
  position: absolute;
  right: 0.5em;
  width: 1em;
  height: 1em;
  margin-top: 0.2em;
  background: var(--color-background-component);
}
</style>
