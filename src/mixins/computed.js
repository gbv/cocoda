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
  },
}
