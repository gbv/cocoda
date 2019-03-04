<template>
  <b-navbar
    toggleable="md"
    type="dark" >
    <!-- Load logos from config -->
    <b-navbar-brand
      v-for="(logo, index) in config.logos || []"
      :key="index"
      :href="logo.url"
      target="_blank" >
      <img
        :src="'./static/' + logo.file"
        :alt="logo.alt || 'logo'"
        style="height: 42px;" >
    </b-navbar-brand>
    <!-- Title -->
    <b-navbar-brand
      href="https://coli-conc.gbv.de/cocoda/"
      target="_blank" >
      {{ config.title }}
    </b-navbar-brand>
    <!-- Links on right side -->
    <b-navbar-nav class="ml-auto">
      <!-- Menu buttons (from configuration) -->
      <b-nav-item
        v-for="item in config.menu"
        :key="item.url"
        :href="item.url"
        target="_blank" >
        {{ $util.prefLabel(item) }}
      </b-nav-item>
      <!-- Favorite concepts -->
      <b-nav-item-dropdown
        v-b-tooltip.right="favoriteCanBeDropped ? 'drop here to favorite' : ''"
        id="favoriteConceptsDropdown"
        ref="favoriteConceptsDropdown"
        extra-menu-classes="favoriteConceptsDropdown"
        no-caret
        right
        @hide="favoriteConceptsDropdownHide"
        @mouseover.native="favoriteConceptsDropdownMouseover"
        @mouseout.native="favoriteConceptsDropdownMouseout" >
        <template slot="button-content">
          <font-awesome-icon
            :class="favoriteCanBeDropped ? 'favoriteConceptsDropdown-iconTarget' : ''"
            icon="star"
            @dragover="dragOver"
            @drop="drop" />
        </template>
        <b-dropdown-header>Favorite Concepts</b-dropdown-header>
        <b-dropdown-item
          v-for="concept in favoriteConcepts"
          :key="'theNavbar-' + concept.uri + '-favorite'"
          disabled
          draggable
          @dragstart="favoriteConceptDragStart(concept)"
          @dragend="favoriteConceptDragEnd" >
          <item-name :item="concept" />
          <div
            class="button favoriteConceptsDropdown-removeButton"
            @click="removeFavoriteConcept(concept)" >
            <font-awesome-icon icon="times-circle" />
          </div>
        </b-dropdown-item>
      </b-nav-item-dropdown>
      <!-- Settings button -->
      <b-nav-item @click="$refs.settings.show()">
        <font-awesome-icon icon="cog" />
        {{ creatorName || $t("navbar.settings") }}
        <!-- Login status -->
        <span
          v-if="$store.state.auth.available"
          :style="`color: ${authorized ? 'green' : (!$store.state.auth.connected ? 'yellow' : 'red')} !important;`">
          <font-awesome-icon icon="user" />
        </span>
      </b-nav-item>
      <!-- Settings modal -->
      <the-settings ref="settings" />
    </b-navbar-nav>
  </b-navbar>
</template>

<script>
import TheSettings from "./TheSettings"
import ItemName from "./ItemName"
import _ from "lodash"

/**
 * The navigation bar.
 */
export default {
  name: "TheNavbar",
  components: {
    TheSettings, ItemName
  },
  computed: {
    favoriteCanBeDropped() {
      return this.draggedConcept != null && !this.$jskos.isScheme(this.draggedConcept) && !this.$jskos.isContainedIn(this.draggedConcept, this.favoriteConcepts)
    },
  },
  watch: {
    draggedConcept(concept) {
      if (concept) {
        _.delay(() => {
          this.$root.$emit("bv::show::tooltip", "favoriteConceptsDropdown")
        }, 100)
      } else {
        this.$root.$emit("bv::hide::tooltip", "favoriteConceptsDropdown")
      }
    },
  },
  methods: {
    favoriteConceptDragStart(concept) {
      event.dataTransfer.setData("text", concept.uri)
      this.draggedConcept = concept
    },
    favoriteConceptDragEnd(event) {
      // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#dragend
      // "If the dropEffect property has the value none during a dragend, then the drag was cancelled."
      if (event.dataTransfer.dropEffect != "none") {
        // Drag successful, hide dropdown
        this.$refs.favoriteConceptsDropdown.hide()
      }
      this.draggedConcept = null
    },
    favoriteConceptsDropdownMouseover() {
      this.$refs.favoriteConceptsDropdown.show()
    },
    favoriteConceptsDropdownMouseout() {
      this.$refs.favoriteConceptsDropdown.hide()
    },
    favoriteConceptsDropdownHide() {
      // Scroll back to the top
      this.$refs.favoriteConceptsDropdown.$el.getElementsByClassName("favoriteConceptsDropdown")[0].scrollTop = 0
    },
    droppedConcept(concept) {
      // Save concept to favorites
      this.$store.dispatch("addConceptToFavorites", concept)
    },
    removeFavoriteConcept(concept) {
      this.$store.dispatch("removeConceptFromFavorites", concept)
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

nav.navbar {
  padding: 2px 8px;
  height: 42px;
  background-color: @color-primary-1;
}
.navbar-brand {
  color: @color-text-dark !important;
}
.btn-link:disabled, .btn-link.disabled {
  text-decoration: line-through;
  color: @color-text-lightGrey;
}
</style>

<style lang="less">
@import "../style/main.less";

.nav-link, .nav-link > span, .btn-link {
  color: @color-text-dark !important;
}
.nav-link:hover, .btn-link:hover {
  color: @color-text-lightGrey !important;
}
.feedbackModal .modal-dialog {
  height: 90%;
}
.feedbackModal .modal-content {
  height: 100%;
}
.feedbackModal iframe {
  overflow:hidden;
  position:absolute;
  height:100%;
  width:100%;
  top:0;
  bottom:0;
  left:0;
  right:0;
}
.favoriteConceptsDropdown {
  max-height: 700px;
  width: 300px;
  overflow-x: hidden;
  // Offset to the right
  right: -50px !important;
  // Move a little to the top
  top: 95% !important;
}
.favoriteConceptsDropdown .dropdown-item {
  white-space: normal;
  position: relative;
}
.favoriteConceptsDropdown .dropdown-item:hover {
  background-color: @color-primary-5;
}
.favoriteConceptsDropdown-iconTarget {
  color: @color-select;
}
.favoriteConceptsDropdown-removeButton {
  position: absolute;
  right: 10px;
  top: 53%;
  transform: translateY(-50%);
  font-size: 14px;
}
</style>
