<template>
  <div id="app">
    <navbar />
    <b-container fluid class="bv-example-row">
      <b-row class="text-left">
        <b-col is="browser" />
        <b-col is="mapping" />
        <b-col is="browser" />
      </b-row>
    </b-container>
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
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 0px;
}
.container-fluid {
  /* TODO: - How much width do we need? */
  min-width: 1200px;
}
.row > div {
    margin-top:20px;
    padding: 20px;
    outline: 2px solid #ccc;
    outline-offset: -5px;
    -moz-outline-radius: 9px;
    -webkit-outline-radius: 9px;
    /* TODO: - Is this good practice? */
    min-height: 500px;
 }
</style>
