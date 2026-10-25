import { createApp } from "vue"
import App from "@/App.vue"
import store from "@/store/index.js"
import router from "@/router.js"
import i18n from "@/utils/i18n.js"

import "bootstrap/dist/css/bootstrap.css"
import "bootstrap-vue-next/dist/bootstrap-vue-next.css"
import "@/style/bootstrap-reboot-overrides.css"

import { installCocoda } from "@/main.js"

const app = createApp(App)
installCocoda(app)
app.use(store).use(router).use(i18n)
// vue-router 4 resolves the initial route asynchronously. The app reads
// $route.query while starting up (config parameter, selected scheme and
// concept), so mounting before that is settled loses the deep link.
router.isReady().then(() => app.mount("#cocoda"))
