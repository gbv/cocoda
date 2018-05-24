import Vue from "vue"
import App from "./App"

Vue.config.productionTip = false

// Import BootstrapVue and associated files
import BootstrapVue from "bootstrap-vue"
Vue.use(BootstrapVue)
import "bootstrap/dist/css/bootstrap.css"
import "bootstrap-vue/dist/bootstrap-vue.css"

// Add vue-scrollto
var VueScrollTo = require("vue-scrollto")
Vue.use(VueScrollTo)

// Add api, use with this.$api in components
import * as api from "./api"
Vue.prototype.$api = api

new Vue({
  el: "#app",
  components: { App },
  template: "<App/>"
})
