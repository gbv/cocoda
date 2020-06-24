/**
 * Global mixin for helper functions.
 */

import _ from "lodash"
import FileSaver from "file-saver"
import jskos from "jskos-tools"

export default {
  data() {
    return {
      // TODO: Solve differently!
      defaults: {
        "delay": {
          "short": { "show": 250, "hide": 0 },
          "medium": { "show": 500, "hide": 0 },
          "long": { "show": 1000, "hide": 0 },
        },
        "licenseBadges": {
          "http://creativecommons.org/publicdomain/zero/1.0/": "https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/cc-zero.svg",
          "http://creativecommons.org/licenses/by/3.0/": "https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by.svg",
          "http://creativecommons.org/licenses/by-nc-nd/3.0/": "https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by-nc-nd.svg",
          "http://creativecommons.org/licenses/by-nc-nd/4.0/": "https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by-nc-nd.svg",
          "http://creativecommons.org/licenses/by-nc-sa/4.0/": "https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by-nc-sa.svg",
          "http://creativecommons.org/licenses/by-sa/4.0/": "https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by-sa.svg",
          "http://opendatacommons.org/licenses/odbl/1.0/": "https://img.shields.io/badge/License-ODbL-lightgrey.svg",
          "http://www.wtfpl.net/": "https://img.shields.io/badge/License-WTFPL-lightgrey.svg",
        },
      },
    }
  },
  methods: {
    /**
     * Returns the provider object for a scheme or concept.
     *
     * @param {*} object
     */
    getProvider(object) {
      return _.get(object, "_registry") || _.get(object, "inScheme[0]._registry")
    },
    toggleMinimize() {
      for (let child of this.$children) {
        child.toggleMinimize()
      }
    },
    refresh(key) {
      this.$parent && this.$parent.refresh(key)
    },
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
        if (forceSide || this.$store.state.selected.scheme[isLeft] == null || this.$jskos.compare(this.$store.state.selected.scheme[isLeft], conceptScheme)) {
        // If the scheme on the same side is null or the same as the concept's scheme, don't change anything.
        } else if (this.$jskos.compare(this.$store.state.selected.scheme[!isLeft], conceptScheme) || this.$store.state.selected.scheme[!isLeft] == null) {
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
    },
    setSelected({ concept, scheme, isLeft, noQueryRefresh = false } = {}) {
      let loadTypes = scheme => {
        if (scheme) {
          this.loadTypes(scheme)
        }
      }
      let loadingId = this.generateID()
      this.$store.commit({
        type: "selected/setLoadingId",
        isLeft,
        loadingId,
      })
      scheme = _.get(concept, "inScheme[0]") || scheme
      // Check if concept and scheme is already selected
      if (jskos.compare(concept, this.$store.state.selected.concept[isLeft]) && jskos.compare(scheme, this.$store.state.selected.scheme[isLeft])) {
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
          this.$log.error("setSelected: could not find scheme in store.")
          return Promise.resolve(false)
        }
      } else if (concept) {
        let kind = "concept"
        if (!scheme) {
          this.$log.error("setSelected: could not find scheme for concept in store.")
          return Promise.resolve(false)
        }
        if (!concept) {
          // This case should not happen!
          this.$log.error("setSelected: critical error when getting/saving concept from store.")
          return Promise.resolve(false)
        }
        let promises = []
        // Check if scheme is different from selected scheme, if not change
        if (!jskos.compare(scheme, this.$store.state.selected.scheme[isLeft])) {
          kind = "both"
          // Load top concepts for scheme
          promises.push(this.loadTop(scheme))
        }
        // Load details
        promises.push(this.loadConcepts([concept]).catch(() => {}))
        // Load narrower concepts
        promises.push(this.loadNarrower(concept).catch(() => {}))
        // Load ancestor concepts and their narrower concepts
        promises.push(this.loadAncestors(concept).catch(() => {}))

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
              this.loadConcepts([broader], { scheme })
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
        this.$log.error("setSelected: called with no valid concept or scheme.")
        return Promise.resolve(false)
      }
    },
    addToMapping(params) {
      params.type = "mapping/add"
      params.cardinality = this.$store.state.settings.settings.components.MappingEditor.only1to1mappings ? "1-to-1" : "1-to-n"
      // Override cardinality from registry if necessary
      const cardinality = _.get(this.$store.getters.getCurrentRegistry, "config.mappings.cardinality")
      if (cardinality == "1-to-1") {
        params.cardinality = cardinality
      }
      this.$store.commit(params)
    },
    /**
     * Shows a bootstrap alert.
     *
     * @param {*} text - text to be shown
     * @param {*} countdown - countdown seconds, 0 for no countdown
     * @param {*} variant - a bootstrap variant, e.g. "danger", "warning", ...
     */
    alert(text, countdown, variant, buttonText, buttonHandler) {
      this.$store.commit({
        type: "alerts/add",
        text,
        countdown,
        variant,
        buttonText,
        buttonHandler,
      })
    },
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
        // from https://www.sanwebe.com/2014/04/select-all-text-in-element-on-click
        const selectText = (el) => {
          var sel, range
          if (window.getSelection && document.createRange) {
            sel = window.getSelection()
            if(sel.toString() == "") {
              range = document.createRange()
              range.selectNodeContents(el)
              sel.removeAllRanges()
              sel.addRange(range)
            }
          } else if (document.selection) {
            sel = document.selection.createRange()
            if(sel.text == "") {
              range = document.body.createTextRange()
              range.moveToElementText(el)
              range.select()
            }
          }
        }
        selectText(element)
        let successful = document.execCommand("copy")
        if (!successful) {
          this.$log.warn("Copy to clipboard failed.")
        }
        window.getSelection().removeAllRanges()
      } catch(error) {
        this.$log.warn("Copy to clipboard failed.")
      }
    },
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
    /**
     * Generates a random ID.
     */
    generateID() {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    },
    // adapted from: https://stackoverflow.com/a/22429679/11050851
    hash(str) {
      var FNV1_32A_INIT = 0x811c9dc5
      var hval = FNV1_32A_INIT
      for ( var i = 0; i < str.length; ++i )
      {
        hval ^= str.charCodeAt(i)
        hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24)
      }
      return ("0000000" + (hval >>> 0).toString(16)).substr(-8)
    },
    /**
     * Converts a date string to a localized date string.
     * Incomplete dates (YYYY or YYYY-MM) will be returned non-localized.
     *
     * @param {string} dateString a date string (compatible with new Date())
     * @param {boolean} onlyDate if true, the time will be omitted
     */
    dateToString(dateString, onlyDate = false) {
      let date = new Date(dateString)
      let optionsDate = { year: "numeric", month: "short", day: "numeric" }
      let options = Object.assign({ hour: "2-digit", minute: "2-digit", second: "2-digit" }, optionsDate)
      if (date instanceof Date && !isNaN(date)) {
        if (dateString.length < 8) {
          return dateString
        }
        return onlyDate ? date.toLocaleDateString(undefined, optionsDate) : date.toLocaleString(undefined, options)
      } else {
        return "?"
      }
    },
    getErrorMessage(error) {
      let errorKey = `cdkErrors.${error.name}`
      if (!this.$te(errorKey)) {
        errorKey = "cdkErrors.CDKError"
      }
      let message = `${this.$t(errorKey)}`
      if (error.message) {
        message += ` (${error.message})`
      }
      return message
    },
  },
}
