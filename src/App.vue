<template>
  <div
    id="app"
    class="text-dark color-primary-0-bg">
    <the-navbar />
    <div class="main">
      <div class="flexbox-row">
        <concept-scheme-browser />
        <mapping-browser />
        <concept-scheme-browser />
      </div>
    </div>
  </div>
</template>

<script>
import TheNavbar from "./components/TheNavbar"
import ConceptSchemeBrowser from "./components/ConceptSchemeBrowser"
import MappingBrowser from "./components/MappingBrowser"

/**
 * The main application.
 */
export default {
  name: "App",
  components: {
    TheNavbar, ConceptSchemeBrowser, MappingBrowser
  }
}
</script>

<style>
html, body {
  height: 100%;
  margin: 0;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
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
  margin: 0px 4px 0px 4px;
  padding: 4px 0px 0px 0px;
 }

/* Define color scheme for text and background color */
.color-primary-0 { color: hsl(216, 42%, 99%) }
.color-primary-1 { color: hsl(216, 42%, 94%) }
.color-primary-2 { color: hsl(216, 42%, 84%) }
.color-primary-3 { color: hsl(216, 42%, 74%) }
.color-primary-4 { color: hsl(216, 42%, 64%) }
.color-primary-base, .color-primary-5 { color: hsl(216, 42%, 54%) }	/* Main Primary color */
.color-primary-6 { color: hsl(216, 42%, 44%) }
.color-primary-7 { color: hsl(216, 42%, 34%) }
.color-primary-8 { color: hsl(216, 42%, 24%) }
.color-primary-9 { color: hsl(216, 42%, 14%) }
.text-dark { color: hsl(0, 0%, 13%) }
.text-grey { color: hsl(0, 0%, 29%) }
.text-light-grey { color: hsl(0, 0%, 45%) }
.font-normal { font-weight: 400 }
.font-heavy { font-weight: 700 }
.color-primary-0-bg { background-color: hsl(216, 42%, 99%) }
.color-primary-1-bg { background-color: hsl(216, 42%, 94%) }
.color-primary-2-bg { background-color: hsl(216, 42%, 84%) }
.color-primary-3-bg { background-color: hsl(216, 42%, 74%) }
.color-primary-4-bg { background-color: hsl(216, 42%, 64%) }
.color-primary-base-bg, .color-primary-5-bg { background-color: hsl(216, 42%, 54%) }	/* Main Primary color */
.color-primary-6-bg { background-color: hsl(216, 42%, 44%) }
.color-primary-7-bg { background-color: hsl(216, 42%, 34%) }
.color-primary-8-bg { background-color: hsl(216, 42%, 24%) }
.color-primary-9-bg { background-color: hsl(216, 42%, 14%) }

/* Define appearance of main components (boxes) */
.main-component {
  box-shadow: 0 2px 4px 0 hsla(0, 0%, 0%, 0.2);
  background-color: #ffffff;
  margin: 2px;
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
