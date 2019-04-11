import Vue from "vue"

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
import { faStar, faPlusCircle, faExchangeAlt, faThumbsUp, faThumbsDown, faAngleDown, faAngleRight, faAngleLeft, faLevelUpAlt, faLevelDownAlt, faEllipsisV, faEllipsisH, faSortUp, faTimesCircle, faLink, faIdCard, faUser, faSearch, faFilter, faCode, faCog, faDownload, faCaretDown, faInfoCircle, faComment, faEdit, faSave, faTrashAlt, faBan, faWindowMinimize, faPlusSquare, faCheck, faLock, faLockOpen, faExternalLinkSquareAlt, faLongArrowAltDown, faLongArrowAltUp, faExternalLinkAlt, faPuzzlePiece, faExclamation } from "@fortawesome/free-solid-svg-icons"
import { faGithub } from "@fortawesome/free-brands-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
library.add(faStar)
library.add(faPlusCircle)
library.add(faExchangeAlt)
library.add(faThumbsUp)
library.add(faThumbsDown)
library.add(faAngleDown)
library.add(faAngleRight)
library.add(faAngleLeft)
library.add(faLevelUpAlt)
library.add(faLevelDownAlt)
library.add(faEllipsisV)
library.add(faEllipsisH)
library.add(faSortUp)
library.add(faTimesCircle)
library.add(faLink)
library.add(faIdCard)
library.add(faUser)
library.add(faSearch)
library.add(faFilter)
library.add(faCode)
library.add(faCog)
library.add(faDownload)
library.add(faCaretDown)
library.add(faInfoCircle)
library.add(faComment)
library.add(faEdit)
library.add(faSave)
library.add(faTrashAlt)
library.add(faBan)
library.add(faWindowMinimize)
library.add(faPlusSquare)
library.add(faCheck)
library.add(faLock)
library.add(faLockOpen)
library.add(faExternalLinkSquareAlt)
library.add(faLongArrowAltDown)
library.add(faLongArrowAltUp)
library.add(faExternalLinkAlt)
library.add(faGithub)
library.add(faPuzzlePiece)
library.add(faExclamation)
Vue.component("font-awesome-icon", FontAwesomeIcon)

// Add objects mixin
import globalMixins from "./mixins/global"
Vue.mixin(globalMixins)

// Add hotkey mixin
import hotkeys from "./mixins/hotkeys"
Vue.mixin(hotkeys)

// Add drag and drop mixin
import draganddrop from "./mixins/dragandrop"
Vue.mixin(draganddrop)

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
        let conceptScheme = _.get(object, "inScheme[0]")
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
    setSelected({ concept, scheme, isLeft, noQueryRefresh = false } = {}) {
      let loadTypes = scheme => {
        if (scheme) {
          this.loadTypes(scheme)
        }
      }
      let loadingId = this.$util.generateID()
      this.$store.commit({
        type: "selected/setLoadingId",
        isLeft,
        loadingId,
      })
      scheme = _.get(concept, "inScheme[0]") || scheme
      // Check if concept and scheme is already selected
      if (jskos.compare(concept, this.selected.concept[isLeft]) && jskos.compare(scheme, this.selected.scheme[isLeft])) {
        return Promise.resolve(true)
      }
      if (scheme && !concept) {
        let kind = "both"
        if (scheme) {
          this.$store.commit({
            type: "selected/set",
            kind,
            isLeft,
            scheme,
            concept: null,
            noQueryRefresh,
          })
          // Load types for scheme
          loadTypes(scheme)
          // Load top concepts for scheme
          return this.loadTop(scheme).then(() => true)
        } else {
          console.error("setSelected: could not find scheme in store.")
          return Promise.resolve(false)
        }
      } else if (concept) {
        let kind = "concept"
        if (!scheme) {
          console.error("setSelected: could not find scheme for concept in store.")
          return Promise.resolve(false)
        }
        if (!concept) {
          // This case should not happen!
          console.error("setSelected: critical error when getting/saving concept from store.")
          return Promise.resolve(false)
        }
        let promises = []
        // Check if scheme is different from selected scheme, if not change
        if (!jskos.compare(scheme, this.selected.scheme[isLeft])) {
          kind = "both"
          // Load top concepts for scheme
          promises.push(this.loadTop(scheme))
        }
        // Load details
        promises.push(this.loadDetails(concept))
        // Load narrower concepts
        promises.push(this.loadNarrower(concept))
        // Load ancestor concepts and their narrower concepts
        promises.push(this.loadAncestors(concept))

        return Promise.all(promises).then(() => {
          // Load types for scheme
          loadTypes(scheme)
          // Asynchronously load its ancestors narrower concepts
          if (concept && concept.ancestors) {
            for (let ancestor of concept.ancestors) {
              this.loadNarrower(ancestor)
            }
          }
          // Asynchronously load information about its broader concepts
          if (concept && concept.broader && !concept.__BROADERLOADED__) {
            let broaderPromises = []
            this.adjustConcept(concept)
            for (let broader of concept.broader.filter(concept => concept != null)) {
              this.loadDetails(broader, { scheme })
            }
            Promise.all(broaderPromises).then(() => {
              // TODO: Is adjustment necessary?
              this.adjustConcept(concept)
              this.$set(concept, "__BROADERLOADED__", true)
            })
          }
          // TODO
          // Only select if loadingId matches on the same side
          if (loadingId == this.$store.state.selected.loadingId[isLeft]) {
            this.$store.commit({
              type: "selected/set",
              kind,
              isLeft,
              concept,
              scheme,
              value: concept,
              noQueryRefresh,
            })
            return true
          } else {
            return false
          }
        })
      } else if (isLeft != null) {
        this.$store.commit({
          type: "selected/clear",
          kind: "scheme",
          isLeft,
          noQueryRefresh,
        })
      } else {
        console.error("setSelected: called with no valid concept or scheme.")
        return Promise.resolve(false)
      }
    },
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
    loadingGlobal: {
      get() {
        return this.$store.state.loading
      },
      set(value) {
        this.$store.commit({
          type: "setLoading",
          value
        })
      }
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
      this.$set(concept, "__ISOPEN__", open)
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
