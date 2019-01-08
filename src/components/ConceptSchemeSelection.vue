<template>
  <div
    :id="`conceptSchemeSelection-${id}`"
    class="conceptSchemeSelection"
    style="overflow: visible;">
    <!-- ^^^ overflow: visible is necessary to properly shown concept search results which go over the edge of the component. -->
    <!-- This is shown when a scheme is selected. -->
    <div
      v-if="scheme"
      class="conceptSchemeSelection-collapsed">
      <!-- Expand button -->
      <div
        :id="`${id}-expandButton`"
        class="conceptSchemeSelection-expandButton button">
        <font-awesome-icon
          :icon="showPopover ? 'angle-left' : 'angle-down'" />
      </div>
      <!-- Name of scheme -->
      <div>
        <item-name
          :item="scheme"
          :is-link="true"
          :is-left="isLeft"
          font-size="large" />
        <!-- Button to clear scheme -->
        <div
          v-b-tooltip.hover="{ title: $t('general.clearScheme'), delay: $util.delay.medium }"
          class="button"
          style="display: inline-block; margin-left: 5px; margin-top: -5px;"
          @click="clearScheme" >
          <font-awesome-icon icon="times-circle" />
        </div>
      </div>
      <!-- ConceptSearch -->
      <concept-search
        ref="conceptSearch"
        :is-left="isLeft"
        :scheme="scheme" />
    </div>
    <!-- This is shown when no scheme is selected, or as a popover. -->
    <!-- The popover reacts to the expand button above. It is attached to the main element of this component. -->
    <div
      :is="scheme == null ? 'div' : 'b-popover'"
      :target="`${id}-expandButton`"
      :show.sync="showPopover"
      :container="`conceptSchemeSelection-${id}`"
      triggers="click"
      placement="leftbottom"
      class="conceptSchemeSelection-popover" >
      <!-- Inner div. Classes are attached because #app's classes don't apply for popovers. -->
      <div
        ref="popover"
        class="conceptSchemeSelection-expanded font-default text-dark color-primary-0-bg fontSize-normal" >
        <!-- Title (source/target scheme) -->
        <div class="componentTitle">
          {{ isLeft ? $t("schemeSelection.source") : $t("schemeSelection.target") }}
        </div>
        <!-- Scheme filter input field -->
        <p>
          <b-form-input
            ref="input"
            v-model="schemeFilter"
            autocomplete="off"
            @keyup.enter.native="chooseFirst"
            @keyup.esc.native="showPopover = false" />
        </p>
        <!-- List of all schemes, showing favorites first -->
        <ul class="conceptSchemeSelection-schemeList scrollable">
          <li
            v-for="(scheme, index) in filteredSchemes"
            :key="scheme.uri + '-scheme-list-' + id + index" >
            <font-awesome-icon
              :class="$jskos.isContainedIn(scheme, favoriteSchemes) ? 'conceptSchemeSelection-starFavorite' : 'conceptSchemeSelection-starNormal'"
              icon="star" />
            <item-name
              :ref="index == 0 ? 'firstScheme' : null"
              :item="scheme"
              :is-link="true"
              :is-left="isLeft" />
          </li>
        </ul>
        <!-- Concept quick selection title -->
        <div
          v-if="favoriteConcepts && favoriteConcepts.length"
          class="componentTitle">
          {{ $t("schemeSelection.conceptQuick") }}
        </div>
        <!-- Quick selection concepts -->
        <div class="conceptSchemeSelection-favoriteConcepts scrollable">
          <p
            v-for="concept in favoriteConcepts"
            :key="concept.uri + '-favorite-' + id" >
            <item-name
              :item="concept"
              :is-link="true"
              :is-left="isLeft"
            />
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ItemName from "./ItemName"
import ConceptSearch from "./ConceptSearch"

/**
 * Concept scheme selection component.
 *
 * If no scheme is selected, the full version of the component is shown, containing a list of schemes with a filter input, as well as a list of favorite concepts.
 * If a scheme is selected, a small version of the component is shown (containing only the scheme name and the concept search). By clicking the arrow on the top right of the component, the full version can be shown as a popover.
 */
