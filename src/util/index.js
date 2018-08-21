import jskos from "jskos-tools"

let mappingTypes = [
  {
    notation: ["="],
    uri: "http://www.w3.org/2004/02/skos/core#exactMatch",
    prefLabel: { "en": "exact match" },
    broader: [ { "uri": "http://www.w3.org/2004/02/skos/core#closeMatch" } ],
    RELEVANCE: "very high",
  },
  {
    notation: ["≈"],
    uri: "http://www.w3.org/2004/02/skos/core#closeMatch",
    prefLabel: { "en": "close match" },
    broader: [ { "uri": "http://www.w3.org/2004/02/skos/core#mappingRelation" } ],
    RELEVANCE: "high",
  },
  {
    notation: [">"],
    uri: "http://www.w3.org/2004/02/skos/core#broadMatch",
    prefLabel: { "en": "broader match" },
    broader: [ { "uri": "http://www.w3.org/2004/02/skos/core#mappingRelation" } ],
    related: [ { "uri": "http://www.w3.org/2004/02/skos/core#narrowMatch" } ],
    RELEVANCE: "medium",
  },
  {
    notation: ["<"],
    uri: "http://www.w3.org/2004/02/skos/core#narrowMatch",
    prefLabel: { "en": "narrower match" },
    broader: [ { "uri": "http://www.w3.org/2004/02/skos/core#mappingRelation" } ],
    related: [ { "uri": "http://www.w3.org/2004/02/skos/core#broadMatch" } ],
    RELEVANCE: "medium",
  },
  {
    notation: ["~"],
    uri: "http://www.w3.org/2004/02/skos/core#relatedMatch",
    prefLabel: { "en": "related match" },
    broader: [ { "uri": "http://www.w3.org/2004/02/skos/core#mappingRelation" } ],
    RELEVANCE: "low",
  },
  {
    notation: ["→"],
    uri: "http://www.w3.org/2004/02/skos/core#mappingRelation",
    prefLabel: { "en": "mapping relation" },
    RELEVANCE: "medium",
  },
]

let mappingTypeByUri = function(uri) {
  for(let mappingType of mappingTypes) {
    if (uri == mappingType.uri) {
      return mappingType
    }
  }
  return null
}

let mappingTypeByType = function(type, defaultType = defaultMappingType) {
  let uri
  if (Array.isArray(type) && type.length > 0) {
    uri = type[0]
  } else {
    // FIXME: This is a workaround for the type being a string instead of an array.
    uri = type
  }
  return mappingTypeByUri(uri) || defaultType
}

let defaultMappingType = mappingTypeByUri("http://www.w3.org/2004/02/skos/core#mappingRelation")

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

export default { mappingTypes, defaultMappingType, mappingTypeByUri, mappingTypeByType, selectText, canConceptBeSelected, setupTableScrollSync, generateID, delay }
