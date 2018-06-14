<template>
  <div
    id="app"
    class="text-dark color-primary-0-bg font-size-normal">
    <the-navbar />
    <div class="main">
      <div class="flexbox-row">
        <!-- <div
          ref="mainElement0-0"
          :style="{ flex: flex[0][0] }"
          class="browser"
          data-direction="column">


          <div
            v-if="conceptSelectedLeft != null || schemeSelectedLeft != null"
            ref="resizeSlider1-0"
            class="resizeSliderRow"
            @mousedown="startResizing($event, 1, 0, false)" />

          <div
            v-else
            :style="{ flex: flex[1][1] }"
            class="main-component placeholder-component"
            data-direction="row">

          </div>
        </div>
        <div
          ref="resizeSlider0-0"
          class="resizeSliderCol"
          @mousedown="startResizing($event, 0, 0)" />
        <div
          id="mappingTool"
          ref="mainElement0-1"
          :style="{ flex: flex[0][1] }"
          data-direction="column">

          <div
            ref="resizeSlider2-0"
            class="resizeSliderRow"
            @mousedown="startResizing($event, 2, 0, false)" />


          <div
            ref="resizeSlider2-1"
            class="resizeSliderRow"
            @mousedown="startResizing($event, 2, 1, false)" />

        </div>
        <div
          ref="resizeSlider0-1"
          class="resizeSliderCol"
          @mousedown="startResizing($event, 0, 1)" />
        <div
          ref="mainElement0-2"
          :style="{ flex: flex[0][2] }"
          class="browser"
          data-direction="column">
          <b-form-select
            v-model="schemeSelectedRight"
            :options="schemeOptions"
            class="schemeSelect" />
          <concept-search
            :voc="schemeSelectedRight"
            @chooseUri="chooseUri(arguments[0], false)" />
          <concept-detail
            ref="mainElement3-0"
            :style="{ flex: flex[3][0] }"
            :item="conceptSelectedRight || schemeSelectedRight"
            :is-scheme="conceptSelectedRight == null"
            :is-left="false"
            :voc="schemeSelectedRight"
            class="main-component"
            data-direction="row"
            @chooseUri="chooseUri" />
          <div
            v-if="conceptSelectedRight != null || schemeSelectedRight != null"
            ref="resizeSlider3-0"
            class="resizeSliderRow"
            @mousedown="startResizing($event, 3, 0, false)" />
          <concept-tree
            v-if="schemeSelectedRight != null"
            ref="mainElement3-1"
            :style="{ flex: flex[3][1] }"
            :voc-selected="schemeSelectedRight"
            :is-left="false"
            class="main-component"
            data-direction="row"
            @selectedConcept="conceptSelectedRight = $event" />
          <div
            v-else
            :style="{ flex: flex[1][1] }"
            class="main-component placeholder-component"
            data-direction="row">
            <p class="font-heavy">Scheme quick selection</p>
            <p
              v-for="scheme in favoriteSchemes"
              :key="scheme.uri">
              ·<br><a
                href=""
                @click.prevent="schemeSelectedRight = scheme">{{ scheme.prefLabel.de || scheme.prefLabel.en }}</a>
            </p>
          </div>
        </div> -->
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
              class="mainComponent conceptBrowserItem"
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
              class="mainComponent conceptBrowserItem"
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
              class="mainComponent conceptBrowserItem"
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
              class="mainComponent conceptBrowserItem"
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
import * as mixins from "./mixins"
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
  mixins: [mixins.resizingMixin],
  data () {
    return {
      flex: [
        [1.0, 2.0, 1.0], // main columns
        [1.0, 1.5], // left concept browser
        [1.0, 1.0, 1.0], // mapping tool
        [1.0, 1.5], // right concept browser
      ],
      conceptSelectedLeft: null,
      conceptSelectedRight: null,
      schemeSelectedLeft: null,
      schemeSelectedRight: null,
      schemes: [],
      favoriteSchemes: []
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
      for (var scheme of this.schemes) {
        // TODO: - Check if notation always has a single value (and why is it an array then?).
        // TODO: - Support other languages.
        // TODO: - Fallback if no German label is available.
        options.push(
          { value: scheme, text: scheme.prefLabel.de || scheme.prefLabel.en || "" }
        )
      }
      return options
    }
  },
  watch: {
    schemeSelectedLeft(newValue, oldValue) {
      if (oldValue == null && newValue != null) {
        this.schemeChangedFromNull(true)
      }
    },
    schemeSelectedRight(newValue, oldValue) {
      if (oldValue == null && newValue != null) {
        this.schemeChangedFromNull(false)
      }
    }
  },
  mounted() {
    // Load schemes
    var vm = this
    this.$api.voc()
      .then(function(data) {
        vm.schemes = sortData(data)
        if (vm.favoriteSchemes.length == 0) {
          for (let scheme of vm.schemes) {
            if ([
              "http://uri.gbv.de/terminology/bk/",
              "http://uri.gbv.de/terminology/rvk/"
            ].includes(scheme.uri)) {
              vm.favoriteSchemes.push(scheme)
            }
          }
        }
      })
      .catch(function(error) {
        console.log("Request failed", error)
      })
  },
  methods: {
    schemeChangedFromNull(isLeft) {
      let index = isLeft ? 1 : 3
      let vm = this
      this.flex[index] = [1.0, 1.5]
      // Introduce short delay to resetting flex values so that the ConceptDetail component has time to expand to its proper size.
      _.delay(function() {
        vm.resetFlex()
      }, 100)
    },
    chooseUri(uri, isLeft) {
      isLeft ? this.$refs["conceptTreeLeft"].chooseFromUri(uri) : this.$refs["conceptTreeRight"].chooseFromUri(uri)
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
  margin-top: 0px;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  /* TODO: - How much width and height do we need? */
  min-width: 1200px;
  min-height: 800px;
}
.main {
  flex: 1;
  position: relative;
}
.flexbox-row {
  display: flex;
  position: absolute;
  // height: 99.5%;
  // width: 99.5%;
  top: 3px;
  bottom: 3px;
  left: 5px;
  right: 5px;
  margin: auto auto;
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
  flex: 1;
  & > div {
    height: 100%;
  }
  min-height: 200px;
}

.conceptSearch {
  margin: 5px 0 0 0;
}
.browser {
  width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 315px;
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
