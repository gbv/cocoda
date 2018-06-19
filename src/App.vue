<template>
  <div
    id="app"
    class="text-dark color-primary-0-bg font-size-normal">
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
              class="schemeSelect" />
          </div>
          <!-- ConceptSearch -->
          <concept-search
            v-show="schemeSelectedLeft != null"
            :voc="schemeSelectedLeft"
            class="conceptSearch"
            @chooseUri="chooseUri(arguments[0], true)" />
          <!-- ConceptDetail and ConceptTree -->
          <div class="conceptBrowser">
            <!-- ConceptDetail -->
            <concept-detail
              v-if="schemeSelectedLeft != null"
              :item="conceptSelectedLeft || schemeSelectedLeft"
              :is-scheme="conceptSelectedLeft == null"
              :is-left="true"
              :voc="schemeSelectedLeft"
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
              class="mainComponent conceptBrowserItem placeholderComponent">
              <p class="font-heavy">Scheme quick selection</p>
              <p
                v-for="scheme in favoriteSchemes"
                :key="scheme.uri">
                ·<br><a
                  href=""
                  @click.prevent="schemeSelectedLeft = scheme">{{ scheme.prefLabel.de || scheme.prefLabel.en }}</a>
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
          <resizing-slider />
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
              class="placeholderComponentCenter"
            >
              <div class="font-heavy font-size-large">Welcome to Cocoda!</div>
            </div>
          </div>
          <!-- Slider -->
          <resizing-slider />
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
              class="schemeSelect" />
          </div>
          <!-- ConceptSearch -->
          <concept-search
            v-show="schemeSelectedRight != null"
            :voc="schemeSelectedRight"
            class="conceptSearch"
            @chooseUri="chooseUri(arguments[0], false)" />
          <!-- ConceptDetail and ConceptTree -->
          <div class="conceptBrowser">
            <!-- ConceptDetail -->
            <concept-detail
              v-if="schemeSelectedRight != null"
              :item="conceptSelectedRight || schemeSelectedRight"
              :is-scheme="conceptSelectedRight == null"
              :is-left="false"
              :voc="schemeSelectedRight"
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
              <p class="font-heavy">Scheme quick selection</p>
              <p
                v-for="scheme in favoriteSchemes"
                :key="scheme.uri">
                ·<br><a
                  href=""
                  @click.prevent="schemeSelectedRight = scheme">{{ scheme.prefLabel.de || scheme.prefLabel.en }}</a>
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
import ConceptDetail from "./components/ConceptDetail"
import ConceptSearch from "./components/ConceptSearch"
import ResizingSlider from "./components/ResizingSlider"
var _ = require("lodash")

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
    TheNavbar, ConceptTree, ConceptDetail, ConceptSearch, MappingEditor, OccurrencesBrowser, MappingBrowser, ResizingSlider
  },
  data () {
    return {
      conceptSelectedLeft: null,
      conceptSelectedRight: null,
      schemeSelectedLeft: null,
      schemeSelectedRight: null,
      schemes: this.$api.schemes
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
        if ([
          "http://uri.gbv.de/terminology/bk/",
          "http://uri.gbv.de/terminology/rvk/",
          "http://bartoc.org/en/node/430"
        ].includes(scheme.uri)) {
          schemes.push(scheme)
        }
      }
      return schemes
    }
  },
  methods: {
    chooseUri(concept, isLeft) {
      let uri
      let delay = 0
      // Support both URIs and objects
      if (typeof concept === "object") {
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
  /* TODO: - How much width and height do we need? */
  min-width: 1200px;
  min-height: 600px;
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
}
.schemeSelect {
  border: 0;
  border-radius: 2px;
  box-shadow: 0 1px 2px 0 hsla(0, 0%, 0%, 0.2);
  background-color: lighten(@color-primary-1, 15%);
  color: @color-primary-4;
  &:extend(.font-heavy);
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
  & > div {
    height: 100%;
  }
  min-height: 200px;
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

a:link, a:visited, a:active {
  color: darken(@color-complement-4, 5%);
}
a:hover {
  text-decoration: none;
  color: @color-complement-3;
}

/* Overwrite the default to keep the scrollbar always visible */
::-webkit-scrollbar {
    -webkit-appearance: none;
    width: 9px;
    height: 9px;
}
::-webkit-scrollbar-thumb {
    box-shadow: inset 0 0 5px 5px #AEAEAE;
    border: solid 1px transparent;
    border-radius: 6px;
}

</style>
