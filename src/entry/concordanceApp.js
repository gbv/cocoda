import Vue from "vue"
import ConcordanceApp from "../ConcordanceApp"
import store from "../store"
import router from "../router"
import i18n from "../util/i18n"

require("../main")
import "bootstrap/dist/css/bootstrap.css"
import "bootstrap-vue/dist/bootstrap-vue.css"

new Vue({
  el: "#concordanceApp",
  store,
  router,
  components: { ConcordanceApp },
  template: "<ConcordanceApp/>",
  i18n,
})
