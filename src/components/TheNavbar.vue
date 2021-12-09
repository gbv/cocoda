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
      {{ title || config.title }}
    </b-navbar-brand>
    <!-- Links on right side -->
    <b-navbar-nav class="ml-auto">
      <!-- Menu buttons (from configuration) -->
      <b-nav-item
        v-for="item in config.menu"
        :key="item.url"
        :href="item.url"
        target="_blank">
        {{ $jskos.prefLabel(item, { language: locale }) }}
      </b-nav-item>
      <!-- Help menu button -->
      <b-nav-item
        v-if="!reduced"
        :href="`./user-manual-${locale}.html`"
        target="_blank">
        {{ $t("general.manual") }}
      </b-nav-item>
      <!-- Full Cocoda button (only if reduced) -->
      <b-nav-item
        v-if="reduced"
        href="./">
        Open Cocoda
      </b-nav-item>
      <!-- Mapping trash -->
      <b-nav-item-dropdown
        v-if="!reduced && mappingTrash.length > 0"
        id="mappingTrashDropdown"
        ref="mappingTrashDropdown"
        menu-class="navbar-dropdown"
        no-caret
        right
        @mouseover.native="dropdownSetStatus($refs.mappingTrashDropdown, true); _dropdownSetStatus($refs.mappingTrashDropdown, true)"
        @mouseout.native="dropdownSetStatus($refs.mappingTrashDropdown, false)">
        <template slot="button-content">
          <font-awesome-icon icon="trash-alt" />
        </template>
        <b-dropdown-header>
          {{ $t("navbar.trashTitle") }}
          <div
            v-b-tooltip.hover="{ title: $t('navbar.trashClearButtonTooltip'), delay: defaults.delay.medium }"
            class="button"
            style="position: absolute; right: 15px; top: 15px;"
            @click="$store.commit('mapping/clearTrash')">
            <font-awesome-icon icon="trash-alt" /> {{ $t("navbar.trashClearButton") }}
          </div>
        </b-dropdown-header>
        <mapping-table
          class="font-default"
          :mappings="mappingTrash.map(item => item.mapping)"
          :actions="[{
            title: $t('navbar.trashRestoreTooltip'),
            name: 'restore',
            icon: 'recycle'
          }]"
          :show-labels="true"
          :show-popover="false"
          :show-registry="true"
          :hide-duplicates="false"
          style="width: 700px;"
          @click="$store.dispatch({ type: 'mapping/restoreMappingFromTrash', uri: $event.item.mapping.uri }).then(success => {
            if (success) {
              alert($t('alerts.mappingRestored', [$jskos.prefLabel($event.item.registry, { fallbackToUri: false })]), null, 'success2')
            } else {
              alert($t('alerts.mappingNotRestored', [$jskos.prefLabel($event.item.registry, { fallbackToUri: false })]), null, 'danger')
            }
          })" />
      </b-nav-item-dropdown>
      <!-- Favorite concepts -->
      <b-nav-item-dropdown
        v-if="!reduced"
        id="favoriteConceptsDropdown"
        ref="favoriteConceptsDropdown"
        menu-class="navbar-dropdown favoriteConceptsDropdown"
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
          {{ $t('conceptList.favoriteConcepts') }}
        </b-dropdown-header>
        <div
          v-for="concept in favoriteConcepts"
          :key="'theNavbar-' + concept.uri + '-favorite'"
          class="dropdown-item"
          draggable
          @dragstart="favoriteConceptDragStart(concept)"
          @dragend="favoriteConceptDragEnd">
          <div style="padding-right: 8px;">
            <span
              v-b-tooltip.hover="{ title: $t('navbar.removeFromFavorites'), delay: defaults.delay.medium }"
              class="button fontSize-verySmall"
              @click="removeFavoriteConcept(concept)">
              <font-awesome-icon icon="times-circle" />
            </span>
          </div>
          <div style="flex: 1">
            <item-name
              v-if="concept.inScheme && concept.inScheme[0]"
              :item="concept.inScheme[0]"
              :show-text="false"
              :is-link="false"
              :prevent-external-hover="true"
              :draggable="false" />
            &nbsp;
            <item-name :item="concept" />
          </div>
          <div>
            <span
              v-b-tooltip.hover="{ title: $t('navbar.openLeft'), delay: defaults.delay.medium }"
              class="button"
              @click="setSelected({ concept, isLeft: true })">
              <font-awesome-icon icon="caret-square-left" />
            </span>
            &nbsp;
            <span
              v-b-tooltip.hover="{ title: $t('navbar.openRight'), delay: defaults.delay.medium }"
              class="button"
              @click="setSelected({ concept, isLeft: false })">
              <font-awesome-icon icon="caret-square-right" />
            </span>
          </div>
        </div>
      </b-nav-item-dropdown>

      <!-- Account menu -->
      <b-nav-item-dropdown
        v-if="!reduced"
        id="accountDropdown"
        ref="accountDropdown"
        menu-class="navbar-dropdown"
        no-caret
        right
        @mouseover.native="dropdownSetStatus($refs.accountDropdown, true); _dropdownSetStatus($refs.accountDropdown, true)"
        @mouseout.native="dropdownSetStatus($refs.accountDropdown, false)">
        <template slot="button-content">
          <div
            class="navbar-settingsButton"
            @click="openSettingsTab(0)">
            <!-- Identity icon -->
            <span
              v-if="userIdentityImage && creator.uri"
              class="fontWeight-heavy">
              <img :src="userIdentityImage">
              {{ creatorName || $t("settingsTabs")[0] }}
            </span>
            <span v-else>
              <font-awesome-icon
                icon="user"
                :style="`color: ${!$store.state.auth.available ? 'black' : (authorized ? 'green' : (!$store.state.auth.connected ? 'yellow' : 'red'))} !important;`" />
              <span :class="{ 'fontWeight-heavy': authorized }">
                {{ creatorName || $t("settingsTabs")[0] }}
              </span>
            </span>
          </div>
        </template>
        <div class="font-default">
          <template v-if="(userUris || [creator.uri]).filter(uri => uri != null).length">
            <p
              v-for="(uri, index) in (userUris || [creator.uri]).filter(uri => uri != null)"
              :key="`navbar-switchToIdentity-${index}`"
              :class="{
                'navbar-dropdown-selectable': true,
                'navbar-dropdown-selectable-selected': uri == creator.uri
              }"
              @click="setIdentity(uri)">
              <span class="navbar-dropdown-selectable-icon">
                <img
                  v-if="imageForIdentityUri(uri)"
                  :src="imageForIdentityUri(uri)">
                <font-awesome-icon
                  v-else
                  icon="user" />
              </span>
              {{ (providerForIdentityUri(uri) && providerForIdentityUri(uri).name) || (user && uri == user.uri ? $t("navbar.defaultIdentity") : uri) }}
            </p>
          </template>
          <p
            v-if="authorized"
            class="navbar-dropdown-selectable"
            @click="$store.commit({
              type: 'auth/openWindow',
              url: config.auth + 'logout',
              eventType: 'logout',
            })">
            <span
              class="navbar-dropdown-selectable-icon">
              {{ $t("settings.logOutButton") }}
            </span>
          </p>
          <p
            v-else-if="config.auth"
            class="navbar-dropdown-selectable"
            @click="openSettingsTab(0)">
            <span
              class="navbar-dropdown-selectable-icon">
              {{ $t("settings.logInButton") }}
            </span>
          </p>
          <p
            v-if="!config.auth && !(userUris || [creator.uri]).filter(Boolean).length"
            class="navbar-dropdown-selectable"
            @click="openSettingsTab(0)">
            <span
              class="navbar-dropdown-selectable-icon">
              {{ $t("navbar.setIdentity") }}
            </span>
          </p>
        </div>
      </b-nav-item-dropdown>

      <!-- Settings menu -->
      <b-nav-item-dropdown
        v-if="!reduced"
        id="settingsDropdown"
        ref="settingsDropdown"
        menu-class="navbar-dropdown"
        no-caret
        right
        @mouseover.native="dropdownSetStatus($refs.settingsDropdown, true); _dropdownSetStatus($refs.settingsDropdown, true)"
        @mouseout.native="dropdownSetStatus($refs.settingsDropdown, false)">
        <template slot="button-content">
          <font-awesome-icon
            icon="cog"
            @click="$refs.settings.show()" />
        </template>
        <p
          v-for="(tab, index) in $t('settingsTabs').slice(1, $t('settingsTabs').length - (localMappingsRegistry ? 0 : 1))"
          :key="`navbar-settingsTabs-${index}`"
          class="navbar-settingsTabs-row"
          @click="openSettingsTab(index+1)">
          {{ tab }}
        </p>
        <hr>
        <div
          v-if="currentRegistry"
          class="font-default">
          <p
            v-for="registry in config.registries.filter(registry => $jskos.mappingRegistryIsStored(registry))"
            :key="`navbar-mappingRegistry-${registry.uri}`"
            :class="{
              'navbar-dropdown-selectable': true,
              'navbar-dropdown-selectable-selected': $jskos.compareFast(registry, currentRegistry)
            }"
            @click="$store.commit({
              type: 'settings/set',
              prop: 'mappingRegistry',
              value: registry.uri
            })">
            <registry-info
              :registry="registry"
              :show-details="false"
              :show-capabilities="false" />
          </p>
          <hr>
        </div>
        <p style="padding: 0 10px;">
          <a
            href="https://github.com/gbv/cocoda"
            target="_blank">
            <font-awesome-icon :icon="['fab', 'github']" />
            GitHub
          </a>
          <span v-if="config.buildInfo.version && config.buildInfo.version != ''">
            •
            {{ $t("settings.version") }} {{ config.buildInfo.version }}
          </span>
        </p>
      </b-nav-item-dropdown>

      <!-- Settings modal -->
      <the-settings
        ref="settings"
        :tab.sync="settingsTab" />
    </b-navbar-nav>
  </b-navbar>
