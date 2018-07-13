<template>
  <div
    id="app"
    class="text-dark color-primary-0-bg fontSize-normal" >
    <div class="alertsContainer">
      <b-alert
        v-for="(alert, index) in $root.$data.alerts"
        :key="index"
        :variant="alert.variant"
        :show="!alert.dismissed"
        dismissible
        @dismissed="alert.dismissed = true" >
        {{ alert.text }}
      </b-alert>
    </div>
    <the-navbar />
    <div class="main">
      <div class="flexbox-row">

        <!-- Concept components left side -->
        <div class="browser">
          <!-- Concept scheme selection -->
          <div class="schemeSelectWrapper">
            <b-form-select
              v-model="schemeSelectedLeft"
              :options="schemeOptions"
              class="schemeSelect fontWeight-heavy" />
            <div
              v-b-tooltip.hover="{ title:'show info about scheme', delay: $util.delay.medium }"
              v-show="schemeSelectedLeft != null && conceptSelectedLeft != null"
              class="button schemeSelectInfo fontSize-large"
              @click="$refs.conceptTreeLeft.selected = null" >
              <font-awesome-icon icon="info-circle" />
            </div>
            <div
              v-b-tooltip.hover="{ title: 'clear scheme', delay: $util.delay.medium }"
              v-show="schemeSelectedLeft != null"
              class="button schemeSelectInfo fontSize-large"
              @click="clear(true)" >
              <font-awesome-icon icon="times-circle" />
            </div>
          </div>
          <!-- ConceptSearch -->
          <concept-search
            v-show="schemeSelectedLeft != null"
            :voc="schemeSelectedLeft"
            class="conceptSearch"
            @chooseUri="chooseUri(arguments[0], true)" />
          <!-- ItemDetail and ConceptTree -->
          <div class="conceptBrowser">
            <!-- ItemDetail -->
            <item-detail
              v-if="schemeSelectedLeft != null"
              :item="conceptSelectedLeft || schemeSelectedLeft"
              :is-left="true"
              :scheme="schemeSelectedLeft"
              :settings="itemDetailSettings.left"
              class="mainComponent conceptBrowserItem conceptBrowserItemDetail"
              @chooseUri="chooseUri"
            />
            <!-- Slider -->
            <resizing-slider />
            <!-- ConceptTree -->
            <concept-tree
              v-if="schemeSelectedLeft != null"
              ref="conceptTreeLeft"
              :voc-selected="schemeSelectedLeft"
              :is-left="true"
              class="mainComponent conceptBrowserItem conceptBrowserItemTree"
              @selectedConcept="conceptSelectedLeft = $event"
            />
            <!-- Placeholder -->
            <div
              v-if="schemeSelectedLeft == null"
              class="mainComponent conceptBrowserItem placeholderComponent" >
              <p class="fontWeight-heavy">
                Scheme quick selection
              </p>
              <p
                v-for="scheme in favoriteSchemes"
                :key="scheme.uri" >
                ·<br>
                <a
                  href=""
                  @click.prevent="schemeSelectedLeft = scheme" >
                  {{ scheme.prefLabel.de || scheme.prefLabel.en }}
                </a>
              </p>
            </div>
          </div>
        </div>

        <!-- Slider -->
        <resizing-slider :is-column="true" />

        <!-- Mapping tools and occurrences browser -->
        <div class="mappingTool">
          <div class="mappingToolItem mainComponent">
            <!-- MappingEditor -->
            <mapping-editor
              v-if="schemeSelectedLeft || schemeSelectedRight"
              :selected-left="conceptSelectedLeft"
              :selected-right="conceptSelectedRight"
              :scheme-left="schemeSelectedLeft"
              :scheme-right="schemeSelectedRight"
              @chooseUri="chooseUri"
            />
            <!-- Placeholder -->

          </div>
          <!-- Slider -->
          <resizing-slider :cocoda-red="true" />
          <div class="mappingToolItem mainComponent">
            <!-- MappingBrowser -->
            <mapping-browser
              v-if="schemeSelectedLeft || schemeSelectedRight"
              :selected-left="conceptSelectedLeft"
              :selected-right="conceptSelectedRight"
              :scheme-left="schemeSelectedLeft"
              :scheme-right="schemeSelectedRight"
              @chooseUri="chooseUri"
            />
            <!-- Placeholder -->
            <div
              v-else
              class="placeholderComponentCenter" >
              <div class="fontWeight-heavy fontSize-large">
                Welcome to Cocoda!
              </div>
            </div>
          </div>
          <!-- Slider -->
          <resizing-slider :cocoda-red="true" />
          <div class="mappingToolItem mainComponent">
            <!-- OccurrencesBrowser -->
            <occurrences-browser
              v-if="schemeSelectedLeft || schemeSelectedRight"
              :selected-left="conceptSelectedLeft"
              :selected-right="conceptSelectedRight"
              :scheme-left="schemeSelectedLeft"
              :scheme-right="schemeSelectedRight"
              @chooseUri="chooseUri"
            />
            <!-- Placeholder -->

          </div>
        </div>

        <!-- Slider -->
        <resizing-slider :is-column="true" />

        <!-- Concept components right side -->
        <div class="browser">
          <!-- Concept scheme selection -->
          <div class="schemeSelectWrapper">
            <b-form-select
              v-model="schemeSelectedRight"
              :options="schemeOptions"
              class="schemeSelect fontWeight-heavy" />
            <div
              v-b-tooltip.hover="{ title: 'show info about scheme', delay: $util.delay.medium }"
              v-show="schemeSelectedRight != null && conceptSelectedRight != null"
              class="button schemeSelectInfo fontSize-large"
              @click="$refs.conceptTreeRight.selected = null" >
              <font-awesome-icon icon="info-circle" />
            </div>
            <div
              v-b-tooltip.hover="{ title: 'clear scheme', delay: $util.delay.medium }"
              v-show="schemeSelectedRight != null"
              class="button schemeSelectInfo fontSize-large"
              @click="clear(false)" >
              <font-awesome-icon icon="times-circle" />
            </div>
          </div>
          <!-- ConceptSearch -->
          <concept-search
            v-show="schemeSelectedRight != null"
            :voc="schemeSelectedRight"
            class="conceptSearch"
            @chooseUri="chooseUri(arguments[0], false)" />
          <!-- ItemDetail and ConceptTree -->
          <div class="conceptBrowser">
            <!-- ItemDetail -->
            <item-detail
              v-if="schemeSelectedRight != null"
              :item="conceptSelectedRight || schemeSelectedRight"
              :is-left="false"
              :scheme="schemeSelectedRight"
              :settings="itemDetailSettings.right"
              class="mainComponent conceptBrowserItem conceptBrowserItemDetail"
              @chooseUri="chooseUri"
            />
            <!-- Slider -->
            <resizing-slider />
            <!-- ConceptTree -->
            <concept-tree
              v-if="schemeSelectedRight != null"
              ref="conceptTreeRight"
              :voc-selected="schemeSelectedRight"
              :is-left="false"
              class="mainComponent conceptBrowserItem conceptBrowserItemTree"
              @selectedConcept="conceptSelectedRight = $event"
            />
            <!-- Placeholder -->
            <div
              v-if="schemeSelectedRight == null"
              class="mainComponent conceptBrowserItem placeholderComponent">
              <p class="fontWeight-heavy">
                Scheme quick selection
              </p>
              <p
                v-for="scheme in favoriteSchemes"
                :key="scheme.uri" >
                ·<br>
                <a
                  href=""
                  @click.prevent="schemeSelectedRight = scheme" >
                  {{ scheme.prefLabel.de || scheme.prefLabel.en }}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TheNavbar from "./components/TheNavbar"
