import { createI18n } from "vue-i18n"
import messages from "@/../config/locale.json"

const i18n = createI18n({
  // Legacy mode keeps $t/$tc/$te and, most importantly, writing to
  // `this.$i18n.locale` - which TheSettings binds to directly via v-model.
  // Deprecated in vue-i18n 11; moving to the composition API is follow-up work.
  legacy: true,
  globalInjection: true,
  locale: "en",
  fallbackLocale: "en",
  // Silence fallback warnings outside of development.
  fallbackWarn: import.meta.env.DEV,
  missingWarn: import.meta.env.DEV,
  messages,
})

/**
 * Translate outside of a component.
 *
 * Modules that are not components used to call `i18n.t(...)` directly. In
 * vue-i18n 9+ the exported instance holds its API under `.global`, so this
 * forwards to it and keeps call sites readable.
 */
export const t = (...args) => i18n.global.t(...args)

export default i18n
