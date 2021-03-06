<template>
  <div
    v-if="item != null"
    :draggable="draggable"
    class="itemName"
    :class="{
      'itemName-hoverable': !preventExternalHover && isValidLink
    }"
    @dragstart="dragStart(item, $event)"
    @dragend="dragEnd"
    @mouseover="hovering(true)"
    @mouseout="hovering(false)">
    <div
      :is="isValidLink ? 'router-link' : 'div'"
      :id="tooltipDOMID"
      v-b-popover="showPopover && (itemDetails.length || !showText) ? {
        placement: 'top',
        trigger: 'hover',
        content: `<div class='fontSize-normal'><b>${getNotation(item, null, true)} ${$jskos.prefLabel(item, { fallbackToUri: false })}</b></div><div class='fontSize-small itemName-details'>${itemDetails}</div>`,
        html: true,
      } : null"
      :to="url"
      :class="[
        {
          'itemName-hovered': isValidLink && isHovered,
          'itemName-highlighted': isHighlighted
        },
        'fontSize-'+(fontSize || 'normal')
      ]">
      <!-- Show icon for concepts where no data could be loaded -->
      <span
        v-if="item && item.__DETAILSLOADED__ == -1"
        v-b-tooltip.hover="{ title: $t('itemDetail.unknownConcept'), delay: defaults.delay.medium }"
        class="fontSize-small">
        <font-awesome-icon icon="bolt" />
      </span>
      <!-- Show icon for combined concepts -->
      <span
        v-if="item && item.type && item.type.includes('http://rdf-vocabulary.ddialliance.org/xkos#CombinedConcept')"
        v-b-tooltip.hover="{ title: $t('itemDetail.combinedConcept'), delay: defaults.delay.medium }"
        :class="'fontSize-'+(fontSize || 'normal')">
        <font-awesome-icon icon="puzzle-piece" />
      </span>
      <!-- Text for notation -->
      <span
        :class="{ 'fontWeight-heavy': showText }"
        v-html="getNotation(item, null, true)" />
      <!-- Text for prefLabel -->
      <span
        v-if="showText || !notation"
        :class="{
          'fontWeight-medium': isHighlighted
        }">
        {{ $jskos.prefLabel(item, { fallbackToUri: notation == null }) }}
      </span>
    </div>
  </div>
</template>

<script>
import _ from "lodash"
import dragandrop from "../mixins/dragandrop"

/**
 * Component that displays an item's notation (if defined) and prefLabel.
 */
export default {
  name: "ItemName",
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
     * Determines whether to show or hide the label text.
     */
    showText: {
      type: Boolean,
      default: true,
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
     * Determines whether to show some concept details as a popover.
     */
    showPopover: {
      type: Boolean,
      default: false,
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
    isHovered() {
      return this.isHoveredFromHere || (!this.preventExternalHover && this.$jskos.compare(this.$store.state.hoveredConcept, this.item))
    },
    notation() {
      return this.$jskos.notation(this.item)
    },
    itemDetails() {
      let result = this.$jskos.languageMapContent(this.item, "scopeNote")
      if (!result || !result.length) {
        return ""
      }
      // Line breaks between title and this content
      return [""].concat(result).join("<br>")
    },
  },
  watch: {
    item: function() {
      // Force show tooltip when item has changed
      _.delay(() => {
        if (this.isHoveredFromHere) {
          this.$refs.tooltip && this.$refs.tooltip.$emit("open")
        }
      }, 50)
    },
  },
  created() {
    if (!this.preventExternalHover && this.isLink) {
      this.isValidLink = true
    }
    this.hovering = _.debounce(this._hovering, 20)
  },
  methods: {
    _hovering(status) {
      if (status) {
        this.isHoveredFromHere = true
        this.$store.commit({
          type: "setHoveredConcept",
          concept: this.item,
        })
        // Set URL
        this.url = this.getRouterUrl(this.item, this.isLeft, this.forceSide)
        // Set isValidLink
        if (!this.isLink) {
          this.isValidLink = false
        } else {
          // Check if scheme is available or item itself is a scheme.
          this.isValidLink = this.getProvider(this.item) != null
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
        this.$store.commit({
          type: "setHoveredConcept",
          concept: null,
        })
        window.clearInterval(this.interval)
      }
    },
    trimTooltip(text) {
      if (text.length > 80) {
        return text.substring(0,75) + "..."
      } else {
        return text
      }
    },
  },
}

</script>

<style lang="less" scoped>
@import "../style/main.less";

.itemName {
  display: inline;
  user-select: text !important;
}
.itemName > * {
  color: @color-text-dark !important;
  display: inline;
}
.itemName-hovered, .itemName-hoverable:hover > div {
  cursor: pointer;
  text-decoration: underline !important;
}
.itemName-highlighted {
  color: @color--itemName-highlighted !important;
}
</style>

<style>
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
  background: white;
}
</style>
