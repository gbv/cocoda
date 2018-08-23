import Vue from "vue"
import MappingsApp from "../MappingsApp"
import store from "../store"
import router from "../router"
require("../main")

new Vue({
  el: "#mappingsApp",
  store,
  router,
  components: { MappingsApp },
  template: "<MappingsApp/>",
})