</template>

<script>
import TheSettings from "./TheSettings.vue"
import RegistryInfo from "./RegistryInfo.vue"
import MappingTable from "./MappingTable.vue"
import ItemName from "./ItemName.vue"
import _ from "lodash"

// Import mixins
import auth from "../mixins/auth.js"
import objects from "../mixins/cdk.js"
import dragandrop from "../mixins/dragandrop.js"
import computed from "../mixins/computed.js"

/**
 * The navigation bar.
 */
export default {
  name: "TheNavbar",
  components: {
    TheSettings, RegistryInfo, MappingTable, ItemName,
  },
  mixins: [auth, objects, dragandrop, computed],
  props: {
    title: {
      type: String,
      default: null,
    },
    reduced: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      settingsTab: 0,
    }
  },
  computed: {
    draggedConcept: {
      get() {
        return this.$store.state.draggedConcept
      },
      set(concept) {
        this.$store.commit({
          type: "setDraggedConcept",
          concept,
        })
      },
    },
    favoriteCanBeDropped() {
      return this.draggedConcept != null && !this.$jskos.isScheme(this.draggedConcept) && !this.$jskos.isContainedIn(this.draggedConcept, this.favoriteConcepts)
    },
    mappingTrash() {
      // Don't load trash before schemes are loaded
      if (!this.$store.state.configLoaded || !this.schemes.length) {
        return []
      }
      let trash = this.$store.state.mapping.mappingTrash
      trash = trash.map(item => Object.assign({}, item, { mapping: this.adjustMapping(this.$jskos.copyDeep(item.mapping)) }))
      for (let item of trash) {
        item.mapping._registry = this.config.registries.find(registry => this.$jskos.compareFast(registry, item.registry))
      }
      return trash
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
    openSettingsTab(index) {
      this.settingsTab = index
      this.$refs.settings.show()
    },
    setIdentity(uri) {
      this.$store.commit({
        type: "settings/set",
        prop: "creatorUri",
        value: uri,
      })
      // Find name in identity and set creator
      // TODO: Code duplication with TheSettings
      if (this.user) {
        let name = this.user.name
        const identity = Object.values(this.user.identities).find(i => i.uri === uri)
        if (identity) {
          name = identity.name
        }
        if (name) {
          this.$store.commit({
            type: "settings/set",
            prop: "creator",
            value: name,
          })
        }
      }
    },
  },
}
</script>

