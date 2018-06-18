let isUpperCase = function(str) {
  return (/^[A-Z]*$/).test(str)
}

let cleanJSKOS = function(jskos) {
  Object.keys(jskos).forEach(function(key) {
    if (isUpperCase(key)) {
      delete jskos[key]
    } else {
      if (jskos[key] != null && typeof jskos[key] === "object") {
        jskos[key] = cleanJSKOS(jskos[key])
      }
    }
  })
  return jskos
}
let deepCopy = function(obj) {
  var clone = Array.isArray(obj) ? [] : {}
  for(var i in obj) {
    if (i == "ancestors" || i == "narrower" || i == "broader") {
      // Remove circular structures, replace with [null] if it has elements
      if (obj[i] && Array.isArray(obj[i]) && obj[i].length > 0) {
        clone[i] = [null]
        continue
      }
    }
    if (obj[i] != null &&  typeof(obj[i]) == "object")
      clone[i] = deepCopy(obj[i])
    else
      clone[i] = obj[i]
  }
  return clone
}

// Not the final implementation!
let mappingHash = function(mapping) {
  let hash = "mapping:"
  for (let fromTo of ["from", "to"]) {
    hash += fromTo + ":"
    let concepts
    if (mapping[fromTo].memberSet) {
      hash += "memberSet:"
      concepts = mapping[fromTo].memberSet
    } else {
      // TODO: - memberChoice should not be supported in from!
      hash += "memberChoice:"
      fromConcepts = mapping[fromTo].memberChoice
    }
    for (let concept of concepts) {
      hash += concept.uri + ","
    }
  }
  return hash
}

let mappingTypes = [
  {
    notation: ["="],
    uri: "http://www.w3.org/2004/02/skos/core#exactMatch",
    prefLabel: { "en": "exact match" },
    broader: [ { "uri": "http://www.w3.org/2004/02/skos/core#closeMatch" } ],
  },
  {
    notation: ["≈"],
    uri: "http://www.w3.org/2004/02/skos/core#closeMatch",
    prefLabel: { "en": "close match" },
    broader: [ { "uri": "http://www.w3.org/2004/02/skos/core#mappingRelation" } ],
  },
  {
    notation: [">"],
    uri: "http://www.w3.org/2004/02/skos/core#broadMatch",
    prefLabel: { "en": "broader match" },
    broader: [ { "uri": "http://www.w3.org/2004/02/skos/core#mappingRelation" } ],
    related: [ { "uri": "http://www.w3.org/2004/02/skos/core#narrowMatch" } ],
  },
  {
    notation: ["<"],
    uri: "http://www.w3.org/2004/02/skos/core#narrowMatch",
    prefLabel: { "en": "narrower match" },
    broader: [ { "uri": "http://www.w3.org/2004/02/skos/core#mappingRelation" } ],
    related: [ { "uri": "http://www.w3.org/2004/02/skos/core#broadMatch" } ]
  },
  {
    notation: ["~"],
    uri: "http://www.w3.org/2004/02/skos/core#relatedMatch",
    prefLabel: { "en": "related match" },
    broader: [ { "uri": "http://www.w3.org/2004/02/skos/core#mappingRelation" } ],
  },
  {
    notation: ["→"],
    uri: "http://www.w3.org/2004/02/skos/core#mappingRelation",
    prefLabel: { "en": "mapping relation" },
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

let compareSchemes = function(scheme1, scheme2) {
  if (!scheme1 || !scheme2) {
    return false
  }
  // Combine and normalize URIs for comparison
  let scheme1uris = [scheme1.uri].concat(scheme1.identifier || []).map(uri => uri.replace("https", "http").replace("/en/", "/de/"))
  let scheme2uris = [scheme2.uri].concat(scheme2.identifier || []).map(uri => uri.replace("https", "http").replace("/en/", "/de/"))
  let intersection = _.intersection(scheme1uris, scheme2uris)
  // console.log(scheme1uris, scheme2uris, intersection)
  if (intersection.length > 0) {
    return true
  }
  return false
}

let canConceptBeSelected = function(concept, scheme) {
  if (!concept.inScheme || concept.inScheme.length == 0) {
    return false
  }
  let conceptScheme = concept.inScheme[0]
  return scheme == null || compareSchemes(conceptScheme, scheme)
}

let setupTableScrollSync = function() {
  // Synchronize scrolling of header and body in all default tables
  let tables = document.getElementsByClassName("defaultTable")
  for (let table of tables) {
    let thead = table.getElementsByTagName("thead")[0]
    let tbody = table.getElementsByTagName("tbody")[0]
    tbody.onscroll = function() {
      thead.scrollLeft = tbody.scrollLeft
    }
  }
}

export default { mappingTypes, defaultMappingType, mappingTypeByUri, cleanJSKOS, deepCopy, mappingHash, selectText, compareSchemes, canConceptBeSelected, setupTableScrollSync }
