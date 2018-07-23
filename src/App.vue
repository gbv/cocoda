<template>
  <div
    id="app"
    class="text-dark color-primary-0-bg fontSize-normal" >
    <div class="alertsContainer">
      <b-alert
        v-for="(alert, index) in $store.state.alerts.alerts"
        :key="index"
        :variant="alert.variant"
        :show="alert.countdown || !alert.shouldCountdown"
        :dismissible="!alert.shouldCountdown"
        fade
        @dismissed="$store.commit({ type: 'alerts/setCountdown', alert, countdown: 0 })"
        @dismiss-count-down="$store.commit({ type: 'alerts/setCountdown', alert, countdown: $event })" >
        {{ alert.text }}
      </b-alert>
    </div>
    <the-navbar />
    <div class="main">
      <div class="flexbox-row">

        <!-- Concept components left side -->
        <div
          v-for="(isLeft, index) in [true, false]"
          :key="'browser-'+index"
          :class="{
            order1: isLeft,
            order5: !isLeft
          }"
          class="browser" >
          <!-- Concept scheme selection -->
          <div class="schemeSelectWrapper">
            <b-form-select
              v-model="selected.scheme[isLeft]"
              :options="schemeOptions"
              class="schemeSelect fontWeight-heavy" />
            <div
              v-b-tooltip.hover="{ title:'show info about scheme', delay: $util.delay.medium }"
              v-show="selected.scheme[isLeft] != null && selected.concept[isLeft] != null"
              class="button schemeSelectInfo fontSize-large"
              @click="setSelected('concept', isLeft, null)" >
              <font-awesome-icon icon="info-circle" />
            </div>
            <div
              v-b-tooltip.hover="{ title: 'clear scheme', delay: $util.delay.medium }"
              v-show="selected.scheme[isLeft] != null"
              class="button schemeSelectInfo fontSize-large"
              @click="clear(isLeft)" >
              <font-awesome-icon icon="times-circle" />
            </div>
          </div>
          <!-- ConceptSearch -->
          <concept-search
            v-show="selected.scheme[isLeft] != null"
            :is-left="isLeft"
            class="conceptSearch"
          />
          <!-- ItemDetail and ConceptTree -->
          <div class="conceptBrowser">
            <!-- ItemDetail -->
            <item-detail
              v-if="selected.scheme[isLeft] != null"
              :item="selected.concept[isLeft] || selected.scheme[isLeft]"
              :is-left="isLeft"
              :settings="itemDetailSettings.left"
              class="mainComponent conceptBrowserItem conceptBrowserItemDetail"
            />
            <!-- Slider -->
            <resizing-slider />
            <!-- ConceptTree -->
            <concept-tree
              v-if="selected.scheme[isLeft] != null"
              :ref="isLeft ? 'conceptTreeLeft' : 'conceptTreeRight'"
              :is-left="isLeft"
              class="mainComponent conceptBrowserItem conceptBrowserItemTree"
            />
            <!-- Placeholder -->
            <div
              v-if="selected.scheme[isLeft] == null"
              class="mainComponent conceptBrowserItem placeholderComponent" >
              <p class="fontWeight-heavy">
                Scheme quick selection
              </p>
              <p
                v-for="scheme in favoriteSchemes"
                :key="scheme.uri" >
                ·<br>
                <item-name
                  :item="scheme"
                  :is-link="true"
                  class="button"
                  @click.native="setSelected('scheme', isLeft, scheme)"
                />
              </p>
              <br><br>
              <p class="fontWeight-heavy">
                Concept quick selection
              </p>
              <p
                v-for="concept in config.favoriteConcepts"
                :key="concept.uri" >
                ·<br>
                <item-name
                  :item="concept"
                  :is-link="true"
                  class="button"
                  @click.native="setSelected('concept', isLeft, concept)"
                />
              </p>
            </div>
          </div>
        </div>

        <!-- Slider -->
        <resizing-slider
          :is-column="true"
          class="order2" />

        <!-- Mapping tools and occurrences browser -->
        <div class="mappingTool order3">
          <div class="mappingToolItem mainComponent">
            <!-- MappingEditor -->
            <mapping-editor
              v-if="selected.scheme[true] || selected.scheme[false]"
            />
            <!-- Placeholder -->

          </div>
          <!-- Slider -->
          <resizing-slider :cocoda-red="true" />
          <div class="mappingToolItem mainComponent">
            <!-- MappingBrowser -->
            <mapping-browser
              v-if="selected.scheme[true] || selected.scheme[false]"
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
              v-if="selected.scheme[true] || selected.scheme[false]"
            />
            <!-- Placeholder -->

          </div>
        </div>

        <!-- Slider -->
        <resizing-slider
          :is-column="true"
          class="order4" />

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
import FontAwesomeIcon from "@fortawesome/vue-fontawesome"
import ItemName from "./components/ItemName"

/**
 * The main application.
 */
export default {
  name: "App",
  components: {
    TheNavbar, ConceptTree, ItemDetail, ConceptSearch, MappingEditor, OccurrencesBrowser, MappingBrowser, ResizingSlider, FontAwesomeIcon, ItemName
  },
  data () {
    return {
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
      for (var scheme of this.$store.state.schemes) {
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
      for (let scheme of this.$store.state.schemes) {
        if (this.config.favoriteTerminologyProviders.includes(scheme.uri)) {
          schemes.push(scheme)
        }
      }
      return schemes
    },
    // Using ref in v-for results in an array.
    // FIXME: Should be removed after references to conceptTree are not needed anymore.
    conceptTreeLeft() {
      return Array.isArray(this.$refs.conceptTreeLeft) ? this.$refs.conceptTreeLeft[0] : this.$refs.conceptTreeLeft
    },
    conceptTreeRight() {
      return Array.isArray(this.$refs.conceptTreeRight) ? this.$refs.conceptTreeRight[0] : this.$refs.conceptTreeRight
    }
  },
  methods: {
    refresh(key) {
      if (key == "minimize") {
        // Minimizer causes a refresh, therefore recheck item detail settings
        this.itemDetailSettings.left.showTopConceptsInScheme = this.conceptTreeLeft != null && this.conceptTreeLeft.$el.dataset.minimized == "1"
        this.itemDetailSettings.right.showTopConceptsInScheme = this.conceptTreeRight != null && this.conceptTreeRight.$el.dataset.minimized == "1"
      }
    },
    /**
     * Completely clears the concept scheme browser on one side
     */
    clear(isLeft) {
      if (isLeft) {
        this.setSelected("scheme", true, null)
      } else {
        this.setSelected("scheme", false, null)
      }
    },
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