<style lang="less" scoped>
@import "../style/main.less";

nav.navbar {
  padding: 2px 8px;
  height: 42px;
  background-color: @color-background-primary;
}
.navbar-brand {
  color: @color-text-dark !important;
}
.btn-link:disabled, .btn-link.disabled {
  text-decoration: line-through;
  color: @color-text-lightGrey;
}

.navbar-settingsButton > span > img, .navbar-settingsButton > span > svg {
  opacity: 1;
  height: 17px;
}
.navbar-settingsButton > span > img {
  margin-top: -3px;
}
.navbar-settingsButton > span > svg {
  margin-top: 1px;
}
.navbar-settingsButton:hover > span > img, .navbar-settingsButton:hover > span > svg {
  opacity: .5;
}
hr {
  margin: 0.75rem 0;
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
.navbar-dropdown {
  overflow-x: hidden;
  // Offset to the right
  right: -8px !important;
  // Move a little to the top
  top: 95% !important;
}
.favoriteConceptsDropdown {
  max-height: 700px;
  width: 400px;
}
.favoriteConceptsDropdown .dropdown-item {
  white-space: normal;
  position: relative;
  display: flex;
}
.favoriteConceptsDropdown .dropdown-item:hover {
  background-color: @color-background-secondary;
}
.favoriteConceptsDropdown-iconTarget {
  color: @color-secondary;
}
.navbar-dropdown-selectable {
  word-break: default;
  white-space: nowrap;
  user-select: none;
  padding: 3px 10px;
  padding-right: 12px;
}
.navbar-dropdown-selectable-icon {
  display: inline-block;
}
.navbar-dropdown-selectable-icon > img {
  height: 17px;
  max-height: 17px;
  margin-top: -3px;
}
.navbar-dropdown-selectable-icon > svg {
  height: 17px;
  margin-top: 1px;
  margin-left: 2px;
}
.navbar-dropdown-selectable-selected {
  .fontWeight-heavy;
  padding-right: 5px;
  background-color: @color-secondary;
}
.navbar-settingsTabs-row {
  padding: 3px 10px;
}
.navbar-settingsTabs-row:hover, .navbar-dropdown-selectable:hover {
  cursor: pointer;
  background-color: @color-background-secondary;
}
</style>
