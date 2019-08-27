import _ from "lodash"
import jskos from "jskos-tools"
import BaseProvider from "./base-provider"
import localforage from "localforage"
import uuid from "uuid/v4"
// TODO: This should be removed in the future. Necessary methods should be moved to jskos-tools.
import util from "../util"

const uriPrefix = "urn:uuid:"

/**
 * For saving and retrieving mappings from the browser's local storage.
 */
class LocalMappingsProvider extends BaseProvider {

  constructor(...params) {
    super(...params)
    this.has.mappings = {
      read: true,
      create: true,
      update: true,
      delete: true,
    }
    this.has.canSaveMappings = true
    this.has.canRemoveMappings = true
    this.queue = []
    this.localStorageKey = "cocoda-mappings--" + this.path
    let oldLocalStorageKey = "mappings"
    // Function that adds URIs to all existing local mappings that don't yet have one
    let addUris = () => {
      return localforage.getItem(this.localStorageKey).then(mappings => {
        mappings = mappings || []
        let adjusted = 0
        for (let mapping of mappings.filter(m => !m.uri || !m.uri.startsWith(uriPrefix))) {
          if (mapping.uri) {
            // Keep previous URI in identifier
            if (!mapping.identifier) {
              mapping.identifier = []
            }
            mapping.identifier.push(mapping.uri)
          }
          mapping.uri = `${uriPrefix}${uuid()}`
          adjusted += 1
        }
        if (adjusted) {
          console.warn(`URIs added to ${adjusted} local mappings.`)
        }
        return localforage.setItem(this.localStorageKey, mappings)
      })
    }
    // Show warning if there are mappings in local storage that use the old local storage key.
    localforage.getItem(oldLocalStorageKey).then(results => {
      if (results) {
        console.warn(`Warning: There is old data in local storage (or IndexedDB, depending on the ) with the key "${oldLocalStorageKey}". This data will not be used anymore. A manual export is necessary to get this data back.`)
      }
    })
    // Put promise into queue so that getMappings requests are waiting for adjustments to finish
    this.queue.push(
      addUris().catch(error => {
        console.warn("Error when adding URIs to local mappings:", error)
      })
    )
  }

  isAuthorizedFor({ type, action }) {
    // Allow all for mappings
    if (type == "mappings" && action != "anonymous") {
      return true
    }
    return false
  }

  /**
   * Returns a Promise that returns an object { mappings, done } with the local mappings and a done function that is supposed to be called when the transaction is finished.
   * This prevents conflicts when _saveMapping is called multiple times simultaneously.
   *
   * TODO: There might be a better solution for this...
   */
  getMappingsQueue(...params) {
    let last = _.last(this.queue) || Promise.resolve()
    return new Promise((resolve) => {
      function defer() {
        var res, rej

        var promise = new Promise((resolve, reject) => {
          res = resolve
          rej = reject
        })

        promise.resolve = res
        promise.reject = rej

        return promise
      }
      let promise = defer()
      let done = () => {
        promise.resolve()
      }
      this.queue.push(promise)

      last.then(() => {
        return this.getMappings(...params)
      }).then(mappings => {
        resolve({ mappings, done })
      })
    })
  }

