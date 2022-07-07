import Vue from "vue"
import VueI18n from "vue-i18n"

Vue.use(VueI18n)
import messages from "@/../config/locale.json"


const i18n = new VueI18n({
  locale: "en",
  fallbackLocale: "en",
  // Silent fallback warnings when not using dev server
  silentFallbackWarn: !window.webpackHotUpdate,
  messages,
})

export default i18n
