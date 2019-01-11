import Vue from "vue"
import store from "./store"
import { mapActions, mapMutations } from "vuex"

Vue.config.productionTip = false

import _ from "lodash"

// Import BootstrapVue
import BootstrapVue from "bootstrap-vue"
Vue.use(BootstrapVue)
// Note: bootstrap css files are imported only for the app.js entry point.
// mappingsApp imports the files directly in mappings.html.

// Add vue-scrollto
var VueScrollTo = require("vue-scrollto")
Vue.use(VueScrollTo)

// Initialize store
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
    getRouterUrl(object, isLeft, forceSide = false) {
      let query = _.cloneDeep(this.$route.query)
      let fromTo = isLeft ? "from" : "to"
      if (!object) {
        // If null, clear side
        delete query[fromTo]
        delete query[fromTo + "Scheme"]
      } else if (jskos.isScheme(object) || !object.inScheme) {
        // Consider object a scheme
        delete query[fromTo]
        query[fromTo + "Scheme"] = object.uri
      } else {
      // Consider object a concept
        let conceptScheme = this.$store.getters["objects/get"]({ uri: _.get(object, "inScheme[0].uri") })
        if (forceSide || this.selected.scheme[isLeft] == null || this.$jskos.compare(this.selected.scheme[isLeft], conceptScheme)) {
        // If the scheme on the same side is null or the same as the concept's scheme, don't change anything.
        } else if (this.$jskos.compare(this.selected.scheme[!isLeft], conceptScheme) || this.selected.scheme[!isLeft] == null) {
        // Else, if the scheme on the other side matches the concept's scheme, change sides to that.
          fromTo = fromTo == "from" ? "to" : "from"
        }
        query[fromTo + "Scheme"] = _.get(object, "inScheme[0].uri")
        query[fromTo] = object.uri
      }
      // Build URL
      let url = "?"
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
      loadObjectDetails: "objects/details",
      setSelected: "selected/set",
    }),
    addToMapping(params) {
      params.type = "mapping/add"
      params.cardinality = this.$settings.mappingCardinality
      this.$store.commit(params)
    }
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

// Global mixin for copy to clipboard
Vue.mixin({
  methods: {
    /**
     * Tries to copy the content of an element to the clipboard.
     *
     * @param {*} elementOrId - DOM element or ID of DOM element
     */
    copyToClipboard(elementOrId) {
      let element
      if (_.isString(elementOrId)) {
        element = document.getElementById(elementOrId)
      } else {
        element = elementOrId
      }
      try {
        window.getSelection().removeAllRanges()
        this.$util.selectText(element)
        _.delay(() => {
          let successful = document.execCommand("copy")
          if (!successful) {
            console.warn("Copy to clipboard failed.")
          }
          window.getSelection().removeAllRanges()
        }, 50)
      } catch(error) {
        console.warn("Copy to clipboard failed.")
      }
    }
  }
})

import FileSaver from "file-saver"

Vue.mixin({
  computed: {
    config() {
      return this.$store.state.config
    },
    $settings() {
      return this.$store.state.settings.settings
    },
    locale() {
      return this.$i18n.locale
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
    draggedConcept: {
      get() {
        return this.$store.state.draggedConcept
      },
      set(concept) {
        this.$store.commit({
          type: "setDraggedConcept",
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
     * Sets the __ISOPEN__ value for a concept on a specific side.
     *
     * @param {object} concept
     * @param {boolean} isLeft
     * @param {boolean} isOpen
     */
    open(concept, isLeft, isOpen) {
      if (!concept) return
      let open = Object.assign({}, concept.__ISOPEN__)
      open[isLeft] = isOpen
      this.$store.commit({
        type: "objects/set",
        object: concept,
        prop: "__ISOPEN__",
        value: open
      })
    },
    /**
     * Uses the mouse position to determine whether it is hovering over an element.
     */
    isMouseOver(element) {
      if (!element) {
        element = this.$el
      }
      let { x, y } = this.$store.state.mousePosition
      let rect = element.getBoundingClientRect()
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    },
    downloadFile(filename, contents) {
      var blob = new Blob([contents], {type: "text/plain;charset=utf-8"})
      FileSaver.saveAs(blob, filename)
    },
  }
})

// Keyboard shortcut mixin
Vue.mixin({
  data() {
    return {
      hotkeys: [],
    }
  },
  methods: {
    enableHotkeys() {
      document.addEventListener("keydown", this.hotkeyHandler)
    },
    disableHotkeys() {
      document.removeEventListener("keydown", this.hotkeyHandler)
    },
    hotkeyHandler(event) {
      let shortcut = _.pick(event, ["key", "metaKey", "ctrlKey", "altKey", "shiftKey"])
      let pass = true
      for (let sc of this.hotkeys) {
        if (_.isEqual(shortcut, sc.shortcut)) {
          pass = sc.handler() && pass
        }
      }
      if (!pass) {
        event.stopPropagation()
        event.preventDefault()
        event.returnValue = false
        event.cancelBubble = true
      }
    },
    addHotkey(shortcuts, handler) {
      shortcuts = shortcuts.split(",")
      for (let sc of shortcuts) {
        let keys = sc.split("+")
        let key = null
        let metaKey = false
        let ctrlKey = false
        let altKey = false
        let shiftKey = false
        for (let k of keys) {
          if (k == "ctrl") {
            ctrlKey = true
          } else if (k == "alt" || k == "options") {
            altKey = true
          } else if (k == "meta" || k == "command") {
            metaKey = true
          } else if (k == "shift") {
            shiftKey = true
          } else {
            key = k
          }
        }
        this.hotkeys.push({
          handler,
          shortcut: {
            key, metaKey, ctrlKey, altKey, shiftKey
          }
        })
      }
    },
  },
})
