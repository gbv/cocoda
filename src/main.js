import Vue from "vue"
import App from "./App"
import store from "./store"
import { mapActions, mapMutations } from "vuex"

Vue.config.productionTip = false

// Import BootstrapVue and associated files
import BootstrapVue from "bootstrap-vue"
Vue.use(BootstrapVue)
import "bootstrap/dist/css/bootstrap.css"
import "bootstrap-vue/dist/bootstrap-vue.css"

// Add vue-scrollto
var VueScrollTo = require("vue-scrollto")
Vue.use(VueScrollTo)

// Add api, use with this.$api in components
import api from "./api"
Vue.prototype.$api = api
// Initialize api
store.dispatch("init")

// Add util, use with this.$util in components
import util from "./util"
Vue.prototype.$util = util

// Add fontawesome
// TODO: - Only import individual items, e.g.
// import faSpinner from '@fortawesome/fontawesome-free-solid/faSpinner'
// fontawesome.library.add(faSpinner)
import fontawesome from "@fortawesome/fontawesome"
import solid from "@fortawesome/fontawesome-free-solid"
import brands from "@fortawesome/fontawesome-free-brands"
fontawesome.library.add(solid)
fontawesome.library.add(brands)

Vue.mixin({
  methods: {
    toggleMinimize() {
      for (let child of this.$children) {
        child.toggleMinimize()
      }
    },
    refresh(key) {
      this.$parent && this.$parent.refresh(key)
    }
  }
})

// Global mixin for selected schemes/concepts
Vue.mixin({
  computed: {
    selected() {
      return this.$store.state.selected
    }
  },
  methods: {
    setSelected(kind, isLeft, value) {
      if (value) {
        this.$store.commit({
          type: "selected/set",
          kind,
          isLeft,
          value
        })
      } else {
        this.$store.commit({
          type: "selected/clear",
          kind,
          isLeft
        })
      }
    }
  }
})

// Global mixin for object actions
Vue.mixin({
  methods: {
    ...mapMutations({
      saveObject: "objects/save",
    }),
    ...mapActions({
      getObject: "objects/load",
      loadTop: "objects/top",
      loadNarrower: "objects/narrower",
      loadAncestors: "objects/ancestors",
      loadObjectDetails: "objects/details"
    })
  }
})

// Global mixin for Vuex alerts
Vue.mixin({
  methods: {
    /**
     * Shows a bootstrap alert.
     *
     * @param {*} text - text to be shown
     * @param {*} countdown - countdown seconds, 0 for no countdown
     * @param {*} variant - a bootstrap variant, e.g. "danger", "warning", ...
     */
    alert(text, countdown, variant) {
      this.$store.commit({
        type: "alerts/add",
        text,
        countdown,
        variant
      })
    }
  }
})

Vue.mixin({
  computed: {
    config() {
      return this.$store.state.config
    }
  }
})

new Vue({
  el: "#app",
  store,
  components: { App },
  data: {
    hoveredConcept: null,
    alerts: []
  },
  template: "<App/>",
})
