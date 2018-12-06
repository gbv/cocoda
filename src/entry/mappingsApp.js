import Vue from "vue"
import MappingsApp from "../MappingsApp"
import store from "../store"
import router from "../router"
import i18n from "../util/i18n"
require("../main")

new Vue({
  el: "#mappingsApp",
  store,
  router,
  components: { MappingsApp },
  template: "<MappingsApp/>",
  i18n,
})
