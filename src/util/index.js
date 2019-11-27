import jskos from "jskos-tools"
import _ from "lodash"
import store from "../store"
import i18n from "./i18n"

// from https://www.sanwebe.com/2014/04/select-all-text-in-element-on-click
function selectText(el){
  var sel, range
  if (window.getSelection && document.createRange) { //Browser compatibility
    sel = window.getSelection()
    if(sel.toString() == ""){ //no text selection
      range = document.createRange() //range object
      range.selectNodeContents(el) //sets Range
      sel.removeAllRanges() //remove all ranges from selection
      sel.addRange(range)//add Range to a Selection.
    }
  }else if (document.selection) { //older ie
    sel = document.selection.createRange()
    if(sel.text == ""){ //no text selection
      range = document.body.createTextRange()//Creates TextRange object
      range.moveToElementText(el)//sets Range
      range.select() //make selection.
    }
  }
}

let canConceptBeSelected = function(concept, scheme) {
  if (!concept.inScheme || concept.inScheme.length == 0) {
    return false
  }
  let conceptScheme = concept.inScheme[0]
  return scheme == null || jskos.compare(conceptScheme, scheme)
}

let setupTableScrollSync = function() {
  // Synchronize scrolling of header and body in all default tables
  let tables = document.getElementsByClassName("table")
  for (let table of tables) {
    let thead = table.getElementsByTagName("thead")[0]
    let tbody = table.getElementsByTagName("tbody")[0]
    tbody.onscroll = function() {
      thead.scrollLeft = tbody.scrollLeft
    }
  }
}

let generateID = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

// adapted from: https://stackoverflow.com/a/22429679/11050851
let hash = (str) => {
  var FNV1_32A_INIT = 0x811c9dc5
  var hval = FNV1_32A_INIT
  for ( var i = 0; i < str.length; ++i )
  {
    hval ^= str.charCodeAt(i)
    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24)
  }
  return ("0000000" + (hval >>> 0).toString(16)).substr(-8)
}

let delay = {
  short: { show: 250, hide: 0 },
  medium: { show: 500, hide: 0 },
  long: { show: 1000, hide: 0 },
}

/**
 * Compare mappings by their first concept.
 *
 * @param {*} mapping1 - first mapping
 * @param {*} mapping2 - second mapping
 * @param {*} fromTo - side, either `from` or `to`
 */
let compareMappingsByConcepts = (mapping1, mapping2, fromTo) => {
  let bundleFields = ["memberSet", "memberList", "memberChoice"], notation1, notation2
  for (let field of bundleFields) {
    notation1 = notation1 || notation(_.get(mapping1, fromTo + "." + field + "[0]"))
    notation2 = notation2 || notation(_.get(mapping2, fromTo + "." + field + "[0]"))
  }
  if (notation1 == null || notation1 < notation2) {
    return -1
  }
  if (notation2 == null || notation1 > notation2) {
    return 1
  }
  return 0
}

/**
 * Returns the primary notation for a JSKOS Item. If there is no notation, it will return an empty string.
 * Scheme notations will be uppercased.
 *
 * @param {*} item - a JSKOS Item
 * @param {string} type - type of item (optional)
 * @param {boolean} adjust - whether to adjust the notation according to certain rules (returns a HTML string!) (default: false)
 */
let notation = (item, type, adjust = false) => {
  let notation
  if (item && item.notation && item.notation.length) {
    notation = item.notation[0]
    if (jskos.isScheme(item) || type == "scheme") {
      notation = notation.toUpperCase()
    }
  } else if (item && item.inScheme && item.inScheme[0] && item.uri) {
    // Try to imply notation from scheme and concept URI
    const scheme = new jskos.ConceptScheme(item && item.inScheme && item.inScheme[0])
    notation = scheme.notationFromUri(item.uri)
  }
  if (!notation) {
    return ""
  }
  // Adjust notation for certain concept schemes -> return HTML as well
  if (adjust) {
    let fill = ""
    // For DDC only: fill notation with trailing zeros
    if (jskos.compare({
      uri : "http://dewey.info/scheme/edition/e23/",
      identifier : [
        "http://bartoc.org/en/node/241",
      ],
    }, _.get(item, "inScheme[0]"))) {
      while (notation.length + fill.length < 3) {
        fill += "0"
      }
    }
    if (fill.length) {
      notation += `<span class='notation-fill text-mediumLightGrey'>${fill}</span>`
    }
  }
  return notation
}

let fallbackLanguages = () => _.get(store, "state.config.languages", ["en", "de"])

/**
 * Returns a language tag to be used for a language map, null if no language was found in the map.
 *
 * @param {*} languageMap
 * @param {*} language
 */
let getLanguage = (languageMap, language) => {
  if (!languageMap) {
    return null
  }
  language = language || i18n.locale
  if (languageMap[language]) {
    return language
  }
  for (let language of fallbackLanguages()) {
    if (languageMap[language]) {
      return language
    }
  }
  // Fallback for the fallback: iterate through languages and choose the first one found.
  for (let language of Object.keys(languageMap)) {
    if (language != "-") {
      return language
    }
  }
  return null
}

