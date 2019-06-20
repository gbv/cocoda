<template>
  <b-navbar
    toggleable="md"
    type="dark">
    <!-- Load logos from config -->
    <b-navbar-brand
      v-for="(logo, index) in config.logos || []"
      :key="index"
      :href="logo.url"
      target="_blank">
      <img
        :src="'./' + logo.file"
        :alt="logo.alt || 'logo'"
        style="height: 42px;">
    </b-navbar-brand>
    <!-- Title -->
    <b-navbar-brand
      href="https://coli-conc.gbv.de/cocoda/"
      target="_blank">
      {{ config.title }}
    </b-navbar-brand>
    <!-- Links on right side -->
    <b-navbar-nav class="ml-auto">
      <!-- Menu buttons (from configuration) -->
      <b-nav-item
        v-for="item in config.menu"
        :key="item.url"
        :href="item.url"
        target="_blank">
        {{ $util.prefLabel(item) }}
      </b-nav-item>
      <!-- Mapping trash -->
      <b-nav-item-dropdown
        v-if="mappingTrash.length > 0"
        id="mappingTrashDropdown"
        ref="mappingTrashDropdown"
        no-caret
        right
        @mouseover.native="dropdownSetStatus($refs.mappingTrashDropdown, true); _dropdownSetStatus($refs.mappingTrashDropdown, true)"
        @mouseout.native="dropdownSetStatus($refs.mappingTrashDropdown, false)">
        <template slot="button-content">
          <font-awesome-icon icon="trash-alt" />
        </template>
        <b-dropdown-header>
          {{ $t("navbar.trashTitle") }}
        </b-dropdown-header>
        <mapping-table
          class="font-default text-dark color-primary-0-bg fontSize-normal"
          :mappings="mappingTrash.map(item => item.mapping)"
          :actions="[{
            title: $t('navbar.trashRestoreTooltip'),
            name: 'restore',
            icon: 'recycle'
          }]"
          :show-labels="true"
          :show-tooltip="false"
          :show-registry="true"
          :hide-duplicates="false"
          style="width: 700px;"
          @click="$store.dispatch({ type: 'mapping/restoreMappingFromTrash', uri: $event.item.mapping.uri }).then(success => {
            if (success) {
              alert($t('alerts.mappingRestored'), null, 'success2')
            } else {
              alert($t('alerts.mappingNotRestored'), null, 'danger')
            }
          })" />
      </b-nav-item-dropdown>
      <!-- Favorite concepts -->
      <b-nav-item-dropdown
        id="favoriteConceptsDropdown"
        ref="favoriteConceptsDropdown"
        v-b-tooltip.right="favoriteCanBeDropped ? 'drop here to favorite' : ''"
        extra-menu-classes="favoriteConceptsDropdown"
        no-caret
        right
        @dragover.native="dragOver"
        @drop.native="drop"
        @hide="favoriteConceptsDropdownHide"
        @mouseover.native="dropdownSetStatus($refs.favoriteConceptsDropdown, true); _dropdownSetStatus($refs.favoriteConceptsDropdown, true)"
        @mouseout.native="dropdownSetStatus($refs.favoriteConceptsDropdown, false)">
        <template slot="button-content">
          <font-awesome-icon
            :class="favoriteCanBeDropped ? 'favoriteConceptsDropdown-iconTarget' : ''"
            icon="star" />
        </template>
        <b-dropdown-header>
          {{ $t('schemeSelection.conceptQuick') }}
        </b-dropdown-header>
        <div
          v-for="concept in favoriteConcepts"
          :key="'theNavbar-' + concept.uri + '-favorite'"
          class="dropdown-item"
          draggable
          @dragstart="favoriteConceptDragStart(concept)"
          @dragend="favoriteConceptDragEnd">
          <item-name :item="concept" />
          <div class="favoriteConceptsDropdown-buttons">
            <div
              v-b-tooltip.hover="{ title: $t('navbar.openLeft'), delay: $util.delay.medium }"
              class="button"
              @click="setSelected({ concept, isLeft: true })">
              <font-awesome-icon icon="caret-square-left" />
            </div>
            <div
              v-b-tooltip.hover="{ title: $t('navbar.openRight'), delay: $util.delay.medium }"
              class="button"
              @click="setSelected({ concept, isLeft: false })">
              <font-awesome-icon icon="caret-square-right" />
            </div>
            <div
              v-b-tooltip.hover="{ title: $t('navbar.removeFromFavorites'), delay: $util.delay.medium }"
              class="button"
              @click="removeFavoriteConcept(concept)">
              <font-awesome-icon icon="times-circle" />
            </div>
          </div>
        </div>
      </b-nav-item-dropdown>
      <!-- Identity icon -->
      <b-nav-item
        :href="userIdentityImage && creator && creator.uri"
        class="navbar-identitySettings"
        target="_blank">
        <span v-if="userIdentityImage && creator.uri">
          <img :src="userIdentityImage">
        </span>
        <span
          v-else
          :style="`color: ${!$store.state.auth.available ? 'black' : (authorized ? 'green' : (!$store.state.auth.connected ? 'yellow' : 'red'))} !important;`">
          <font-awesome-icon icon="user" />
        </span>
      </b-nav-item>
      <!-- Settings button -->
      <b-nav-item @click="$refs.settings.show()">
        <!-- Name -->
        {{ creatorName || $t("navbar.settings") }}
      </b-nav-item>
      <!-- Current registry notation -->
      <b-nav-item v-if="$store.getters.getCurrentRegistry">
        <registry-notation
          :registry="$store.getters.getCurrentRegistry"
          style="opacity: 0.7; cursor: default;" />
      </b-nav-item>
      <!-- Settings modal -->
      <the-settings ref="settings" />
    </b-navbar-nav>
  </b-navbar>
