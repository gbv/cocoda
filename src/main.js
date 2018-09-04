import Vue from "vue"
import store from "./store"
import { mapActions, mapMutations } from "vuex"

Vue.config.productionTip = false

import _ from "lodash"

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

// Add jskos-tools, use with this.$jskos in components
import jskos from "jskos-tools"
Vue.prototype.$jskos = jskos

// Add fontawesome
// TODO: - Only import individual items, e.g.
// import { faSpinner } from '@fortawesome/free-solid-svg-icons'
// library.add(faSpinner)
import { library } from "@fortawesome/fontawesome-svg-core"
import { fas } from "@fortawesome/free-solid-svg-icons"
import { fab } from "@fortawesome/free-brands-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
library.add(fas)
library.add(fab)
Vue.component("font-awesome-icon", FontAwesomeIcon)

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
    setSelected(kind, isLeft, value, noQueryRefresh = false) {
      // Apply logic to selecting concepts (see discussion in #118).
      if (kind == "concept" && value != null) {
        let conceptScheme = this.$store.getters["objects/get"]({ uri: _.get(value, "inScheme[0].uri") })
        if (this.selected.scheme[isLeft] == null || this.$jskos.compare(this.selected.scheme[isLeft], conceptScheme)) {
          // If the scheme on the same side is null or the same as the concept's scheme, don't change anything.
        } else if (this.$jskos.compare(this.selected.scheme[!isLeft], conceptScheme)) {
          // Else, if the scheme on the other side matches the concept's scheme, change sides to that.
          isLeft = !isLeft
        } else {
          // Else, don't change side, but also open the concept's scheme on that side.
          this.$store.commit({
            type: "selected/set",
            kind: "both",
            isLeft,
            scheme: conceptScheme,
            concept: value,
            noQueryRefresh
          })
          return
        }
      }
      if (value) {
        this.$store.commit({
          type: "selected/set",
          kind,
          isLeft,
          value,
          noQueryRefresh
        })
      } else {
        this.$store.commit({
          type: "selected/clear",
          kind,
          isLeft,
          noQueryRefresh
        })
      }
    },
    getRouterUrl(object, isLeft) {
      let query = _.cloneDeep(this.$route.query)
      let fromTo = isLeft ? "from" : "to"
      if (jskos.isScheme(object) || !object.inScheme) {
      // Consider object a scheme
        query[fromTo] = ""
        query[fromTo + "Scheme"] = object.uri
      } else {
      // Consider object a concept
        let conceptScheme = this.$store.getters["objects/get"]({ uri: _.get(object, "inScheme[0].uri") })
        if (this.selected.scheme[isLeft] == null || this.$jskos.compare(this.selected.scheme[isLeft], conceptScheme)) {
        // If the scheme on the same side is null or the same as the concept's scheme, don't change anything.
        } else if (this.$jskos.compare(this.selected.scheme[!isLeft], conceptScheme)) {
        // Else, if the scheme on the other side matches the concept's scheme, change sides to that.
          fromTo = fromTo == "from" ? "to" : "from"
        }
        query[fromTo + "Scheme"] = _.get(object, "inScheme[0].uri")
        query[fromTo] = object.uri
      }
      // Build URL
      let url = "/?"
      _.forOwn(query, (value, key) => {
        url += `${key}=${encodeURIComponent(value)}&`
      })
      return url.substring(0, url.length - 1)
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
    },
    $settings() {
      return this.$store.state.settings.settings
    },
    hoveredConcept: {
      get() {
        return this.$store.state.hoveredConcept
      },
      set(concept) {
        this.$store.commit({
          type: "setHoveredConcept",
          concept
        })
      }
    },
    hoveredMapping: {
      get() {
        return this.$store.state.hoveredMapping
      },
      set(mapping) {
        this.$store.commit({
          type: "setHoveredMapping",
          mapping
        })
      }
    },
  },
  methods: {
    /**
     * Sets the ISOPEN value for a concept on a specific side.
     *
     * @param {object} concept
     * @param {boolean} isLeft
     * @param {boolean} isOpen
     */
    open(concept, isLeft, isOpen) {
      if (!concept) return
      let open = Object.assign({}, concept.ISOPEN)
      open[isLeft] = isOpen
      this.$store.commit({
        type: "objects/set",
        object: concept,
        prop: "ISOPEN",
        value: open
      })
    }
  }
})
