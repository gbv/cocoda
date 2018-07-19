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
api.init()

// Add config, use with this.$config in components
import config from "./config"
Vue.prototype.$config = config

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

new Vue({
  el: "#app",
  store,
  components: { App },
  data: {
    hoveredConcept: null,
    alerts: []
  },
  methods: {
    /**
     * Shows a bootstrap alert with text and variant.
     * Usage from any component: this.$root.alert(text, variant)
     *
     * This is actually shown by App.vue, so it has to implement the respective HTML and CSS for this.
     *
     * @param {string} text
     * @param {string} variant
     */
    alert({ text, variant = "danger", countdown = 5 }) {
      let shouldCountdown = true
      if (countdown == -1 || countdown == null) {
        shouldCountdown = false
      }
      let alert = {
        text,
        variant,
        countdown,
        maxCountdown: countdown,
        shouldCountdown,
        countdownChanged: function(countdown) {
          this.countdown = countdown
        }
      }
      this.alerts.push(alert)
    }
  },
  template: "<App/>",
})
