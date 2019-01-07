<template>
  <div
    class="conceptSchemeSelection"
    style="overflow: visible;">
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
    <div
      :is="scheme == null ? 'div' : 'b-popover'"
      :target="`${id}-expandButton`"
      :show.sync="showPopover"
      triggers="click"
      placement="leftbottom"
      class="conceptSchemeSelection-popover" >
      <div
        ref="popover"
        class="conceptSchemeSelection-expanded" >
        <div class="conceptSchemeSelection-title">
          {{ isLeft ? $t("schemeSelection.source") : $t("schemeSelection.target") }}
        </div>
        <p>
          <b-form-input
            ref="input"
            v-model="schemeFilter"
            autocomplete="off"
            @keyup.enter.native="chooseFirst" />
        </p>
        <ul class="conceptSchemeSelection-schemeList scrollable">
          <li
            v-for="(scheme, index) in filteredSchemes"
            :key="scheme.uri + '-scheme-list-' + id + index"
            class="quickSelectionItem" >
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
        <div
          v-if="favoriteConcepts && favoriteConcepts.length"
          class="conceptSchemeSelection-title">
          {{ $t("schemeSelection.conceptQuick") }}
        </div>
        <p
          v-for="concept in favoriteConcepts"
          :key="concept.uri + '-favorite-' + id"
          class="quickSelectionItem" >
          <item-name
            :item="concept"
            :is-link="true"
            :is-left="isLeft"
          />
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import ItemName from "./ItemName"
import ConceptSearch from "./ConceptSearch"

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
      id: this.$util.generateID(),
      updateId: null,
      showPopover: false,
      schemeFilter: "",
    }
  },
  computed: {
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
    conceptSearch() {
      // Recompute when updateId changed
      this.updateId
      return this.$refs.conceptSearch
    },
  },
  watch: {
    showPopover(show) {
      let input = this.$refs.input.$el
      if (show && input) {
        input.focus()
        input.select()
      }
      // Add class to popover element
      try {
        this.$refs.popover.parentElement.parentElement.parentElement.classList.add("conceptSchemeSelection-popover")
      } catch(error) {
        // Ignore error.
      }
    },
  },
  mounted() {
    // Add click event listener
    document.addEventListener("click", this.handleClickOutside)
  },
  updated() {
    this.updateId = this.$util.generateID()
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
    chooseFirst() {
      if (!this.filteredSchemes.length) {
        return
      }
      this.$router.push({ path: this.getRouterUrl(this.filteredSchemes[0], this.isLeft) })
      this.showPopover = false
    },
  }
}
</script>

<style lang="less">
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
  min-height: 93vh;
  max-height: 93vh;
  padding: 5px 10px;
}

.conceptSchemeSelection-expanded > * {
  flex: none;
}

.conceptSchemeSelection-title {
  .componentTitle;
}

.conceptSchemeSelection-schemeList {
  flex: 1;
  list-style: none;
  padding-left: 3px;
}
.conceptSchemeSelection-schemeList > li {
  padding-top: 8px;
}

.conceptSchemeSelection-starFavorite {
  color: @color-primary-4;
}
.conceptSchemeSelection-starNormal {
  color: @color-button-faded;
}

.conceptSchemeSelection-popover.popover {
  min-width: 350px;
  max-width: 350px;
}
.conceptSchemeSelection-popover.popover > .popover-body {
  padding: 4px 6px;
}

</style>
