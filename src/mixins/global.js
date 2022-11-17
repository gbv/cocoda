/**
 * Global mixin for helper functions.
 */

import _ from "lodash"
import FileSaver from "file-saver"
import jskos from "jskos-tools"
import { getItem, loadAncestors, loadConcepts, loadNarrower, loadTop, loadTypes, modifyItem, saveItem } from "@/items"

// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // $& means the whole matched string
}

export default {
  data() {
    return {
      // TODO: Solve differently!
      defaults: {
        delay: {
          short: { show: 250, hide: 0 },
          medium: { show: 500, hide: 0 },
          long: { show: 1000, hide: 0 },
        },
        licenseBadges: {
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
      object = getItem(object) || object
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
      object = getItem(object) || object
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
        let conceptScheme = getItem(_.get(object, "inScheme[0]"))
        !conceptScheme && console.assert("getRouterUrl", object, conceptScheme)
        if (forceSide || this.$store.state.selected.scheme[isLeft] == null || this.$jskos.compare(this.$store.state.selected.scheme[isLeft], conceptScheme)) {
        // If the scheme on the same side is null or the same as the concept's scheme, don't change anything.
        } else if (this.$jskos.compare(this.$store.state.selected.scheme[!isLeft], conceptScheme) || this.$store.state.selected.scheme[!isLeft] == null) {
        // Else, if the scheme on the other side matches the concept's scheme, change sides to that.
          fromTo = fromTo == "from" ? "to" : "from"
        }
        query[fromTo + "Scheme"] = conceptScheme.uri
        query[fromTo] = object.uri
      }
      // Build URL
      let url = "?"
      _.forOwn(query, (value, key) => {
        url += `${key}=${encodeURIComponent(value)}&`
      })
      return url.substring(0, url.length - 1)
    },
    async setSelected({ concept, scheme, isLeft, noQueryRefresh = false, noLoading = false } = {}) {
      let loadingId = this.generateID()

      concept = concept && saveItem(concept, { returnIfExists: true, type: "concept", scheme })
      scheme = _.get(concept, "inScheme[0]") || scheme
      scheme = scheme && saveItem(scheme, { returnIfExists: true, type: "scheme" })

      // Check if concept and scheme are already selected
      if (jskos.compare(concept, this.$store.state.selected.concept[isLeft]) && jskos.compare(scheme, this.$store.state.selected.scheme[isLeft])) {
        return true
      }

      this.$store.commit({
        type: "selected/setLoadingId",
        isLeft,
        loadingId,
      })
      // Set loading indicator
      if (!noLoading) {
        this.loadingGlobal = true
      }

      // Call this function before returning
      const preReturn = () => {
        // Set loading indicator
        if (!noLoading && loadingId == this.$store.state.selected.loadingId[isLeft]) {
          this.loadingGlobal = false
        }
      }

      if (scheme && !concept) {
        this.$store.commit({
          type: "selected/set",
          kind: "both",
          isLeft,
          scheme,
          concept: null,
          noQueryRefresh,
        })
        // Load types for scheme
        loadTypes(scheme)
        // Load top concepts for scheme
        // ? Should we wait for the top concepts?
        loadTop(scheme)
        preReturn()
        return true
      } else if (concept) {
        let kind = "concept"
        if (!scheme) {
          this.$log.error("setSelected: could not find scheme for concept in store.")
          preReturn()
          return false
        }
        // Check if scheme is different from selected scheme, if not change
        if (!jskos.compare(scheme, this.$store.state.selected.scheme[isLeft])) {
          kind = "both"
          // Load top concepts for scheme
          // ? Should we wait for the top concepts?
          loadTop(scheme)
        }

        // Load details
        concept = (await loadConcepts([concept]))[0] || concept

        // Load narrower and ancestor concepts (in background)
        // Note: We're waiting until after concept details are loaded because sometimes narrower/ancestors are already loaded there.
        loadNarrower(concept).then(narrower => {
          loadConcepts(narrower)
        })
        loadAncestors(concept).then(ancestors => {
          // Load its ancestors' narrower concepts
          ancestors.filter(Boolean).forEach(ancestor => loadNarrower(ancestor))
        })

        // Load types for scheme
        scheme && loadTypes(scheme)

        // Load information about its broader concepts
        if (concept.broader && !concept.__BROADERLOADED__) {
          loadConcepts(concept.broader.filter(Boolean), { scheme }).then(() => {
            modifyItem(concept, "__BROADERLOADED__", true)
          })
        }

        // Only select if loadingId matches on the same side
        preReturn()
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
      } else if (isLeft != null) {
        this.$store.commit({
          type: "selected/clear",
          kind: "scheme",
          isLeft,
          noQueryRefresh,
        })
        preReturn()
        return true
      } else {
        this.$log.error("setSelected: called with no valid concept or scheme.")
        preReturn()
        return false
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
      concept = getItem(concept) || concept
      if (!concept) return
      let open = Object.assign({}, concept.__ISOPEN__)
      open[isLeft] = isOpen
      modifyItem(concept, "__ISOPEN__", open)
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
    // Wrapper around jskos.notation that makes adjustments if nececessary
    getNotation(item, type, adjust = false) {
      item = getItem(item, { relatedItems: true }) || item
      let notation = jskos.notation(item, type)
      // Adjust notation for certain concept schemes -> return HTML as well
      if (adjust) {
        let fill = ""
        // Special handling for DDC and SDNB
        if (jskos.compare({
          uri : "http://dewey.info/scheme/edition/e23/",
          identifier : [
            "http://bartoc.org/en/node/241",
            "http://bartoc.org/en/node/18497",
            "http://www.wikidata.org/entity/Q67011877",
            "http://id.loc.gov/vocabulary/classSchemes/sdnb",
            "http://uri.gbv.de/terminology/sdnb",
          ],
        }, _.get(item, "inScheme[0]"))) {
          // Fix notations for table ranges
          if (notation) {
            notation = notation.replace(/^(T[1-9][A-Z]?--)(.*)-(.*)$/, "$1$2-$1$3")
          }
          // Fill number notation with trailing zeros
          if (!isNaN(parseInt(notation))) {
            while (notation.length + fill.length < 3) {
              fill += "0"
            }
          }
        }
        if (fill.length) {
          notation += `<span class='notation-fill text-mediumLightGrey'>${fill}</span>`
        }
      }
      return notation
    },
    getPrefLabel(item) {
      item = getItem(item) || item
      const notation = this.getNotation(item, null, true)
      let prefLabel = this.$jskos.prefLabel(item, { fallbackToUri: notation == null })
      const regex = new RegExp("^" + escapeRegExp(notation) + "\\s+(.*)$")
      const match = prefLabel.match(regex)
      return (match && match[1] != null) ? match[1] : prefLabel
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
    /**
     * from: https://stackoverflow.com/a/37285344
     *
     * Checks if element is in view relative to container element.
     * Note: container must have "position: relative"!
     */
    checkInView(container, element, partial = true) {
      if (!container || !element) {
        return false
      }
      let cTop = container.scrollTop
      let cBottom = cTop + container.clientHeight
      let eTop = element.offsetTop
      let eBottom = eTop + element.clientHeight
      let isTotal = (eTop >= cTop && eBottom <= cBottom)
      let isPartial = partial && (
        (eTop < cTop && eBottom > cTop) ||
        (eBottom > cBottom && eTop < cBottom)
      )
      return (isTotal || isPartial)
    },
  },
}
