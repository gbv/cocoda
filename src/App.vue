<template>
  <div
    id="app"
    class="text-dark color-primary-0-bg">
    <the-navbar />
    <div class="main">
      <div class="flexbox-row">
        <concept-scheme-browser
          ref="mainElement0"
          :flex="flexes[0]"
          data-direction="column" />
        <div
          ref="resizeSlider0"
          class="resizeSliderCol"
          @mousedown="startResizing($event, 0)" />
        <mapping-browser
          ref="mainElement1"
          :flex="flexes[1]"
          data-direction="column" />
        <div
          ref="resizeSlider1"
          class="resizeSliderCol"
          @mousedown="startResizing($event, 1)" />
        <concept-scheme-browser
          ref="mainElement2"
          :flex="flexes[2]"
          data-direction="column" />
      </div>
    </div>
  </div>
</template>

<script>
import TheNavbar from "./components/TheNavbar"
import ConceptSchemeBrowser from "./components/ConceptSchemeBrowser"
import MappingBrowser from "./components/MappingBrowser"
import * as mixins from "./mixins"

/**
 * The main application.
 */
export default {
  name: "App",
  components: {
    TheNavbar, ConceptSchemeBrowser, MappingBrowser
  },
  mixins: [mixins.resizingMixin],
  data () {
    return {
      flexes: [1.0, 2.0, 1.0]
    }
  }
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
  min-height: 500px;
}
.main {
  flex: 1;
  position: relative;
}
.flexbox-row {
  display: flex;
  position: absolute;
  height: 100%;
  width: 100%;
}
.flexbox-row > div {
  margin: 0px 0px 0px 0px;
  padding: 4px 0px 0px 0px;
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
