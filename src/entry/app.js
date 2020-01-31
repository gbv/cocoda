import Vue from "vue"
import App from "../App"
import store from "../store"
import router from "../router"
import i18n from "../utils/i18n"

require("../main")
import "bootstrap/dist/css/bootstrap.css"
import "bootstrap-vue/dist/bootstrap-vue.css"

new Vue({
  el: "#app",
  store,
  router,
  components: { App },
  template: "<App/>",
  i18n,
})