  /**
   * Returns a Promise with a list of local mappings.
   *
   * TODO: Add support for sort (`created` or `modified`) and order (`asc` or `desc`).
   */
  _getMappings({ from, fromScheme, to, toScheme, creator, type, partOf, offset, limit, direction, mode, identifier, uri } = {}) {
    let params = {}
    if (from) {
      params.from = _.isString(from) ? from : from.uri
    }
    if (fromScheme) {
      params.fromScheme = _.isString(fromScheme) ? { uri: fromScheme } : fromScheme
    }
    if (to) {
      params.to = _.isString(to) ? to : to.uri
    }
    if (toScheme) {
      params.toScheme = _.isString(toScheme) ? { uri: toScheme } : toScheme
    }
    if (creator) {
      params.creator = _.isString(creator) ? creator : util.prefLabel(creator)
    }
    if (type) {
      params.type = _.isString(type) ? type : type.uri
    }
    if (partOf) {
      params.partOf = _.isString(partOf) ? partOf : partOf.uri
    }
    if (offset) {
      params.offset = offset
    }
    if (limit) {
      params.limit = limit
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
    if (uri) {
      params.uri = uri
    }
    return localforage.getItem(this.localStorageKey).then(mappings => mappings || []).catch(() => []).then(mappings => {
      // Check concept with param
      let checkConcept = (concept, param) => concept.uri == param || (param && concept.notation && concept.notation[0].toLowerCase() == param.toLowerCase())
      // Filter mappings according to params (support for from + to)
      // TODO: - Support more parameters.
      // TODO: - Move to its own things.
      // TODO: - Clean all this up.
      if (params.from || params.to) {
        mappings = mappings.filter(mapping => {
          let fromInFrom = null != jskos.conceptsOfMapping(mapping, "from").find(concept => checkConcept(concept, params.from))
          let fromInTo = null != jskos.conceptsOfMapping(mapping, "to").find(concept => checkConcept(concept, params.from))
          let toInFrom = null != jskos.conceptsOfMapping(mapping, "from").find(concept => checkConcept(concept, params.to))
          let toInTo = null != jskos.conceptsOfMapping(mapping, "to").find(concept => checkConcept(concept, params.to))
          if (params.direction == "backward") {
            if (params.mode == "or") {
              return (params.from && fromInTo) || (params.to && toInFrom)
            } else {
              return (!params.from || fromInTo) && (!params.to || toInFrom)
            }
          } else if (params.direction == "both") {
            if (params.mode == "or") {
              return (params.from && (fromInFrom || fromInTo)) || (params.to && (toInFrom || toInTo))
            } else {
              return ((!params.from || fromInFrom) && (!params.to || toInTo)) || ((!params.from || fromInTo) && (!params.to || toInFrom))
            }
          } else {
            if (params.mode == "or") {
              return (params.from && fromInFrom) || (params.to && toInTo)
            } else {
              return (!params.from || fromInFrom) && (!params.to || toInTo)
            }
          }
        })
      }
      if (params.fromScheme || params.toScheme) {
        mappings = mappings.filter(mapping => {
          let fromInFrom = jskos.compare(mapping.fromScheme, params.fromScheme)
          let fromInTo = jskos.compare(mapping.toScheme, params.fromScheme)
          let toInFrom = jskos.compare(mapping.fromScheme, params.toScheme)
          let toInTo = jskos.compare(mapping.toScheme, params.toScheme)
          if (params.direction == "backward") {
            if (params.mode == "or") {
              return (params.fromScheme && fromInTo) || (params.toScheme && toInFrom)
            } else {
              return (!params.fromScheme || fromInTo) && (!params.toScheme || toInFrom)
            }
          } else if (params.direction == "both") {
            if (params.mode == "or") {
              return (params.fromScheme && (fromInFrom || fromInTo)) || (params.toScheme && (toInFrom || toInTo))
            } else {
              return ((!params.fromScheme || fromInFrom) && (!params.toScheme || toInTo)) || ((!params.fromScheme || fromInTo) && (!params.toScheme || toInFrom))
            }
          } else {
            if (params.mode == "or") {
              return (params.fromScheme && fromInFrom) || (params.toScheme && toInTo)
            } else {
              return (!params.fromScheme || fromInFrom) && (!params.toScheme || toInTo)
            }
          }
        })
      }
      // creator
      if (params.creator) {
        let creators = params.creator.split("|")
        mappings = mappings.filter(mapping => {
          return (mapping.creator && mapping.creator.find(creator => creators.includes(util.prefLabel(creator)) || creators.includes(creator.uri))) != null
        })
      }
      // type
      if (params.type) {
        mappings = mappings.filter(mapping => (mapping.type || [jskos.defaultMappingType.uri]).includes(params.type))
      }
      // concordance
      if (params.partOf) {
        mappings = mappings.filter(mapping => {
          return mapping.partOf != null && mapping.partOf.find(partOf => jskos.compare(partOf, { uri: params.partOf })) != null
        })
      }
      // identifier
      if (params.identifier) {
        mappings = mappings.filter(mapping => {
          return params.identifier.split("|").map(identifier => {
            return (mapping.identifier || []).includes(identifier) || mapping.uri == identifier
          }).reduce((current, total) => current || total)
        })
      }
      if (params.uri) {
        mappings = mappings.filter(mapping => mapping.uri == params.uri)
      }
      let totalCount = mappings.length
      // Sort mappings (default: modified/created date descending)
      mappings = mappings.sort((a, b) => {
        let aDate = a.modified || a.created
        let bDate = b.modified || b.created
        if (bDate == null) {
          return -1
        }
        if (aDate == null) {
          return 1
        }
        if (aDate > bDate) {
          return -1
        }
        return 1
      })
      mappings = mappings.slice(params.offset || 0)
      mappings = mappings.slice(0, params.limit)
      mappings.totalCount = totalCount
      return mappings
    })
  }

  /**
   * Saves mappings to local storage. Returns a Promise with a list of mappings that were saved.
   *
   * @param {*} mappings - list of mappings in object form: { mapping, original }
   */
  _saveMapping(mapping, original) {
    return this.getMappingsQueue().then(({ mappings: localMappings, done }) => {
      if (!mapping.created) {
        mapping.created = (new Date()).toISOString()
      }
      if (!mapping.modified) {
        mapping.modified = mapping.created
      }
      if (original) {
        mapping.modified = (new Date()).toISOString()
      }

      let previousIndex = original ? localMappings.findIndex(m => m.uri == original.uri) : -1

      // Set URI if necessary
      if (!mapping.uri || !mapping.uri.startsWith(uriPrefix)) {
        if (mapping.uri) {
          // Keep previous URI in identifier
          if (!mapping.identifier) {
            mapping.identifier = []
          }
          mapping.identifier.push(mapping.uri)
        }
        mapping.uri = `${uriPrefix}${uuid()}`
      }

      if (original) {
        localMappings = localMappings.filter(m => m.uri != original.uri)
      }
      if (original && previousIndex != -1) {
        // Insert mapping at previous index
        localMappings.splice(previousIndex, 0, mapping)
      } else {
        // Insert mapping at the end
        localMappings.push(mapping)
      }

      // Minify mappings before saving back to local storage
      localMappings = localMappings.map(mapping => jskos.minifyMapping(mapping))
      return localforage.setItem(this.localStorageKey, localMappings).then(() => {
        return mapping
      }).catch(error => {
        console.error("local-mappings - error in saveMapping:", error)
        return null
      }).then(mapping => {
        done()
        return mapping
      })
    })
  }

  /**
   * Removes mappings from local storage. Returns a Promise with a list of mappings that were removed.
   */
  _removeMapping(mapping) {
    return this.getMappingsQueue().then(({ mappings: localMappings, done }) => {
      // Remove by content identifier
      localMappings = localMappings.filter(m => m.uri != mapping.uri)
      // Minify mappings before saving back to local storage
      localMappings = localMappings.map(mapping => jskos.minifyMapping(mapping))
      return localforage.setItem(this.localStorageKey, localMappings).then(() => {
        return mapping
      }).catch(error => {
        console.error("local-mappings - error in removeMapping:", error)
        return null
      }).then(mapping => {
        done()
        return mapping
      })
    })
  }
}

LocalMappingsProvider.providerName = "LocalMappings"

export default LocalMappingsProvider
