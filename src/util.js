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

let mappingTypes = [
  {
    SYMBOL: "⇝",
    LABEL: "Related Match",
    uri: "http://www.w3.org/2004/02/skos/core#relatedMatch",
    prefLabel: { "en": "has related match" },
    broader: [ { "uri": "http://www.w3.org/2004/02/skos/core#mappingRelation" } ],
    style: "padding-top: 1px;"
  },
  {
    SYMBOL: "⤏",
    LABEL: "Close Match",
    uri: "http://www.w3.org/2004/02/skos/core#closeMatch",
    prefLabel: { "en": "has close match" },
    broader: [ { "uri": "http://www.w3.org/2004/02/skos/core#mappingRelation" } ],
    STYLE: "padding-top: 1.5px; padding-left: 1px;"
  },
  {
    SYMBOL: "⇒",
    LABEL: "Exact Match",
    uri: "http://www.w3.org/2004/02/skos/core#exactMatch",
    prefLabel: { "en": "has exact match" },
    broader: [ { "uri": "http://www.w3.org/2004/02/skos/core#closeMatch" } ],
    STYLE: "padding-top: 1px;"
  },
  {
    SYMBOL: "⥸",
    LABEL: "Broad Match",
    uri: "http://www.w3.org/2004/02/skos/core#broadMatch",
    prefLabel: { "en": "has broader match" },
    broader: [ { "uri": "http://www.w3.org/2004/02/skos/core#mappingRelation" } ],
    related: [ { "uri": "http://www.w3.org/2004/02/skos/core#narrowMatch" } ],
    STYLE: "padding-left: 1px;"
  },
  {
    SYMBOL: "⥶",
    LABEL: "Narrow Match",
    uri: "http://www.w3.org/2004/02/skos/core#narrowMatch",
    prefLabel: { "en": "has narrower match" },
    broader: [ { "uri": "http://www.w3.org/2004/02/skos/core#mappingRelation" } ],
    related: [ { "uri": "http://www.w3.org/2004/02/skos/core#broadMatch" } ]
  }
]
let defaultMappingType = mappingTypes[2]

export default { mappingTypes, defaultMappingType, cleanJSKOS, deepCopy }
