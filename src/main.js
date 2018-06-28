import Vue from "vue"
import App from "./App"

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

// Add config, use with this.$config in components
import config from "./config"
Vue.prototype.$config = config

// Add util, use with this.$util in components
import util from "./util"
Vue.prototype.$util = util

var _ = require("lodash")

// Add fontawesome
// TODO: - Only import individual items, e.g.
// import faSpinner from '@fortawesome/fontawesome-free-solid/faSpinner'
// fontawesome.library.add(faSpinner)
import fontawesome from "@fortawesome/fontawesome"
import solid from "@fortawesome/fontawesome-free-solid"
import brands from "@fortawesome/fontawesome-free-brands"
fontawesome.library.add(solid)
fontawesome.library.add(brands)

// Global mixin for choosing a concept by uri (emits the chooseUri event)
Vue.mixin({
  methods: {
    chooseUri(concept, isLeft = true) {
      /**
       * Event when the user has chosen a result.
       *
       * @event chooseUri
       * @type {string} - uri that is chosen
       */
      this.$emit("chooseUri", concept, isLeft)
    },
    toggleMinimize() {
      for (let child of this.$children) {
        child.toggleMinimize()
      }
    }
  }
})

new Vue({
  el: "#app",
  components: { App },
  data: {
    hoveredConcept: null,
    mapping: {
      // TODO: - Differenciate between AND (memberSet) and OR (memberChoice) in jskos.to
      add(concept, scheme, isLeft=true) {
        if (this.checkScheme(scheme, isLeft)) {
          this.jskos[this._fromToScheme(isLeft)] = scheme
        } else {
          return false
        }
        if (this.added(concept, isLeft)) {
          return false
        }
        let fromTo = this._fromTo(isLeft)
        if (fromTo == "from" && this.jskos.from.memberSet.length != 0) {
          this.jskos.from.memberSet = [concept]
          return true
        }
        this.jskos[fromTo].memberSet.push(concept)
        return true
      },
      canAdd(concept, scheme, isLeft=true) {
        if(!this.checkScheme(scheme, isLeft)) {
          return false
        }
        if(concept == null) {
          return false
        }
        if(this.added(concept, isLeft)) {
          return false
        }
        return true
      },
      remove(concept, isLeft=true) {
        let fromTo = this._fromTo(isLeft)
        let indexConcept = _.findIndex(this.jskos[fromTo].memberSet, function(c) {
          return c.uri == concept.uri
        })
        if (indexConcept == -1) {
          return false
        }
        this.jskos[fromTo].memberSet.splice(indexConcept, 1)
        if (this.jskos[fromTo].memberSet.length == 0) {
          this.jskos[this._fromToScheme(isLeft)] = null
        }
        return true
      },
      removeAll(isLeft) {
        let fromTo = this._fromTo(isLeft)
        this.jskos[fromTo].memberSet = []
        this.jskos[this._fromToScheme(isLeft)] = null
      },
      added(concept, isLeft=true) {
        let fromTo = this._fromTo(isLeft)
        let indexConcept = _.findIndex(this.jskos[fromTo].memberSet, function(c) {
          return c.uri == concept.uri
        })
        if (indexConcept == -1) {
          return false
        } else {
          return true
        }
      },
      checkScheme(scheme, isLeft=true) {
        let actualScheme = this.getScheme(isLeft)
        return actualScheme == null ? true : util.compareSchemes(actualScheme, scheme)
      },
      getConcepts(isLeft) {
        return this.jskos[this._fromTo(isLeft)].memberSet
      },
      getScheme(isLeft) {
        return this.jskos[this._fromToScheme(isLeft)]
      },
      reverse() {
        if (!this.reversible()) {
          return false
        }
        this.reversed = !this.reversed;
        [this.jskos.to, this.jskos.from] = [this.jskos.from, this.jskos.to];
        [this.jskos.toScheme, this.jskos.fromScheme] = [this.jskos.fromScheme, this.jskos.toScheme]
        return true
      },
      reversible() {
        return this.jskos.to.memberSet.length <= 1
      },
      _fromTo(isLeft=true) {
        if (isLeft ? !this.reversed : this.reversed) {
          return "from"
        } else {
          return "to"
        }
      },
      _fromToScheme(isLeft=true) {
        return this._fromTo(isLeft) + "Scheme"
      },
      jskos: {
        from: { "memberSet": [] },
        to: { "memberSet": [] },
        fromScheme: null,
        toScheme: null,
        type: [util.defaultMappingType.uri]
      },
      reversed: false
    },
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
    alert(text, variant = "danger") {
      this.alerts.push({
        text: text,
        variant: variant
      })
    }
  },
  template: "<App/>",
})
