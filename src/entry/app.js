import Vue from "vue"
import App from "../App"
import store from "../store"
import router from "../router"

require("../main")
import "bootstrap/dist/css/bootstrap.css"
import "bootstrap-vue/dist/bootstrap-vue.css"

new Vue({
  el: "#app",
  store,
  router,
  components: { App },
  template: "<App/>",
})
