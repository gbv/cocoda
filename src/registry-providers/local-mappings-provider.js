import jskos from "jskos-tools"
import BaseProvider from "./base-provider"
import localforage from "localforage"

class LocalMappingsProvider extends BaseProvider {
  /**
   * Returns a Promise with a list of local mappings.
   */
  _getMappings({ from, to, direction, mode, identifier }) {
    let params = {}
    if (from) {
      params.from = from.uri
    }
    if (to) {
      params.to = to.uri
    }
    if (direction) {
      params.direction = direction
    }
    if (mode) {
      params.mode = mode
    }
    if (identifier) {
      params.identifier = identifier
    }
    return localforage.getItem("mappings").then(mappings => mappings || []).catch(() => []).then(mappings => {
      if (params.direction == "both") {
        params.mode = "or"
      }
      // Filter mappings according to params (support for from + to)
      // TODO: - Support more parameters.
      // TODO: - Move to its own things.
      // TODO: - Support memberList and memberChoice.
      // TODO: - Clean all this up.
      if (params.mode == "or") {
        mappings = mappings.filter(mapping => {
          let fromInFrom = null != mapping.from.memberSet.find(concept => {
            return concept.uri == params.from
          })
          let fromInTo = null != mapping.to.memberSet.find(concept => {
            return concept.uri == params.from
          })
          let toInFrom = null != mapping.from.memberSet.find(concept => {
            return concept.uri == params.to
          })
          let toInTo = null != mapping.to.memberSet.find(concept => {
            return concept.uri == params.to
          })
          return (params.direction == "forward" && (fromInFrom || toInTo)) ||
            (params.direction == "backward" && (fromInTo || toInFrom)) ||
            (params.direction == "both" && (fromInFrom || fromInTo || toInFrom || toInTo))
        })
      } else {
        if (params.from) {
          mappings = mappings.filter(mapping => {
            let target = params.direction == "backward" ? "to" : "from"
            return null != mapping[target].memberSet.find(concept => {
              return concept.uri == params.from
            })
          })
        }
        if (params.to) {
          mappings = mappings.filter(mapping => {
            let target = params.direction == "backward" ? "from" : "to"
            return null != mapping[target].memberSet.find(concept => {
              return concept.uri == params.to
            })
          })
        }
      }
      if (params.identifier) {
        mappings = mappings.filter(mapping => {
          return params.identifier.split("|").map(identifier => {
            return (mapping.identifier || []).includes(identifier)
          }).reduce((current, total) => current || total)
        })
      }
      return mappings
    }).then(mappings => {
      // Add "LOCAL = true" for all mappings.
      mappings.forEach(mapping => {
        mapping.LOCAL = true
      })
      return mappings
    })
  }

  /**
   * Saves mappings to local storage. Returns a Promise with a list of mappings that were saved.
   *
   * @param {*} mappings - list of mappings in object form: { mapping, original }
   */
  _saveMappings(mappings) {
    return this.getMappings().then(localMappings => {
      let addedMappings = []

      for (let { mapping, original } of mappings) {
        if (!mapping.fromScheme || !mapping.toScheme) {
          continue
        }
        original = original || {}
        mapping = jskos.addMappingIdentifiers(mapping)
        // Filter out original mapping and other local mappings with the same content identifier.
        localMappings = localMappings.filter(m => {
          let findContentId = id => id.startsWith("urn:jskos:mapping:content:")
          let id1 = m.identifier ? m.identifier.find(findContentId) : null
          let id2 = (original.identifier || []).find(findContentId)
          let id3 = (mapping.identifier || []).find(findContentId)
          return id1 != id2 && id1 != id3
        })
        localMappings.push(mapping)
        addedMappings.push(mapping)
      }

      return localforage.setItem("mappings", localMappings).then(() => {
        return addedMappings
      }).catch(() => {
        return []
      })
    })
  }

  /**
   * Removes mappings from local storage. Returns a Promise with a list of mappings that were removed.
   */
  _removeMappings(mappings) {
    return this.getMappings().then(localMappings => {
      let removedMappings = []
      let filter = (reverse = false) => mapping => m => {
        let findContentId = id => id.startsWith("urn:jskos:mapping:content:")
        let id1 = m.identifier ? m.identifier.find(findContentId) : null
        let id2 = mapping.identifier ? mapping.identifier.find(findContentId) : null
        let result = id1 == null || id2 == null || id1 != id2
        return reverse ? !result : result
      }
      for (let mapping of mappings) {
        // Remove by content identifier
        removedMappings = removedMappings.concat(localMappings.filter(filter(true)(mapping)))
        localMappings = localMappings.filter(filter()(mapping))
      }
      return localforage.setItem("mappings", localMappings).then(() => {
        return removedMappings
      }).catch(() => {
        return []
      })
    })
  }
}

LocalMappingsProvider.providerName = "LocalMappings"

export default LocalMappingsProvider
