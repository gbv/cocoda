import Vue from "vue"
import App from "../App"
import store from "../store"
import router from "../router"
require("../main")

new Vue({
  el: "#app",
  store,
  router,
  components: { App },
  template: "<App/>",
})
