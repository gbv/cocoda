import jskos from "jskos-tools"
import _ from "lodash"
import store from "../store"

// from https://www.sanwebe.com/2014/04/select-all-text-in-element-on-click
function selectText(el){
  var sel, range
  if (window.getSelection && document.createRange) { //Browser compatibility
    sel = window.getSelection()
    if(sel.toString() == ""){ //no text selection
      window.setTimeout(function(){
        range = document.createRange() //range object
        range.selectNodeContents(el) //sets Range
        sel.removeAllRanges() //remove all ranges from selection
        sel.addRange(range)//add Range to a Selection.
      },1)
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

let delay = {
  short: { show: 250, hide: 0 },
  medium: { show: 500, hide: 0 },
  long: { show: 1000, hide: 0 }
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
 */
let notation = (item) => {
  if (item && item.notation && item.notation.length) {
    let notation = item.notation[0]
    if (jskos.isScheme(item)) {
      return notation.toUpperCase()
    }
    return notation
  }
  return ""
}

/**
 * Returns the primary label for a JSKOS Item. If there is no label, it will return the URI. If there is no URI, it will return an empty string.
 *
 * @param {*} item - a JSKOS Item
 * @param {*} language - a language tag, will default to the one in config, then English, then whatever other language is available.
 */
let prefLabel = (item, language) => {
  let fallbackLanguage = "en"
  if (!language) {
    language = store.state.config.language || fallbackLanguage
  }
  if (item.prefLabel) {
    if (item.prefLabel[language]) {
      return item.prefLabel[language]
    }
    if (item.prefLabel[fallbackLanguage]) {
      return item.prefLabel[fallbackLanguage]
    }
    // Fallback for the fallback: iterate through languages and choose the first one found.
    for (let language of Object.keys(item.prefLabel)) {
      if (language != "-") {
        return item.prefLabel[language]
      }
    }
  }
  if (item.uri) {
    return item.uri
  }
  return ""
}

export default { selectText, canConceptBeSelected, setupTableScrollSync, generateID, delay, compareMappingsByConcepts, notation, prefLabel }