import MappingEditor from "./components/MappingEditor"
import OccurrencesBrowser from "./components/OccurrencesBrowser"
import MappingBrowser from "./components/MappingBrowser"
import ConceptTree from "./components/ConceptTree"
import ItemDetail from "./components/ItemDetail"
import ConceptSearch from "./components/ConceptSearch"
import ResizingSlider from "./components/ResizingSlider"
var _ = require("lodash")
import FontAwesomeIcon from "@fortawesome/vue-fontawesome"

/**
 * Sorts data by German prefLabel with fallback to uri.
 */
function sortData(data) {
  // TODO: - Rethink way of sorting
  return data.sort(
    (a, b) => (a.prefLabel.de && b.prefLabel.de ? a.prefLabel.de > b.prefLabel.de : a.uri > b.uri) ? 1 : -1
  )
}

/**
 * The main application.
 */
export default {
  name: "App",
  components: {
    TheNavbar, ConceptTree, ItemDetail, ConceptSearch, MappingEditor, OccurrencesBrowser, MappingBrowser, ResizingSlider, FontAwesomeIcon
  },
  data () {
    return {
      conceptSelectedLeft: null,
      conceptSelectedRight: null,
      schemeSelectedLeft: null,
      schemeSelectedRight: null,
      schemes: this.$api.schemes,
      itemDetailSettings: {
        left: {
          showTopConceptsInScheme: false
        },
        right: {
          showTopConceptsInScheme: false
        }
      }
    }
  },
  computed: {
    /**
     * Generates the options for the select element.
     */
    schemeOptions: function() {
      let options = [
        { value: null, text: "Select a scheme", disabled: true }
      ]
      // Add from schemes
      for (var scheme of sortData(this.schemes)) {
        // TODO: - Check if notation always has a single value (and why is it an array then?).
        // TODO: - Support other languages.
        // TODO: - Fallback if no German label is available.
        options.push(
          { value: scheme, text: scheme.prefLabel.de || scheme.prefLabel.en || "" }
        )
      }
      return options
    },
    favoriteSchemes() {
      let schemes = []
      for (let scheme of this.schemes) {
        if (this.$config.favoriteTerminologyProviders.includes(scheme.uri)) {
          schemes.push(scheme)
        }
      }
      return schemes
    }
  },
  methods: {
    refresh(key) {
      if (key == "minimize") {
        // Minimizer causes a refresh, therefore recheck item detail settings
        this.itemDetailSettings.left.showTopConceptsInScheme = this.$refs.conceptTreeLeft != null && this.$refs.conceptTreeLeft.$el.dataset.minimized == "1"
        this.itemDetailSettings.right.showTopConceptsInScheme = this.$refs.conceptTreeRight != null && this.$refs.conceptTreeRight.$el.dataset.minimized == "1"
      }
    },
    /**
     * Completely clears the concept scheme browser on one side
     */
    clear(isLeft) {
      if (isLeft) {
        this.$refs.conceptTreeLeft.selected = null
        this.conceptSelectedLeft = null
        this.schemeSelectedLeft = null
      } else {
        this.$refs.conceptTreeRight.selected = null
        this.conceptSelectedRight = null
        this.schemeSelectedRight = null
      }
    },
    chooseUri(concept, isLeft) {
      let uri
      let delay = 0
      // Support both URIs and objects
      if (typeof concept === "object") {
        if (this.$util.isScheme(concept)) {
          // Loading scheme by setting selected to null
          if (isLeft) {
            this.$refs.conceptTreeLeft.selected = null
          } else {
            this.$refs.conceptTreeRight.selected = null
          }
          return
        }
        uri = concept.uri
        // Check if scheme needs to be selected as well
        if (concept.inScheme && (isLeft && !this.schemeSelectedLeft || !isLeft && !this.schemeSelectedRight)) {
          let conceptScheme = concept.inScheme[0]
          let newScheme = null
          // Find in existing list of schemes
          for (let scheme of this.schemes) {
            if (this.$util.compareSchemes(scheme, conceptScheme)) {
              newScheme = scheme
              break
            }
          }
          if (newScheme) {
            // introduce delay so that the ConceptTree component has time to load
            delay = 200
            if (isLeft) {
              this.schemeSelectedLeft = newScheme
            } else {
              this.schemeSelectedRight = newScheme
            }
          }
        }
      } else {
        uri = concept
      }
      let vm = this
      _.delay(function() {
        isLeft ? vm.$refs["conceptTreeLeft"].chooseFromUri(uri) : vm.$refs["conceptTreeRight"].chooseFromUri(uri)
      }, delay)
    }
  },
}
</script>

