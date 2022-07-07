import Vue from "vue"
import App from "@/App.vue"
import store from "@/store/index.js"
import router from "@/router.js"
import i18n from "@/utils/i18n.js"

import "bootstrap/dist/css/bootstrap.css"
import "bootstrap-vue/dist/bootstrap-vue.css"

import "@/main.js"

new Vue({
  store,
  router,
  i18n,
  render: (h) => h(App),
}).$mount("#app")
