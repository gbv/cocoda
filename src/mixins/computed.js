/**
 * Mixin for some computed values from Vuex store.
 */

export default {
  computed: {
    selected() {
      return this.$store.state.selected
    },
    config() {
      return this.$store.state.config
    },
    $settings() {
      return this.$store.state.settings.settings
    },
    settingsLoaded() {
      return this.$store.state.settings.loaded
    },
    configLoaded() {
      return this.$store.state.configLoaded
    },
    componentName() {
      return this.$options.name
    },
    componentSettings() {
      if (!this.settingsLoaded) {
        return {}
      }
      return (this.$settings.components && this.$settings.components[this.componentName]) || {}
    },
    loadingGlobal: {
      get() {
        return this.$store.state.loading
      },
      set(value) {
        this.$store.commit({
          type: "setLoading",
          value,
        })
      },
    },
    locale() {
      return this.$i18n.locale
    },
    languages() {
      return this.$store.getters.languages
    },
  },
}
