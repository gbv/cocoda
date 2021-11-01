import { createApp, h } from "@/composition-api"
import App from "../App.vue"
import store from "../store/index.js"
import router from "../router.js"
import i18n from "../utils/i18n.js"

import "bootstrap/dist/css/bootstrap.css"
import "bootstrap-vue/dist/bootstrap-vue.css"

const app = createApp({
  store,
  router,
  i18n,
  render: () => h(App),
})

import { supplementApp } from "../main.js"
supplementApp(app)

app.mount("#app")
