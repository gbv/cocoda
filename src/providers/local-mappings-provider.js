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
    this.queue = []
    this.localStorageKey = "cocoda-mappings--" + this.path
    let oldLocalStorageKey = "mappings"
    // Function that adds URIs to all existing local mappings that don't yet have one
    let addUris = () => {
      return localforage.getItem(this.localStorageKey).then(mappings => {
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
    // Migration from old local storage key to new one if necessary
    let promise = Promise.all([localforage.getItem(oldLocalStorageKey), localforage.getItem(this.localStorageKey)]).then(results => {
      let [oldMappings, newMappings] = results
      if (oldMappings && !newMappings) {
        return localforage.setItem(this.localStorageKey, oldMappings).then(() => {
          console.warn(`Migrated from old local storage key (${oldLocalStorageKey}) to new one (${this.localStorageKey})`)
        }).catch(error => {
          console.error("Error attempting to migrate from old storage key to new one:", error)
        }).then(addUris)
      } else {
        return addUris()
      }
    })
    // Put promise into queue so that getMappings requests are waiting for migration/adjustments to finish
    this.queue.push(promise)
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
   */
  _getMappings({ from, fromScheme, to, toScheme, creator, type, partOf, offset, limit, direction, mode, identifier } = {}) {
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
    return localforage.getItem(this.localStorageKey).then(mappings => mappings || []).catch(() => []).then(mappings => {
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
              return concept.uri == params.from || (concept.notation && concept.notation[0].toLowerCase() == params.from.toLowerCase())
            })
          })
        }
        if (params.to) {
          mappings = mappings.filter(mapping => {
            let target = params.direction == "backward" ? "from" : "to"
            return null != mapping[target].memberSet.find(concept => {
              return concept.uri == params.to || (concept.notation && concept.notation[0].toLowerCase() == params.to.toLowerCase())
            })
          })
        }
      }
      if (params.fromScheme) {
        mappings = mappings.filter(mapping => jskos.compare(mapping.fromScheme, params.fromScheme))
      }
      if (params.toScheme) {
        mappings = mappings.filter(mapping => jskos.compare(mapping.toScheme, params.toScheme))
      }
      // creator
      if (params.creator) {
        mappings = mappings.filter(mapping => {
          return (mapping.creator && mapping.creator.find(creator => util.prefLabel(creator) == params.creator)) != null
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
      let totalCount = mappings.length
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
