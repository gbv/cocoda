let isUpperCase = function(str) {
  return (/^[A-Z]*$/).test(str)
}

let cleanJSKOS = function(jskos) {
  Object.keys(jskos).forEach(function(key) {
    if (isUpperCase(key) || key.startsWith("_")) {
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
    if (i == "ancestors" || i == "narrower" || i == "broader" || i == "TOPCONCEPTS" || i == "MAPPINGS" || i == "PROVIDER") {
      // Remove circular structures, replace with [null] if it has elements
      if (obj[i] && Array.isArray(obj[i])) {
        if (obj[i].length > 0) {
          clone[i] = [null]
        } else {
          clone[i] = []
        }
        continue
      } else {
        clone[i] = null
        continue
      }
    }
    if (i == "inScheme") {
      // Remove circular structur for inScheme and replace with new object consisting only of URI, notation, and prefLabel
      let inScheme = []
      for (let scheme of obj.inScheme) {
        let newScheme = { uri: scheme.uri }
        if (scheme.notation) {
          newScheme.notation = scheme.notation
        }
        if (scheme.prefLabel) {
          newScheme.prefLabel = scheme.prefLabel
        }
        inScheme.push(newScheme)
      }
      clone.inScheme = inScheme
      continue
    }
    if (obj[i] != null &&  typeof(obj[i]) == "object") {
      clone[i] = deepCopy(obj[i])
    } else {
      clone[i] = obj[i]
    }
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
  if (mapping.type && mapping.type.length) {
    hash += `type:${mapping.type[0]}`
  }
  return hash
}

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

let getAllUris = object => {
  if (!object) return []
  let uris = [object.uri].concat(object.identifier || [])
  // Generate several variants of URIs to work around inconsistencies
  uris = uris.concat(uris.map(uri => uri.startsWith("https") ? uri.replace("https", "http") : uri.replace("http", "https")))
  uris = uris.concat(uris.map(uri => uri.endsWith("/") ? uri.substring(0, uri.length - 1) : uri + "/"))
  uris = uris.concat(uris.map(uri => uri.indexOf("/en/") != -1 ? uri.replace("/en/", "/de/") : uri.replace("/de/", "/en/")))
  return uris
}

let compareObjects = (object1, object2) => {
  let object1uris = getAllUris(object1)
  let object2uris = getAllUris(object2)
  if (_.intersection(object1uris, object2uris).length > 0) {
    return true
  } else {
    return false
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
  if (intersection.length > 0) {
    return true
  }
  return false
}

let isSchemeInList = function(scheme, schemes) {
  if (!scheme || !schemes) {
    return false
  }
  for (let s of schemes) {
    if (compareSchemes(scheme, s)) {
      return true
    }
  }
  return false
}

let isConcept = function(object) {
  return object && object.type && object.type.includes("http://www.w3.org/2004/02/skos/core#Concept")
}
let isScheme = function(object) {
  return object && object.type && object.type.includes("http://www.w3.org/2004/02/skos/core#ConceptScheme")
}

let canConceptBeSelected = function(concept, scheme) {
  if (!concept.inScheme || concept.inScheme.length == 0) {
    return false
  }
  let conceptScheme = concept.inScheme[0]
  return scheme == null || compareSchemes(conceptScheme, scheme)
}

let compareConcepts = function(concept1, concept2) {
  if (!concept1 || !concept2) {
    return concept1 == concept2
  }
  return concept1.uri === concept2.uri
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

function sortConcepts(data) {
  return data.sort(
    (a, b) => (a.notation && b.notation ? a.notation[0] > b.notation[0] : a.uri > b.uri) ? 1 : -1
  )
}

let generateID = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

let delay = {
  short: { show: 250, hide: 0 },
  medium: { show: 500, hide: 0 },
  long: { show: 1000, hide: 0 }
}

let sortSchemes = schemes => {
  return schemes.sort(
    (a, b) => (a.prefLabel.de && b.prefLabel.de ? a.prefLabel.de > b.prefLabel.de : a.uri > b.uri) ? 1 : -1
  )
}

export default { mappingTypes, defaultMappingType, mappingTypeByUri, mappingTypeByType, cleanJSKOS, deepCopy, mappingHash, selectText, getAllUris, compareObjects, compareSchemes, isSchemeInList, isConcept, isScheme, canConceptBeSelected, compareConcepts, setupTableScrollSync, sortConcepts, generateID, delay, sortSchemes }