/**
 * Returns the content of a language map for a JSKOS Item.
 *
 * @param {*} item - a JSKOS Item
 * @param {*} language - a language tag, will default to the one in config, then English, then whatever other language is available.
 */
let lmContent = (item, prop, language) => {
  if(!item) {
    return null
  }
  let object
  if (prop) {
    object = item[prop]
  } else {
    object = item
  }
  if (object) {
    language = getLanguage(object, language)
    if (language) {
      return object[language]
    }
  }
  return null
}

/**
 * Returns the prefLabel of a JSKOS Item. If there is no label, it will return the URI. If there is no URI, it will return an empty string.
 *
 * For parameters, see also lmContent above.
 *
 * @param {*} item
 * @param {*} language
 * @param {*} fallbackToUri - return URI if no prefLabel can be found
 */
let prefLabel = (item, language, fallbackToUri = true) => {
  let content = lmContent(item, "prefLabel", language)
  if (content) {
    return content
  }
  if (fallbackToUri && item && item.uri) {
    return item.uri
  }
  return ""
}

let definition = (item, language) => {
  let content = lmContent(item, "definition", language)
  if (!content) {
    return []
  }
  if (_.isString(content)) {
    content = [content]
  }
  return content
}

let addEndpoint = (url, endpoint) => {
  if (url.slice(-1) == "/") {
    url = url.slice(0, -1)
  }
  if (endpoint[0] == "/") {
    endpoint = endpoint.substring(1)
  }
  return url + "/" + endpoint
}

let dateToString = (dateString, onlyDate = false) => {
  let date = new Date(dateString)
  let optionsDate = { year: "numeric", month: "short", day: "numeric" }
  let options = Object.assign({ hour: "2-digit", minute: "2-digit", second: "2-digit" }, optionsDate)
  if (date instanceof Date && !isNaN(date)) {
    return onlyDate ? date.toLocaleDateString(undefined, optionsDate) : date.toLocaleString(undefined, options)
  } else {
    return "?"
  }
}

let annotations = {
  creatorUri(annotation) {
    if (_.isString(annotation.creator)) {
      return annotation.creator
    }
    return annotation.creator && annotation.creator.id
  },
  creatorName(annotation) {
    let name
    if (_.isString(annotation.creator)) {
      name = _.get(store, "state.config.creatorNames", {})[annotation.creator]
    } else if (annotation.creator) {
      name = annotation.creator.name
    }
    return name || ""
  },
  creatorMatches(annotation, uris) {
    return annotation && _.isString(annotation.creator) ? uris && uris.includes(annotation.creator) : uris && annotation.creator && uris.includes(annotation.creator.id)
  },
}

/** Image URLs for specific licenses */
let licenseBadges = {
  "http://creativecommons.org/publicdomain/zero/1.0/": "https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/cc-zero.svg",
  "http://creativecommons.org/licenses/by/3.0/": "https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by.svg",
  "http://creativecommons.org/licenses/by-nc-nd/3.0/": "https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by-nc-nd.svg",
  "http://creativecommons.org/licenses/by-nc-nd/4.0/": "https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by-nc-nd.svg",
  "http://creativecommons.org/licenses/by-nc-sa/4.0/": "https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by-nc-sa.svg",
  "http://creativecommons.org/licenses/by-sa/4.0/": "https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/by-sa.svg",
  "http://opendatacommons.org/licenses/odbl/1.0/": "https://img.shields.io/badge/License-ODbL-lightgrey.svg",
  "http://www.wtfpl.net/": "https://img.shields.io/badge/License-WTFPL-lightgrey.svg",
}

let isValidUri = (uri) => {
  // from: http://jmrware.com/articles/2009/uri_regexp/URI_regex.html
  var re_js_rfc3986_URI = /^[A-Za-z][A-Za-z0-9+\-.]*:(?:\/\/(?:(?:[A-Za-z0-9\-._~!$&'()*+,;=:]|%[0-9A-Fa-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9A-Fa-f]{1,4}:){6}|::(?:[0-9A-Fa-f]{1,4}:){5}|(?:[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,1}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){3}|(?:(?:[0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){2}|(?:(?:[0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}:|(?:(?:[0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})?::)(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(?:(?:[0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})?::)|[Vv][0-9A-Fa-f]+\.[A-Za-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|(?:[A-Za-z0-9\-._~!$&'()*+,;=]|%[0-9A-Fa-f]{2})*)(?::[0-9]*)?(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|\/(?:(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*)?|(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|)(?:\?(?:[A-Za-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9A-Fa-f]{2})*)?(?:#(?:[A-Za-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9A-Fa-f]{2})*)?$/
  return uri.match(re_js_rfc3986_URI) !== null
}

const mappingCreatorMatches = (user, mapping) => {
  if (!user) {
    return false
  }
  return [user.uri].concat(Object.values(user.identities).map(identity => identity.uri)).filter(uri => uri != null).includes(_.get(mapping, "creator[0].uri"))
}

export default { selectText, canConceptBeSelected, setupTableScrollSync, generateID, hash, delay, compareMappingsByConcepts, notation, fallbackLanguages, getLanguage, lmContent, prefLabel, definition, addEndpoint, dateToString, licenseBadges, annotations, isValidUri, mappingCreatorMatches }
