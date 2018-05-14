<template>
  <div id="app">
    <navbar />
    <div class="main">
      <div class="flexbox-row">
        <browser />
        <mapping />
        <browser />
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from './components/Navbar'
import Browser from './components/Browser'
import Mapping from './components/Mapping'

export default {
  name: 'App',
  components: {
    Navbar, Browser, Mapping
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
  margin: 10px 6px 2px 6px;
  padding: 10px 0px 12px 0px;
  /* outline: 2px solid #ccc;
  outline-offset: -5px;
  -moz-outline-radius: 9px;
  -webkit-outline-radius: 9px; */
 }

/* Overwrite the default to keep the scrollbar always visible */
::-webkit-scrollbar {
    -webkit-appearance: none;
    width: 9px;
}
::-webkit-scrollbar-thumb {
    box-shadow: inset 0 0 5px 5px #AEAEAE;
    border: solid 1px transparent;
    border-radius: 6px;
}
</style>