</template>

<script>
import TheSettings from "./TheSettings"
import ItemName from "./ItemName"
import RegistryNotation from "./RegistryNotation"
import MappingTable from "./MappingTable"
import _ from "lodash"

// Import mixins
import auth from "../mixins/auth"
import objects from "../mixins/objects"
import dragandrop from "../mixins/dragandrop"
import computed from "../mixins/computed"

/**
 * The navigation bar.
 */
export default {
  name: "TheNavbar",
  components: {
    TheSettings, ItemName, RegistryNotation, MappingTable
  },
  mixins: [auth, objects, dragandrop, computed],
  computed: {
    draggedConcept: {
      get() {
        return this.$store.state.draggedConcept
      },
      set(concept) {
        this.$store.commit({
          type: "setDraggedConcept",
          concept
        })
      }
    },
    favoriteCanBeDropped() {
      return this.draggedConcept != null && !this.$jskos.isScheme(this.draggedConcept) && !this.$jskos.isContainedIn(this.draggedConcept, this.favoriteConcepts)
    },
    mappingTrash() {
      let trash = this.$store.state.mapping.mappingTrash
      trash = trash.map(item => Object.assign({}, item, { mapping: this.adjustMapping(this.$jskos.copyDeep(item.mapping)) }))
      for (let item of trash) {
        item.mapping._registry = this.config.registries.find(registry => this.$jskos.compare(registry, item.registry))
      }
      return trash
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
  created() {
    this.dropdownSetStatus = _.debounce(this._dropdownSetStatus, 500)
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
    _dropdownSetStatus(dropdown, status) {
      if (status) {
        dropdown.show()
      } else {
        dropdown.hide()
      }
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

.navbar-identitySettings img, .navbar-identitySettings svg {
  opacity: 1;
  height: 17px;
  margin-right: -10px;
}
.navbar-identitySettings img {
  margin-top: -3px;
}
.navbar-identitySettings svg {
  margin-top: 1px;
}
.navbar-identitySettings:hover img, .navbar-identitySettings:hover svg {
  opacity: .5;
}
</style>

<style lang="less">
@import "../style/main.less";

.nav-link, .nav-link > span, .btn-link {
  color: @color-text-dark !important;
}
.nav-link.active, .btn-link.active {
  font-weight: 700;
}
.nav-pills .nav-link.active {
  color: white !important;
}
.nav-link:hover, .btn-link:hover {
  color: @color-text-veryLightGrey !important;
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
.favoriteConceptsDropdown-buttons {
  position: absolute;
  right: 10px;
  top: 53%;
  transform: translateY(-50%);
  font-size: 14px;
  display: flex;
}
.favoriteConceptsDropdown-buttons > div {
  padding: 0 3px;
}
</style>
