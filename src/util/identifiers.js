/**
 * Module to calculate JSKOS mapping identifiers.
 */

// SHA1 library (may be replaced by another implementation!)
const sha1 = require("simple-sha1").sync


// Reduce JSKOS set to members with URI.
function reduceSet(set) {
  return set.map(member => member && member.uri).filter(Boolean)
}

// Tell which concept bundle field is used.
function memberField(bundle) {
  return ["memberSet", "memberList", "memberChoice"].find(f => bundle[f])
}

// Reduce JSKOS concept bundle to memberSet/List/Choice with member URIs only.
function reduceBundle(bundle) {
  const field = memberField(bundle)
  const set = bundle[field] ? reduceSet(bundle[field]) : []
  return {
    [set.length > 1 ? field : "memberSet"]: set.map(uri => ({uri}))
  }
}

// Reduce mapping to reduced fields from, to, and type.
function mappingContent(mapping) {
  const { from, to, type } = mapping
  return {
    from: reduceBundle(from || {}),
    to: reduceBundle(to || {}),
    type: [
      type && type[0] || "http://www.w3.org/2004/02/skos/core#mappingRelation"
    ]
  }
}

// Get a sorted list of member URIs.
function mappingMembers(mapping) {
  const { from, to } = mapping
  const memberUris = [ from, to ].filter(Boolean)
    .map(bundle => reduceSet(bundle[memberField(bundle)] || []))
  return [].concat(...memberUris).sort()
}

function mappingContentIdentifier(mapping) {
  const json = JSON.stringify(mappingContent(mapping), ["from","to","type","memberSet","memberList","memberChoice","uri"])
  return "urn:jskos:mapping:content:" + sha1(json+"\n")
}

function mappingMembersIdentifier(mapping) {
  const json = JSON.stringify(mappingMembers(mapping))
  return "urn:jskos:mapping:members:" + sha1(json+"\n")
}

function addMappingIdentifiers(mapping) {
  const identifier = (mapping.identifier || []).filter(
    id => !id.startsWith("urn:jskos:mapping:")
  ).concat([
    mappingMembersIdentifier(mapping),
    mappingContentIdentifier(mapping)
  ]).sort()
  return Object.assign({}, mapping, {identifier})
}

export default {
  mappingContent,
  mappingMembers,
  mappingContentIdentifier,
  mappingMembersIdentifier,
  addMappingIdentifiers
}
