<template>
  <div
    id="app"
    class="text-dark color-primary-0-bg">
    <the-navbar />
    <div class="main">
      <div class="flexbox-row">
        <concept-scheme-browser
          ref="mainElement0"
          :flex="flex[0]" />
        <div
          ref="resizeSlider0"
          class="resizeSlider"
          @mousedown="sliderStarted($event, 0)" />
        <mapping-browser
          ref="mainElement1"
          :flex="flex[1]" />
        <div
          ref="resizeSlider1"
          class="resizeSlider"
          @mousedown="sliderStarted($event, 1)" />
        <concept-scheme-browser
          ref="mainElement2"
          :flex="flex[2]" />
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
  },
  data () {
    return {
      flex: [1.0, 2.0, 1.0]
    }
  },
  mounted() {
    let newFlex = []
    for (let index = 0; index < this.flex.length; index += 1) {
      let el = this.$refs["mainElement" + index].$el
      newFlex.push(el.offsetWidth)
    }
    this.flex = newFlex
  },
  methods: {
    sliderStarted(event, index) {
      let vm = this
      let startX = event.clientX
      document.body.style.cursor = "col-resize"
      function onMouseMove(event) {
        let moved = event.clientX - startX
        let newFlexLeft = vm.flex[index] + moved
        let newFlexRight = vm.flex[index+1] - moved
        let flexSum = vm.flex.reduce(function(total, num) {
          return total + num
        })
        if (newFlexLeft / flexSum < 0.2 || newFlexRight / flexSum < 0.2) {
          console.log("don't change size")
        } else {
          startX = event.clientX
          vm.$set(vm.flex, index, newFlexLeft)
          vm.$set(vm.flex, index+1, newFlexRight)
        }
      }
      document.addEventListener("mousemove", onMouseMove)
      document.onmouseup = function() {
        document.removeEventListener("mousemove", onMouseMove)
        document.onmouseup = null
        document.body.style.cursor = "default"
      }
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

.resizeSlider {
  flex: 0 1 5px;
  // background-color: lighten(@color-primary-1, 15%);
  cursor: col-resize;
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
