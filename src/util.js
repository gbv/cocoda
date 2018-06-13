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
    notation: ["?"],
    uri: "http://www.w3.org/2004/02/skos/core#mappingRelation",
    prefLabel: { "en": "mapping relation" },
  },
]
let defaultMappingType = mappingTypes[1]


let mappingTypeByUri = function(uri) {
  for(let mappingType of mappingTypes) {
    if (uri == mappingType.uri) {
      return mappingType
    }
  }
  return null
}

export default { mappingTypes, defaultMappingType, mappingTypeByUri, cleanJSKOS, deepCopy, mappingHash }