export default {
  name: "ConceptSchemeSelection",
  components: { ItemName, ConceptSearch },
  props: {
    /**
     * Tells the component on which side of the application it is.
     */
    isLeft: {
      type: Boolean,
      default: true
    },
  },
  data() {
    return {
      // Unique ID for this instance of the component.
      id: this.$util.generateID(),
      // Boolean whether popover is shown.
      showPopover: false,
      // Filter text for scheme selection.
      schemeFilter: "",
    }
  },
  computed: {
    // Sorted list of all available schemes.
    schemes() {
      return this.$store.state.schemes.slice().sort((a, b) => {
        let labelA = this.$util.prefLabel(a), labelB = this.$util.prefLabel(b)
        if (labelA < labelB) {
          return -1
        }
        if (labelA > labelB) {
          return 1
        }
        return 0
      })
    },
    // Current scheme for this side.
    scheme() {
      return this.selected.scheme[this.isLeft]
    },
    filteredSchemes() {
      let filter = this.schemeFilter.toLowerCase()
      // Filter schemes, prepend favorites if filter is empty.
      return (filter == "" ? this.favoriteSchemes : []).concat(this.schemes).filter(
        scheme =>
          Object.values(scheme.prefLabel || {}).find(label => label.toLowerCase().startsWith(filter)) ||
          (scheme.notation || []).find(notation => notation.toLowerCase().startsWith(filter))
      )
    },
    favoriteSchemes() {
      let schemes = []
      for (let uri of this.config.favoriteTerminologyProviders) {
        let scheme = this.$store.getters["objects/get"]({ uri })
        if (scheme && !this.$jskos.isContainedIn(scheme, schemes)) {
          schemes.push(scheme)
        }
      }
      // This does nothing except for triggering a refresh for this computed property when the list of schemes has changed.
      this.schemes
      return schemes
    },
    favoriteConcepts() {
      let concepts = []
      for (let concept of this.config.favoriteConcepts) {
        concepts.push(this.$store.getters["objects/get"](concept) || concept)
      }
      return concepts
    },
  },
  watch: {
    showPopover(show) {
      // Focus input field when popover is shown
      let input = this.$refs.input.$el
      if (show && input) {
        input.focus()
        input.select()
      }
    },
  },
  mounted() {
    // Add click event listener
    document.addEventListener("click", this.handleClickOutside)
  },
  destroyed() {
    // Remove click event listener
    document.removeEventListener("click", this.handleClickOutside)
  },
  methods: {
    handleClickOutside(evt) {
      // Handle popover
      if (this.showPopover && this.$refs.popover && !this.$refs.popover.contains(evt.target)) {
        this.showPopover = false
      }
    },
    /**
     * Clears the scheme.
     */
    clearScheme() {
      this.$router.push({ path: this.getRouterUrl(null, this.isLeft) })
      // Focus and select input field with delay.
      _.delay(() => {
        let input = this.$refs.input.$el
        if (input) {
          input.focus()
          input.select()
        }
      }, 100)
    },
    /**
     * Selects first result from filtered scheme list and hide popover if necessary.
     */
    chooseFirst() {
      if (!this.filteredSchemes.length) {
        return
      }
      this.$router.push({ path: this.getRouterUrl(this.filteredSchemes[0], this.isLeft) })
      this.showPopover = false
    },
    /**
     * Sets concept search query to a certain string.
     */
    setConceptSearchQuery(query) {
      if (this.$refs.conceptSearch) {
        this.$refs.conceptSearch.setSearchQuery(query)
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

.conceptSchemeSelection {
  position: relative;
}

.conceptSchemeSelection-collapsed {
  padding: 5px;
}

.conceptSchemeSelection-expandButton {
  position: absolute;
  top: 0px;
  right: 20px;
  font-size: 24px;
  height: 30px;
  width: 20px;
  text-align: center;
}

.conceptSchemeSelection-expanded {
  display: flex;
  flex-direction: column;
  padding: 5px 10px;
  // Make the component take up almost all of the visible height.
  min-height: 93vh;
  max-height: 93vh;
}

.conceptSchemeSelection-expanded > * {
  flex: none;
}

.conceptSchemeSelection-schemeList {
  flex: 1;
  // Make sure scheme list doesn't get too small.
  min-height: 40vh;
  list-style: none;
  padding-left: 3px;
  margin-bottom: 30px;
}
.conceptSchemeSelection-schemeList > li, .conceptSchemeSelection-favoriteConcepts > p {
  padding-top: 8px;
}

.conceptSchemeSelection-favoriteConcepts {
  flex: 0 1 auto;
}

.conceptSchemeSelection-starFavorite {
  color: @color-primary-4;
}
.conceptSchemeSelection-starNormal {
  color: @color-button-faded;
}

</style>

<style>
/* Global styles overriding bootstrap classes */
.conceptSchemeSelection .popover {
  min-width: 350px;
  max-width: 350px;
}
.conceptSchemeSelection .popover > .popover-body {
  padding: 4px 6px;
}
</style>
