<template>
  <div
    class="conceptDetail font-size-small">

    <!-- Ancestors (display only broader concept by default, others can be expanded) -->
    <div class="conceptDetailAncestors">
      <div
        v-b-tooltip.hover="'show all ancestors'"
        v-show="!showAncestors && item.ancestors.length > 1"
        class="conceptDetailAncestorsMore"
        @click="showAncestors = true">
        <font-awesome-icon icon="ellipsis-v" />
      </div>
      <div
        v-show="showAncestors || item.ancestors.length <= 1"
        class="conceptDetailAncestorsItem">
        <font-awesome-icon icon="level-up-alt" />
        <item-name
          :item="scheme"
          :is-link="true"
          font-size="small"
          @click.native="chooseUri(scheme, isLeft)" />
      </div>
      <div
        v-for="(concept, index) in item.ancestors"
        v-if="concept != null"
        v-show="showAncestors || index == item.ancestors.length - 1"
        :key="concept.uri"
        class="conceptDetailAncestorsItem" >
        <font-awesome-icon icon="level-up-alt" />
        <item-name
          :item="concept"
          :is-link="true"
          font-size="small"
          @click.native="chooseUri(concept, isLeft)" />
      </div>
      <!-- Show LoadingIndicator when ancestors exist, but are not loaded yet -->
      <loading-indicator
        v-if="item.ancestors.length != 0 && item.ancestors.includes(null)"
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
      <font-awesome-icon :icon="identifier.startsWith('http') ? 'link' : 'id-card'" />
      <auto-link :link="identifier" />
    </div>

    <!-- AltLabels -->
    <div v-if="item.altLabel && item.altLabel.de && item.altLabel.de.length">
      {{ item.altLabel.de.join(", ") }}
    </div>

    <!-- ScopeNotes and EditorialNotes -->
    <div
      v-for="(notes, index) in [item.scopeNote, item.editorialNote]"
      v-if="notes != null"
      :key="'note'+index"
      class="conceptDetailNotes">
      <div class="conceptDetailNoteIcon">
        <font-awesome-icon icon="comment-alt" />
      </div>
      <div class="conceptDetailNote">
        <span v-if="Array.isArray(notes.de)">
          <div
            v-for="(note, index2) in notes.de"
            :key="'point'+index2"
            class="conceptDetailNotePoint">
            {{ note }}
          </div>
        </span>
        <div
          v-else-if="notes.de"
          class="conceptDetailNotePoint">{{ notes.de }}</div>
      </div>
    </div>

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
        <font-awesome-icon icon="level-down-alt" />
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
    }
  },
  data () {
    return {
      gndMappings: [],
      showAncestors: false
    }
  },
  watch: {
    item() {
      this.showAncestors = false
      // Scroll to top
      this.$el.parentElement.scrollTop = 0
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
}

.conceptDetailNotes {
  margin-top: 0px;
  display: flex;
  & .conceptDetailNoteIcon {
    flex: none;
    padding: 3px 5px;
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