<style lang="less">
@import "./style/main.less";

html, body {
  height: 100%;
  margin: 0;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  min-width: 1220px;
  min-height: 680px;
}
.main {
  flex: 1;
  position: relative;
}
.flexbox-row {
  display: flex;
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 5px;
  right: 5px;
  margin: auto auto;
}

.browser {
  width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 315px;
}
.schemeSelectWrapper {
  flex: none;
  padding: 2px;
  display: flex;
}
.schemeSelect {
  .m-borderRadius(2px);
  border: 0 !important;
  box-shadow: 0 1px 2px 0 @color-shadow;
  background-color: @color-background-select !important;
  color: @color-primary-4 !important;
  flex: 1;
}
.schemeSelectInfo {
  flex: none;
  display: flex;
  justify-content: center;
  align-content: center;
  flex-direction: column;
  margin-left: 10px;
}
.conceptSearch {
  margin: 5px 0 0 0;
}
.conceptBrowser {
  height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.conceptBrowserItem {
  height: 0;
  flex: 1;
  min-height: 200px;
}
.conceptBrowserItemDetail {
  flex: 4;
}
.conceptBrowserItemTree {
  flex: 6;
}

.mappingTool {
  width: 0;
  flex: 2;
  display: flex;
  flex-direction: column;
  min-width: 540px;
}
.mappingToolItem {
  height: 0;
  flex: 3;
  min-height: 200px;
}
.mappingToolItem > div {
    height: 100%;
  }

.placeholderComponent {
  text-align: center;
  padding-top: 50px;
}
.placeholderComponentCenter > div {
  text-align: center;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
}

.alertsContainer {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translate(-50%, 0);
  z-index: @zIndex-8;
  width: 600px;
}

</style>
